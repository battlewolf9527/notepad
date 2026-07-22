import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockEnv } from '../setup'
import { onRequestPost } from '../../functions/view/[token]/auth'
import { KV_KEY_PREFIX, COOKIE_NAME } from '../../functions/utils/constants'
import { hashPassword } from '../../functions/utils/password'

describe('view/[token]/auth Route', () => {
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    env = createMockEnv()
    vi.clearAllMocks()
  })

  const createPasswordLink = async (token: string, password: string, expires?: number) => {
    const hash = await hashPassword(password)
    await env.NOTEPAD_KV.put(
      `${KV_KEY_PREFIX.LINK}${token}`,
      JSON.stringify({
        type: 'view',
        filename: 'test.md',
        expires: expires ?? Date.now() + 3600000,
        oneTime: false,
        password: hash,
        createdAt: Date.now(),
        used: false,
      }),
    )
  }

  describe('POST /view/[token]/auth', () => {
    it('should return 500 for invalid form data', async () => {
      const request = new Request('http://localhost/view/test-token/auth', {
        method: 'POST',
        body: 'invalid form data',
      })
      const response = await onRequestPost({ params: { token: 'test-token' }, env, request })
      expect(response.status).toBe(500)
    })

    it('should return 403 for invalid token', async () => {
      const formData = new FormData()
      formData.append('password', 'any-password')

      const request = new Request('http://localhost/view/invalid-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({ params: { token: 'invalid-token' }, env, request })
      expect(response.status).toBe(403)
    })

    it('should return 403 for link without password', async () => {
      await env.NOTEPAD_KV.put(
        `${KV_KEY_PREFIX.LINK}no-password-token`,
        JSON.stringify({
          type: 'view',
          filename: 'test.md',
          expires: Date.now() + 3600000,
          oneTime: false,
          password: null,
          createdAt: Date.now(),
          used: false,
        }),
      )

      const formData = new FormData()
      formData.append('password', 'any-password')

      const request = new Request('http://localhost/view/no-password-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({ params: { token: 'no-password-token' }, env, request })
      expect(response.status).toBe(403)
    })

    it('should return 403 for incorrect password', async () => {
      await createPasswordLink('wrong-password-token', 'correct-password')

      const formData = new FormData()
      formData.append('password', 'wrong-password')

      const request = new Request('http://localhost/view/wrong-password-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({
        params: { token: 'wrong-password-token' },
        env,
        request,
      })
      expect(response.status).toBe(403)
    })

    it('should return 410 for expired link', async () => {
      await createPasswordLink('expired-token', 'password', Date.now() - 1000)

      const formData = new FormData()
      formData.append('password', 'password')

      const request = new Request('http://localhost/view/expired-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({ params: { token: 'expired-token' }, env, request })
      expect(response.status).toBe(410)
    })

    it('should return 302 with cookie for correct password', async () => {
      await createPasswordLink('correct-token', 'correct-password')

      const formData = new FormData()
      formData.append('password', 'correct-password')

      const request = new Request('http://localhost/view/correct-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({ params: { token: 'correct-token' }, env, request })
      expect(response.status).toBe(302)

      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain(`${COOKIE_NAME.SHARE_AUTH}=correct-token`)
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('Secure')
      expect(setCookie).toContain('SameSite=Strict')

      expect(response.headers.get('Location')).toBe('/view/correct-token')
    })

    it('should set appropriate Max-Age for permanent link', async () => {
      await env.NOTEPAD_KV.put(
        `${KV_KEY_PREFIX.LINK}permanent-token`,
        JSON.stringify({
          type: 'view',
          filename: 'test.md',
          expires: 0,
          oneTime: false,
          password: await hashPassword('password'),
          createdAt: Date.now(),
          used: false,
        }),
      )

      const formData = new FormData()
      formData.append('password', 'password')

      const request = new Request('http://localhost/view/permanent-token/auth', {
        method: 'POST',
        body: formData,
      })
      const response = await onRequestPost({ params: { token: 'permanent-token' }, env, request })
      expect(response.status).toBe(302)

      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('Max-Age=31536000')
    })
  })
})
