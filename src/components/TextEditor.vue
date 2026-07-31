<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useConfigStore } from '../stores/config'
import { useToastStore } from '../stores/toast'
import {
  getTextFromContentEditable,
  setTextToContentEditable,
  getTextOffsetFromDOM,
  getDOMPositionFromTextOffset,
} from '../utils/editor-content'

const editorStore = useEditorStore()
const configStore = useConfigStore()
const toastStore = useToastStore()
const editorRef = ref<HTMLDivElement | null>(null)

let savedSelectionStart = 0
let savedSelectionEnd = 0
let hasSelection = false
let isInternalUpdate = false
let lastFindText = ''
let lastFindEndPos = 0

const scaledFontSize = computed(() => {
  return (editorStore.fontSize * configStore.scale) / 100
})

function updateCursorPosition() {
  const editor = editorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const offset = getTextOffsetFromDOM(editor, range.startContainer, range.startOffset)
  const text = getTextFromContentEditable(editor).substring(0, offset)
  const lines = text.split('\n')
  const line = lines.length
  const lastLine = lines[lines.length - 1] || ''
  const column = lastLine.length + 1

  editorStore.setCursorPosition(line, column)
}

function handleKeydown(event: KeyboardEvent) {
  const editor = editorRef.value
  if (!editor) return

  if (event.key === 'Tab') {
    event.preventDefault()
    insertText('  ')
  }
}

function focus() {
  nextTick(() => {
    editorRef.value?.focus()
  })
}

function selectAll() {
  const editor = editorRef.value
  if (!editor) return
  editor.focus()
  document.execCommand('selectAll', false)
}

function insertText(text: string) {
  const editor = editorRef.value
  if (!editor) return

  editor.focus()
  document.execCommand('insertText', false, text)
  updateCursorPosition()
  editorStore.updateContent(getTextFromContentEditable(editor))
}

function findText(searchText: string, caseSensitive: boolean = false): boolean {
  const editor = editorRef.value
  if (!editor || !searchText) return false

  const content = getTextFromContentEditable(editor)
  const flags = caseSensitive ? 'g' : 'gi'
  const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const searchKey = caseSensitive ? searchText : searchText.toLowerCase()

  let startIndex = 0

  if (searchKey === lastFindText && lastFindEndPos > 0 && lastFindEndPos < content.length) {
    startIndex = lastFindEndPos
  } else {
    editor.focus()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        startIndex = getTextOffsetFromDOM(editor, range.startContainer, range.startOffset)
      }
    }
    lastFindText = searchKey
  }

  const regex = new RegExp(escapedText, flags)
  regex.lastIndex = startIndex
  let match = regex.exec(content)

  let wrapped = false
  if (!match) {
    regex.lastIndex = 0
    match = regex.exec(content)
    wrapped = true
    if (match && match.index >= startIndex) {
      lastFindEndPos = 0
      return false
    }
  }

  if (match) {
    editor.focus()
    const range = document.createRange()
    const selection = window.getSelection()

    const startPos = getDOMPositionFromTextOffset(editor, match.index)
    const endPos = getDOMPositionFromTextOffset(editor, match.index + match[0].length)

    if (startPos && endPos) {
      range.setStart(startPos.node, startPos.offset)
      range.setEnd(endPos.node, endPos.offset)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }

    lastFindEndPos = match.index + match[0].length
    return true
  }

  lastFindEndPos = 0
  return false
}

function replaceText(
  searchText: string,
  replaceWith: string,
  caseSensitive: boolean = false,
): boolean {
  const editor = editorRef.value
  if (!editor || !searchText) return false

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()

  const flags = caseSensitive ? '' : 'i'
  const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)

  if (regex.test(selectedText)) {
    editor.focus()
    document.execCommand('insertText', false, replaceWith)
    updateCursorPosition()
    editorStore.updateContent(getTextFromContentEditable(editor))
    return true
  }

  return false
}

function replaceAllText(
  searchText: string,
  replaceWith: string,
  caseSensitive: boolean = false,
): number {
  const editor = editorRef.value
  if (!editor || !searchText) return 0

  const content = getTextFromContentEditable(editor)
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)

  const matches = content.match(regex)
  if (!matches) return 0

  const newValue = content.replace(regex, replaceWith)
  setTextToContentEditable(editor, newValue)
  editorStore.updateContent(newValue)
  return matches.length
}

function saveCursorPosition(): number {
  const editor = editorRef.value
  if (!editor) return 0

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0

  const range = selection.getRangeAt(0)
  return getTextOffsetFromDOM(editor, range.startContainer, range.startOffset)
}

function restoreCursorPosition(position: number) {
  const editor = editorRef.value
  if (!editor) return

  const contentLength = getTextFromContentEditable(editor).length
  const targetPosition = Math.min(position, contentLength)

  const domPos = getDOMPositionFromTextOffset(editor, targetPosition)
  if (!domPos) return

  editor.focus()
  const range = document.createRange()
  const selection = window.getSelection()

  range.setStart(domPos.node, domPos.offset)
  range.setEnd(domPos.node, domPos.offset)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function handleInput() {
  const editor = editorRef.value
  if (!editor) return

  const cleanText = getTextFromContentEditable(editor)
  updateCursorPosition()

  isInternalUpdate = true
  editorStore.updateContent(cleanText)
  nextTick(() => {
    isInternalUpdate = false
  })
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  updateCursorPosition()
  const editor = editorRef.value
  if (!editor) return
  editorStore.updateContent(getTextFromContentEditable(editor))
}

function saveSelection() {
  const editor = editorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    hasSelection = false
    return
  }

  const range = selection.getRangeAt(0)
  if (range.startOffset === range.endOffset && range.startContainer === range.endContainer) {
    hasSelection = false
    return
  }

  savedSelectionStart = getTextOffsetFromDOM(editor, range.startContainer, range.startOffset)
  savedSelectionEnd = getTextOffsetFromDOM(editor, range.endContainer, range.endOffset)
  hasSelection = true
}

