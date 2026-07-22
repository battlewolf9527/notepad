import {
  setFolderNoEncrypt,
  removeFolderNoEncrypt,
  checkPathNoEncrypt,
  checkFolderProtected,
} from '../../utils/folder-auth'
import {
  successResponse,
  badRequest,
  unauthorized,
  serverError,
  conflict,
  getErrorMessage,
} from '../../utils/response'
import { verifyAdminToken } from '../../utils/admin'
import { parseJsonOrBadRequest } from '../../utils/api'
import { sanitizePath } from '../../utils/path'
import type { Env } from '../../types/env'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { path: rawPath } = parsed as { path: string }

  if (rawPath === undefined || rawPath === null) {
    return badRequest('路径不能为空')
  }

  const path = sanitizePath(rawPath)
  if (path === null) {
    return badRequest('无效的路径')
  }

  try {
    const isAdmin = await verifyAdminToken(env, request)
    if (!isAdmin) {
      return unauthorized('需要管理员权限')
    }

    const isProtected = await checkFolderProtected(env, path)
    if (isProtected) {
      return conflict('该文件夹已加密，请先移除密码后再禁止加密')
    }

    await setFolderNoEncrypt(env, path)
    return successResponse({ message: '已设置该目录禁止加密' })
  } catch (err) {
    const message = getErrorMessage(err, '操作失败')
    return serverError(message)
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { path: rawPath } = parsed as { path: string }

  if (rawPath === undefined || rawPath === null) {
    return badRequest('路径不能为空')
  }

  const path = sanitizePath(rawPath)
  if (path === null) {
    return badRequest('无效的路径')
  }

  try {
    const isAdmin = await verifyAdminToken(env, request)
    if (!isAdmin) {
      return unauthorized('需要管理员权限')
    }

    await removeFolderNoEncrypt(env, path)
    return successResponse({ message: '已取消该目录的禁止加密设置' })
  } catch (err) {
    const message = getErrorMessage(err, '操作失败')
    return serverError(message)
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url)
  const rawPath = url.searchParams.get('path')

  if (!rawPath) {
    return badRequest('路径不能为空')
  }

  const path = sanitizePath(rawPath)
  if (path === null) {
    return badRequest('无效的路径')
  }

  try {
    const isAdmin = await verifyAdminToken(env, request)
    if (!isAdmin) {
      return unauthorized('需要管理员权限')
    }

    const result = await checkPathNoEncrypt(env, path)
    return successResponse(result)
  } catch (err) {
    const message = getErrorMessage(err, '操作失败')
    return serverError(message)
  }
}
