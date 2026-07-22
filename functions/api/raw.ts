import { generateToken } from '../utils/token'
import { createShareLink } from '../utils/share'
import { successResponse, badRequest, serverError, getErrorMessage } from '../utils/response'
import {
  parseJsonOrBadRequest,
  validateShareLinkFields,
  isValidContentType,
  isValidCorsOrigin,
} from '../utils/api'
import { checkPathAccessOrUnauthorized } from '../utils/folder-auth'
import type { Env } from '../types/env'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const result = parsed as {
    expiresInHours?: number
    oneTime?: boolean
    contentType?: string
    corsOrigin?: string
    filename?: string
  }

  const { expiresInHours = 24, oneTime = false, contentType, corsOrigin } = result

  if (contentType !== undefined && !isValidContentType(contentType)) {
    return badRequest('无效的 Content-Type 格式')
  }

  if (corsOrigin !== undefined && !isValidCorsOrigin(corsOrigin)) {
    return badRequest('无效的 CORS 源格式')
  }

  const validation = validateShareLinkFields(result)
  if (!validation.valid || !validation.filename) {
    return badRequest('无效的文件路径')
  }

  const accessResponse = await checkPathAccessOrUnauthorized(env, request, validation.filename)
  if (accessResponse) return accessResponse

  try {
    const shareResult = await createShareLink(
      env,
      {
        type: 'raw',
        filename: validation.filename,
        expiresInHours,
        oneTime,
        contentType,
        corsOrigin,
      },
      generateToken,
    )

    return successResponse(shareResult)
  } catch (err) {
    const message = getErrorMessage(err, '创建分享链接失败')
    return serverError(message)
  }
}
