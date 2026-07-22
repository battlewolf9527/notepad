import { describe, it, expect, beforeEach } from 'vitest'
import { createMockKV, createMockEnv } from '../setup'

import { onRequestDelete } from '../../functions/api/share/[token]'

describe('DELETE /api/share/[token]', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  const createMockRequest = (authHeader?: string) => ({
    headers: new Headers((authHeader ? { Authorization: authHeader } : {})),
  }) as Request

  it('should return 403 without admin token', async () => {
    const response = await onRequestDelete({ params: { token: 'validtoken' }, env, request: createMockRequest() })
    expect(response.status).toBe(403)
  })

  it('should return 400 for missing token', async () => {
    const response = await onRequestDelete({ params: { token: '' }, env, request: createMockRequest('Bearer test-token') })
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid token type', async () => {
    const response = await onRequestDelete({ params: { token: 123 as unknown as string }, env, request: createMockRequest('Bearer test-token') })
    expect(response.status).toBe(400)
  })

  it('should return 400 for token with invalid characters', async () => {
    const response = await onRequestDelete({ params: { token: 'token@invalid' }, env, request: createMockRequest('Bearer test-token') })
    expect(response.status).toBe(400)
  })
})
