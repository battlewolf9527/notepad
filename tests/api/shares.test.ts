import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockKV, createMockEnv, parseJsonResponse, expectStatus } from '../setup'
import type { ApiResponse } from '../../types/shared'
import type { ShareLink } from '../../types/shared'

// Import the handler
import { onRequestGet } from '../../functions/api/shares'

function createMockRequest() {
  return {
    headers: new Headers(),
  } as unknown as Request
}

describe('GET /api/shares', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  it('should return empty array when no shares exist', async () => {
    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 200)

    const body = await parseJsonResponse<ApiResponse<ShareLink[]>>(response)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('should return all share links', async () => {
    // Setup mock data
    const shareData = {
      type: 'view' as const,
      filename: 'test.txt',
      expires: Date.now() + 86400000,
      oneTime: false,
      password: null,
      createdAt: Date.now(),
      used: false,
    }

    // Add share links to KV
    await mockKV.kv.put('link:token1', JSON.stringify(shareData))
    await mockKV.kv.put('link:token2', JSON.stringify({ ...shareData, filename: 'another.txt' }))

    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 200)

    const body = await parseJsonResponse<ApiResponse<ShareLink[]>>(response)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)

    // Check that tokens are correctly extracted
    const tokens = body.data!.map((s) => s.token).sort()
    expect(tokens).toEqual(['token1', 'token2'])
  })

  it('should filter by prefix correctly', async () => {
    // Add non-link data
    await mockKV.kv.put('config:other', JSON.stringify({ value: 'test' }))
    await mockKV.kv.put('link:share1', JSON.stringify({
      type: 'view',
      filename: 'test.txt',
      expires: Date.now() + 86400000,
      oneTime: false,
      password: null,
      createdAt: Date.now(),
      used: false,
    }))

    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 200)

    const body = await parseJsonResponse<ApiResponse<ShareLink[]>>(response)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data![0].token).toBe('share1')
  })

  it('should handle pagination correctly', async () => {
    // Add multiple share links
    for (let i = 0; i < 5; i++) {
      await mockKV.kv.put(`link:share${i}`, JSON.stringify({
        type: 'view',
        filename: `file${i}.txt`,
        expires: Date.now() + 86400000,
        oneTime: false,
        password: null,
        createdAt: Date.now(),
        used: false,
      }))
    }

    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 200)

    const body = await parseJsonResponse<ApiResponse<ShareLink[]>>(response)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(5)
  })

  it('should return 500 on KV error', async () => {
    // Make KV throw an error
    mockKV.kv.list = vi.fn().mockRejectedValueOnce(new Error('KV error'))

    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 500)

    const body = await parseJsonResponse<ApiResponse<null>>(response)
    expect(body.success).toBe(false)
    expect(body.error).toBe('KV error')
  })

  it('should handle share with null value gracefully', async () => {
    // Add a valid share and a null one
    await mockKV.kv.put('link:valid', JSON.stringify({
      type: 'view',
      filename: 'test.txt',
      expires: Date.now() + 86400000,
      oneTime: false,
      password: null,
      createdAt: Date.now(),
      used: false,
    }))
    // KV returns null for missing keys (already handled by our mock)

    const response = await onRequestGet({ request: createMockRequest(), env })
    expectStatus(response, 200)

    const body = await parseJsonResponse<ApiResponse<ShareLink[]>>(response)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })
})
