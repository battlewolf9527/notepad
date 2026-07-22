import { KV_KEY_PREFIX } from '../utils/constants'
import { successResponse, badRequest, serverError, getErrorMessage } from '../utils/response'
import { parseJsonOrBadRequest } from '../utils/api'
import type { Env } from '../types/env'

const CONFIG_KEYS = [
  'siteTitle',
  'theme',
  'customTheme',
  'autoWrap',
  'scale',
  'saveExtensions',
  'defaultExtension',
  'defaultEncoding',
  'fontFamily',
  'fontSize',
]

function validateConfigValue(key: string, value: unknown): boolean {
  const validThemes = [
    'light',
    'dark',
    'deep-blue',
    'eye-green',
    'rose',
    'amber',
    'purple',
    'custom',
  ]
  switch (key) {
    case 'theme':
      return typeof value === 'string' && validThemes.includes(value)
    case 'scale': {
      const num = Number(value)
      return !isNaN(num) && num >= 50 && num <= 200
    }
    case 'fontSize': {
      const num = Number(value)
      return !isNaN(num) && num >= 8 && num <= 72
    }
    case 'autoWrap':
      return typeof value === 'boolean'
    case 'defaultExtension':
      return typeof value === 'string' && /^\.[a-zA-Z0-9]{1,10}$/.test(value)
    case 'siteTitle':
      return typeof value === 'string' && value.length <= 100
    case 'fontFamily':
      return typeof value === 'string' && value.length <= 200
    case 'saveExtensions':
      return Array.isArray(value) && value.every((ext) => typeof ext === 'string')
    case 'defaultEncoding':
      return typeof value === 'string' && /^[a-zA-Z0-9_-]{2,20}$/.test(value)
    default:
      return true
  }
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const config: Record<string, string | null> = {}
    for (const key of CONFIG_KEYS) {
      config[key] = await env.NOTEPAD_KV.get(`${KV_KEY_PREFIX.CONFIG}${key}`)
    }
    return successResponse(config)
  } catch (err) {
    const message = getErrorMessage(err, '获取配置失败')
    return serverError(message)
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const data = parsed as Record<string, unknown>

  try {
    for (const key of CONFIG_KEYS) {
      if (data[key] !== undefined) {
        if (!validateConfigValue(key, data[key])) {
          return badRequest(`无效的${key}值`)
        }
        if (key === 'saveExtensions') {
          await env.NOTEPAD_KV.put(`${KV_KEY_PREFIX.CONFIG}${key}`, JSON.stringify(data[key]))
        } else {
          await env.NOTEPAD_KV.put(`${KV_KEY_PREFIX.CONFIG}${key}`, String(data[key]))
        }
      }
    }
    return successResponse(undefined)
  } catch (err) {
    const message = getErrorMessage(err, '保存配置失败')
    return serverError(message)
  }
}
