/**
 * 应用常量定义
 */

/**
 * KV 存储键前缀
 */
export const KV_KEY_PREFIX = {
  LINK: 'link:',
  CONFIG: 'config:',
  FOLDER_PASSWORD: 'folder:password:',
  FOLDER_NO_ENCRYPT: 'folder:no_encrypt:',
  FOLDER_TOKEN_VERSION: 'folder:token_version:',
  ADMIN_TOKEN_VERSION: 'admin:token_version:',
  RATE_LIMIT: 'rate_limit:',
} as const

/**
 * 批量操作的最大文件数量
 * R2规范规定单次批量删除最多1000个对象
 */
export const MAX_BATCH_SIZE = 1000

/**
 * 列表查询的最大返回数量
 * R2规范规定单次列表查询最多返回1000个对象
 */
export const LIST_LIMIT = 1000

/**
 * 永久链接的有效期（毫秒）
 */
export const PERMANENT_LINK_EXPIRY = 10 * 365 * 24 * 60 * 60 * 1000 // 10 年

/**
 * 密码哈希迭代次数
 */
export const PASSWORD_HASH_ITERATIONS = 100000

/**
 * 密码哈希输出长度（位）
 */
export const PASSWORD_HASH_LENGTH = 256

/**
 * 随机令牌默认长度
 */
export const DEFAULT_TOKEN_LENGTH = 24

/**
 * Cookie 名称（用于分享链接认证）
 */
export const COOKIE_NAME = {
  SHARE_AUTH: 'share_auth',
} as const
