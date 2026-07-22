<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useEditorStore } from './stores/editor'
import { useConfigStore } from './stores/config'
import { useConfirmStore } from './stores/confirm'
import { useAuthStore } from './stores/auth'
import { useFileOperations } from './composables/useFileOperations'
import { useEditorCommands } from './composables/useEditorCommands'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useAppDialogs } from './composables/useAppDialogs'

import MenuBar from './components/MenuBar.vue'
import StatusBar from './components/StatusBar.vue'
import FindReplace from './components/FindReplace.vue'
import FontDialog from './components/FontDialog.vue'
import FileDialog from './components/FileDialog.vue'
import ShareDialog from './components/ShareDialog.vue'
import RawDialog from './components/RawDialog.vue'
import ShareManager from './components/ShareManager.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import AboutDialog from './components/AboutDialog.vue'
import PromptDialog from './components/PromptDialog.vue'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ZoomControl from './components/ZoomControl.vue'
import EditorWrapper from './components/EditorWrapper.vue'
import AdminBadge from './components/AdminBadge.vue'
import AdminLoginDialog from './components/AdminLoginDialog.vue'

const editorStore = useEditorStore()
const configStore = useConfigStore()
const confirmStore = useConfirmStore()
const authStore = useAuthStore()

const editorRef = ref<InstanceType<typeof EditorWrapper> | null>(null)
const windowTitle = computed(() => {
  const filename = editorStore.currentFile || '无标题'
  const modified = editorStore.isModified ? '*' : ''
  return `${filename}${modified} - ${configStore.siteTitle}`
})

const adminLoginError = ref('')

async function handleAdminLogin(password: string) {
  adminLoginError.value = ''
  const success = await authStore.loginAsAdmin(password)
  if (success) {
    closeAdminLoginDialog()
    await handleAdminLoginSuccess()
  } else {
    adminLoginError.value = authStore.error || '管理员密码错误'
  }
}

const dialogs = useAppDialogs()

const {
  showFindReplace,
  showGoToDialog,
  showFontDialog,
  showOpenDialog,
  showSaveDialog,
  showShareDialog,
  showRawDialog,
  showShareManager,
  showSettings,
  showDownloadPrompt,
  showAbout,
  showAdminLoginDialog,
  downloadFilename,
  openFindReplace,
  closeFindReplace,
  openGoToDialog,
  closeGoToDialog,
  openFontDialog,
  closeFontDialog,
  openOpenDialog,
  closeOpenDialog,
  openSaveDialog,
  closeSaveDialog,
  openShareDialog,
  closeShareDialog,
  openRawDialog,
  closeRawDialog,
  openShareManager,
  closeShareManager,
  openSettings,
  closeSettings,
  openDownloadPrompt,
  closeDownloadPrompt,
  openAdminLoginDialog,
  closeAdminLoginDialog,
} = dialogs

const {
  isOpeningFile,
  saveFile,
  triggerAutoSave,
  cancelAutoSave,
  newFile,
  openFile,
  importLocalFile,
  handleDropFile,
  selectFile,
  saveAs,
  download,
  handleSaveAsSelect,
  handleSaveDialogClose,
  handleAdminLoginSuccess,
  handleAdminLoginClose,
  exit,
} = useFileOperations({
  showFindReplace,
  showGoToDialog,
  showFontDialog,
  showOpenDialog,
  showSaveDialog,
  showShareDialog,
  showRawDialog,
  showShareManager,
  showSettings,
  showDownloadPrompt,
  showAbout,
  showAdminLoginDialog,
  downloadFilename,
  openFindReplace,
  closeFindReplace,
  openGoToDialog,
  closeGoToDialog,
  openFontDialog,
  closeFontDialog,
  openOpenDialog,
  closeOpenDialog,
  openSaveDialog,
  closeSaveDialog,
  openShareDialog,
  closeShareDialog,
  openRawDialog,
  closeRawDialog,
  openShareManager,
  closeShareManager,
  openSettings,
  closeSettings,
  openDownloadPrompt,
  closeDownloadPrompt,
  openAdminLoginDialog,
  closeAdminLoginDialog,
  openAbout: dialogs.openAbout,
  closeAbout: dialogs.closeAbout,
})

const {
  undo,
  redo,
  cut,
  copy,
  paste,
  deleteSelection,
  find,
  replace,
  goTo,
  goToConfirm,
  selectAll,
  insertDateTime,
  toggleAutoWrap,
  fontDialog,
  toggleMarkdown,
} = useEditorCommands(editorRef, dialogs)

const { handleKeydown } = useKeyboardShortcuts({
  newFile,
  openFile,
  saveFile,
  undo,
  redo,
  cut,
  copy,
  paste,
  selectAll,
  find,
  replace,
  goTo,
  insertDateTime,
  delete: deleteSelection,
})

function handleSetTheme(theme: string) {
  configStore.setTheme(theme)
}

function handleHeaderMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  const menuItem = target.closest('.menu-item')
  const menuOption = target.closest('.menu-option')
  const zoomControl = target.closest('.zoom-control')

  if (!menuItem && !menuOption && !zoomControl) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function handleFind(searchText: string, caseSensitive: boolean) {
  editorRef.value?.findText(searchText, caseSensitive)
}

function handleReplace(searchText: string, replaceWith: string, caseSensitive: boolean) {
  editorRef.value?.replaceText(searchText, replaceWith, caseSensitive)
}

function handleReplaceAll(searchText: string, replaceWith: string, caseSensitive: boolean) {
  editorRef.value?.replaceAllText(searchText, replaceWith, caseSensitive)
}

function handleDownload() {
  const filename = editorStore.currentFile.split('/').pop() || 'untitled.txt'
  openDownloadPrompt(filename)
}

function handleDownloadConfirm(filename: string) {
  const finalName = filename.trim() || 'untitled.txt'
  download(finalName)
  closeDownloadPrompt()
}

onMounted(async () => {
  await authStore.initAuth()
  await configStore.loadConfig()
  editorStore.setAutoWrap(configStore.autoWrap)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.title = windowTitle.value
})

watch(windowTitle, (newTitle) => {
  document.title = newTitle
})

watch(
  () => editorStore.content,
  () => {
    nextTick(() => triggerAutoSave())
  },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  cancelAutoSave()
})

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (editorStore.isModified) {
    event.preventDefault()
    event.returnValue = ''
  }
}
</script>

<template>
  <div class="app-container">
    <div v-if="isOpeningFile" class="global-loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <span>正在打开文件...</span>
      </div>
    </div>
    <header class="app-header" @mousedown="handleHeaderMouseDown">
      <MenuBar
        @new-file="newFile"
        @open-file="openFile"
        @import-local-file="importLocalFile"
        @save-file="saveFile"
        @save-as="saveAs"
        @download="handleDownload"
        @share-link="openShareDialog"
        @raw-link="openRawDialog"
        @manage-shares="openShareManager"
        @exit="exit"
        @undo="undo"
        @redo="redo"
        @cut="cut"
        @copy="copy"
        @paste="paste"
        @delete="deleteSelection"
        @find="find"
        @replace="replace"
        @go-to="goTo"
        @select-all="selectAll"
        @insert-date-time="insertDateTime"
        @toggle-auto-wrap="toggleAutoWrap"
        @font-dialog="fontDialog"
        @set-theme="handleSetTheme"
        @toggle-markdown="toggleMarkdown"
        @settings="openSettings"
        @about="showAbout = true"
      />
      <ZoomControl />
    </header>

    <EditorWrapper @drop-file="handleDropFile" ref="editorRef" />

    <StatusBar />

    <FindReplace
      :visible="showFindReplace"
      @close="closeFindReplace"
      @find="handleFind"
      @replace="handleReplace"
      @replace-all="handleReplaceAll"
    />

    <FontDialog :visible="showFontDialog" @close="closeFontDialog" />

    <FileDialog
      :visible="showOpenDialog"
      mode="open"
      @close="closeOpenDialog"
      @select="selectFile"
    />

    <FileDialog
      :visible="showSaveDialog"
      mode="save"
      @close="handleSaveDialogClose"
      @select="handleSaveAsSelect"
    />

    <ShareDialog
      :visible="showShareDialog"
      :filename="editorStore.currentFile"
      @close="closeShareDialog"
    />

    <RawDialog
      :visible="showRawDialog"
      :filename="editorStore.currentFile"
      @close="closeRawDialog"
    />

    <ShareManager :visible="showShareManager" @close="closeShareManager" />

    <SettingsDialog :visible="showSettings" @close="closeSettings" />

    <AboutDialog :visible="showAbout" @close="showAbout = false" />

    <PromptDialog
      :visible="showGoToDialog"
      title="跳转到行号"
      label="行号:"
      default-value="1"
      @confirm="goToConfirm"
      @cancel="closeGoToDialog"
    />

    <PromptDialog
      :visible="showDownloadPrompt"
      title="下载文件"
      label="文件名:"
      :default-value="downloadFilename"
      @confirm="handleDownloadConfirm"
      @cancel="closeDownloadPrompt"
    />

    <ToastNotification />

    <ConfirmDialog
      :visible="confirmStore.visible"
      :title="confirmStore.title"
      :message="confirmStore.message"
      :buttons="confirmStore.buttons"
      @confirm="confirmStore.onConfirm"
      @third="confirmStore.onThird"
      @cancel="confirmStore.onCancel"
    />

    <AdminBadge />

    <AdminLoginDialog
      :visible="showAdminLoginDialog"
      title="管理员认证"
      message="保存根目录文件需要管理员权限，请输入管理员密码。"
      :error="adminLoginError"
      @close="handleAdminLoginClose"
      @confirm="handleAdminLogin"
    />
  </div>
</template>

<style>
@import './styles/notepad.css';

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
</style>
