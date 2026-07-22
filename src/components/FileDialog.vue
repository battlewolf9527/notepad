<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useFilesStore } from '../stores/files'

import { useConfigStore } from '../stores/config'
import { useToastStore } from '../stores/toast'
import { useConfirmStore } from '../stores/confirm'
import { useAuthStore } from '../stores/auth'
import { joinPath, getParentPath, validateFileName, isRootPath } from '../../types/shared'
import { FolderProtectedError } from '../utils/api'
import PromptDialog from './PromptDialog.vue'
import FileDialogContextMenu from './FileDialogContextMenu.vue'
import FileDialogPassword from './FileDialogPassword.vue'
import AdminLoginDialog from './AdminLoginDialog.vue'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
  mode: 'open' | 'save'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', path: string): void
}>()

const filesStore = useFilesStore()
const configStore = useConfigStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const authStore = useAuthStore()

const currentPath = ref('')
const selectedFile = ref('')
const newFileName = ref('')
const saveError = ref('')
const isLoading = ref(false)
const loadError = ref('')
const isProcessing = ref(false)
const processingMessage = ref('')

const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const showMoveDialog = ref(false)

const itemToRename = ref<{ name: string; type: 'file' | 'folder' } | null>(null)
const itemToMove = ref<{ name: string; type: 'file' | 'folder' } | null>(null)
const renameValue = ref('')
const moveTargetPath = ref('')

const contextMenuX = ref(0)
const contextMenuY = ref(0)
const showContextMenu = ref(false)
const contextMenuItem = ref<{ name: string; type: 'file' | 'folder' } | null>(null)

const showVerifyPasswordDialog = ref(false)
const showSetPasswordDialog = ref(false)
const showRemovePasswordDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showRootPasswordDialog = ref(false)
const showForgotPasswordDialog = ref(false)
const showAdminLoginDialog = ref(false)
const adminLoginError = ref('')
const rootPasswordAction = ref<'set' | 'remove' | 'change'>('set')
const passwordPath = ref<string | null>(null)
const pendingRootAction = ref<(() => void) | null>(null)
const pendingAdminAction = ref<{
  action:
    | 'set-no-encrypt'
    | 'remove-no-encrypt'
    | 'delete-folder'
    | 'rename-folder'
    | 'delete-file'
    | 'rename-file'
  path: string
  newPath?: string
} | null>(null)

const fileDialogRef = ref<HTMLElement | null>(null)
const fileDialogDrag = useDraggable()

const pathSegments = computed(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/')
})

const isRootAuthenticated = computed(() => {
  return authStore.isPathVerified('')
})

async function loadFiles(path: string) {
  isLoading.value = true
  loadError.value = ''
  try {
    await filesStore.listFiles(path)
    if (filesStore.error) {
      loadError.value = filesStore.error
    }
  } catch (err) {
    if (err instanceof FolderProtectedError) {
      passwordPath.value = err.protectedPath
      showVerifyPasswordDialog.value = true
    } else {
      loadError.value = '加载文件列表失败，请重试'
    }
  } finally {
    isLoading.value = false
  }
}

function retryLoad() {
  loadFiles(currentPath.value)
}

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      selectedFile.value = ''
      newFileName.value = ''
      fileDialogDrag.resetOffset()
      if (!currentPath.value) {
        await loadFiles('')
      } else {
        await loadFiles(currentPath.value)
      }
    }
  },
)

async function navigateTo(path: string) {
  currentPath.value = path
  await loadFiles(path)
}

function goUp() {
  const parent = getParentPath(currentPath.value)
  navigateTo(parent)
}

async function selectFolder(folderName: string) {
  if (folderName.includes('/')) {
    return
  }
  const newPath = joinPath(currentPath.value, folderName)
  const folderItem = filesStore.folders.find((f) => f.name === folderName)

  if (folderItem?.protected) {
    passwordPath.value = newPath
    showVerifyPasswordDialog.value = true
    return
  }

  navigateTo(newPath)
}

