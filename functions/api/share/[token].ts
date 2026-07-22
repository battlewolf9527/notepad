import { KV_KEY_PREFIX } from '../../utils/constants'
import {
  successResponse,
  badRequest,
  serverError,
  forbidden,
  getErrorMessage,
} from '../../utils/response'
import { verifyAdminToken } from '../../utils/admin'
import type { Env } from '../../types/env'

export async function onRequestDelete({
  params,
  env,
  request,
}: {
  params: { token: string }
  env: Env
  request: Request
}) {
  const token = params.token

  if (!token || typeof token !== 'string') {
    return badRequest('无效的令牌')
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(token)) {
    return badRequest('令牌格式无效')
  }

  const isAdmin = await verifyAdminToken(env, request)
  if (!isAdmin) {
    return forbidden('需要管理员权限')
  }

  try {
    await env.NOTEPAD_KV.delete(`${KV_KEY_PREFIX.LINK}${token}`)
    return successResponse(undefined)
  } catch (err) {
    const message = getErrorMessage(err, '删除分享链接失败')
    return serverError(message)
  }
}
