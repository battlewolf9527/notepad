/**
 * Cloudflare Workers 环境变量类型定义
 */

export interface Env {
  /** KV 命名空间，用于存储配置、文件夹密码和分享链接 */
  NOTEPAD_KV: KVNamespace

  /** R2 存储桶，用于存储文件 */
  NOTEPAD_R2: R2Bucket

  /** JWT 密钥，用于生成和验证令牌 */
  JWT_SECRET: string

  /** 是否启用边缘封禁 */
  ENABLE_EDGE_BLOCKING?: string

  /** Cloudflare API Token（用于管理 IP List） */
  CLOUDFLARE_API_TOKEN?: string

  /** Cloudflare 账户 ID */
  CLOUDFLARE_ACCOUNT_ID?: string

  /** Cloudflare ban 列表 ID */
  CLOUDFLARE_BAN_LIST_ID?: string

  /** 系统管理员密码，用于重置文件夹密码 */
  ADMIN_PASSWORD?: string

  /** 文件夹最大深度，默认 5 */
  MAX_FOLDER_DEPTH?: string
}
