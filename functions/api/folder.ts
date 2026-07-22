import { sanitizePath, getFolderDepth, getMaxFolderDepth } from '../utils/path'
import {
  successResponse,
  badRequest,
  notFound,
  unauthorized,
  r2ResultToResponse,
} from '../utils/response'
import { renameOrMoveFolder, deleteFolder } from '../utils/r2'
import { checkPathAccessOrUnauthorized } from '../utils/folder-auth'
import { isRootPath, getParentPath, isRootOperation } from '../../types/shared'
import { checkRootPathAdminAccess } from '../utils/admin'
import { parseJsonOrBadRequest } from '../utils/api'
import type { Env } from '../types/env'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { path } = parsed as { path?: string }

  if (path === null || path === undefined) {
    return badRequest('路径不能为空')
  }

  const sanitized = sanitizePath(path)
  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  if (isRootOperation(sanitized)) {
    const hasAdminAccess = await checkRootPathAdminAccess(env, request)
    if (!hasAdminAccess) {
      return unauthorized('需要管理员权限')
    }
  } else {
    const accessResponse = await checkPathAccessOrUnauthorized(
      env,
      request,
      getParentPath(sanitized),
      '需要密码',
    )
    if (accessResponse) return accessResponse
  }

  const maxDepth = getMaxFolderDepth(env)
  const depth = getFolderDepth(sanitized)
  if (depth > maxDepth) {
    return badRequest(`文件夹深度超过限制（最大 ${maxDepth} 层）`)
  }

  const folderKey = `${sanitized}/`

  const existing = await env.NOTEPAD_R2.head(folderKey)
  if (existing) {
    return badRequest('文件夹已存在')
  }

  const existingFile = await env.NOTEPAD_R2.head(sanitized)
  if (existingFile) {
    return badRequest('该路径已被文件占用')
  }

  await env.NOTEPAD_R2.put(folderKey, new Uint8Array(), {
    httpMetadata: {
      contentType: 'application/x-directory',
    },
  })
  return successResponse(undefined)
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { path } = parsed as { path?: string }

  if (path === null || path === undefined) {
    return badRequest('路径不能为空')
  }

  const sanitized = sanitizePath(path)
  if (sanitized === null) {
    return badRequest('无效的路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitized, '需要密码')
  if (accessResponse) return accessResponse

  const folderKey = `${sanitized}/`
  const folderExists = await env.NOTEPAD_R2.head(folderKey)
  if (!folderExists) {
    return notFound('文件夹不存在')
  }

  const r2Result = await deleteFolder(env, sanitized)
  return r2ResultToResponse(r2Result)
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { oldPath, newPath } = parsed as { oldPath?: string; newPath?: string }

  if (oldPath === null || oldPath === undefined || newPath === null || newPath === undefined) {
    return badRequest('路径不能为空')
  }

  const sanitizedOld = sanitizePath(oldPath)
  const sanitizedNew = sanitizePath(newPath)

  if (sanitizedOld === null || sanitizedNew === null) {
    return badRequest('无效的路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, sanitizedOld, '需要密码')
  if (accessResponse) return accessResponse

  const newPathParent = getParentPath(sanitizedNew)

  if (isRootPath(newPathParent)) {
    const hasAdminAccess = await checkRootPathAdminAccess(env, request)
    if (!hasAdminAccess) {
      return unauthorized('需要管理员权限')
    }
  } else {
    const newPathAccessResponse = await checkPathAccessOrUnauthorized(
      env,
      request,
      newPathParent,
      '目标路径需要密码',
    )
    if (newPathAccessResponse) return newPathAccessResponse
  }

  const r2Result = await renameOrMoveFolder(env, sanitizedOld, sanitizedNew)
  return r2ResultToResponse(r2Result)
}
