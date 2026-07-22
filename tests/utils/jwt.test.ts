import { describe, it, expect } from 'vitest'
import { createJwt, verifyJwt, JwtError } from '../../functions/utils/jwt'

describe('JWT Utils', () => {
  const secret = 'test-secret-key-12345'

  describe('createJwt', () => {
    it('should create a valid JWT token', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('should create JWT with custom expiration', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret, 3600)
      const payload = await verifyJwt(token, secret)
      expect(payload.exp).toBeDefined()
    })

    it('should include issued at time', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      expect(decoded.iat).toBeDefined()
    })
  })

  describe('verifyJwt', () => {
    it('should verify a valid JWT token', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      const payload = await verifyJwt(token, secret)
      expect(payload.userId).toBe('test-user')
      expect(payload.exp).toBeDefined()
    })

    it('should include userId in payload', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      const payload = await verifyJwt(token, secret)
      expect(payload.userId).toBe('test-user')
    })

    it('should throw error for invalid token', async () => {
      await expect(verifyJwt('invalid.token', secret)).rejects.toThrow(JwtError)
    })

    it('should throw error for token with wrong secret', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      await expect(verifyJwt(token, 'wrong-secret')).rejects.toThrow(JwtError)
    })

    it('should throw error for expired token', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret, -1)
      await expect(verifyJwt(token, secret)).rejects.toThrow(JwtError)
    })

    it('should throw TOKEN_EXPIRED error code for expired token', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret, -1)
      await expect(verifyJwt(token, secret)).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
    })

    it('should throw INVALID_TOKEN error code for malformed token', async () => {
      await expect(verifyJwt('not-a-jwt', secret)).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    })

    it('should throw INVALID_SIGNATURE error code for invalid signature', async () => {
      const token = await createJwt({ userId: 'test-user' }, secret)
      const parts = token.split('.')
      parts[2] = 'modified-signature'
      const modifiedToken = parts.join('.')
      await expect(verifyJwt(modifiedToken, secret)).rejects.toMatchObject({
        code: 'INVALID_SIGNATURE',
      })
    })
  })
})
