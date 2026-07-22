import { describe, it, expect, beforeEach } from 'vitest'
import { createMockKV, createMockEnv, parseJsonResponse } from '../setup'
import type { ApiResponse } from '../../types/shared'

import { onRequestGet, onRequestPut } from '../../functions/api/config'

describe('Config API', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  const createRequest = (body: unknown): Request => {
    return new Request('http://localhost/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('GET /api/config', () => {
    it('should return all config keys', async () => {
      const response = await onRequestGet({ env })
      expect(response.status).toBe(200)

      const body = await parseJsonResponse<ApiResponse<Record<string, string | null>>>(response)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('siteTitle')
      expect(body.data).toHaveProperty('theme')
      expect(body.data).toHaveProperty('autoWrap')
      expect(body.data).toHaveProperty('scale')
      expect(body.data).toHaveProperty('saveExtensions')
      expect(body.data).toHaveProperty('defaultExtension')
      expect(body.data).toHaveProperty('defaultEncoding')
    })

    it('should return stored config values', async () => {
      await mockKV.kv.put('config:siteTitle', 'My Notepad')
      await mockKV.kv.put('config:theme', 'dark')

      const response = await onRequestGet({ env })
      expect(response.status).toBe(200)

      const body = await parseJsonResponse<ApiResponse<Record<string, string | null>>>(response)
      expect(body.data?.siteTitle).toBe('My Notepad')
      expect(body.data?.theme).toBe('dark')
    })

    it('should return null for unset values', async () => {
      const response = await onRequestGet({ env })
      expect(response.status).toBe(200)

      const body = await parseJsonResponse<ApiResponse<Record<string, string | null>>>(response)
      expect(body.data?.siteTitle).toBeNull()
      expect(body.data?.theme).toBeNull()
    })
  })

  describe('PUT /api/config', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost/api/config', {
        method: 'PUT',
        body: 'not valid json',
      })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update siteTitle', async () => {
      const request = createRequest({ siteTitle: 'Test Title' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:siteTitle')
      expect(stored).toBe('Test Title')
    })

    it('should update theme with valid values', async () => {
      const request = createRequest({ theme: 'dark' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:theme')
      expect(stored).toBe('dark')
    })

    it('should return 400 for invalid theme', async () => {
      const request = createRequest({ theme: 'invalid' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update autoWrap', async () => {
      const request = createRequest({ autoWrap: true })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:autoWrap')
      expect(stored).toBe('true')
    })

    it('should return 400 for invalid autoWrap', async () => {
      const request = createRequest({ autoWrap: 'not boolean' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update scale within range', async () => {
      const request = createRequest({ scale: 100 })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:scale')
      expect(stored).toBe('100')
    })

    it('should return 400 for scale outside range', async () => {
      const request = createRequest({ scale: 600 })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update defaultExtension', async () => {
      const request = createRequest({ defaultExtension: '.md' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:defaultExtension')
      expect(stored).toBe('.md')
    })

    it('should return 400 for invalid defaultExtension', async () => {
      const request = createRequest({ defaultExtension: 'invalid' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update saveExtensions as JSON', async () => {
      const extensions = ['.md', '.txt', '.json']
      const request = createRequest({ saveExtensions: extensions })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:saveExtensions')
      expect(JSON.parse(stored!)).toEqual(extensions)
    })

    it('should return 400 for invalid saveExtensions', async () => {
      const request = createRequest({ saveExtensions: 'not array' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update defaultEncoding', async () => {
      const request = createRequest({ defaultEncoding: 'utf-8' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const stored = await mockKV.kv.get('config:defaultEncoding')
      expect(stored).toBe('utf-8')
    })

    it('should return 400 for invalid defaultEncoding', async () => {
      const request = createRequest({ defaultEncoding: 'invalid encoding with spaces' })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should update multiple configs at once', async () => {
      const request = createRequest({ siteTitle: 'My App', theme: 'light', autoWrap: true })
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)

      const title = await mockKV.kv.get('config:siteTitle')
      const theme = await mockKV.kv.get('config:theme')
      const wrap = await mockKV.kv.get('config:autoWrap')
      expect(title).toBe('My App')
      expect(theme).toBe('light')
      expect(wrap).toBe('true')
    })
  })
})
