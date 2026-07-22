import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiPost, apiDelete, apiRequest } from '../utils/api'
import { isRootPath } from '../../types/shared'
import { getErrorMessage } from '../utils/error'
import {
  getAuthToken,
  setAuthToken,
  getAuthPath,
  setAuthPath,
  getVerifiedPaths,
  addVerifiedPath,
  removeVerifiedPath,
  getAdminToken,
  setAdminToken,
  removeAdminToken,
  clearAllAuth,
} from '../utils/token-manager'

export const useAuthStore = defineStore('auth', () => {
  const pathPrefix = ref<string | null>(null)
  const verifiedPaths = ref<string[]>([])
  const error = ref('')
  const isAdmin = ref(false)
  const adminToken = ref<string | null>(null)
  const authToken = ref<string | null>(null)
  const authInitialized = ref(false)

  async function verifyFolderPassword(
    path: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; blocked?: boolean }> {
    try {
      const data = await apiPost<{ token: string }>('/folder/password', { path, password })
      if (data.token) {
        authToken.value = data.token
        setAuthToken(data.token)
        pathPrefix.value = path
        setAuthPath(path)
        if (!verifiedPaths.value.includes(path)) {
          verifiedPaths.value = [...verifiedPaths.value, path]
        }
        addVerifiedPath(path)
        error.value = ''
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      const errMsg = getErrorMessage(err, '验证失败')
      error.value = errMsg
      return {
        success: false,
        error: errMsg,
        blocked: errMsg.includes('封禁') || errMsg.includes('累计'),
      }
    }
  }

  async function setFolderPassword(path: string, password: string): Promise<boolean> {
    try {
      const useAdmin = isRootPath(path)
      await apiPost('/folder/password', { path, password, action: 'set' }, useAdmin)
      error.value = ''
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '设置失败')
      return false
    }
  }

  async function removeFolderPassword(
    path: string,
    password?: string,
  ): Promise<{ success: boolean; error?: string; blocked?: boolean }> {
    try {
      await apiDelete('/folder/password', { path, password })
      const index = verifiedPaths.value.indexOf(path)
      if (index > -1) {
        verifiedPaths.value = verifiedPaths.value.filter((p) => p !== path)
      }
      removeVerifiedPath(path)
      error.value = ''
      return { success: true }
    } catch (err) {
      const errMsg = getErrorMessage(err, '移除失败')
      error.value = errMsg
      return {
        success: false,
        error: errMsg,
        blocked: errMsg.includes('封禁') || errMsg.includes('累计'),
      }
    }
  }

  async function resetFolderPassword(
    path: string,
    adminPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiPost('/folder/password', { path, password: adminPassword, action: 'reset' })
      const index = verifiedPaths.value.indexOf(path)
      if (index > -1) {
        verifiedPaths.value = verifiedPaths.value.filter((p) => p !== path)
      }
      removeVerifiedPath(path)
      error.value = ''
      return { success: true }
    } catch (err) {
      const errMsg = getErrorMessage(err, '重置失败')
      error.value = errMsg
      return {
        success: false,
        error: errMsg,
      }
    }
  }

  async function loginAsAdmin(password: string): Promise<boolean> {
    try {
      const data = await apiPost<{ token: string }>('/admin', { password })
      adminToken.value = data.token
      setAdminToken(data.token)
      isAdmin.value = true
      error.value = ''
      return true
    } catch (err) {
      logoutAsAdmin()
      error.value = getErrorMessage(err, '登录失败')
      return false
    }
  }

  function logoutAsAdmin(): void {
    isAdmin.value = false
    adminToken.value = null
    removeAdminToken()
  }

  async function validateToken(token: string): Promise<boolean> {
    try {
      await apiRequest('/admin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ validate: true }),
      })
      return true
    } catch {
      return false
    }
  }

  async function checkAdminAuth(): Promise<boolean> {
    if (isAdmin.value && adminToken.value) {
      const valid = await validateToken(adminToken.value)
      if (!valid) {
        logoutAsAdmin()
        return false
      }
      return true
    }
    const storedToken = getAdminToken()
    if (storedToken) {
      const valid = await validateToken(storedToken)
      if (valid) {
        adminToken.value = storedToken
        isAdmin.value = true
        return true
      }
      removeAdminToken()
    }
    return false
  }

  async function checkFolderAuth(): Promise<boolean> {
    if (authToken.value) {
      return true
    }
    const storedToken = getAuthToken()
    if (storedToken) {
      authToken.value = storedToken
      const storedPath = getAuthPath()
      if (storedPath) {
        pathPrefix.value = storedPath
      }
      verifiedPaths.value = getVerifiedPaths()
      return true
    }
    return false
  }

  async function initAuth(): Promise<void> {
    if (authInitialized.value) return
    await checkFolderAuth()
    await checkAdminAuth()
    authInitialized.value = true
  }

  async function logout(): Promise<void> {
    pathPrefix.value = null
    verifiedPaths.value = []
    error.value = ''
    isAdmin.value = false
    adminToken.value = null
    authToken.value = null
    clearAllAuth()
    authInitialized.value = false
  }

  function checkAuth(): boolean {
    return !!authToken.value || !!getAuthToken()
  }

  function isPathVerified(path: string): boolean {
    return verifiedPaths.value.includes(path)
  }

  return {
    pathPrefix,
    verifiedPaths,
    error,
    isAdmin,
    adminToken,
    authToken,
    authInitialized,
    verifyFolderPassword,
    setFolderPassword,
    removeFolderPassword,
    resetFolderPassword,
    loginAsAdmin,
    logoutAsAdmin,
    checkAdminAuth,
    checkFolderAuth,
    initAuth,
    logout,
    checkAuth,
    isPathVerified,
  }
})
