import { KV_KEY_PREFIX } from '../../utils/constants'
import {
  successResponse,
  badRequest,
  unauthorized,
  serverError,
  getErrorMessage,
} from '../../utils/response'
import { verifyFolderPassword } from '../../utils/folder-auth'
import { isShareLinkData } from '../../../types/shared'
import { parseJsonOrBadRequest } from '../../utils/api'
import type { Env } from '../../types/env'
import type { ShareLink } from '../../../types/shared'

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const parsed = await parseJsonOrBadRequest(request)
  if (parsed instanceof Response) return parsed

  const result = parsed as { id?: string; password?: string }
  const { id, password } = result

  if (!id || !password) {
    return badRequest('缺少链接 ID 或密码')
  }

  try {
    // 根据 ID 查找分享链接
    const key = `${KV_KEY_PREFIX.LINK}${id}`
    const value = await env.NOTEPAD_KV.get(key)
    if (!value) {
      return unauthorized('链接不存在或已失效')
    }

    let data: unknown
    try {
      data = JSON.parse(value)
    } catch {
      return badRequest('链接数据格式无效')
    }

    if (!isShareLinkData(data)) {
      return badRequest('链接数据格式无效')
    }

    const linkData = data as ShareLink
    const filename = linkData.filename

    // 验证文件夹密码
    const verifyResult = await verifyFolderPassword(env, filename, password, request)
    if (!verifyResult.verified) {
      if (verifyResult.blocked) {
        return unauthorized(verifyResult.message || '账号已被封禁')
      }
      return unauthorized(verifyResult.message || '密码错误')
    }

    // 验证通过，返回完整的链接信息
    const fullLink: ShareLink = {
      ...linkData,
      token: id,
      protected: false,
    }

    return successResponse(fullLink)
  } catch (err) {
    const message = getErrorMessage(err, '验证失败')
    return serverError(message)
  }
}
