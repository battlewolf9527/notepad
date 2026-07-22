import { describe, it, expect, beforeEach } from 'vitest'
import { createMockKV, createMockEnv, parseJsonResponse } from '../setup'
import type { ApiResponse, ShareLinkCreationResponse } from '../../types/shared'

import { onRequestPost } from '../../functions/api/raw'

describe('POST /api/raw', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockKV = createMockKV()
    env = createMockEnv(mockKV.kv)
  })

  const createRequest = (body: unknown): Request => {
    return new Request('http://localhost/api/raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/raw', {
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

  it('should return 400 for negative expiresInHours', async () => {
    const request = createRequest({ filename: 'test.txt', expiresInHours: -1 })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid contentType', async () => {
    const request = createRequest({ filename: 'test.txt', contentType: 'invalid' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid corsOrigin', async () => {
    const request = createRequest({ filename: 'test.txt', corsOrigin: 'invalid-origin' })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(400)
  })

  it('should create raw share link successfully', async () => {
    const request = createRequest({
      filename: 'test.txt',
      contentType: 'text/plain',
      corsOrigin: '*',
    })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
    expect(body.data?.token).toBeDefined()
    expect(body.data?.url).toBeDefined()
  })

  it('should create raw share link with custom contentType', async () => {
    const request = createRequest({
      filename: 'test.json',
      contentType: 'application/json',
      corsOrigin: '*',
    })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
  })

  it('should create raw share link with corsOrigin', async () => {
    const request = createRequest({
      filename: 'test.txt',
      contentType: 'text/plain',
      corsOrigin: 'https://example.com',
    })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
  })

  it('should create raw share link with wildcard corsOrigin', async () => {
    const request = createRequest({
      filename: 'test.txt',
      contentType: 'application/json',
      corsOrigin: '*',
    })
    const response = await onRequestPost({ request, env })
    expect(response.status).toBe(200)

    const body = await parseJsonResponse<ApiResponse<ShareLinkCreationResponse>>(response)
    expect(body.success).toBe(true)
  })
})
