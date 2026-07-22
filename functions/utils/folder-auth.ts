import { verifyPassword } from './password'
import { verifyJwt } from './jwt'
import { KV_KEY_PREFIX } from './constants'
import { unauthorized } from './response'
import { Logger } from './error'
import type { Env } from '../types/env'
import {
  getClientIp,
  hashIp,
  checkIpBlocked,
  recordPasswordFailure,
  recordPasswordSuccess,
  addIpToBanList,
} from './rate-limit'

export async function getFolderPasswordHash(env: Env, folderPath: string): Promise<string | null> {
  const key = `${KV_KEY_PREFIX.FOLDER_PASSWORD}${folderPath}`
  return env.NOTEPAD_KV.get(key)
}

export async function setFolderPasswordHash(
  env: Env,
  folderPath: string,
  hash: string,
): Promise<void> {
  const key = `${KV_KEY_PREFIX.FOLDER_PASSWORD}${folderPath}`
  await env.NOTEPAD_KV.put(key, hash)
}

export async function removeFolderPasswordHash(env: Env, folderPath: string): Promise<void> {
  const key = `${KV_KEY_PREFIX.FOLDER_PASSWORD}${folderPath}`
  await env.NOTEPAD_KV.delete(key)
}

export async function checkFolderNoEncrypt(env: Env, folderPath: string): Promise<boolean> {
  const key = `${KV_KEY_PREFIX.FOLDER_NO_ENCRYPT}${folderPath}`
  const result = await env.NOTEPAD_KV.get(key)
  return result === 'true'
}

export async function checkPathNoEncrypt(
  env: Env,
  targetPath: string,
): Promise<{
  noEncrypt: boolean
  noEncryptPath: string | null
}> {
  const noEncrypt = await checkFolderNoEncrypt(env, targetPath)
  if (noEncrypt) {
    return {
      noEncrypt: true,
      noEncryptPath: targetPath,
    }
  }

  return { noEncrypt: false, noEncryptPath: null }
}

export async function setFolderNoEncrypt(env: Env, folderPath: string): Promise<void> {
  const key = `${KV_KEY_PREFIX.FOLDER_NO_ENCRYPT}${folderPath}`
  await env.NOTEPAD_KV.put(key, 'true')
}

export async function removeFolderNoEncrypt(env: Env, folderPath: string): Promise<void> {
  const key = `${KV_KEY_PREFIX.FOLDER_NO_ENCRYPT}${folderPath}`
  await env.NOTEPAD_KV.delete(key)
}

export async function getFolderTokenVersion(env: Env, folderPath: string): Promise<number> {
  const key = `${KV_KEY_PREFIX.FOLDER_TOKEN_VERSION}${folderPath}`
  try {
    const version = await env.NOTEPAD_KV.get(key, 'json')
    return typeof version === 'number' ? version : 1
  } catch {
    return 1
  }
}

export async function incrementFolderTokenVersion(env: Env, folderPath: string): Promise<number> {
  const currentVersion = await getFolderTokenVersion(env, folderPath)
  const newVersion = currentVersion + 1
  const key = `${KV_KEY_PREFIX.FOLDER_TOKEN_VERSION}${folderPath}`
  await env.NOTEPAD_KV.put(key, JSON.stringify(newVersion))
  return newVersion
}

export async function checkFolderProtection(
  env: Env,
  targetPath: string,
): Promise<{ protected: boolean; protectedPath: string | null; hash: string | null }> {
  let currentPath = targetPath

  while (true) {
    const hash = await getFolderPasswordHash(env, currentPath)
    if (hash) {
      return {
        protected: true,
        protectedPath: currentPath,
        hash,
      }
    }

    if (!currentPath) {
      break
    }

    const lastSlash = currentPath.lastIndexOf('/')
    currentPath = lastSlash === -1 ? '' : lastSlash === 0 ? '' : currentPath.substring(0, lastSlash)
  }

  return { protected: false, protectedPath: null, hash: null }
}

