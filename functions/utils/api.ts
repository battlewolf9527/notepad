import { sanitizePath } from './path'
import { getErrorMessage, badRequest } from './response'

export async function parseJsonOrBadRequest<T = unknown>(request: Request): Promise<T | Response> {
  try {
    return await request.json()
  } catch (err) {
    return badRequest(getErrorMessage(err, '无效的 JSON 格式'))
  }
}

export function validateShareLinkFields(data: unknown): { valid: boolean; filename?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false }
  }

  const { filename, expiresInHours } = data as {
    filename?: unknown
    expiresInHours?: unknown
  }

  if (!filename || typeof filename !== 'string') {
    return { valid: false }
  }

  if (expiresInHours !== undefined && (typeof expiresInHours !== 'number' || expiresInHours < 0)) {
    return { valid: false }
  }

  const sanitizedPath = sanitizePath(filename)
  if (sanitizedPath === null) {
    return { valid: false }
  }

  return { valid: true, filename: sanitizedPath }
}

export function isValidContentType(contentType: unknown): contentType is string {
  if (typeof contentType !== 'string') return false
  return /^[\w-]+\/[\w-]+(;[\w-]+=[\w-]+)*$/.test(contentType)
}

export function isValidCorsOrigin(corsOrigin: unknown): corsOrigin is string {
  if (typeof corsOrigin !== 'string') return false
  if (corsOrigin === '*') return true
  return /^https?:\/\/[\w-]+(\.[\w-]+)*(:\d+)?$/.test(corsOrigin)
}