function restoreSelection() {
  if (!hasSelection) return

  const editor = editorRef.value
  if (!editor) return

  const contentLength = getTextFromContentEditable(editor).length
  if (savedSelectionStart > contentLength || savedSelectionEnd > contentLength) {
    hasSelection = false
    return
  }

  const startDomPos = getDOMPositionFromTextOffset(editor, savedSelectionStart)
  const endDomPos = getDOMPositionFromTextOffset(editor, savedSelectionEnd)

  if (!startDomPos || !endDomPos) {
    hasSelection = false
    return
  }

  editor.focus()
  const range = document.createRange()
  const selection = window.getSelection()

  range.setStart(startDomPos.node, startDomPos.offset)
  range.setEnd(endDomPos.node, endDomPos.offset)
  selection?.removeAllRanges()
  selection?.addRange(range)

  hasSelection = false
}

function handleFocus() {
  restoreSelection()
}

function handleBlur() {
  saveSelection()
}

onMounted(() => {
  const editor = editorRef.value
  if (!editor) return
  const content = editorStore.content
  if (getTextFromContentEditable(editor) !== content) {
    setTextToContentEditable(editor, content)
  }
})

function goToLine(line: number) {
  const editor = editorRef.value
  if (!editor) return

  const text = getTextFromContentEditable(editor)
  const lines = text.split('\n')
  const maxLine = lines.length

  if (line < 1 || line > maxLine) {
    toastStore.error(`行号必须在 1 到 ${maxLine} 之间`)
    return
  }

  let position = 0
  for (let i = 0; i < line - 1; i++) {
    const lineContent = lines[i] ?? ''
    position += lineContent.length + 1
  }

  const domPos = getDOMPositionFromTextOffset(editor, position)
  if (!domPos) return

  editor.focus()
  const range = document.createRange()
  const selection = window.getSelection()

  range.setStart(domPos.node, domPos.offset)
  range.setEnd(domPos.node, domPos.offset)
  selection?.removeAllRanges()
  selection?.addRange(range)
  editorStore.setCursorPosition(line, 1)
  editorStore.clearTargetLine()
}

watch(
  () => editorStore.content,
  (newContent) => {
    if (isInternalUpdate) return

    nextTick(() => {
      const editor = editorRef.value
      if (!editor) return
      if (getTextFromContentEditable(editor) !== newContent) {
        setTextToContentEditable(editor, newContent)
      }
      updateCursorPosition()
    })
  },
  { immediate: true },
)

watch(
  () => editorStore.targetLine,
  (line) => {
    if (line !== null) {
      nextTick(() => goToLine(line))
    }
  },
)

async function cut() {
  const editor = editorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  if (!selectedText) return

  try {
    await navigator.clipboard.writeText(selectedText)
    editor.focus()
    document.execCommand('delete', false)
    updateCursorPosition()
    editorStore.updateContent(getTextFromContentEditable(editor))
  } catch {
    toastStore.error('剪切失败')
  }
}

async function copy() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  if (!selectedText) return

  try {
    await navigator.clipboard.writeText(selectedText)
  } catch {
    toastStore.error('复制失败')
  }
}

async function paste() {
  const editor = editorRef.value
  if (!editor) return

  try {
    const text = await navigator.clipboard.readText()
    editor.focus()
    document.execCommand('insertText', false, text)
    updateCursorPosition()
    editorStore.updateContent(getTextFromContentEditable(editor))
  } catch {
    toastStore.error('粘贴失败')
  }
}

function deleteSelection() {
  const editor = editorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  if (range.startOffset === range.endOffset && range.startContainer === range.endContainer) {
    return
  }

  editor.focus()
  document.execCommand('delete', false)
  updateCursorPosition()
  editorStore.updateContent(getTextFromContentEditable(editor))
}

defineExpose({
  focus,
  selectAll,
  insertText,
  findText,
  replaceText,
  replaceAllText,
  goToLine,
  cut,
  copy,
  paste,
  deleteSelection,
})
</script>

<template>
  <div
    ref="editorRef"
    class="editor-content"
    :class="{ 'auto-wrap': editorStore.isAutoWrap }"
    :style="{
      fontFamily: editorStore.fontFamily,
      fontSize: scaledFontSize + 'px',
      lineHeight: scaledFontSize * 1.4 + 'px',
      tabSize: Math.max(2, Math.round(scaledFontSize / 7)),
    }"
    contenteditable="true"
    @click="updateCursorPosition"
    @keyup="updateCursorPosition"
    @keydown="handleKeydown"
    @input="handleInput"
    @paste.prevent="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    spellcheck="false"
  ></div>
</template>

<style scoped>
.editor-content {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 8px;
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  white-space: pre;
  overflow: auto;
  cursor: text;
  user-select: text;
}

.editor-content:focus {
  outline: none;
}

.editor-content::selection {
  background-color: #4a90d9 !important;
  color: #ffffff !important;
}

.editor-content::-moz-selection {
  background-color: #4a90d9 !important;
  color: #ffffff !important;
}

.editor-content:empty:before {
  content: '\200B';
}

.editor-content.auto-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: hidden;
}

.editor-content br {
  display: block;
  content: '';
}
</style>