import { PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_LENGTH } from './constants'
import { timingSafeEqual } from './crypto'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PASSWORD_HASH_LENGTH,
  )

  return `${btoa(String.fromCharCode(...new Uint8Array(salt)))}:${btoa(String.fromCharCode(...new Uint8Array(derived)))}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 2) return false

  const saltB64 = parts[0]
  const hashB64 = parts[1]
  const salt = new Uint8Array(
    atob(saltB64)
      .split('')
      .map((c) => c.charCodeAt(0)),
  )

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PASSWORD_HASH_LENGTH,
  )

  const derivedB64 = btoa(String.fromCharCode(...new Uint8Array(derived)))
  return timingSafeEqual(derivedB64, hashB64)
}