function handlePasswordVerifySuccess() {
  if (passwordPath.value) {
    navigateTo(passwordPath.value)
    passwordPath.value = null
  } else {
    loadFiles(currentPath.value)
  }
}

function handlePasswordClose() {
  showVerifyPasswordDialog.value = false
  showSetPasswordDialog.value = false
  showRemovePasswordDialog.value = false
  showChangePasswordDialog.value = false
  showRootPasswordDialog.value = false
  showForgotPasswordDialog.value = false
  passwordPath.value = null
}

function handleForgotPassword() {
  showVerifyPasswordDialog.value = false
  showForgotPasswordDialog.value = true
}

function selectFile(fileName: string) {
  selectedFile.value = fileName
  if (props.mode === 'save') {
    newFileName.value = fileName
  }
}

function openFile(fileName: string) {
  if (props.mode === 'open') {
    const fullPath = joinPath(currentPath.value, fileName)
    emit('select', fullPath)
  }
}

async function createFolder() {
  if (isRootPath(currentPath.value)) {
    if (authStore.isAdmin) {
      showCreateFolderDialog.value = true
    } else {
      const hasAuth = await authStore.checkAdminAuth()
      if (!hasAuth) {
        pendingRootAction.value = () => {
          showCreateFolderDialog.value = true
        }
        showAdminLoginDialog.value = true
        return
      }
      showCreateFolderDialog.value = true
    }
  } else {
    showCreateFolderDialog.value = true
  }
}

async function handleCreateFolderConfirm(folderName: string) {
  showCreateFolderDialog.value = false
  if (!folderName.trim()) return

  const { valid, error } = validateFileName(folderName)
  if (!valid) {
    toastStore.error(error || '文件夹名称无效')
    return
  }

  const fullPath = joinPath(currentPath.value, folderName.trim())
  isProcessing.value = true
  processingMessage.value = '正在创建文件夹...'
  try {
    const success = await filesStore.createFolder(fullPath)
    if (success) {
      toastStore.success('文件夹创建成功')
      await loadFiles(currentPath.value)
    } else {
      const errMsg = filesStore.error || '创建文件夹失败'
      if (errMsg.includes('管理员') || errMsg.includes('权限')) {
        authStore.logoutAsAdmin()
        pendingRootAction.value = () => {
          showCreateFolderDialog.value = true
        }
        showAdminLoginDialog.value = true
      } else {
        toastStore.error(errMsg)
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : '创建文件夹失败'
    if (errMsg.includes('管理员') || errMsg.includes('权限')) {
      authStore.logoutAsAdmin()
      pendingRootAction.value = () => {
        showCreateFolderDialog.value = true
      }
      showAdminLoginDialog.value = true
    } else {
      toastStore.error(errMsg)
    }
  } finally {
    isProcessing.value = false
  }
}

function showItemMenu(event: MouseEvent, name: string, type: 'file' | 'folder') {
  event.preventDefault()
  event.stopPropagation()
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuItem.value = { name, type }
  showContextMenu.value = true
}

function hideContextMenu() {
  showContextMenu.value = false
  contextMenuItem.value = null
}

async function handleDelete() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item) return

  const confirmed = await confirmStore.confirm(
    `确定要删除${item.type === 'folder' ? '文件夹' : '文件'} "${item.name}" 吗？此操作不可撤销。`,
    '确认删除',
  )

  if (!confirmed) return

  const fullPath = joinPath(currentPath.value, item.name)

  if (isRootPath(currentPath.value)) {
    if (!authStore.isAdmin) {
      pendingAdminAction.value = {
        action: item.type === 'folder' ? 'delete-folder' : 'delete-file',
        path: fullPath,
      }
      showAdminLoginDialog.value = true
      return
    }
  }

  const isFolder = item.type === 'folder'
  isProcessing.value = true
  processingMessage.value = isFolder ? '正在删除文件夹...' : '正在删除文件...'

  let success = false
  if (isFolder) {
    success = await filesStore.deleteFolder(fullPath)
  } else {
    success = await filesStore.deleteFile(fullPath)
  }

  isProcessing.value = false

  if (!success) {
    toastStore.error(filesStore.error || (isFolder ? '删除文件夹失败' : '删除文件失败'))
    return
  }

  toastStore.success(isFolder ? '文件夹删除成功' : '文件删除成功')
  await loadFiles(currentPath.value)
}

