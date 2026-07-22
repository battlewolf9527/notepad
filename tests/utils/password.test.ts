import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../functions/utils/password'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should generate a hash string', async () => {
      const hash = await hashPassword('test-password')
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword('same-password')
      const hash2 = await hashPassword('same-password')
      expect(hash1).not.toBe(hash2)
    })

    it('should generate hash in correct format', async () => {
      const hash = await hashPassword('test-password')
      const parts = hash.split(':')
      expect(parts.length).toBe(2)
      expect(parts[0]).toBeDefined()
      expect(parts[1]).toBeDefined()
    })

    it('should handle empty password', async () => {
      const hash = await hashPassword('')
      expect(hash).toBeDefined()
      const parts = hash.split(':')
      expect(parts.length).toBe(2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword('test-password')
      const result = await verifyPassword('test-password', hash)
      expect(result).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('test-password')
      const result = await verifyPassword('wrong-password', hash)
      expect(result).toBe(false)
    })

    it('should reject malformed hash', async () => {
      const result = await verifyPassword('test-password', 'invalid-hash')
      expect(result).toBe(false)
    })

    it('should reject empty hash', async () => {
      const result = await verifyPassword('test-password', '')
      expect(result).toBe(false)
    })

    it('should handle empty password correctly', async () => {
      const hash = await hashPassword('')
      const result = await verifyPassword('', hash)
      expect(result).toBe(true)
    })

    it('should reject empty password against non-empty hash', async () => {
      const hash = await hashPassword('test-password')
      const result = await verifyPassword('', hash)
      expect(result).toBe(false)
    })
  })
})
