import { verifyPassword } from '../../utils/password'
import { errorResponse, serverError, getErrorMessage } from '../../utils/response'
import { KV_KEY_PREFIX, COOKIE_NAME } from '../../utils/constants'
import { isShareLinkData } from '../../../types/shared'
import type { Env } from '../../types/env'

export async function onRequestPost({
  params,
  request,
  env,
}: {
  params: { token: string }
  request: Request
  env: Env
}) {
  const token = params.token

  let formData
  try {
    formData = await request.formData()
  } catch (err) {
    return serverError(getErrorMessage(err, '无效的表单数据'))
  }

  const password = formData.get('password') as string

  try {
    const linkDataStr = await env.NOTEPAD_KV.get(`${KV_KEY_PREFIX.LINK}${token}`)
    if (!linkDataStr) {
      return errorResponse('Unauthorized', 403)
    }

    let linkData
    try {
      linkData = JSON.parse(linkDataStr)
    } catch {
      return errorResponse('Unauthorized', 403)
    }

    if (!isShareLinkData(linkData)) {
      return errorResponse('Unauthorized', 403)
    }

    if (Date.now() > linkData.expires && linkData.expires !== 0) {
      return errorResponse('Link expired', 410)
    }

    if (!linkData.password) {
      return errorResponse('Unauthorized', 403)
    }

    const isValid = await verifyPassword(password, linkData.password)

    if (!isValid) {
      return errorResponse('Unauthorized', 403)
    }

    const maxAge =
      linkData.expires === 0 ? 31536000 : Math.floor((linkData.expires - Date.now()) / 1000)

    return new Response(null, {
      status: 302,
      headers: {
        Location: `/view/${token}`,
        'Set-Cookie': `${COOKIE_NAME.SHARE_AUTH}=${token}; Path=/view/${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.max(maxAge, 3600)}`,
      },
    })
  } catch (err) {
    return serverError(getErrorMessage(err, '服务器错误'))
  }
}
