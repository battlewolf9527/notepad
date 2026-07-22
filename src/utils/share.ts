export function formatExpires(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now
  if (diff < 0) return '已过期'
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
  if (years >= 1) return '永久有效'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
  if (days > 0) return `${days}天${hours > 0 ? hours + '小时' : ''}`
  if (hours > 0) return `${hours}小时`
  return '小于1小时'
}

export function formatCreatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}