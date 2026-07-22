/**
 * R2 类型扩展
 * Cloudflare Workers 类型定义可能滞后于实际 API，这里扩展缺失的属性
 */

// 扩展 R2PutOptions 以支持 copyFrom
declare global {
  interface R2PutOptions {
    /** 从另一个 R2 对象复制内容 */
    copyFrom?: string
  }
}

export {}