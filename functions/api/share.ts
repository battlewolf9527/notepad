import { generateToken } from '../utils/token'
import { hashPassword } from '../utils/password'
import { createShareLink } from '../utils/share'
import { successResponse, badRequest, serverError, getErrorMessage } from '../utils/response'
import { parseJsonOrBadRequest, validateShareLinkFields } from '../utils/api'
import { checkPathAccessOrUnauthorized } from '../utils/folder-auth'
import type { Env } from '../types/env'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const result = parsed as {
    expiresInHours?: number
    oneTime?: boolean
    password?: string
    renderMarkdown?: boolean
    allowIframe?: boolean
    filename?: string
  }

  const {
    expiresInHours = 24,
    oneTime = false,
    password,
    renderMarkdown = true,
    allowIframe = false,
  } = result

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
        type: 'view',
        filename: validation.filename,
        expiresInHours,
        oneTime,
        password,
        renderMarkdown,
        allowIframe,
      },
      generateToken,
      hashPassword,
    )

    return successResponse(shareResult)
  } catch (err) {
    const message = getErrorMessage(err, '创建分享链接失败')
    return serverError(message)
  }
}
