/**
 * 安全的路径处理工具函数
 */

/**
 * 安全解码 URL path segments
 * Cloudflare Pages Functions 的动态路由 params 不会自动解码 URL 编码的 path 段
 * 此函数对每个 segment 单独做 decodeURIComponent，避免 %2F 被解码为 / 造成路径注入
 * @param segments URL path segments（可能包含 % 编码的中文字符等）
 * @returns 解码后的 path segments，解码失败的 segment 保持原样
 */
export function decodePathSegments(segments: string[]): string[] {
  return segments.map((segment) => {
    // 只有包含 % 序列的 segment 才尝试解码，避免对字面量 %（如 "100%2E"）造成误解码
    if (!segment.includes('%')) return segment
    try {
      return decodeURIComponent(segment)
    } catch {
      // 解码失败（例如包含不完整的 % 序列），保留原值
      console.warn('路径段解码失败:', segment)
      return segment
    }
  })
}

/**
 * 从 params.path 构建解码后的文件路径
 * @param segments Cloudflare Pages Functions 动态路由 params.path
 * @returns 解码后的完整文件路径
 */
export function buildDecodedFilePath(segments?: string[]): string {
  if (!segments || segments.length === 0) return ''
  return decodePathSegments(segments).join('/')
}

/**
 * 验证并清理路径，防止路径遍历攻击
 * @param path 原始路径
 * @returns 清理后的安全路径，如果路径无效则返回 null
 */
export function sanitizePath(path: string): string | null {
  if (path === undefined || path === null || typeof path !== 'string') {
    return null
  }

  const trimmed = path.trim()
  if (trimmed === '') {
    return ''
  }

  let sanitized = trimmed.replace(/\\/g, '/').replace(/\/+/g, '/')

  const segments = sanitized.split('/').filter((segment) => {
    const trimmedSegment = segment.trim()
    return trimmedSegment !== '' && trimmedSegment !== '.' && trimmedSegment !== '..'
  })

  sanitized = segments.join('/')

  if (/[<>:"|?*]/.test(sanitized)) {
    return null
  }

  return sanitized
}

export function isValidPath(path: string): boolean {
  return sanitizePath(path) !== null
}

/**
 * 计算文件夹路径的深度
 * 根目录为 0，如 "notes" 深度为 1，"notes/2024" 深度为 2
 * @param path 文件夹路径
 * @returns 深度值
 */
export function getFolderDepth(path: string): number {
  const sanitized = sanitizePath(path)
  if (!sanitized) return 0
  return sanitized.split('/').length
}

/**
 * 获取最大文件夹深度，默认 5
 * @param env 环境变量
 * @returns 最大深度
 */
export function getMaxFolderDepth(env: { MAX_FOLDER_DEPTH?: string }): number {
  const depth = parseInt(env.MAX_FOLDER_DEPTH || '5', 10)
  return isNaN(depth) || depth < 1 ? 5 : depth
}
