import { API_PREFIX } from './constants'
import { ApiError } from './error'
import type { ApiResponse } from '../../types/shared'
import { getAuthToken, getAdminToken } from './token-manager'

export class FolderProtectedError extends Error {
  constructor(
    public readonly protectedPath: string,
    message?: string,
  ) {
    super(message || '文件夹需要密码')
    this.name = 'FolderProtectedError'
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  useAdminAuth: boolean = false,
): Promise<T> {
  const url = `${API_PREFIX}${endpoint}`

  const authToken = getAuthToken() || ''
  const adminToken = getAdminToken() || ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`
  } else if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    const protectedPath = response.headers.get('X-Protected-Path') ?? undefined

    if (response.status === 401 && protectedPath !== undefined) {
      throw new FolderProtectedError(protectedPath, data.error)
    }

    throw new ApiError(response.status, data.error || `请求失败: ${response.status}`)
  }

  const responseData = (await response.json()) as ApiResponse<T>

  if (!responseData.success) {
    throw new ApiError(response.status, responseData.error || '请求失败')
  }

  return responseData.data as T
}

export async function apiGet<T = unknown>(
  endpoint: string,
  useAdminAuth: boolean = false,
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, useAdminAuth)
}

export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  useAdminAuth: boolean = false,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
    useAdminAuth,
  )
}

export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  useAdminAuth: boolean = false,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    },
    useAdminAuth,
  )
}

export async function apiDelete<T = unknown>(
  endpoint: string,
  body?: unknown,
  useAdminAuth: boolean = false,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    },
    useAdminAuth,
  )
}
