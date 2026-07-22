import { KV_KEY_PREFIX } from '../utils/constants'
import { successResponse, serverError, getErrorMessage } from '../utils/response'
import { isShareLinkData } from '../../types/shared'
import { checkFolderProtection } from '../utils/folder-auth'
import { verifyAdminToken } from '../utils/admin'
import type { Env } from '../types/env'
import type { ShareLink } from '../../types/shared'

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const shares: ShareLink[] = []
    let cursor: string | undefined = undefined

    const isAdmin = await verifyAdminToken(env, request)

    do {
      const list: {
        list_complete: boolean
        keys: { name: string }[]
        cursor?: string
      } = await env.NOTEPAD_KV.list({
        prefix: KV_KEY_PREFIX.LINK,
        cursor,
      })

      const pageShares = await Promise.all(
        list.keys.map(async (key) => {
          const value = await env.NOTEPAD_KV.get(key.name)
          if (!value) return null

          let data: unknown
          try {
            data = JSON.parse(value)
          } catch {
            return null
          }

          if (!isShareLinkData(data)) return null

          const token = key.name.slice(KV_KEY_PREFIX.LINK.length)
          const linkData = data as ShareLink
          const filename = linkData.filename

          if (!isAdmin) {
            // 非管理员：检查文件是否在受保护的文件夹中
            // 注意：分享链接是独立于文件夹访问权限的，即使登录了文件夹，
            // 受保护文件夹中的分享链接仍然需要验证密码才能复制
            const protection = await checkFolderProtection(env, filename)
            if (protection.protected) {
              // 受保护：遮蔽敏感信息，不返回 token、type 和 password，但显示完整文件名和路径
              const protectedPath = protection.protectedPath || ''
              return {
                id: token,
                type: '' as ShareLink['type'],
                token: '',
                filename,
                protected: true,
                protectedPath,
                expires: linkData.expires,
                oneTime: linkData.oneTime,
                password: null,
                createdAt: linkData.createdAt,
                used: linkData.used,
              } as ShareLink
            }
          }

          // 管理员或未受保护或已验证：返回完整信息
          return { token, ...data } as ShareLink
        }),
      )

      shares.push(...pageShares.filter((s): s is ShareLink => s !== null))
      cursor = !list.list_complete ? list.cursor : undefined
    } while (cursor)

    return successResponse(shares)
  } catch (err) {
    const message = getErrorMessage(err, '获取分享列表失败')
    return serverError(message)
  }
}
