/**
 * 令牌生成工具
 */

/**
 * 生成随机令牌
 * @param length 令牌长度
 * @returns 随机令牌
 */
export function generateToken(length: number = 24): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(36)).join('')
}
