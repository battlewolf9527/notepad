import { KV_KEY_PREFIX } from './constants'
import { getErrorMessage } from './response'
import type { Env } from '../types/env'

export interface RetryRecord {
  count: number
  blockedUntil: number
}

const TIER_CONFIG = [
  { threshold: 3, duration: 5 },
  { threshold: 6, duration: 15 },
  { threshold: 9, duration: 30 },
] as const

export const EDGE_BLOCK_THRESHOLD = 10

export function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIp) return cfConnectingIp

  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = request.headers.get('X-Real-IP')
  if (xRealIp) return xRealIp

  return '127.0.0.1'
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getRetryKey(ipHash: string): string {
  return `${KV_KEY_PREFIX.RATE_LIMIT}retry:${ipHash}`
}

export function getEdgeBlockKey(ipHash: string): string {
  return `${KV_KEY_PREFIX.RATE_LIMIT}edge_block:${ipHash}`
}

export async function getRetryRecord(env: Env, ipHash: string): Promise<RetryRecord | null> {
  const key = getRetryKey(ipHash)
  const data = await env.NOTEPAD_KV.get(key)
  if (!data) return null

  try {
    return JSON.parse(data) as RetryRecord
  } catch {
    return null
  }
}

export async function saveRetryRecord(
  env: Env,
  ipHash: string,
  record: RetryRecord,
): Promise<void> {
  const key = getRetryKey(ipHash)
  const ttl = Math.max(Math.ceil((record.blockedUntil - Date.now()) / 1000), 3600)
  await env.NOTEPAD_KV.put(key, JSON.stringify(record), { expirationTtl: ttl })
}

export async function deleteRetryRecord(env: Env, ipHash: string): Promise<void> {
  const key = getRetryKey(ipHash)
  await env.NOTEPAD_KV.delete(key)
}

export function calculateBlockDuration(count: number): number {
  for (let i = TIER_CONFIG.length - 1; i >= 0; i--) {
    if (count >= TIER_CONFIG[i].threshold) {
      return TIER_CONFIG[i].duration * 60 * 1000
    }
  }
  return 0
}

