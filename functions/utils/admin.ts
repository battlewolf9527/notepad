import type { Env } from '../types/env'
import {
  getClientIp,
  hashIp,
  checkIpBlocked,
  recordPasswordFailure,
  recordPasswordSuccess,
} from './rate-limit'
import { verifyJwt } from './jwt'
import { KV_KEY_PREFIX } from './constants'
import { timingSafeEqual } from './crypto'

export async function getTokenVersion(env: Env): Promise<number> {
  try {
    const version = await env.NOTEPAD_KV.get(KV_KEY_PREFIX.ADMIN_TOKEN_VERSION, 'json')
    return typeof version === 'number' ? version : 1
  } catch {
    return 1
  }
}

export async function incrementTokenVersion(env: Env): Promise<number> {
  const currentVersion = await getTokenVersion(env)
  const newVersion = currentVersion + 1
  await env.NOTEPAD_KV.put(KV_KEY_PREFIX.ADMIN_TOKEN_VERSION, JSON.stringify(newVersion))
  return newVersion
}

export async function verifyAdminPassword(
  env: Env,
  password: string,
  request: Request,
): Promise<{ verified: boolean; blocked?: boolean; message?: string }> {
  if (!env.ADMIN_PASSWORD) {
    return { verified: false, message: '系统管理员密码未配置' }
  }

  const ip = getClientIp(request)
  const ipHash = await hashIp(ip)
  const blockResult = await checkIpBlocked(env, ipHash)
  if (blockResult.blocked) {
    return { verified: false, blocked: true, message: blockResult.message || '账号已被封禁' }
  }

  if (!timingSafeEqual(password, env.ADMIN_PASSWORD)) {
    const failureResult = await recordPasswordFailure(env, ipHash, ip)
    if (failureResult.blocked) {
      return { verified: false, blocked: true, message: failureResult.message || '账号已被封禁' }
    }
    return { verified: false, message: '管理员密码错误' }
  }

  await recordPasswordSuccess(env, ipHash)
  return { verified: true }
}

export async function verifyAdminToken(env: Env, request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await verifyJwt(token, env.JWT_SECRET)
    if (decoded.admin !== true) {
      return false
    }

    const currentVersion = await getTokenVersion(env)
    if (decoded.tokenVersion !== currentVersion) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function checkRootPathAdminAccess(env: Env, request: Request): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) {
    return true
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7)
  try {
    const decoded = await verifyJwt(token, env.JWT_SECRET)
    if (decoded.userId !== 'admin' && decoded.admin !== true) {
      return false
    }

    const currentVersion = await getTokenVersion(env)
    if (decoded.tokenVersion !== currentVersion) {
      return false
    }

    return true
  } catch {
    return false
  }
}
