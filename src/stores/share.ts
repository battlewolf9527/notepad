import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiDelete } from '../utils/api'
import { useAuthStore } from './auth'
import type { ShareLink, ShareLinkCreationResponse } from '../types/index'
import { getErrorMessage } from '../utils/error'

export const useShareStore = defineStore('share', () => {
  const links = ref<ShareLink[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function generateViewLink(
    filename: string,
    expiresInHours: number,
    oneTime: boolean,
    password: string | null,
    allowIframe: boolean,
  ): Promise<string | null> {
    try {
      const data = await apiPost<ShareLinkCreationResponse>('/share', {
        filename,
        expiresInHours,
        oneTime,
        password,
        allowIframe,
      })
      return data.url
    } catch (err) {
      error.value = getErrorMessage(err, '生成分享链接失败')
      return null
    }
  }

  async function generateRawLink(
    filename: string,
    expiresInHours: number,
    oneTime: boolean,
    contentType: string,
    corsOrigin: string,
  ): Promise<string | null> {
    try {
      const data = await apiPost<ShareLinkCreationResponse>('/raw', {
        filename,
        expiresInHours,
        oneTime,
        contentType,
        corsOrigin,
      })
      return data.url
    } catch (err) {
      error.value = getErrorMessage(err, '生成原始链接失败')
      return null
    }
  }

  async function listLinks(): Promise<void> {
    isLoading.value = true
    error.value = ''
    try {
      const authStore = useAuthStore()
      links.value = await apiGet<ShareLink[]>('/shares', authStore.isAdmin)
    } catch (err) {
      error.value = getErrorMessage(err, '加载分享链接失败')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteLink(token: string): Promise<boolean> {
    try {
      await apiDelete(`/share/${token}`, undefined, true)
      links.value = links.value.filter((l) => l.token !== token)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '删除分享链接失败')
      return false
    }
  }

  async function verifyLink(id: string, password: string): Promise<ShareLink | null> {
    try {
      const fullLink = await apiPost<ShareLink>('/shares/verify', { id, password })
      // 替换列表中的受保护链接为完整信息
      const index = links.value.findIndex((l) => l.id === id || l.token === id)
      if (index !== -1) {
        links.value[index] = fullLink
      }
      return fullLink
    } catch (err) {
      error.value = getErrorMessage(err, '验证失败')
      return null
    }
  }

  return {
    links,
    isLoading,
    error,
    generateViewLink,
    generateRawLink,
    listLinks,
    deleteLink,
    verifyLink,
  }
})
