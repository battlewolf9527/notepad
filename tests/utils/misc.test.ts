import { describe, it, expect } from 'vitest'
import { generateToken } from '../../functions/utils/token'
import { hashPassword, verifyPassword } from '../../functions/utils/password'

describe('Token Utils', () => {
  describe('generateToken', () => {
    it('should generate token with minimum length based on input', () => {
      const token = generateToken(24)
      expect(token.length).toBeGreaterThanOrEqual(24)
    })

    it('should generate token with default minimum length', () => {
      const token = generateToken()
      expect(token.length).toBeGreaterThanOrEqual(32)
    })

    it('should generate alphanumeric tokens', () => {
      const token = generateToken(24)
      expect(/^[a-z0-9]+$/i.test(token)).toBe(true)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken(24))
      }
      expect(tokens.size).toBe(100)
    })
  })
})

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should generate hash string', async () => {
      const hash = await hashPassword('test-password')
      expect(typeof hash).toBe('string')
      expect(hash.includes(':')).toBe(true)
    })

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword('test-password')
      const hash2 = await hashPassword('test-password')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('test-password')
      const result = await verifyPassword('test-password', hash)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('test-password')
      const result = await verifyPassword('wrong-password', hash)
      expect(result).toBe(false)
    })

    it('should return false for invalid hash format', async () => {
      const result = await verifyPassword('password', 'invalid')
      expect(result).toBe(false)

      const result2 = await verifyPassword('password', 'missing:parts')
      expect(result2).toBe(false)
    })
  })
})
