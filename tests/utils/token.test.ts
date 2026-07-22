import { describe, it, expect } from 'vitest'
import { generateToken } from '../../functions/utils/token'

describe('Token Utils', () => {
  describe('generateToken', () => {
    it('should generate a token with default length', () => {
      const token = generateToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThanOrEqual(32)
    })

    it('should generate a token with custom length', () => {
      const token = generateToken(16)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThanOrEqual(16)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should generate alphanumeric tokens', () => {
      const token = generateToken(32)
      expect(/^[a-z0-9]+$/i.test(token)).toBe(true)
    })

    it('should handle zero length', () => {
      const token = generateToken(0)
      expect(token).toBe('')
    })

    it('should handle large length', () => {
      const token = generateToken(1000)
      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThanOrEqual(1000)
    })
  })
})
