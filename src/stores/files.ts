import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete, FolderProtectedError } from '../utils/api'
import type { FileInfo, FolderInfo, FileListResponse } from '../types/index'
import { isRootOperation, isRootPath } from '../../types/shared'
import { getErrorMessage } from '../utils/error'

export type FileItem = Omit<FileInfo, 'lastModified'> & { lastModified: Date }

export const useFilesStore = defineStore('files', () => {
  const currentPath = ref('')
  const folders = ref<FolderInfo[]>([])
  const files = ref<FileItem[]>([])
  const rootProtected = ref(false)
  const currentProtected = ref(false)
  const currentNoEncrypt = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  async function listFiles(path: string = ''): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    folders.value = []
    files.value = []
    try {
      const data = await apiGet<FileListResponse>(`/files?path=${encodeURIComponent(path)}`)

      folders.value = data.folders || []
      files.value = (data.files || []).map((f) => ({
        name: f.name,
        size: f.size,
        lastModified: new Date(f.lastModified),
      }))
      rootProtected.value = data.rootProtected ?? false
      currentProtected.value = data.currentProtected ?? false
      currentNoEncrypt.value = data.currentNoEncrypt ?? false
      currentPath.value = path
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '加载文件列表失败')
      if (err instanceof FolderProtectedError) {
        throw err
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function readFile(path: string): Promise<string | null> {
    try {
      const data = await apiGet<{ content: string }>(`/files/${path}`)
      return data.content
    } catch (err) {
      error.value = getErrorMessage(err, '读取文件失败')
      if (err instanceof FolderProtectedError) {
        throw err
      }
      return null
    }
  }

  async function writeFile(path: string, content: string): Promise<boolean> {
    try {
      const useAdmin = isRootOperation(path)
      await apiPut(`/files/${path}`, { content }, useAdmin)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '保存文件失败')
      return false
    }
  }

  async function deleteFile(path: string): Promise<boolean> {
    try {
      await apiDelete(`/files/${path}`)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '删除文件失败')
      return false
    }
  }

  async function createFolder(path: string): Promise<boolean> {
    try {
      const parentPath = path.lastIndexOf('/') >= 0 ? path.substring(0, path.lastIndexOf('/')) : ''
      const useAdmin = isRootPath(parentPath)
      await apiPost('/folder', { path }, useAdmin)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '创建文件夹失败')
      return false
    }
  }

  async function deleteFolder(path: string): Promise<boolean> {
    try {
      await apiDelete('/folder', { path })
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '删除文件夹失败')
      return false
    }
  }

  async function renameFolder(oldPath: string, newPath: string): Promise<boolean> {
    try {
      await apiPut('/folder', { oldPath, newPath })
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '重命名文件夹失败')
      return false
    }
  }

  async function moveFile(oldPath: string, newPath: string): Promise<boolean> {
    try {
      await apiPut(`/files/${oldPath}`, { action: 'move', newPath })
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '移动文件失败')
      return false
    }
  }

  async function renameFile(oldPath: string, newName: string): Promise<boolean> {
    try {
      const parentPath =
        oldPath.lastIndexOf('/') >= 0 ? oldPath.substring(0, oldPath.lastIndexOf('/')) : ''
      const newPath = parentPath ? `${parentPath}/${newName}` : newName
      await apiPut(`/files/${oldPath}`, { action: 'move', newPath })
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '重命名文件失败')
      return false
    }
  }

  async function setFolderNoEncrypt(path: string): Promise<boolean> {
    try {
      await apiPost('/folder/no-encrypt', { path }, true)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '设置禁止加密失败')
      return false
    }
  }

  async function removeFolderNoEncrypt(path: string): Promise<boolean> {
    try {
      await apiDelete('/folder/no-encrypt', { path }, true)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, '取消禁止加密失败')
      return false
    }
  }

  return {
    currentPath,
    folders,
    files,
    rootProtected,
    currentProtected,
    currentNoEncrypt,
    isLoading,
    error,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    createFolder,
    deleteFolder,
    renameFolder,
    moveFile,
    renameFile,
    setFolderNoEncrypt,
    removeFolderNoEncrypt,
  }
})
