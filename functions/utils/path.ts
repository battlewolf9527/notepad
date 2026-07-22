/**
 * 安全的路径处理工具函数
 */

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