export function getBlockDurationDescription(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes}分钟`
  }
  if (durationMinutes < 1440) {
    const hours = Math.round(durationMinutes / 60)
    return `${hours}小时`
  }
  const days = Math.round(durationMinutes / 1440)
  return `${days}天`
}

export async function checkIpBlocked(
  env: Env,
  ipHash: string,
): Promise<{ blocked: boolean; message?: string }> {
  if (await isEdgeBlocked(env, ipHash)) {
    return {
      blocked: true,
      message: '该 IP 已被永久封禁，请联系管理员解封',
    }
  }

  const record = await getRetryRecord(env, ipHash)
  if (!record) {
    return { blocked: false }
  }

  if (record.count >= EDGE_BLOCK_THRESHOLD) {
    return {
      blocked: true,
      message: '该 IP 已被永久封禁，请联系管理员解封',
    }
  }

  const now = Date.now()
  if (record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000)
    const durationDesc = getBlockDurationDescription(remainingMinutes)
    return {
      blocked: true,
      message: `已达到最大重试次数，请${durationDesc}后再试`,
    }
  }

  return { blocked: false }
}

export async function recordPasswordFailure(
  env: Env,
  ipHash: string,
  realIp: string,
): Promise<{ blocked: boolean; message?: string; shouldEdgeBlock: boolean }> {
  const now = Date.now()
  const record = await getRetryRecord(env, ipHash)
  const newCount = (record?.count || 0) + 1

  if (newCount >= EDGE_BLOCK_THRESHOLD) {
    const newRecord: RetryRecord = {
      count: newCount,
      blockedUntil: now + 365 * 24 * 60 * 60 * 1000,
    }
    await saveRetryRecord(env, ipHash, newRecord)

    if (!(await isEdgeBlocked(env, ipHash))) {
      await markEdgeBlocked(env, ipHash, realIp)
    }

    return {
      blocked: true,
      message: '该 IP 已被永久封禁，请联系管理员解封',
      shouldEdgeBlock: true,
    }
  }

  const blockDuration = calculateBlockDuration(newCount)
  const blockedUntil = now + blockDuration

  const newRecord: RetryRecord = {
    count: newCount,
    blockedUntil,
  }

  await saveRetryRecord(env, ipHash, newRecord)

  if (blockDuration > 0) {
    const durationDesc = getBlockDurationDescription(Math.round(blockDuration / 60000))
    return {
      blocked: true,
      message: `密码错误，已累计${newCount}次失败，账号将被封禁${durationDesc}`,
      shouldEdgeBlock: false,
    }
  }

  return {
    blocked: false,
    message: `密码错误，已累计${newCount}次失败`,
    shouldEdgeBlock: false,
  }
}

export async function recordPasswordSuccess(env: Env, ipHash: string): Promise<void> {
  const record = await getRetryRecord(env, ipHash)
  if (!record || record.count < EDGE_BLOCK_THRESHOLD) {
    await deleteRetryRecord(env, ipHash)
  }
}

export async function isEdgeBlocked(env: Env, ipHash: string): Promise<boolean> {
  const key = getEdgeBlockKey(ipHash)
  const data = await env.NOTEPAD_KV.get(key)
  return !!data
}

export async function markEdgeBlocked(env: Env, ipHash: string, realIp: string): Promise<void> {
  const key = getEdgeBlockKey(ipHash)
  await env.NOTEPAD_KV.put(key, realIp, { expirationTtl: 86400 })
}

export async function getIpsToEdgeBlock(env: Env): Promise<string[]> {
  const ips: string[] = []
  const prefix = getEdgeBlockKey('')
  let cursor: string | undefined
  let listComplete = false

  do {
    const result: {
      list_complete: boolean
      keys: { name: string }[]
      cursor?: string
    } = await env.NOTEPAD_KV.list({ prefix, cursor, limit: 100 })
    for (const key of result.keys) {
      const ip = await env.NOTEPAD_KV.get(key.name)
      if (ip) ips.push(ip)
    }
    cursor = result.cursor
    listComplete = result.list_complete
  } while (!listComplete)

  return ips
}

export async function addIpToBanList(
  env: Env,
  ip: string,
): Promise<{ success: boolean; error?: string }> {
  if (
    env.ENABLE_EDGE_BLOCKING !== 'true' ||
    !env.CLOUDFLARE_API_TOKEN ||
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_BAN_LIST_ID
  ) {
    return { success: false, error: '边缘封禁未配置' }
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rules/lists/${env.CLOUDFLARE_BAN_LIST_ID}/items`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ ip }]),
      },
    )

    const result = (await response.json()) as { success: boolean; errors?: { message: string }[] }
    if (result.success) {
      return { success: true }
    }

    return { success: false, error: result.errors?.[0]?.message || '添加失败' }
  } catch (err) {
    return { success: false, error: getErrorMessage(err, '网络错误') }
  }
}

export async function removeIpFromBanList(
  env: Env,
  ip: string,
): Promise<{ success: boolean; error?: string }> {
  if (
    env.ENABLE_EDGE_BLOCKING !== 'true' ||
    !env.CLOUDFLARE_API_TOKEN ||
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_BAN_LIST_ID
  ) {
    return { success: false, error: '边缘封禁未配置' }
  }

  try {
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rules/lists/${env.CLOUDFLARE_BAN_LIST_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
      },
    )

    const listResult = (await listResponse.json()) as {
      success: boolean
      errors?: { message: string }[]
      result?: { ip: string; id: string }[]
    }
    if (!listResult.success) {
      return { success: false, error: listResult.errors?.[0]?.message || '获取列表失败' }
    }

    const item = listResult.result?.find((item: { ip: string }) => item.ip === ip)
    if (!item) {
      return { success: true }
    }

    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rules/lists/${env.CLOUDFLARE_BAN_LIST_ID}/items/${item.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
      },
    )

    const deleteResult = (await deleteResponse.json()) as {
      success: boolean
      errors?: { message: string }[]
    }
    if (deleteResult.success) {
      return { success: true }
    }

    return { success: false, error: deleteResult.errors?.[0]?.message || '删除失败' }
  } catch (err) {
    return { success: false, error: getErrorMessage(err, '网络错误') }
  }
}
