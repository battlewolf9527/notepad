import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MAX_HISTORY_SIZE = 50

export const useEditorStore = defineStore('editor', () => {
  const content = ref('')
  const currentFile = ref('')
  const isModified = ref(false)
  const isLocalFile = ref(false)
  const cursorLine = ref(1)
  const cursorColumn = ref(1)
  const isAutoWrap = ref(false)
  const isMarkdownPreview = ref(false)
  const fontSize = ref(14)
  const fontFamily = ref('Consolas, "Courier New", monospace')
  const targetLine = ref<number | null>(null)

  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  const fileSize = computed(() => {
    const bytes = new Blob([content.value]).size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  })

  const lineCount = computed(() => content.value.split('\n').length)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function saveToHistory(): void {
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(content.value)
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
  }

  function setContent(newContent: string): void {
    content.value = newContent
    isModified.value = false
    history.value = [newContent]
    historyIndex.value = 0
  }

  function updateContent(newContent: string): void {
    if (newContent !== content.value) {
      saveToHistory()
      content.value = newContent
      isModified.value = true
    }
  }

  function undo(): void {
    if (historyIndex.value > 0) {
      historyIndex.value--
      content.value = history.value[historyIndex.value] ?? ''
      isModified.value = content.value !== history.value[0]
    }
  }

  function redo(): void {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      content.value = history.value[historyIndex.value] ?? ''
      isModified.value = content.value !== history.value[0]
    }
  }

  function setCurrentFile(filename: string): void {
    currentFile.value = filename
    isModified.value = false
    isLocalFile.value = false
  }

  function setLocalFile(filename: string): void {
    currentFile.value = filename
    isModified.value = false
    isLocalFile.value = true
  }

  function setCursorPosition(line: number, column: number): void {
    cursorLine.value = line
    cursorColumn.value = column
  }

  function toggleAutoWrap(): void {
    isAutoWrap.value = !isAutoWrap.value
  }

  function setAutoWrap(value: boolean): void {
    isAutoWrap.value = value
  }

  function toggleMarkdownPreview(): void {
    isMarkdownPreview.value = !isMarkdownPreview.value
  }

  function setFontSize(size: number): void {
    fontSize.value = size
  }

  function setFontFamily(font: string): void {
    fontFamily.value = font
  }

  function newFile(): void {
    content.value = ''
    currentFile.value = ''
    isModified.value = false
    isLocalFile.value = false
    cursorLine.value = 1
    cursorColumn.value = 1
    history.value = ['']
    historyIndex.value = 0
  }

  function goToLine(line: number): void {
    const maxLine = lineCount.value
    const target = Math.max(1, Math.min(line, maxLine))
    targetLine.value = target
    cursorLine.value = target
    cursorColumn.value = 1
  }

  function clearTargetLine(): void {
    targetLine.value = null
  }

  return {
    content,
    currentFile,
    isModified,
    isLocalFile,
    cursorLine,
    cursorColumn,
    isAutoWrap,
    isMarkdownPreview,
    fontSize,
    fontFamily,
    targetLine,
    fileSize,
    lineCount,
    canUndo,
    canRedo,
    setContent,
    updateContent,
    setCurrentFile,
    setLocalFile,
    setCursorPosition,
    toggleAutoWrap,
    setAutoWrap,
    toggleMarkdownPreview,
    setFontSize,
    setFontFamily,
    newFile,
    goToLine,
    clearTargetLine,
    undo,
    redo,
  }
})
