<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useConfigStore } from '../stores/config'
import { useToastStore } from '../stores/toast'

const editorStore = useEditorStore()
const configStore = useConfigStore()
const toastStore = useToastStore()
const editorRef = ref<HTMLDivElement | null>(null)

let savedSelectionStart = 0
let savedSelectionEnd = 0
let hasSelection = false

const content = computed({
  get: () => editorStore.content,
  set: (val) => editorStore.updateContent(val),
})

const scaledFontSize = computed(() => {
  return (editorStore.fontSize * configStore.scale) / 100
})

function updateCursorPosition() {
  const editor = editorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const text = editor.innerText.substring(
    0,
    getTextPosition(editor, range.startContainer, range.startOffset),
  )
  const lines = text.split('\n')
  const line = lines.length
  const lastLine = lines[lines.length - 1] || ''
  const column = lastLine.length + 1

  editorStore.setCursorPosition(line, column)
}

function getTextPosition(editor: HTMLDivElement, node: Node, offset: number): number {
  let position = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const currentNode = walker.currentNode
    if (currentNode === node) {
      return position + offset
    }
    position += currentNode.textContent?.length || 0
  }
  return position
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
  editorStore.updateContent(editor.innerText)
}

function findText(searchText: string, caseSensitive: boolean = false): boolean {
  const editor = editorRef.value
  if (!editor || !searchText) return false

  const content = editor.innerText
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
  const match = regex.exec(content)

  if (match) {
    editor.focus()
    const range = document.createRange()
    const selection = window.getSelection()

    let currentPos = 0
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const nodeLen = node.textContent?.length || 0

      if (currentPos + nodeLen > match.index) {
        range.setStart(node, match.index - currentPos)
        range.setEnd(node, match.index - currentPos + match[0].length)
        break
      }
      currentPos += nodeLen
    }

    selection?.removeAllRanges()
    selection?.addRange(range)
    return true
  }

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
    editorStore.updateContent(editor.innerText)
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

  const content = editor.innerText
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)

  const matches = content.match(regex)
  if (!matches) return 0

  const newValue = content.replace(regex, replaceWith)
  editor.innerHTML = newValue.replace(/\n/g, '<br>')
  editorStore.updateContent(newValue)
  return matches.length
}

function handleInput() {
  const editor = editorRef.value
  if (!editor) return

  const cleanText = editor.innerText
  if (editor.innerHTML !== cleanText.replace(/\n/g, '<br>')) {
    editor.innerHTML = cleanText.replace(/\n/g, '<br>')
  }

  updateCursorPosition()
  editorStore.updateContent(cleanText)
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  updateCursorPosition()
  editorStore.updateContent(editorRef.value?.innerText || '')
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

  savedSelectionStart = getTextPosition(editor, range.startContainer, range.startOffset)
  savedSelectionEnd = getTextPosition(editor, range.endContainer, range.endOffset)
  hasSelection = true
}

function restoreSelection() {
  if (!hasSelection) return

  const editor = editorRef.value
  if (!editor) return

  const contentLength = editor.innerText.length
  if (savedSelectionStart > contentLength || savedSelectionEnd > contentLength) {
    hasSelection = false
    return
  }

  editor.focus()
  const range = document.createRange()
  const selection = window.getSelection()

  let currentPos = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const nodeLen = node.textContent?.length || 0

    if (!startNode && currentPos + nodeLen > savedSelectionStart) {
      startNode = node
      startOffset = savedSelectionStart - currentPos
    }

    if (!endNode && currentPos + nodeLen > savedSelectionEnd) {
      endNode = node
      endOffset = savedSelectionEnd - currentPos
    }

    if (startNode && endNode) {
      break
    }

    currentPos += nodeLen
  }

  if (startNode && endNode) {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

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
  if (editor.innerText !== content) {
    editor.innerHTML = content.replace(/\n/g, '<br>')
  }
})

function goToLine(line: number) {
  const editor = editorRef.value
  if (!editor) return

  const text = editor.innerText
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

  editor.focus()
  const range = document.createRange()
  const selection = window.getSelection()

  let currentPos = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const nodeLen = node.textContent?.length || 0

    if (currentPos + nodeLen > position) {
      range.setStart(node, position - currentPos)
      range.setEnd(node, position - currentPos)
      break
    }
    currentPos += nodeLen
  }

  selection?.removeAllRanges()
  selection?.addRange(range)
  editorStore.setCursorPosition(line, 1)
  editorStore.clearTargetLine()
}

watch(
  () => editorStore.content,
  (newContent) => {
    nextTick(() => {
      const editor = editorRef.value
      if (!editor) return
      if (editor.innerText !== newContent) {
        editor.innerHTML = newContent.replace(/\n/g, '<br>')
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
    editorStore.updateContent(editor.innerText)
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
    editorStore.updateContent(editor.innerText)
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
  editorStore.updateContent(editor.innerText)
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
