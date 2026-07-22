import { describe, it, expect } from 'vitest'
import {
  jsonResponse,
  successResponse,
  errorResponse,
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from '../../functions/utils/response'

describe('Response Utilities', () => {
  describe('jsonResponse', () => {
    it('should create JSON response with default status 200', () => {
      const response = jsonResponse({ success: true })
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should create JSON response with custom status', () => {
      const response = jsonResponse({ success: false, error: 'Test' }, 400)
      expect(response.status).toBe(400)
    })

    it('should include extra headers', async () => {
      const response = jsonResponse({ success: true }, 200, { 'X-Custom': 'value' })
      expect(response.headers.get('X-Custom')).toBe('value')
    })

    it('should serialize data correctly', async () => {
      const data = { success: true, data: { name: 'test' } }
      const response = jsonResponse(data)
      const body = await response.text()
      expect(JSON.parse(body)).toEqual(data)
    })
  })

  describe('successResponse', () => {
    it('should create success response with data', async () => {
      const response = successResponse({ name: 'test' })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ success: true, data: { name: 'test' } })
    })

    it('should create success response without data', async () => {
      const response = successResponse()
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ success: true })
    })
  })

  describe('errorResponse', () => {
    it('should create error response with default status 400', () => {
      const response = errorResponse('Bad request')
      expect(response.status).toBe(400)
    })

    it('should create error response with custom status', () => {
      const response = errorResponse('Forbidden', 403)
      expect(response.status).toBe(403)
    })

    it('should include error message in body', async () => {
      const response = errorResponse('Not found')
      const body = await response.json()
      expect(body).toEqual({ success: false, error: 'Not found' })
    })
  })

  describe('badRequest', () => {
    it('should return 400 status', () => {
      const response = badRequest('Invalid input')
      expect(response.status).toBe(400)
    })
  })

  describe('unauthorized', () => {
    it('should return 401 status', () => {
      const response = unauthorized()
      expect(response.status).toBe(401)
    })

    it('should use default message', async () => {
      const response = unauthorized()
      const body = await response.json() as { success: boolean; error: string }
      expect(body.error).toBe('Unauthorized')
    })

    it('should use custom message', async () => {
      const response = unauthorized('Invalid token')
      const body = await response.json() as { success: boolean; error: string }
      expect(body.error).toBe('Invalid token')
    })
  })

  describe('notFound', () => {
    it('should return 404 status', () => {
      const response = notFound()
      expect(response.status).toBe(404)
    })

    it('should use custom message', async () => {
      const response = notFound('Resource not found')
      const body = await response.json() as { success: boolean; error: string }
      expect(body.error).toBe('Resource not found')
    })
  })

  describe('serverError', () => {
    it('should return 500 status', () => {
      const response = serverError()
      expect(response.status).toBe(500)
    })

    it('should use default message', async () => {
      const response = serverError()
      const body = await response.json() as { success: boolean; error: string }
      expect(body.error).toBe('Internal server error')
    })
  })
})
