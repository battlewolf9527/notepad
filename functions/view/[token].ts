import { generateViewPage, generatePasswordForm } from '../utils/share-page'
import { markShareLinkUsed, validateShareLinkWithResponse } from '../utils/share'
import { COOKIE_NAME } from '../utils/constants'
import { Logger } from '../utils/error'
import { notFound } from '../utils/response'
import type { Env } from '../types/env'

export async function onRequestOptions({ params, env }: { params: { token: string }; env: Env }) {
  const token = params.token
  const result = await validateShareLinkWithResponse(env, token)

  if ('response' in result) {
    return result.response
  }

  return new Response(null, { headers: result.headers })
}

export async function onRequestGet({
  params,
  request,
  env,
}: {
  params: { token: string }
  request: Request
  env: Env
}) {
  const token = params.token
  const validationResult = await validateShareLinkWithResponse(env, token)

  if ('response' in validationResult) {
    return validationResult.response
  }

  const { linkData, headers: corsHeaders } = validationResult

  if (linkData.password) {
    const cookie = request.headers.get('Cookie')
    const authToken = cookie
      ?.split('; ')
      .find((c) => c.startsWith(`${COOKIE_NAME.SHARE_AUTH}=`))
      ?.split('=')[1]
    if (!authToken || authToken !== token) {
      return new Response(generatePasswordForm(token), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  }

  const object = await env.NOTEPAD_R2.get(linkData.filename)
  if (!object) {
    return notFound('File not found')
  }

  const content = await object.text()

  try {
    await markShareLinkUsed(env, token, linkData)
  } catch (err) {
    Logger.error('Mark share link used error:', err instanceof Error ? err : undefined)
  }

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders,
  }

  if (!linkData.allowIframe) {
    responseHeaders['X-Frame-Options'] = 'DENY'
    responseHeaders['Content-Security-Policy'] = "frame-ancestors 'none'"
  }

  const [fontFamily, fontSizeStr, theme, customThemeStr] = await Promise.all([
    env.NOTEPAD_KV.get('config:fontFamily'),
    env.NOTEPAD_KV.get('config:fontSize'),
    env.NOTEPAD_KV.get('config:theme'),
    env.NOTEPAD_KV.get('config:customTheme'),
  ])

  const fontSize = parseInt(fontSizeStr || '14', 10)
  const customTheme = customThemeStr
    ? (JSON.parse(customThemeStr) as Record<string, string> | null)
    : null

  const resolvedFontFamily = fontFamily || 'Consolas'
  const resolvedTheme = theme || 'light'

  Logger.info('Share page theme config:', {
    fontFamily,
    fontSize,
    theme,
    customTheme: customTheme ? 'present' : 'null',
  })

  const html = generateViewPage(
    linkData.filename,
    content,
    resolvedFontFamily,
    fontSize,
    resolvedTheme,
    customTheme,
  )

  return new Response(html, { headers: responseHeaders })
}
