import { ref, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useFilesStore } from '../stores/files'
import { useConfirmStore } from '../stores/confirm'
import { useToastStore } from '../stores/toast'
import { useConfigStore } from '../stores/config'
import { useAuthStore } from '../stores/auth'
import { isRootOperation } from '../../types/shared'
import jschardet from 'jschardet'

export type SaveResult = 'success' | 'cancelled' | 'error'

export function useFileOperations(
  dialogs: ReturnType<typeof import('./useAppDialogs').useAppDialogs>,
) {
  const editorStore = useEditorStore()
  const filesStore = useFilesStore()
  const confirmStore = useConfirmStore()
  const toastStore = useToastStore()
  const configStore = useConfigStore()
  const authStore = useAuthStore()
  const isOpeningFile = ref(false)
  let pendingSaveResolve: ((result: SaveResult) => void) | null = null
  let pendingSaveAction: (() => Promise<void>) | null = null
  const autoSaveTimer = { value: null as ReturnType<typeof setTimeout> | null }
  const AUTO_SAVE_DELAY = 3000

  async function confirmSaveIfModified(): Promise<boolean> {
    if (!editorStore.isModified) return true

    const result = await confirmStore.confirmThree(
      '当前文件已修改，是否保存？',
      '记事本',
      '保存',
      '不保存',
      '取消',
    )

    if (result === 'cancel') return false
    if (result === 'yes') {
      const saveStatus = await saveFile()
      return saveStatus === 'success'
    }
    return true
  }

  async function saveFile(silent: boolean = false): Promise<SaveResult> {
    if (!editorStore.currentFile || editorStore.isLocalFile) {
      return new Promise((resolve) => {
        pendingSaveResolve = resolve
        dialogs.openSaveDialog()
      })
    }

    if (isRootOperation(editorStore.currentFile)) {
      if (!authStore.isAdmin) {
        const hasAuth = await authStore.checkAdminAuth()
        if (!hasAuth) {
          if (silent) {
            return 'error'
          }
          return new Promise((resolve) => {
            pendingSaveResolve = resolve
            pendingSaveAction = async () => {
              const success = await filesStore.writeFile(
                editorStore.currentFile,
                editorStore.content,
              )
              if (success) {
                editorStore.isModified = false
                toastStore.success('保存成功')
                pendingSaveResolve?.('success')
              } else {
                toastStore.error('保存失败')
                pendingSaveResolve?.('error')
              }
              pendingSaveResolve = null
              pendingSaveAction = null
            }
            dialogs.openAdminLoginDialog()
          })
        }
      }
    }

    const success = await filesStore.writeFile(editorStore.currentFile, editorStore.content)
    if (success) {
      editorStore.isModified = false
      return 'success'
    } else {
      if (!silent) {
        toastStore.error('保存失败')
      }
      return 'error'
    }
  }

  async function handleAdminLoginSuccess() {
    if (pendingSaveAction) {
      await pendingSaveAction()
    }
  }

  function handleAdminLoginClose() {
    dialogs.closeAdminLoginDialog()
    if (pendingSaveResolve) {
      pendingSaveResolve('cancelled')
      pendingSaveResolve = null
    }
    pendingSaveAction = null
  }

  function triggerAutoSave(): void {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
      autoSaveTimer.value = null
    }

    if (!configStore.autoSave) return
    if (!editorStore.isModified) return
    if (!editorStore.currentFile) return
    if (editorStore.isLocalFile) return

    autoSaveTimer.value = setTimeout(async () => {
      if (editorStore.isModified && editorStore.currentFile && !editorStore.isLocalFile) {
        const result = await saveFile(true)
        if (result === 'success') {
          toastStore.success('已自动保存')
        }
      }
      autoSaveTimer.value = null
    }, AUTO_SAVE_DELAY)
  }

  function cancelAutoSave(): void {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }

  async function handleSaveAsSelect(path: string) {
    dialogs.closeSaveDialog()

    const success = await filesStore.writeFile(path, editorStore.content)
    if (success) {
      editorStore.setCurrentFile(path)
      editorStore.isModified = false
      pendingSaveResolve?.('success')
    } else {
      toastStore.error('保存失败')
      pendingSaveResolve?.('error')
    }
    pendingSaveResolve = null
  }

  async function exit(): Promise<void> {
    if (editorStore.isModified) {
      const filename = editorStore.currentFile || '无标题'
      const result = await confirmStore.confirmThree(
        `"${filename}" 已修改，是否保存更改？`,
        '记事本',
        '是',
        '否',
        '取消',
      )

      if (result === 'yes') {
        const saveResult = await saveFile()
        if (saveResult === 'success') {
          window.close()
        }
      } else if (result === 'no') {
        window.close()
      }
    } else {
      window.close()
    }
  }

  function handleSaveDialogClose() {
    dialogs.closeSaveDialog()
    if (pendingSaveResolve) {
      pendingSaveResolve('cancelled')
      pendingSaveResolve = null
    }
  }

  async function newFile(): Promise<void> {
    if (!(await confirmSaveIfModified())) return
    editorStore.newFile()
  }

  async function openFile(): Promise<void> {
    if (!(await confirmSaveIfModified())) return
    dialogs.openOpenDialog()
  }

  async function selectFile(path: string): Promise<void> {
    dialogs.closeOpenDialog()
    dialogs.closeSaveDialog()

    isOpeningFile.value = true
    try {
      const content = await filesStore.readFile(path)
      if (content !== null) {
        editorStore.setContent(content)
        editorStore.setCurrentFile(path)
      } else {
        toastStore.error('打开文件失败')
      }
    } catch {
      toastStore.error('打开文件失败')
    } finally {
      isOpeningFile.value = false
    }
  }

  function saveAs(): void {
    dialogs.openSaveDialog()
  }

  function download(filename?: string): void {
    const content = editorStore.content
    const baseName = editorStore.currentFile ? editorStore.currentFile.split('/').pop() : undefined
    const finalFilename = filename || baseName || 'untitled.txt'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function readLocalFile(file: File): Promise<{ content: string; encoding: string } | null> {
    try {
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)

      let encoding = configStore.defaultEncoding || 'gbk'
      let bomLength = 0

      if (
        uint8Array.length >= 3 &&
        uint8Array[0] === 0xef &&
        uint8Array[1] === 0xbb &&
        uint8Array[2] === 0xbf
      ) {
        encoding = 'utf-8'
        bomLength = 3
      } else if (uint8Array.length >= 2 && uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
        encoding = 'utf-16le'
        bomLength = 2
      } else if (uint8Array.length >= 2 && uint8Array[0] === 0xfe && uint8Array[1] === 0xff) {
        encoding = 'utf-16be'
        bomLength = 2
      } else if (
        uint8Array.length >= 4 &&
        uint8Array[0] === 0xff &&
        uint8Array[1] === 0xfe &&
        uint8Array[2] === 0x00 &&
        uint8Array[3] === 0x00
      ) {
        encoding = 'utf-32le'
        bomLength = 4
      } else if (
        uint8Array.length >= 4 &&
        uint8Array[0] === 0x00 &&
        uint8Array[1] === 0x00 &&
        uint8Array[2] === 0xfe &&
        uint8Array[3] === 0xff
      ) {
        encoding = 'utf-32be'
        bomLength = 4
      } else {
        try {
          const textDecoder = new TextDecoder('utf-8', { fatal: true })
          try {
            textDecoder.decode(uint8Array)
            encoding = 'utf-8'
          } catch {
            const detected = jschardet.detect(uint8Array)
            if (detected && detected.encoding) {
              let detectedEncoding = detected.encoding
              if (detectedEncoding === 'GB2312') {
                detectedEncoding = 'gbk'
              }
              if (detectedEncoding !== 'utf-8' && detected.confidence > 0.5) {
                encoding = detectedEncoding
              }
            }
          }
        } catch {
          console.warn('编码检测失败，使用默认编码')
        }
      }

      let content = ''
      const dataToDecode = bomLength > 0 ? uint8Array.slice(bomLength) : uint8Array
      try {
        const decoder = new TextDecoder(encoding)
        content = decoder.decode(dataToDecode)
      } catch (decodeError) {
        console.warn(`解码失败 (${encoding})，尝试使用 UTF-8`, decodeError)
        const fallbackDecoder = new TextDecoder('utf-8')
        content = fallbackDecoder.decode(dataToDecode)
        encoding = 'utf-8'
      }

      return { content, encoding }
    } catch (error) {
      console.error('读取文件失败:', error)
      toastStore.error('读取文件失败')
      return null
    }
  }

  async function importLocalFile(): Promise<void> {
    if (!(await confirmSaveIfModified())) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.json,.log,.csv,.xml,.html,.js,.ts,.css,.py,.go,.java,.cpp,.c'
    input.multiple = false
    input.style.display = 'none'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const result = await readLocalFile(file)
      if (result) {
        editorStore.setContent(result.content)
        editorStore.setLocalFile(file.name)
        toastStore.success(`已导入文件: ${file.name} (编码: ${result.encoding})`)
      }
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  async function handleDropFile(file: File): Promise<void> {
    if (!(await confirmSaveIfModified())) return

    const result = await readLocalFile(file)
    if (result) {
      editorStore.setContent(result.content)
      editorStore.setLocalFile(file.name)
      toastStore.success(`已拖放导入文件: ${file.name} (编码: ${result.encoding})`)
    }
  }

  onUnmounted(() => {
    cancelAutoSave()
    if (pendingSaveResolve) {
      pendingSaveResolve('cancelled')
      pendingSaveResolve = null
    }
  })

  return {
    isOpeningFile,
    confirmSaveIfModified,
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
    dialogs,
  }
}
