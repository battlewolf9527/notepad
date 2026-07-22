import { hashPassword } from '../../utils/password'
import {
  verifyFolderPassword,
  setFolderPasswordHash,
  removeFolderPasswordHash,
  checkPathAccess,
  checkFolderProtection,
  getFolderTokenVersion,
  incrementFolderTokenVersion,
  checkPathNoEncrypt,
} from '../../utils/folder-auth'
import { createJwt, type JwtPayload } from '../../utils/jwt'
import {
  successResponse,
  badRequest,
  unauthorized,
  serverError,
  getErrorMessage,
} from '../../utils/response'
import { verifyAdminPassword, checkRootPathAdminAccess } from '../../utils/admin'
import { parseJsonOrBadRequest } from '../../utils/api'
import { sanitizePath } from '../../utils/path'
import { isRootPath } from '../../../types/shared'
import { getClientIp, hashIp, checkIpBlocked } from '../../utils/rate-limit'
import type { Env } from '../../types/env'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const {
    path: rawPath,
    password,
    action,
  } = parsed as {
    path: string
    password: string
    action?: 'set' | 'verify' | 'reset'
  }

  if (rawPath === undefined || rawPath === null || !password) {
    return badRequest('路径和密码不能为空')
  }

  const path = sanitizePath(rawPath)
  if (path === null) {
    return badRequest('无效的路径')
  }

  try {
    if (action === 'set') {
      const noEncryptResult = await checkPathNoEncrypt(env, path)
      if (noEncryptResult.noEncrypt) {
        return badRequest('该目录已被设置为禁止加密')
      }

      const ip = getClientIp(request)
      const ipHash = await hashIp(ip)
      const blockResult = await checkIpBlocked(env, ipHash)
      if (blockResult.blocked) {
        return unauthorized(blockResult.message || '账号已被封禁')
      }

      if (isRootPath(path)) {
        const hasAdminAccess = await checkRootPathAdminAccess(env, request)
        if (!hasAdminAccess) {
          return unauthorized('需要管理员权限')
        }
      } else {
        const accessCheck = await checkPathAccess(env, request, path)
        if (!accessCheck.allowed) {
          return unauthorized('该目录已被密码保护，请先验证密码', {
            'X-Protected-Path': accessCheck.protectedPath || '',
          })
        }
      }

      const hash = await hashPassword(password)
      await setFolderPasswordHash(env, path, hash)
      await incrementFolderTokenVersion(env, path)
      return successResponse({ message: '密码设置成功' })
    }

    if (action === 'reset') {
      const protection = await checkFolderProtection(env, path)
      if (!protection.protected) {
        return badRequest('该路径未被密码保护')
      }

      const verifyResult = await verifyAdminPassword(env, password, request)
      if (!verifyResult.verified) {
        if (verifyResult.blocked) {
          return unauthorized(verifyResult.message || '账号已被封禁')
        }
        return unauthorized(verifyResult.message || '管理员密码错误')
      }

      await removeFolderPasswordHash(env, protection.protectedPath!)
      await incrementFolderTokenVersion(env, protection.protectedPath!)
      return successResponse({ message: '文件夹密码已清除' })
    }

    const { verified, protectedPath, blocked, message } = await verifyFolderPassword(
      env,
      path,
      password,
      request,
    )
    if (!verified) {
      if (blocked) {
        return unauthorized(message || '账号已被封禁', {
          'X-Protected-Path': protectedPath,
        })
      }
      return unauthorized(message || '密码错误', {
        'X-Protected-Path': protectedPath,
      })
    }

    const tokenVersion = await getFolderTokenVersion(env, protectedPath)
    const payload: JwtPayload = {
      userId: 'user',
      pathPrefix: protectedPath,
      tokenVersion,
    }
    const token = await createJwt(payload, env.JWT_SECRET, 86400)

    return successResponse({ token })
  } catch (err) {
    const message = getErrorMessage(err, '操作失败')
    return serverError(message)
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const { path: rawPath, password } = parsed as { path: string; password: string }

  if (rawPath === undefined || rawPath === null) {
    return badRequest('路径不能为空')
  }

  if (!password) {
    return badRequest('密码不能为空')
  }

  const path = sanitizePath(rawPath)
  if (path === null) {
    return badRequest('无效的路径')
  }

  try {
    const { verified, blocked, message } = await verifyFolderPassword(env, path, password, request)
    if (!verified) {
      if (blocked) {
        return unauthorized(message || '账号已被封禁')
      }
      return unauthorized('密码错误')
    }

    await removeFolderPasswordHash(env, path)
    await incrementFolderTokenVersion(env, path)
    return successResponse({ message: '密码已移除' })
  } catch (err) {
    const message = getErrorMessage(err, '操作失败')
    return serverError(message)
  }
}
