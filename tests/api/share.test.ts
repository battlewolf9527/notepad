import { describe, it, expect, beforeEach } from 'vitest'
import { createMockKV, createMockEnv, parseJsonResponse } from '../setup'
import type { ApiResponse, ShareLinkCreationResponse } from '../../types/shared'

import { onRequestPost } from '../../functions/api/share'

describe('POST /api/share', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  const createRequest = (body: unknown): Request => {
    return new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/share', {
      method: 'POST',
      body: 'not valid json',
    })

    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing filename', async () => {
    const request = createRequest({})
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for empty filename', async () => {
    const request = createRequest({ filename: '' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid filename type', async () => {
    const request = createRequest({ filename: 123 })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for negative expiresInHours', async () => {
    const request = createRequest({ filename: 'test.txt', expiresInHours: -1 })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid expiresInHours type', async () => {
    const request = createRequest({ filename: 'test.txt', expiresInHours: 'invalid' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should create share link successfully', async () => {
    const request = createRequest({ filename: 'test.txt' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
    expect(body.data?.token).toBeDefined()
    expect(body.data?.url).toBeDefined()
  })

  it('should create share link with custom expiresInHours', async () => {
    const request = createRequest({ filename: 'test.txt', expiresInHours: 12 })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
    expect(body.data?.token).toBeDefined()
  })

  it('should create one-time share link', async () => {
    const request = createRequest({ filename: 'test.txt', oneTime: true })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
    expect(body.data?.token).toBeDefined()
  })

  it('should create share link with password', async () => {
    const request = createRequest({ filename: 'test.txt', password: 'secret' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
    expect(body.data?.token).toBeDefined()
  })
})