function handleRename() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item) return

  itemToRename.value = item
  renameValue.value = item.name
  showRenameDialog.value = true
}

async function handleRenameConfirm(newName: string) {
  showRenameDialog.value = false
  if (!itemToRename.value) {
    return
  }

  const { valid, error } = validateFileName(newName)
  if (!valid) {
    toastStore.error(error || '名称无效')
    return
  }

  const oldPath = joinPath(currentPath.value, itemToRename.value.name)
  const newPath = joinPath(currentPath.value, newName.trim())

  if (isRootPath(currentPath.value)) {
    if (!authStore.isAdmin) {
      pendingAdminAction.value = {
        action: itemToRename.value.type === 'folder' ? 'rename-folder' : 'rename-file',
        path: oldPath,
        newPath,
      }
      showAdminLoginDialog.value = true
      return
    }
  }

  const isFolder = itemToRename.value.type === 'folder'
  isProcessing.value = true
  processingMessage.value = isFolder ? '正在重命名文件夹...' : '正在重命名文件...'

  const success = isFolder
    ? await filesStore.renameFolder(oldPath, newPath)
    : await filesStore.renameFile(oldPath, newName.trim())

  isProcessing.value = false

  if (!success) {
    toastStore.error('重命名失败')
    return
  }

  toastStore.success(isFolder ? '文件夹重命名成功' : '文件重命名成功')
  await loadFiles(currentPath.value)
  itemToRename.value = null
}

function handleMove() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item) return

  itemToMove.value = item
  moveTargetPath.value = ''
  showMoveDialog.value = true
}

async function handleMoveConfirm(newPath: string) {
  showMoveDialog.value = false
  if (!itemToMove.value) return

  const oldPath = joinPath(currentPath.value, itemToMove.value.name)
  const targetPath = joinPath(newPath.trim(), itemToMove.value.name)

  if (itemToMove.value.type === 'file') {
    isProcessing.value = true
    processingMessage.value = '正在移动文件...'
    const success = await filesStore.moveFile(oldPath, targetPath)
    isProcessing.value = false
    if (!success) {
      toastStore.error('移动文件失败')
      return
    }
    toastStore.success('文件移动成功')
  }

  await loadFiles(currentPath.value)

  const targetParent = getParentPath(newPath.trim()) || ''
  if (targetParent !== currentPath.value) {
    await loadFiles(targetParent)
  }

  itemToMove.value = null
}

function handleSetPassword() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item || item.type !== 'folder') return

  passwordPath.value = joinPath(currentPath.value, item.name)
  showSetPasswordDialog.value = true
}

function handleRemovePassword() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item || item.type !== 'folder') return

  passwordPath.value = joinPath(currentPath.value, item.name)
  showRemovePasswordDialog.value = true
}

function handleChangePassword() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item || item.type !== 'folder') return

  passwordPath.value = joinPath(currentPath.value, item.name)
  showChangePasswordDialog.value = true
}

function handleSetRootPassword() {
  if (authStore.isAdmin) {
    rootPasswordAction.value = 'set'
    showRootPasswordDialog.value = true
  } else {
    pendingRootAction.value = () => {
      rootPasswordAction.value = 'set'
      showRootPasswordDialog.value = true
    }
    showAdminLoginDialog.value = true
  }
}

function handleRemoveRootPassword() {
  if (authStore.isAdmin) {
    rootPasswordAction.value = 'remove'
    showRootPasswordDialog.value = true
  } else {
    pendingRootAction.value = () => {
      rootPasswordAction.value = 'remove'
      showRootPasswordDialog.value = true
    }
    showAdminLoginDialog.value = true
  }
}

