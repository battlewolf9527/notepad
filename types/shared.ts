export interface FileInfo {
  name: string
  size: number
  lastModified: number
}

export interface FolderInfo {
  name: string
  protected: boolean
  noEncrypt?: boolean
}

export interface FileListResponse {
  folders: FolderInfo[]
  files: FileInfo[]
  rootProtected?: boolean
  currentProtected?: boolean
  currentNoEncrypt?: boolean
}

export interface FileContentResponse {
  content: string
  size: number
  lastModified: number
}

export type ThemeType =
  | 'light'
  | 'dark'
  | 'deep-blue'
  | 'eye-green'
  | 'rose'
  | 'amber'
  | 'purple'
  | 'custom'

export interface Config {
  siteTitle?: string
  theme?: ThemeType
  customTheme?: string
  autoWrap?: boolean
  autoSave?: boolean
  saveExtensions?: string[]
  scale?: number
  defaultExtension?: string
  defaultEncoding?: string
}

export type ShareLinkType = 'view' | 'raw'

export interface ShareLinkData {
  type: ShareLinkType
  filename: string
  expires: number
  oneTime: boolean
  password: string | null
  renderMarkdown?: boolean
  allowIframe?: boolean
  contentType?: string
  corsOrigin?: string
  createdAt: number
  used: boolean
}

export interface ShareLink extends ShareLinkData {
  token: string
  /** 是否属于受密码保护的文件夹 */
  protected?: boolean
  /** 受保护的文件夹路径（仅 protected=true 时有值） */
  protectedPath?: string
  /** 受保护链接的引用 ID（仅 protected=true 时有值，用于验证密码） */
  id?: string
}

export interface ShareLinkCreationResponse {
  token: string
  url: string
}

export interface CreateShareLinkOptions {
  type: ShareLinkType
  filename: string
  expiresInHours: number
  oneTime: boolean
  password?: string | null
  renderMarkdown?: boolean
  allowIframe?: boolean
  contentType?: string
  corsOrigin?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 共享路径工具函数
 */

/**
 * 获取父路径
 */
export function getParentPath(path: string): string {
  if (!path || typeof path !== 'string') {
    return ''
  }
  const parts = path.split('/').filter(Boolean)
  parts.pop()
  return parts.join('/')
}

/**
 * 拼接路径
 */
export function joinPath(...parts: string[]): string {
  return parts
    .filter((p) => p && p.trim() !== '')
    .map((p) => p.replace(/^\/|\/$/g, ''))
    .filter(Boolean)
    .join('/')
}

/**
 * 获取路径中的文件名（不含目录部分）
 */
export function basename(path: string): string {
  if (!path || typeof path !== 'string') {
    return ''
  }
  const lastSlash = path.lastIndexOf('/')
  if (lastSlash === -1) {
    return path
  }
  return path.substring(lastSlash + 1)
}

/**
 * 判断是否为根路径
 */
export function isRootPath(path: string): boolean {
  const sanitized = path.trim()
  return sanitized === '' || sanitized === '/' || sanitized === '.'
}

/**
 * 判断文件操作是否在根目录下进行
 */
export function isRootOperation(filePath: string): boolean {
  const parentPath = getParentPath(filePath)
  return isRootPath(parentPath)
}

/**
 * Windows 文件名禁止的特殊字符
 */
const WINDOWS_INVALID_CHARS = /[\\/:*?"<>|]/

/**
 * Windows 保留文件名（不区分大小写）
 */
const WINDOWS_RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
])

/**
 * 验证文件名是否符合 Windows 命名规范
 * @param filename 文件名（不含路径）
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateFileName(filename: string): { valid: boolean; error?: string } {
  if (!filename || !filename.trim()) {
    return { valid: false, error: '文件名不能为空' }
  }

  const trimmed = filename.trim()

  if (trimmed.length > 255) {
    return { valid: false, error: '文件名长度不能超过 255 个字符' }
  }

  if (WINDOWS_INVALID_CHARS.test(trimmed)) {
    return { valid: false, error: '文件名不能包含以下字符: \\ / : * ? " < > |' }
  }

  if (trimmed.endsWith('.') || trimmed.endsWith(' ')) {
    return { valid: false, error: '文件名不能以空格或句点结尾' }
  }

  const nameWithoutExtension = trimmed.includes('.')
    ? trimmed.substring(0, trimmed.lastIndexOf('.'))
    : trimmed

  if (WINDOWS_RESERVED_NAMES.has(nameWithoutExtension.toLowerCase())) {
    return { valid: false, error: `文件名 "${trimmed}" 是系统保留名称，不能使用` }
  }

  return { valid: true }
}

/**
 * 验证对象是否为有效的 ShareLinkData
 */
export function isShareLinkData(data: unknown): data is ShareLinkData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  // 检查必填字段
  if (typeof obj.type !== 'string') return false
  if (typeof obj.filename !== 'string') return false
  if (typeof obj.expires !== 'number') return false
  if (typeof obj.oneTime !== 'boolean') return false
  // password 字段可选，可能是 null、string 或 undefined
  if (obj.password !== undefined && obj.password !== null && typeof obj.password !== 'string')
    return false
  if (typeof obj.createdAt !== 'number') return false
  if (typeof obj.used !== 'boolean') return false

  // 验证 type
  if (obj.type !== 'view' && obj.type !== 'raw') return false

  return true
}
