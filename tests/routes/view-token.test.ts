import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockEnv, createMockR2 } from '../setup'
import { onRequestGet, onRequestOptions } from '../../functions/view/[token]'
import { KV_KEY_PREFIX, COOKIE_NAME } from '../../functions/utils/constants'
import { hashPassword } from '../../functions/utils/password'

describe('view/[token] Route', () => {
  let env: ReturnType<typeof createMockEnv>
  let mockR2: ReturnType<typeof createMockR2>

  beforeEach(() => {
    mockR2 = createMockR2()
    env = createMockEnv(undefined, mockR2.r2)
    vi.clearAllMocks()
  })

  const createValidLink = async (
    token: string,
    filename: string,
    options: { password?: boolean; allowIframe?: boolean } = {},
  ) => {
    const linkData: Record<string, unknown> = {
      filename,
      type: 'view',
      expires: Date.now() + 3600000,
      oneTime: false,
      createdAt: Date.now(),
      used: false,
      allowIframe: options.allowIframe ?? false,
    }

    if (options.password) {
      linkData.password = await hashPassword('test-password')
    }

    await env.NOTEPAD_KV.put(`${KV_KEY_PREFIX.LINK}${token}`, JSON.stringify(linkData))
    await mockR2.r2.put(filename, '# Heading\n\n**bold** text')
  }

  describe('GET /view/[token]', () => {
    it('should return 404 for invalid token', async () => {
      const response = await onRequestGet({
        params: { token: 'invalid' },
        env,
        request: new Request('http://localhost/view/invalid'),
      })
      expect(response.status).toBe(404)
    })

    it('should return HTML page with client-side rendering setup', async () => {
      await createValidLink('valid-token', 'test.md')
      await env.NOTEPAD_KV.put('config:theme', 'dark')

      const response = await onRequestGet({
        params: { token: 'valid-token' },
        env,
        request: new Request('http://localhost/view/valid-token'),
      })
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')

      const html = await response.text()
      expect(html).toContain('<html')
      expect(html).toContain('<script type="application/base64" id="markdownContent">')
      expect(html).toContain('renderMarkdown')
      expect(html).toContain('content markdown-view')
      expect(html).toContain('<html class="dark">')
    })

    it('should apply amber theme from KV config', async () => {
      await createValidLink('amber-token', 'test.md')
      await env.NOTEPAD_KV.put('config:theme', 'amber')

      const response = await onRequestGet({
        params: { token: 'amber-token' },
        env,
        request: new Request('http://localhost/view/amber-token'),
      })
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('<html class="amber">')
    })

    it('should apply custom theme from KV config', async () => {
      await createValidLink('custom-theme-token', 'test.md')
      await env.NOTEPAD_KV.put('config:theme', 'custom')
      await env.NOTEPAD_KV.put(
        'config:customTheme',
        JSON.stringify({
          bgPrimary: '#123456',
          bgSecondary: '#234567',
          bgTertiary: '#345678',
          textPrimary: '#ffffff',
          textSecondary: '#cccccc',
          textMuted: '#999999',
          borderLight: '#456789',
          borderMedium: '#567890',
          accentPrimary: '#ff0000',
          accentSecondary: '#ff6666',
          accentHover: '#cc0000',
        }),
      )

      const response = await onRequestGet({
        params: { token: 'custom-theme-token' },
        env,
        request: new Request('http://localhost/view/custom-theme-token'),
      })
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('<html class="custom">')
      expect(html).toContain('--bg-primary: #123456')
      expect(html).toContain('--text-primary: #ffffff')
    })

    it('should return HTML page with text view option', async () => {
      await createValidLink('text-view-token', 'test.md')

      const response = await onRequestGet({
        params: { token: 'text-view-token' },
        env,
        request: new Request('http://localhost/view/text-view-token'),
      })
      const html = await response.text()
      expect(html).toContain('content text-view')
      expect(html).toContain('# Heading')
      expect(html).toContain('**bold**')
    })

    it('should return password form when password is required', async () => {
      await createValidLink('password-token', 'test.md', { password: true })

      const response = await onRequestGet({
        params: { token: 'password-token' },
        env,
        request: new Request('http://localhost/view/password-token'),
      })
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')

      const html = await response.text()
      expect(html).toContain('Password Required')
    })

    it('should allow access when password cookie is present', async () => {
      await createValidLink('password-token', 'test.md', { password: true })

      const request = new Request('http://localhost/view/password-token', {
        headers: { Cookie: `${COOKIE_NAME.SHARE_AUTH}=password-token` },
      })

      const response = await onRequestGet({ params: { token: 'password-token' }, env, request })
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    })

    it('should return 404 if file not found in R2', async () => {
      await env.NOTEPAD_KV.put(
        `${KV_KEY_PREFIX.LINK}missing-file-token`,
        JSON.stringify({
          filename: 'missing.md',
          type: 'view',
          expires: Date.now() + 3600000,
          oneTime: false,
          createdAt: Date.now(),
          used: false,
        }),
      )

      const response = await onRequestGet({
        params: { token: 'missing-file-token' },
        env,
        request: new Request('http://localhost/view/missing-file-token'),
      })
      expect(response.status).toBe(404)
    })

    it('should set X-Frame-Options header by default', async () => {
      await createValidLink('frame-token', 'test.md')

      const response = await onRequestGet({
        params: { token: 'frame-token' },
        env,
        request: new Request('http://localhost/view/frame-token'),
      })
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'")
    })

    it('should omit X-Frame-Options when allowIframe is true', async () => {
      await createValidLink('iframe-token', 'test.md', { allowIframe: true })

      const response = await onRequestGet({
        params: { token: 'iframe-token' },
        env,
        request: new Request('http://localhost/view/iframe-token'),
      })
      expect(response.headers.get('X-Frame-Options')).toBeNull()
    })
  })

  describe('OPTIONS /view/[token]', () => {
    it('should return 404 for invalid token', async () => {
      const response = await onRequestOptions({ params: { token: 'invalid' }, env })
      expect(response.status).toBe(404)
    })

    it('should return CORS headers for valid token', async () => {
      await createValidLink('options-token', 'options.md')

      const response = await onRequestOptions({ params: { token: 'options-token' }, env })
      expect(response.status).toBe(200)
    })
  })
})
