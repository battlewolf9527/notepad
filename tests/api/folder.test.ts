import { describe, it, expect, beforeEach } from 'vitest'
import { createMockR2, createMockEnv, parseJsonResponse } from '../setup'
import type { ApiResponse } from '../../types/shared'

import { onRequestPost, onRequestDelete, onRequestPut } from '../../functions/api/folder'

describe('Folder API', () => {
  let mockR2: ReturnType<typeof createMockR2>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockR2 = createMockR2()
    env = createMockEnv(undefined, mockR2.r2)
  })

  const createRequest = (body: unknown, method: string = 'POST'): Request => {
    return new Request('http://localhost/api/folder', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('POST /api/folder', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost/api/folder', {
        method: 'POST',
        body: 'not valid json',
      })
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(400)
    })

    it('should return 400 for missing path', async () => {
      const request = createRequest({})
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid path', async () => {
      const request = createRequest({ path: '<invalid' })
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(400)
    })

    it('should create folder successfully', async () => {
      const request = createRequest({ path: 'new-folder' })
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(200)

      const body = await parseJsonResponse<ApiResponse<null>>(response)
      expect(body.success).toBe(true)

      const folder = await mockR2.r2.head('new-folder/')
      expect(folder).not.toBeNull()
    })

    it('should return 400 if folder already exists', async () => {
      await mockR2.r2.put('existing/', new Uint8Array(), {
        httpMetadata: { contentType: 'application/x-directory' },
      })

      const request = createRequest({ path: 'existing' })
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(400)
    })

    it('should return 400 if path is occupied by file', async () => {
      await mockR2.r2.put('file.txt', 'content')

      const request = createRequest({ path: 'file.txt' })
      const response = await onRequestPost({ request, env })
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/folder', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost/api/folder', {
        method: 'DELETE',
        body: 'not valid json',
      })
      const response = await onRequestDelete({ request, env })
      expect(response.status).toBe(400)
    })

    it('should return 404 if folder does not exist', async () => {
      const request = createRequest({ path: 'nonexistent' }, 'DELETE')
      const response = await onRequestDelete({ request, env })
      expect(response.status).toBe(404)
    })

    it('should delete empty folder', async () => {
      await mockR2.r2.put('empty-folder/', new Uint8Array(), {
        httpMetadata: { contentType: 'application/x-directory' },
      })

      const request = createRequest({ path: 'empty-folder' }, 'DELETE')
      const response = await onRequestDelete({ request, env })
      expect(response.status).toBe(200)

      const folder = await mockR2.r2.head('empty-folder/')
      expect(folder).toBeNull()
    })
  })

  describe('PUT /api/folder (rename)', () => {
    it('should return 400 for missing paths', async () => {
      const request = createRequest({ oldPath: 'old' }, 'PUT')
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid paths', async () => {
      const request = createRequest({ oldPath: '<invalid', newPath: 'new' }, 'PUT')
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(400)
    })

    it('should rename folder', async () => {
      await mockR2.r2.put('old-folder/', new Uint8Array(), {
        httpMetadata: { contentType: 'application/x-directory' },
      })

      const request = createRequest({ oldPath: 'old-folder', newPath: 'new-folder' }, 'PUT')
      const response = await onRequestPut({ request, env })
      expect(response.status).toBe(200)
    })

    it('should return 401 when moving to root path without admin access', async () => {
      await mockR2.r2.put('sub/old-folder/', new Uint8Array(), {
        httpMetadata: { contentType: 'application/x-directory' },
      })

      const envWithAdmin = {
        ...env,
        ADMIN_PASSWORD: 'test-admin-password',
      }

      const request = createRequest({ oldPath: 'sub/old-folder', newPath: 'root-folder' }, 'PUT')
      const response = await onRequestPut({ request, env: envWithAdmin })
      expect(response.status).toBe(401)
    })
  })
})
