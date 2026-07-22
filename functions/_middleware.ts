import type { Env } from './types/env'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// 这些头允许被路由覆盖（如 view 页面的 iframe 策略）
export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next()

  const newResponse = new Response(response.body, response)

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newResponse.headers.set(key, value)
  }

  // 对于可覆盖的头，仅在路由未设置时添加默认值
  const url = new URL(context.request.url)
  if (url.pathname.startsWith('/view/')) {
    if (!newResponse.headers.has('X-Frame-Options')) {
      newResponse.headers.set('X-Frame-Options', 'DENY')
    }
    if (!newResponse.headers.has('Content-Security-Policy')) {
      newResponse.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'",
      )
    }
  } else {
    newResponse.headers.set('X-Frame-Options', 'DENY')
    newResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'",
    )
  }

  return newResponse
}
