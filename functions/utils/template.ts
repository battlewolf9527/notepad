export function renderTemplate(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    // 使用 split/join 替代 replace，避免替换字符串中 $ 的特殊含义
    result = result.split(`{{${key}}}`).join(value)
  }
  return result
}
