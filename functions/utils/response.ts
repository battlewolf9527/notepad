import type { ApiResponse } from '../../types/shared'

export function jsonResponse(
  data: ApiResponse<unknown>,
  status: number = 200,
  extraHeaders?: Record<string, string>,
): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (extraHeaders) {
    Object.assign(headers, extraHeaders)
  }
  return new Response(JSON.stringify(data), { status, headers })
}

export function successResponse<T = unknown>(
  data?: T,
  extraHeaders?: Record<string, string>,
): Response {
  const response: ApiResponse<T> = { success: true }
  if (data !== undefined) {
    response.data = data
  }
  return jsonResponse(response, 200, extraHeaders)
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ success: false, error: message }, status)
}

export function badRequest(message: string): Response {
  return errorResponse(message, 400)
}

export function unauthorized(
  message: string = 'Unauthorized',
  extraHeaders?: Record<string, string>,
): Response {
  return jsonResponse({ success: false, error: message }, 401, extraHeaders)
}

export function notFound(message: string = 'Not found'): Response {
  return errorResponse(message, 404)
}

export function forbidden(message: string = 'Forbidden'): Response {
  return errorResponse(message, 403)
}

export function conflict(message: string = 'Conflict'): Response {
  return errorResponse(message, 409)
}

export function serverError(message: string = 'Internal server error'): Response {
  return errorResponse(message, 500)
}

export function r2ResultToResponse(result: { success: boolean; error?: string }): Response {
  if (result.success) {
    return successResponse()
  }
  return serverError(result.error || '操作失败')
}

export function getErrorMessage(err: unknown, defaultMessage: string): string {
  return err instanceof Error ? err.message : defaultMessage
}
