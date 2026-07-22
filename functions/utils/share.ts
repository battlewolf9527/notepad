import { KV_KEY_PREFIX, PERMANENT_LINK_EXPIRY, DEFAULT_TOKEN_LENGTH } from './constants'
import { isShareLinkData } from '../../types/shared'
import type { ShareLinkData, CreateShareLinkOptions } from '../../types/shared'
import { notFound } from './response'
import { Logger } from './error'
import type { Env } from '../types/env'

/**
 * 验证分享链接并返回响应
 * 如果验证失败返回 Response，成功返回链接数据和 CORS 头
 */
export async function validateShareLinkWithResponse(
  env: Env,
  token: string,
): Promise<{ linkData: ShareLinkData; headers: Record<string, string> } | { response: Response }> {
  const linkData = await validateShareLink(env, token)

  if (!linkData) {
    return { response: notFound('Link not found or expired') }
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (linkData.corsOrigin) {
    headers['Access-Control-Allow-Origin'] = linkData.corsOrigin
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
  }

  return { linkData, headers }
}

export async function validateShareLink(env: Env, token: string): Promise<ShareLinkData | null> {
  const linkDataStr = await env.NOTEPAD_KV.get(`${KV_KEY_PREFIX.LINK}${token}`)

  if (!linkDataStr) {
    return null
  }

  let linkData: unknown
  try {
    linkData = JSON.parse(linkDataStr)
  } catch {
    return null
  }

  if (!isShareLinkData(linkData)) {
    try {
      await env.NOTEPAD_KV.delete(`${KV_KEY_PREFIX.LINK}${token}`)
    } catch (err) {
      Logger.error('Failed to delete invalid share link:', err instanceof Error ? err : undefined)
    }
    return null
  }

  if (Date.now() > linkData.expires) {
    try {
      await env.NOTEPAD_KV.delete(`${KV_KEY_PREFIX.LINK}${token}`)
    } catch (err) {
      Logger.error('Failed to delete expired share link:', err instanceof Error ? err : undefined)
    }
    return null
  }

  return linkData
}

export async function markShareLinkUsed(
  env: Env,
  token: string,
  linkData: ShareLinkData,
): Promise<void> {
  if (linkData.oneTime) {
    try {
      await env.NOTEPAD_KV.delete(`${KV_KEY_PREFIX.LINK}${token}`)
    } catch (err) {
      Logger.error('Failed to delete one-time share link:', err instanceof Error ? err : undefined)
    }
  }
}

export async function createShareLink(
  env: Env,
  options: CreateShareLinkOptions,
  generateToken: (length: number) => string,
  hashPassword?: (password: string) => Promise<string>,
): Promise<{ token: string; url: string }> {
  const { type, filename, expiresInHours, oneTime } = options
  const token = generateToken(DEFAULT_TOKEN_LENGTH)
  const expires =
    expiresInHours === 0
      ? Date.now() + PERMANENT_LINK_EXPIRY
      : Date.now() + expiresInHours * 60 * 60 * 1000

  let passwordHash = null
  if (options.password && hashPassword) {
    passwordHash = await hashPassword(options.password)
  }

  const linkData: ShareLinkData = {
    type,
    filename,
    expires,
    oneTime,
    password: passwordHash,
    createdAt: Date.now(),
    used: false,
  }

  if (type === 'view') {
    linkData.renderMarkdown = options.renderMarkdown ?? true
    linkData.allowIframe = options.allowIframe ?? false
  } else {
    linkData.contentType = options.contentType
    linkData.corsOrigin = options.corsOrigin
  }

  const ttl = expiresInHours === 0 ? undefined : expiresInHours * 60 * 60
  await env.NOTEPAD_KV.put(`${KV_KEY_PREFIX.LINK}${token}`, JSON.stringify(linkData), {
    expirationTtl: ttl,
  })

  return { token, url: `/${type}/${token}` }
}