function handleChangeRootPassword() {
  if (authStore.isAdmin) {
    rootPasswordAction.value = 'change'
    showRootPasswordDialog.value = true
  } else {
    pendingRootAction.value = () => {
      rootPasswordAction.value = 'change'
      showRootPasswordDialog.value = true
    }
    showAdminLoginDialog.value = true
  }
}

function handleSetFolderPassword() {
  passwordPath.value = currentPath.value
  showSetPasswordDialog.value = true
}

function handleChangeFolderPassword() {
  passwordPath.value = currentPath.value
  showChangePasswordDialog.value = true
}

function handleRemoveFolderPassword() {
  passwordPath.value = currentPath.value
  showRemovePasswordDialog.value = true
}

async function handleSetNoEncrypt() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item || item.type !== 'folder') return

  if (!authStore.isAdmin) {
    pendingAdminAction.value = {
      action: 'set-no-encrypt',
      path: joinPath(currentPath.value, item.name),
    }
    showAdminLoginDialog.value = true
    return
  }

  const fullPath = joinPath(currentPath.value, item.name)
  isProcessing.value = true
  processingMessage.value = '正在设置禁止加密...'
  const success = await filesStore.setFolderNoEncrypt(fullPath)
  isProcessing.value = false
  if (success) {
    toastStore.success('已禁止该文件夹加密')
    await loadFiles(currentPath.value)
  } else {
    toastStore.error(filesStore.error || '设置失败')
  }
}

async function handleRemoveNoEncrypt() {
  const item = contextMenuItem.value
  hideContextMenu()
  if (!item || item.type !== 'folder') return

  if (!authStore.isAdmin) {
    pendingAdminAction.value = {
      action: 'remove-no-encrypt',
      path: joinPath(currentPath.value, item.name),
    }
    showAdminLoginDialog.value = true
    return
  }

  const fullPath = joinPath(currentPath.value, item.name)
  isProcessing.value = true
  processingMessage.value = '正在取消禁止加密...'
  const success = await filesStore.removeFolderNoEncrypt(fullPath)
  isProcessing.value = false
  if (success) {
    toastStore.success('已允许该文件夹加密')
    await loadFiles(currentPath.value)
  } else {
    toastStore.error(filesStore.error || '取消失败')
  }
}

type AdminActionType = NonNullable<typeof pendingAdminAction.value>['action']

const adminActionHandlers: Record<
  AdminActionType,
  (path: string, newPath?: string) => Promise<void>
> = {
  'set-no-encrypt': async (path) => {
    const result = await filesStore.setFolderNoEncrypt(path)
    if (result) {
      toastStore.success('已禁止该文件夹加密')
    } else {
      toastStore.error(filesStore.error || '设置失败')
    }
  },
  'remove-no-encrypt': async (path) => {
    const result = await filesStore.removeFolderNoEncrypt(path)
    if (result) {
      toastStore.success('已允许该文件夹加密')
    } else {
      toastStore.error(filesStore.error || '取消失败')
    }
  },
  'delete-folder': async (path) => {
    await filesStore.deleteFolder(path)
    toastStore.success('文件夹删除成功')
  },
  'rename-folder': async (path, newPath) => {
    const success = await filesStore.renameFolder(path, newPath || '')
    if (success) {
      toastStore.success('文件夹重命名成功')
    } else {
      toastStore.error('重命名失败')
    }
  },
  'delete-file': async (path) => {
    await filesStore.deleteFile(path)
    toastStore.success('文件删除成功')
  },
  'rename-file': async (path, newPath) => {
    const success = await filesStore.renameFile(path, newPath || '')
    if (success) {
      toastStore.success('文件重命名成功')
    } else {
      toastStore.error('重命名失败')
    }
  },
}

