import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockEnv, createMockR2 } from '../setup'
import { onRequestGet, onRequestOptions } from '../../functions/raw/[token]'
import { KV_KEY_PREFIX } from '../../functions/utils/constants'

describe('raw/[token] Route', () => {
  let env: ReturnType<typeof createMockEnv>
  let mockR2: ReturnType<typeof createMockR2>

  beforeEach(() => {
    mockR2 = createMockR2()
    env = createMockEnv(undefined, mockR2.r2)
    vi.clearAllMocks()
  })

  const createValidLink = async (token: string, filename: string, contentType?: string) => {
    await env.NOTEPAD_KV.put(
      `${KV_KEY_PREFIX.LINK}${token}`,
      JSON.stringify({
        filename,
        type: 'raw',
        expires: Date.now() + 3600000,
        oneTime: false,
        createdAt: Date.now(),
        used: false,
        contentType: contentType || 'text/plain; charset=utf-8',
        corsOrigin: '*',
      }),
    )
    await mockR2.r2.put(filename, 'test content', {
      httpMetadata: { contentType: contentType || 'text/plain; charset=utf-8' },
    })
  }

  describe('GET /raw/[token]', () => {
    it('should return 404 for invalid token', async () => {
      const response = await onRequestGet({
        params: { token: 'invalid' },
        env,
        request: new Request('http://localhost/raw/invalid'),
      })
      expect(response.status).toBe(404)
    })

    it('should return file content successfully', async () => {
      await createValidLink('valid-token', 'test.txt')

      const response = await onRequestGet({
        params: { token: 'valid-token' },
        env,
        request: new Request('http://localhost/raw/valid-token'),
      })
      expect(response.status).toBe(200)

      const text = await response.text()
      expect(text).toBe('test content')
    })

    it('should return correct content type', async () => {
      await createValidLink('json-token', 'test.json', 'application/json')

      const response = await onRequestGet({
        params: { token: 'json-token' },
        env,
        request: new Request('http://localhost/raw/json-token'),
      })
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should return 404 if file not found in R2', async () => {
      await env.NOTEPAD_KV.put(
        `${KV_KEY_PREFIX.LINK}missing-file-token`,
        JSON.stringify({
          filename: 'missing.txt',
          type: 'raw',
          expires: Date.now() + 3600000,
          oneTime: false,
          createdAt: Date.now(),
          used: false,
          contentType: 'text/plain',
          corsOrigin: '*',
        }),
      )

      const response = await onRequestGet({
        params: { token: 'missing-file-token' },
        env,
        request: new Request('http://localhost/raw/missing-file-token'),
      })
      expect(response.status).toBe(404)
    })

    it('should support range requests', async () => {
      await createValidLink('range-token', 'range.txt')

      const request = new Request('http://localhost/raw/range-token', {
        headers: { Range: 'bytes=0-4' },
      })
      const response = await onRequestGet({ params: { token: 'range-token' }, env, request })
      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBeDefined()
    })

    it('should return 416 for unsatisfiable range', async () => {
      await createValidLink('range-token', 'range.txt')

      const request = new Request('http://localhost/raw/range-token', {
        headers: { Range: 'bytes=1000-2000' },
      })
      const response = await onRequestGet({ params: { token: 'range-token' }, env, request })
      expect(response.status).toBe(416)
    })

    it('should set CORS headers', async () => {
      await env.NOTEPAD_KV.put(
        `${KV_KEY_PREFIX.LINK}cors-token`,
        JSON.stringify({
          filename: 'cors.txt',
          type: 'raw',
          expires: Date.now() + 3600000,
          oneTime: false,
          createdAt: Date.now(),
          used: false,
          contentType: 'text/plain',
          corsOrigin: 'https://example.com',
        }),
      )
      await mockR2.r2.put('cors.txt', 'cors content')

      const response = await onRequestGet({
        params: { token: 'cors-token' },
        env,
        request: new Request('http://localhost/raw/cors-token'),
      })
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    })
  })

  describe('OPTIONS /raw/[token]', () => {
    it('should return 404 for invalid token', async () => {
      const response = await onRequestOptions({ params: { token: 'invalid' }, env })
      expect(response.status).toBe(404)
    })

    it('should return CORS headers for valid token', async () => {
      await createValidLink('options-token', 'options.txt')

      const response = await onRequestOptions({ params: { token: 'options-token' }, env })
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })
})