export async function verifyFolderPassword(
  env: Env,
  path: string,
  password: string,
  request?: Request,
): Promise<{
  verified: boolean
  protectedPath: string
  blocked?: boolean
  message?: string
}> {
  const protection = await checkFolderProtection(env, path)
  if (!protection.protected || !protection.hash) {
    return { verified: true, protectedPath: path }
  }

  const protectedPath = protection.protectedPath || path

  let ip: string | undefined
  let ipHash: string | undefined
  if (request) {
    ip = getClientIp(request)
    ipHash = await hashIp(ip)
    const blockResult = await checkIpBlocked(env, ipHash)
    if (blockResult.blocked) {
      addIpToBanList(env, ip).catch((err) => {
        Logger.error('Failed to add IP to ban list:', err instanceof Error ? err : undefined)
      })
      return {
        verified: false,
        protectedPath,
        blocked: true,
        message: blockResult.message,
      }
    }
  }

  const verified = await verifyPassword(password, protection.hash)

  if (request && ip && ipHash) {
    if (verified) {
      await recordPasswordSuccess(env, ipHash)
    } else {
      const failureResult = await recordPasswordFailure(env, ipHash, ip)
      if (failureResult.shouldEdgeBlock) {
        addIpToBanList(env, ip).catch((err) => {
          Logger.error('Failed to add IP to ban list:', err instanceof Error ? err : undefined)
        })
      }
      if (failureResult.blocked) {
        return {
          verified: false,
          protectedPath,
          blocked: true,
          message: failureResult.message,
        }
      }
      return {
        verified: false,
        protectedPath,
        message: failureResult.message,
      }
    }
  }

  return { verified, protectedPath }
}

export async function getPathPrefixFromRequest(env: Env, request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await verifyJwt(token, env.JWT_SECRET)
    if (decoded.pathPrefix === undefined || decoded.pathPrefix === null) {
      return null
    }

    const currentVersion = await getFolderTokenVersion(env, decoded.pathPrefix)
    if (decoded.tokenVersion !== currentVersion) {
      return null
    }

    return decoded.pathPrefix
  } catch {
    return null
  }
}

export async function checkPathAccess(
  env: Env,
  request: Request,
  targetPath: string,
): Promise<{ allowed: boolean; protectedPath: string | null; error?: string }> {
  const protection = await checkFolderProtection(env, targetPath)

  if (!protection.protected) {
    return { allowed: true, protectedPath: null }
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = await verifyJwt(token, env.JWT_SECRET)
      if (decoded.admin === true) {
        return { allowed: true, protectedPath: null }
      }
      if (decoded.pathPrefix === protection.protectedPath) {
        return { allowed: true, protectedPath: null }
      }
    } catch {
      // Token invalid
    }
  }

  return {
    allowed: false,
    protectedPath: protection.protectedPath || '',
    error: '需要密码',
  }
}

export async function checkFolderProtected(env: Env, folderPath: string): Promise<boolean> {
  const hash = await getFolderPasswordHash(env, folderPath)
  return !!hash
}

export async function checkFoldersProtected(
  env: Env,
  folderPaths: string[],
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  const promises = folderPaths.map(async (path) => {
    results[path] = await checkFolderProtected(env, path)
  })
  await Promise.all(promises)
  return results
}

export async function checkFoldersNoEncrypt(
  env: Env,
  folderPaths: string[],
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  const promises = folderPaths.map(async (path) => {
    results[path] = await checkFolderNoEncrypt(env, path)
  })
  await Promise.all(promises)
  return results
}

export async function checkPathAccessOrUnauthorized(
  env: Env,
  request: Request,
  targetPath: string,
  errorMessage?: string,
): Promise<Response | null> {
  const accessCheck = await checkPathAccess(env, request, targetPath)
  if (!accessCheck.allowed) {
    return unauthorized(errorMessage || accessCheck.error || '需要密码', {
      'X-Protected-Path': accessCheck.protectedPath || '',
    })
  }
  return null
}
