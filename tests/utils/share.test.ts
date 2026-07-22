import { describe, it, expect, beforeEach } from 'vitest'
import { createMockKV, createMockEnv } from '../setup'
import {
  validateShareLink,
  validateShareLinkWithResponse,
  markShareLinkUsed,
} from '../../functions/utils/share'
import type { ShareLinkData } from '../../types/shared'

describe('Share Utils', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  const createValidShareLink = (overrides?: Partial<ShareLinkData>): ShareLinkData => ({
    type: 'view',
    filename: 'test.txt',
    expires: Date.now() + 86400000, // 1 day from now
    oneTime: false,
    password: null,
    createdAt: Date.now(),
    used: false,
    ...overrides,
  })

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  describe('validateShareLink', () => {
    it('should return null for non-existent token', async () => {
      const result = await validateShareLink(env, 'nonexistent')
      expect(result).toBeNull()
    })

    it('should return link data for valid token', async () => {
      const shareData = createValidShareLink()
      await mockKV.kv.put('link:validtoken', JSON.stringify(shareData))

      const result = await validateShareLink(env, 'validtoken')
      expect(result).toEqual(shareData)
    })

    it('should return null for expired link', async () => {
      const shareData = createValidShareLink({
        expires: Date.now() - 1000, // Expired
      })
      await mockKV.kv.put('link:expired', JSON.stringify(shareData))

      const result = await validateShareLink(env, 'expired')
      expect(result).toBeNull()
    })

    it('should delete and return null for invalid JSON', async () => {
      await mockKV.kv.put('link:invalidjson', 'not valid json')

      const result = await validateShareLink(env, 'invalidjson')
      expect(result).toBeNull()
    })

    it('should delete and return null for malformed data', async () => {
      await mockKV.kv.put('link:malformed', JSON.stringify({ invalid: 'structure' }))

      const result = await validateShareLink(env, 'malformed')
      expect(result).toBeNull()
    })

    it('should handle future expiration dates', async () => {
      const futureExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year from now
      const shareData = createValidShareLink({
        expires: futureExpiry,
      })
      await mockKV.kv.put('link:future', JSON.stringify(shareData))

      const result = await validateShareLink(env, 'future')
      expect(result).not.toBeNull()
      expect(result?.filename).toBe('test.txt')
    })
  })

  describe('validateShareLinkWithResponse', () => {
    it('should return linkData and headers for valid token', async () => {
      const shareData = createValidShareLink()
      await mockKV.kv.put('link:validtoken', JSON.stringify(shareData))

      const result = await validateShareLinkWithResponse(env, 'validtoken')
      expect('linkData' in result).toBe(true)
      if ('linkData' in result && 'headers' in result) {
        expect(result.linkData).toEqual(shareData)
        expect(result.headers['Access-Control-Allow-Methods']).toBe('GET, OPTIONS')
      }
    })

    it('should return notFound response for expired/invalid token', async () => {
      const shareData = createValidShareLink({ expires: Date.now() - 1000 })
      await mockKV.kv.put('link:expired', JSON.stringify(shareData))

      const result = await validateShareLinkWithResponse(env, 'expired')
      expect('response' in result).toBe(true)
      if ('response' in result) {
        expect(result.response.status).toBe(404)
      }
    })

    it('should include CORS headers when configured', async () => {
      const shareData = createValidShareLink({ corsOrigin: 'https://example.com' })
      await mockKV.kv.put('link:withcors', JSON.stringify(shareData))

      const result = await validateShareLinkWithResponse(env, 'withcors')
      expect('linkData' in result).toBe(true)
      if ('linkData' in result && 'headers' in result) {
        expect(result.headers['Access-Control-Allow-Origin']).toBe('https://example.com')
        expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type')
      }
    })
  })

  describe('markShareLinkUsed', () => {
    it('should delete one-time link after use', async () => {
      const shareData = createValidShareLink({ oneTime: true })
      await mockKV.kv.put('link:onetime', JSON.stringify(shareData))

      await markShareLinkUsed(env, 'onetime', shareData)

      const value = await mockKV.kv.get('link:onetime')
      expect(value).toBeNull()
    })

    it('should keep non-one-time link after use', async () => {
      const shareData = createValidShareLink({ oneTime: false })
      await mockKV.kv.put('link:reusable', JSON.stringify(shareData))

      await markShareLinkUsed(env, 'reusable', shareData)

      const value = await mockKV.kv.get('link:reusable')
      expect(value).not.toBeNull()
    })
  })
})
