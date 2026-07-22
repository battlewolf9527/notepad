import {
  verifyAdminPassword,
  getTokenVersion,
  incrementTokenVersion,
  verifyAdminToken,
} from '../utils/admin'
import { createJwt, verifyJwt } from '../utils/jwt'
import { Logger } from '../utils/error'
import {
  successResponse,
  unauthorized,
  badRequest,
  serverError,
  getErrorMessage,
} from '../utils/response'
import { parseJsonOrBadRequest } from '../utils/api'
import type { Env } from '../types/env'

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const isAdmin = await verifyAdminToken(env, request)
    if (!isAdmin) {
      return unauthorized('需要管理员权限')
    }

    const parsed = await parseJsonOrBadRequest(request)
    if (parsed instanceof Response) return parsed
    const data = parsed as { action?: string }
    if (data?.action === 'revoke-all-tokens') {
      const newVersion = await incrementTokenVersion(env)
      return successResponse({ message: '所有管理员 Token 已失效', tokenVersion: newVersion })
    }

    return badRequest('无效操作')
  } catch (error) {
    Logger.error('Admin API error:', error instanceof Error ? error : undefined)
    return serverError(getErrorMessage(error, '服务器错误'))
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const parsed = await parseJsonOrBadRequest(request)
    if (parsed instanceof Response) return parsed
    const data = parsed as { password?: string; validate?: boolean }

    if (data?.validate === true) {
      const isAdmin = await verifyAdminToken(env, request)
      if (!isAdmin) {
        return unauthorized('Token 已失效，请重新登录')
      }
      return successResponse({ message: 'Token 有效' })
    }

    if (!data?.password || typeof data.password !== 'string') {
      return badRequest('请提供管理员密码')
    }

    const password = data.password

    const result = await verifyAdminPassword(env, password, request)
    if (!result.verified) {
      if (result.blocked) {
        return unauthorized(result.message || '账号已被封禁')
      }
      return unauthorized(result.message || '管理员密码错误')
    }

    const tokenVersion = await getTokenVersion(env)
    const token = await createJwt(
      { userId: 'admin', pathPrefix: '', admin: true, tokenVersion },
      env.JWT_SECRET,
      86400,
    )
    return successResponse({ token, message: '验证成功' })
  } catch (error) {
    Logger.error('Admin verify error:', error instanceof Error ? error : undefined)
    return serverError(getErrorMessage(error, '服务器错误'))
  }
}
