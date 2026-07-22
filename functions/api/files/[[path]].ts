import { sanitizePath } from '../../utils/path'
import { LIST_LIMIT } from '../../utils/constants'
import {
  successResponse,
  badRequest,
  notFound,
  serverError,
  unauthorized,
  r2ResultToResponse,
  getErrorMessage,
} from '../../utils/response'
import { renameOrMoveFile } from '../../utils/r2'
import {
  checkPathAccessOrUnauthorized,
  checkFolderProtected,
  checkFolderNoEncrypt,
  checkFoldersProtected,
  checkFoldersNoEncrypt,
} from '../../utils/folder-auth'
import { isRootPath, getParentPath, isRootOperation } from '../../../types/shared'
import { parseJsonOrBadRequest } from '../../utils/api'
import { checkRootPathAdminAccess } from '../../utils/admin'
import type { Env } from '../../types/env'

async function listFiles(env: Env, path: string, request: Request): Promise<Response> {
  const accessResponse = await checkPathAccessOrUnauthorized(env, request, path)
  if (accessResponse) return accessResponse

  const prefix = path ? `${path}/` : ''

  try {
    const folders: { name: string; protected: boolean; noEncrypt: boolean }[] = []
    const files: { name: string; size: number; lastModified: number }[] = []
    let cursor: string | undefined
    let result: R2Objects

    do {
      result = await env.NOTEPAD_R2.list({
        prefix,
        delimiter: '/',
        cursor,
        limit: LIST_LIMIT,
      })

      const folderNames = (result.delimitedPrefixes || [])
        .map((p: string) => {
          if (p.endsWith('/')) {
            return p.slice(0, -1).replace(prefix, '')
          }
          return p.replace(prefix, '')
        })
        .filter(Boolean)

      const folderFullPaths = folderNames.map((name) => (path ? `${path}/${name}` : name))

      const [protectedMap, noEncryptMap] = await Promise.all([
        checkFoldersProtected(env, folderFullPaths),
        checkFoldersNoEncrypt(env, folderFullPaths),
      ])

      for (let i = 0; i < folderNames.length; i++) {
        const folderName = folderNames[i]
        const folderFullPath = folderFullPaths[i]
        folders.push({
          name: folderName,
          protected: protectedMap[folderFullPath] || false,
          noEncrypt: noEncryptMap[folderFullPath] || false,
        })
      }

      const objects = result.objects || []
      for (const obj of objects) {
        const relativePath = obj.key.replace(prefix, '')
        if (!relativePath || relativePath.trim() === '') continue
        if (relativePath.endsWith('/')) continue

        files.push({
          name: relativePath,
          size: obj.size,
          lastModified: obj.uploaded.getTime(),
        })
      }

      cursor = result.truncated ? result.cursor : undefined
    } while (result.truncated)

    folders.sort((a, b) => a.name.localeCompare(b.name))
    files.sort((a, b) => a.name.localeCompare(b.name))

    const rootProtected = await checkFolderProtected(env, '')
    const currentProtected = path ? await checkFolderProtected(env, path) : false
    const currentNoEncrypt = path ? await checkFolderNoEncrypt(env, path) : false

    return successResponse({ folders, files, rootProtected, currentProtected, currentNoEncrypt })
  } catch (err) {
    return serverError(getErrorMessage(err, '加载文件列表失败'))
  }
}

async function readFile(env: Env, path: string, request: Request): Promise<Response> {
  const sanitized = sanitizePath(path)

  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitized)
  if (accessResponse) return accessResponse

  const object = await env.NOTEPAD_R2.get(sanitized)
  if (!object) {
    return notFound('文件不存在')
  }

  let content: string
  try {
    content = await object.text()
  } catch (err) {
    return serverError(getErrorMessage(err, '读取文件内容失败'))
  }

  return successResponse({
    content,
    size: object.size,
    lastModified: object.uploaded ? object.uploaded.getTime() : null,
    etag: object.httpEtag,
  })
}

async function writeFile(
  env: Env,
  path: string,
  content: string,
  contentType?: string,
  request?: Request,
): Promise<Response> {
  const sanitized = sanitizePath(path)
  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  if (request) {
    const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitized)
    if (accessResponse) return accessResponse
  }

  if (isRootOperation(sanitized)) {
    if (!request) {
      return unauthorized('需要管理员权限')
    }
    const hasAdminAccess = await checkRootPathAdminAccess(env, request)
    if (!hasAdminAccess) {
      return unauthorized('需要管理员权限')
    }
  }

  const encoder = new TextEncoder()
  await env.NOTEPAD_R2.put(sanitized, encoder.encode(content), {
    httpMetadata: {
      contentType: contentType || 'text/plain; charset=utf-8',
    },
  })
  return successResponse()
}

export async function onRequestGet({
  params,
  request,
  env,
}: {
  params: { path?: string[] }
  request: Request
  env: Env
}) {
  if (!params.path || params.path.length === 0) {
    const url = new URL(request.url)
    const rawPath = url.searchParams.get('path') || ''
    const path = sanitizePath(rawPath)
    if (path === null) {
      return badRequest('无效的路径')
    }
    return listFiles(env, path, request)
  }

  const filePath = params.path.join('/')
  return readFile(env, filePath, request)
}

export async function onRequestPut({
  params,
  request,
  env,
}: {
  params: { path: string[] }
  request: Request
  env: Env
}) {
  const filePath = params.path.join('/')
  const sanitized = sanitizePath(filePath)

  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitized)
  if (accessResponse) return accessResponse

  const requestContentType = request.headers.get('Content-Type') || ''

  if (requestContentType.includes('application/json')) {
    const parsed = await parseJsonOrBadRequest(request)
    if (parsed instanceof Response) return parsed

    const data = parsed as { action?: string; newPath?: string; content?: string }

    if (data.action === 'move' && data.newPath) {
      const sanitizedNewPath = sanitizePath(data.newPath)
      if (sanitizedNewPath === null) {
        return badRequest('无效的目标路径')
      }
      const newPathAccessResponse = await checkPathAccessOrUnauthorized(
        env,
        request,
        sanitizedNewPath,
        '目标路径需要密码',
      )
      if (newPathAccessResponse) return newPathAccessResponse
      const r2Result = await renameOrMoveFile(env, sanitized, sanitizedNewPath)
      return r2ResultToResponse(r2Result)
    }

    const content = typeof data.content === 'string' ? data.content : ''
    return writeFile(env, sanitized, content, 'text/plain; charset=utf-8', request)
  }

  let content: string
  try {
    content = await request.text()
  } catch (err) {
    return serverError(getErrorMessage(err, '读取请求体失败'))
  }

  return writeFile(env, sanitized, content, requestContentType, request)
}

export async function onRequestDelete({
  params,
  request,
  env,
}: {
  params: { path: string[] }
  request: Request
  env: Env
}) {
  const filePath = params.path.join('/')
  const sanitized = sanitizePath(filePath)

  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitized)
  if (accessResponse) return accessResponse

  try {
    await env.NOTEPAD_R2.delete(sanitized)
    return successResponse()
  } catch (err) {
    return serverError(getErrorMessage(err, '删除文件失败'))
  }
}
