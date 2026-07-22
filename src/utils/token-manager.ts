const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_PATH_KEY = 'auth_path'
const AUTH_VERIFIED_KEY = 'auth_verified'
const ADMIN_TOKEN_KEY = 'admin_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthPath(): string | null {
  return localStorage.getItem(AUTH_PATH_KEY)
}

export function setAuthPath(path: string): void {
  localStorage.setItem(AUTH_PATH_KEY, path)
}

export function removeAuthPath(): void {
  localStorage.removeItem(AUTH_PATH_KEY)
}

export function getVerifiedPaths(): string[] {
  const stored = localStorage.getItem(AUTH_VERIFIED_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as string[]
    } catch {
      return []
    }
  }
  return []
}

export function setVerifiedPaths(paths: string[]): void {
  localStorage.setItem(AUTH_VERIFIED_KEY, JSON.stringify(paths))
}

export function addVerifiedPath(path: string): void {
  const paths = getVerifiedPaths()
  if (!paths.includes(path)) {
    paths.push(path)
    setVerifiedPaths(paths)
  }
}

export function removeVerifiedPath(path: string): void {
  const paths = getVerifiedPaths()
  const index = paths.indexOf(path)
  if (index > -1) {
    paths.splice(index, 1)
    setVerifiedPaths(paths)
  }
}

export function clearVerifiedPaths(): void {
  localStorage.removeItem(AUTH_VERIFIED_KEY)
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function removeAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function clearAllAuth(): void {
  removeAuthToken()
  removeAuthPath()
  clearVerifiedPaths()
  removeAdminToken()
}
