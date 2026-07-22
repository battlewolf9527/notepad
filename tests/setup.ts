import { vi } from 'vitest'
import type {
  KVNamespace,
  R2Bucket,
  R2HTTPMetadata,
  R2PutOptions,
  R2ListOptions,
  R2Object,
} from '@cloudflare/workers-types'
import type { Env } from '../functions/types/env'

// Mock KVNamespace
export function createMockKV(): {
  kv: KVNamespace
  storedData: Map<string, string>
  storedKeys: { name: string }[]
} {
  const storedData = new Map<string, string>()
  const storedKeys: { name: string }[] = []

  const kv = {
    get: vi.fn(async (key: string) => storedData.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      storedData.set(key, value)
      if (!storedKeys.find((k) => k.name === key)) {
        storedKeys.push({ name: key })
      }
    }),
    delete: vi.fn(async (key: string) => {
      storedData.delete(key)
      const idx = storedKeys.findIndex((k) => k.name === key)
      if (idx !== -1) storedKeys.splice(idx, 1)
    }),
    list: vi.fn(async (options?: { prefix?: string; cursor?: string; limit?: number }) => {
      const keys = storedKeys.filter((k) => !options?.prefix || k.name.startsWith(options.prefix))
      const cursor = options?.cursor
      const limit = options?.limit ?? 1000

      // Simple cursor simulation
      let startIndex = 0
      if (cursor) {
        const cursorIndex = keys.findIndex((k) => k.name === cursor)
        if (cursorIndex !== -1) startIndex = cursorIndex + 1
      }

      const paginatedKeys = keys.slice(startIndex, startIndex + limit)
      const hasMore = startIndex + limit < keys.length
      const nextCursor = hasMore ? paginatedKeys[paginatedKeys.length - 1]?.name : undefined

      return {
        keys: paginatedKeys,
        list_complete: !hasMore,
        cursor: nextCursor ?? '',
      }
    }),
  } as unknown as KVNamespace

  return { kv, storedData, storedKeys }
}

// Mock R2Bucket
export function createMockR2(): {
  r2: R2Bucket
  storedObjects: Map<
    string,
    { httpMetadata?: R2HTTPMetadata; customMetadata?: Record<string, string>; body: Uint8Array }
  >
} {
  const storedObjects = new Map<
    string,
    { httpMetadata?: R2HTTPMetadata; customMetadata?: Record<string, string>; body: Uint8Array }
  >()

  const r2 = {
    head: vi.fn(async (key: string) => {
      const obj = storedObjects.get(key)
      if (!obj) return null
      return {
        key,
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata,
        size: obj.body.length,
      } as R2Object
    }),
    get: vi.fn(async (key: string, options?: { range?: { offset: number; length?: number } }) => {
      const obj = storedObjects.get(key)
      if (!obj) return null
      const uploaded = new Date()

      let body = obj.body
      let range = undefined
      let size = obj.body.length

      if (options?.range) {
        const { offset, length } = options.range
        const end = length ? offset + length : obj.body.length
        body = obj.body.slice(offset, end)
        size = body.length
        range = { offset, length: size }
      }

      return {
        key,
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata,
        size,
        body,
        text: async () => new TextDecoder().decode(body),
        arrayBuffer: async () => body.buffer,
        uploaded,
        httpEtag: `"${key}-${obj.body.length}"`,
        range,
        // R2Object 新增属性
        version: 'v1',
        etag: `"${key}-${obj.body.length}"`,
        checksums: {
          md5: '',
          sha1: '',
          sha256: '',
          sha384: '',
          sha512: '',
        },
        storageClass: 'Standard',
        writeHttpMetadata: {},
      } as unknown as R2Object
    }),
    put: vi.fn(async (key: string, value: BodyInit, options?: R2PutOptions) => {
      const body = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value))
      // 类型转换：R2PutOptions.httpMetadata 可能是 Headers 或 R2HTTPMetadata
      const httpMetadata =
        options?.httpMetadata instanceof Headers
          ? undefined
          : (options?.httpMetadata as R2HTTPMetadata | undefined)
      storedObjects.set(key, {
        httpMetadata,
        customMetadata: options?.customMetadata,
        body,
      })
    }),
    delete: vi.fn(async (keys: string | string[]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys]
      keyArray.forEach((k) => storedObjects.delete(k))
    }),
    list: vi.fn(async (options?: R2ListOptions) => {
      const objects = Array.from(storedObjects.entries())
        .filter(([key]) => !options?.prefix || key.startsWith(options.prefix))
        .filter(([key]) => !options?.delimiter || !key.includes(options.delimiter))
        .map(([key, obj]) => ({
          key,
          httpMetadata: obj.httpMetadata,
          customMetadata: obj.customMetadata,
          size: obj.body.length,
        }))

      return {
        objects,
        truncated: false,
      }
    }),
  } as unknown as R2Bucket

  return { r2, storedObjects }
}

// Create mock Env for testing
export function createMockEnv(kv?: KVNamespace, r2?: R2Bucket): Env {
  const mockKv = kv ?? createMockKV().kv
  const mockR2 = r2 ?? createMockR2().r2
  return {
    NOTEPAD_KV: mockKv as KVNamespace,
    NOTEPAD_R2: mockR2 as R2Bucket,
    JWT_SECRET: 'test-secret-key-for-testing-only',
  } as Env
}

// Helper to parse JSON response
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  return JSON.parse(text) as T
}

// Helper to check response status
export function expectStatus(response: Response, status: number) {
  expect(response.status).toBe(status)
}