async function handleAdminLogin(password: string) {
  adminLoginError.value = ''
  const success = await authStore.loginAsAdmin(password)
  if (success) {
    showAdminLoginDialog.value = false
    if (pendingRootAction.value) {
      pendingRootAction.value()
      pendingRootAction.value = null
    }
    if (pendingAdminAction.value) {
      const { action, path, newPath } = pendingAdminAction.value
      pendingAdminAction.value = null
      const handler = adminActionHandlers[action]
      if (handler) {
        isProcessing.value = true
        processingMessage.value = getProcessingMessage(action)
        await handler(path, newPath)
        isProcessing.value = false
        await loadFiles(currentPath.value)
      }
    }
  } else {
    adminLoginError.value = authStore.error || '管理员密码错误'
  }
}

function getProcessingMessage(action: AdminActionType): string {
  const messages: Record<AdminActionType, string> = {
    'set-no-encrypt': '正在设置禁止加密...',
    'remove-no-encrypt': '正在取消禁止加密...',
    'delete-folder': '正在删除文件夹...',
    'rename-folder': '正在重命名文件夹...',
    'delete-file': '正在删除文件...',
    'rename-file': '正在重命名文件...',
  }
  return messages[action] || '处理中...'
}

function handleAdminLoginClose() {
  showAdminLoginDialog.value = false
  pendingRootAction.value = null
  pendingAdminAction.value = null
}

function handlePasswordActionSuccess() {
  loadFiles(currentPath.value)
}

function getFinalFileName(fileName: string): string {
  const trimmed = fileName.trim()
  return trimmed.includes('.') ? trimmed : trimmed + configStore.defaultExtension
}

