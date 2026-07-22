/**
 * 前端常量定义
 *
 * 注意：后端有独立的常量定义文件 functions/utils/constants.ts
 * 前端常量主要用于 API 调用和前端逻辑，后端常量主要用于业务逻辑和存储
 */

/**
 * API 路由前缀
 */
export const API_PREFIX = '/api'

/**
 * 获取当前窗口的 origin
 */
export function getOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