async function handleSave() {
  saveError.value = ''
  if (!newFileName.value.trim()) {
    saveError.value = '请输入文件名'
    return
  }

  const { valid, error } = validateFileName(newFileName.value)
  if (!valid) {
    saveError.value = error || '文件名无效'
    return
  }

  const finalFileName = getFinalFileName(newFileName.value)
  const fullPath = joinPath(currentPath.value, finalFileName)

  if (isRootPath(currentPath.value)) {
    if (authStore.isAdmin) {
      emit('select', fullPath)
    } else {
      const hasAuth = await authStore.checkAdminAuth()
      if (!hasAuth) {
        pendingRootAction.value = () => {
          emit('select', fullPath)
        }
        showAdminLoginDialog.value = true
        return
      }
      emit('select', fullPath)
    }
  } else {
    emit('select', fullPath)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showRenameDialog.value) {
      showRenameDialog.value = false
    } else if (showMoveDialog.value) {
      showMoveDialog.value = false
    } else if (showCreateFolderDialog.value) {
      showCreateFolderDialog.value = false
    } else if (showContextMenu.value) {
      hideContextMenu()
    } else if (showVerifyPasswordDialog.value) {
      showVerifyPasswordDialog.value = false
      passwordPath.value = null
      emit('close')
    } else if (showSetPasswordDialog.value) {
      showSetPasswordDialog.value = false
    } else if (showRemovePasswordDialog.value) {
      showRemovePasswordDialog.value = false
    } else if (showChangePasswordDialog.value) {
      showChangePasswordDialog.value = false
    } else if (showRootPasswordDialog.value) {
      showRootPasswordDialog.value = false
    } else if (props.visible) {
      emit('close')
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="fileDialogRef"
      class="modal-dialog file-dialog"
      :style="
        fileDialogDrag.offset.value.x !== 0 || fileDialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${fileDialogDrag.offset.value.x}px, ${fileDialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="fileDialogDrag.onMouseDown">
        <span>{{ mode === 'open' ? '打开' : '另存为' }}</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body file-dialog-body">
        <div class="path-bar">
          <div class="path-nav">
            <button @click="navigateTo('')">根目录</button>
            <span v-if="filesStore.rootProtected" class="lock-icon">🔒</span>
            <template v-for="(segment, index) in pathSegments" :key="index">
              <span>/</span>
              <button @click="navigateTo(pathSegments.slice(0, index + 1).join('/'))">
                {{ segment }}
              </button>
            </template>
          </div>
          <div class="path-actions">
            <template v-if="currentPath === ''">
              <button
                v-if="filesStore.rootProtected && isRootAuthenticated"
                class="root-password-btn"
                @click="handleChangeRootPassword()"
                :disabled="filesStore.currentNoEncrypt"
                :title="filesStore.currentNoEncrypt ? '该目录已被设置为禁止加密' : ''"
              >
                修改密码
              </button>
              <button
                v-if="
                  !filesStore.rootProtected || (filesStore.rootProtected && isRootAuthenticated)
                "
                class="root-password-btn"
                @click="
                  filesStore.rootProtected ? handleRemoveRootPassword() : handleSetRootPassword()
                "
                :disabled="filesStore.currentNoEncrypt && !filesStore.rootProtected"
                :title="
                  filesStore.currentNoEncrypt && !filesStore.rootProtected
                    ? '该目录已被设置为禁止加密'
                    : ''
                "
              >
                {{ filesStore.rootProtected ? '移除密码' : '设置密码' }}
              </button>
            </template>
            <template v-else>
              <button
                v-if="filesStore.currentProtected"
                class="root-password-btn"
                @click="handleChangeFolderPassword()"
                :disabled="filesStore.currentNoEncrypt"
                :title="filesStore.currentNoEncrypt ? '该目录已被设置为禁止加密' : ''"
              >
                修改密码
              </button>
              <button
                class="root-password-btn"
                @click="
                  filesStore.currentProtected
                    ? handleRemoveFolderPassword()
                    : handleSetFolderPassword()
                "
                :disabled="filesStore.currentNoEncrypt && !filesStore.currentProtected"
                :title="
                  filesStore.currentNoEncrypt && !filesStore.currentProtected
                    ? '该目录已被设置为禁止加密'
                    : ''
                "
              >
                {{ filesStore.currentProtected ? '移除密码' : '🔒 设置密码' }}
              </button>
            </template>
          </div>
        </div>

        <div class="file-list">
          <div v-if="isProcessing" class="processing-overlay">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ processingMessage }}</span>
          </div>
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">加载中...</span>
          </div>
          <div v-else-if="loadError" class="error-container">
            <span class="error-icon">❌</span>
            <span class="error-message">{{ loadError }}</span>
            <button class="retry-btn" @click="retryLoad">重试</button>
          </div>
          <template v-else>
            <div v-if="currentPath" class="list-item folder-item" @click="goUp">
              <span class="name">📁 ..</span>
              <span class="size"></span>
              <span class="actions"></span>
            </div>

            <div
              v-for="folder in filesStore.folders"
              :key="folder.name"
              class="list-item folder-item"
              @click="selectFolder(folder.name)"
              @contextmenu="showItemMenu($event, folder.name, 'folder')"
            >
              <span class="name"
                >📁 {{ folder.name }}
                <span v-if="folder.protected" class="lock-icon">🔒</span>
                <span v-if="folder.noEncrypt" class="no-encrypt-icon" title="禁止加密">
                  <span class="no-encrypt-lock">🔒</span>
                  <span class="no-encrypt-badge">❌</span>
                </span>
              </span>
              <span class="size"></span>
              <span class="actions">
                <button
                  class="actions-btn"
                  @click.stop="showItemMenu($event, folder.name, 'folder')"
                  title="更多操作"
                >
                  ⋮
                </button>
              </span>
            </div>

            <div
              v-for="file in filesStore.files.filter((f) => f.name && f.name.trim())"
              :key="file.name"
              class="list-item file-item"
              :class="{ selected: selectedFile === file.name }"
              @click="selectFile(file.name)"
              @dblclick="openFile(file.name)"
              @contextmenu="showItemMenu($event, file.name, 'file')"
            >
              <span class="name">📄 {{ file.name }}</span>
              <span class="size">{{ (file.size / 1024).toFixed(1) }} KB</span>
              <span class="actions">
                <button
                  class="actions-btn"
                  @click.stop="showItemMenu($event, file.name, 'file')"
                  title="更多操作"
                >
                  ⋮
                </button>
              </span>
            </div>
          </template>
        </div>

        <div v-if="mode === 'save'" class="save-input">
          <label>文件名:</label>
          <input v-model="newFileName" type="text" placeholder="请输入文件名" />
          <span class="default-extension-hint">默认后缀: {{ configStore.defaultExtension }}</span>
          <div v-if="saveError" class="error-text">{{ saveError }}</div>
        </div>
      </div>

      <div class="dialog-footer">
        <div>
          <button @click="createFolder">新建文件夹</button>
        </div>
        <div class="dialog-actions">
          <button
            class="primary"
            v-if="mode === 'open'"
            :disabled="!selectedFile"
            @click="() => emit('select', joinPath(currentPath, selectedFile))"
          >
            打开
          </button>
          <button class="primary" v-else @click="handleSave">保存</button>
          <button @click="emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>

  <PromptDialog
    :visible="showCreateFolderDialog"
    title="新建文件夹"
    label="文件夹名称:"
    @confirm="handleCreateFolderConfirm"
    @cancel="showCreateFolderDialog = false"
  />

  <PromptDialog
    :visible="showRenameDialog"
    title="重命名"
    label="新名称:"
    :default-value="renameValue"
    @confirm="handleRenameConfirm"
    @cancel="showRenameDialog = false"
  />

  <PromptDialog
    :visible="showMoveDialog"
    title="移动到..."
    label="目标路径:"
    :default-value="moveTargetPath"
    placeholder="例如: documents/work"
    @confirm="handleMoveConfirm"
    @cancel="showMoveDialog = false"
  />

  <FileDialogContextMenu
    :visible="showContextMenu"
    :x="contextMenuX"
    :y="contextMenuY"
    :item-name="contextMenuItem?.name || null"
    :item-type="contextMenuItem?.type || null"
    @close="hideContextMenu"
    @rename="handleRename"
    @move="handleMove"
    @delete="handleDelete"
    @set-password="handleSetPassword"
    @remove-password="handleRemovePassword"
    @change-password="handleChangePassword"
    @set-no-encrypt="handleSetNoEncrypt"
    @remove-no-encrypt="handleRemoveNoEncrypt"
  />

  <FileDialogPassword
    :visible="showVerifyPasswordDialog"
    type="verify"
    :path="passwordPath"
    @close="handlePasswordClose"
    @success="handlePasswordVerifySuccess"
    @forgot="handleForgotPassword"
  />

  <FileDialogPassword
    :visible="showSetPasswordDialog"
    type="set"
    :path="passwordPath"
    @close="
      () => {
        showSetPasswordDialog = false
        passwordPath = null
      }
    "
    @success="handlePasswordActionSuccess"
  />

  <FileDialogPassword
    :visible="showRemovePasswordDialog"
    type="remove"
    :path="passwordPath"
    @close="
      () => {
        showRemovePasswordDialog = false
        passwordPath = null
      }
    "
    @success="handlePasswordActionSuccess"
  />

  <FileDialogPassword
    :visible="showChangePasswordDialog"
    type="change"
    :path="passwordPath"
    @close="
      () => {
        showChangePasswordDialog = false
        passwordPath = null
      }
    "
    @success="handlePasswordActionSuccess"
  />

  <FileDialogPassword
    :visible="showRootPasswordDialog"
    type="root"
    :root-action="rootPasswordAction"
    @close="showRootPasswordDialog = false"
    @success="handlePasswordActionSuccess"
  />

  <FileDialogPassword
    :visible="showForgotPasswordDialog"
    type="forgot"
    :path="passwordPath"
    @close="showForgotPasswordDialog = false"
    @success="handlePasswordVerifySuccess"
  />

  <AdminLoginDialog
    :visible="showAdminLoginDialog"
    title="管理员认证"
    message="此操作需要管理员权限，请输入管理员密码。"
    :error="adminLoginError"
    @close="handleAdminLoginClose"
    @confirm="handleAdminLogin"
  />
</template>

<style scoped>
.lock-icon {
  margin-left: calc(4px * var(--scale));
  font-size: var(--font-size-xs);
}

.no-encrypt-icon {
  margin-left: calc(4px * var(--scale));
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  vertical-align: bottom;
}

.no-encrypt-lock {
  font-size: var(--font-size-xs);
}

.no-encrypt-badge {
  position: absolute;
  bottom: calc(1px * var(--scale));
  left: 50%;
  transform: translateX(-50%);
  font-size: calc(7px * var(--scale));
  color: var(--text-error);
}

.root-password-btn {
  margin-left: calc(12px * var(--scale));
  padding: calc(4px * var(--scale)) calc(8px * var(--scale));
  font-size: var(--font-size-xs);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.root-password-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.root-password-btn:disabled,
.root-password-btn.disabled {
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
  border-color: var(--border-light);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(40px * var(--scale));
  gap: calc(12px * var(--scale));
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--bg-primary-rgb), 0.85);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.loading-spinner {
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  border: 3px solid var(--border-light);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(40px * var(--scale));
  gap: calc(12px * var(--scale));
  color: var(--text-error);
  background: rgba(239, 68, 68, 0.05);
  border-radius: var(--radius-md);
}

.error-icon {
  font-size: calc(32px * var(--scale));
}

.error-message {
  font-size: var(--font-size-sm);
}

.retry-btn {
  padding: calc(8px * var(--scale)) calc(16px * var(--scale));
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  background: var(--accent-secondary);
}

.file-dialog {
  width: calc(600px * var(--scale));
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.file-dialog-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.path-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(12px * var(--scale)) calc(16px * var(--scale));
  background: var(--bg-secondary);
  gap: calc(12px * var(--scale));
  border-radius: var(--radius-sm);
  margin-bottom: calc(12px * var(--scale));
}

.path-nav {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
  flex-wrap: wrap;
}

.path-actions {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
}

.path-bar button {
  background: none;
  border: none;
  color: var(--accent-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: calc(4px * var(--scale)) calc(8px * var(--scale));
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.path-bar button:hover {
  background: var(--bg-tertiary);
  text-decoration: none;
}

.path-bar span {
  color: var(--text-muted);
}

.file-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: calc(8px * var(--scale));
  position: relative;
  min-height: 200px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: calc(10px * var(--scale)) calc(12px * var(--scale));
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  gap: calc(8px * var(--scale));
}

.list-item .name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item .size {
  width: 80px;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.list-item .actions {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.list-item:hover {
  background: var(--bg-secondary);
}

.list-item.selected {
  background: rgba(74, 144, 217, 0.1);
  color: var(--accent-primary);
}

.actions-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: calc(4px * var(--scale)) calc(8px * var(--scale));
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.list-item:hover .actions-btn {
  opacity: 1;
}

.actions-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.list-item.selected .size {
  color: var(--accent-secondary);
}

.save-input {
  display: flex;
  align-items: center;
  padding: calc(16px * var(--scale));
  border-top: 1px solid var(--border-light);
  gap: calc(12px * var(--scale));
  margin-top: calc(12px * var(--scale));
  flex-wrap: wrap;
}

.save-input label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.save-input input {
  flex: 1;
  min-width: calc(150px * var(--scale));
  padding: calc(10px * var(--scale)) calc(14px * var(--scale));
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  transition: all var(--transition-fast);
}

.save-input input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 calc(3px * var(--scale)) rgba(74, 144, 217, 0.15);
  outline: none;
}

.default-extension-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
}

.error-text {
  color: var(--text-error);
  font-size: var(--font-size-xs);
}

.dialog-footer button {
  min-width: calc(80px * var(--scale));
  padding: calc(8px * var(--scale)) calc(20px * var(--scale));
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.dialog-footer button:hover:not(:disabled) {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.dialog-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-footer button.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.dialog-footer button.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
