<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useToastStore } from '../stores/toast'
import TextEditor from './TextEditor.vue'
import MarkdownPreview from './MarkdownPreview.vue'

const emit = defineEmits<{
  (e: 'drop-file', file: File): void
}>()

const editorStore = useEditorStore()
const toastStore = useToastStore()

const editorRef = ref<InstanceType<typeof TextEditor> | null>(null)
const isDragOver = ref(false)

function handleDragOver() {
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file) return

  if (
    !file.type.startsWith('text/') &&
    !file.name.match(
      /\.(txt|md|json|log|csv|xml|html|js|ts|css|py|go|java|cpp|c|h|sh|bat|ps1|yaml|yml|ini|conf|cfg|properties)$/i,
    )
  ) {
    toastStore.error('不支持的文件类型')
    return
  }

  emit('drop-file', file)
}

function findText(searchText: string, caseSensitive: boolean) {
  const found = editorRef.value?.findText(searchText, caseSensitive)
  if (!found) {
    toastStore.error('未找到匹配的文本')
  }
}

function replaceText(searchText: string, replaceWith: string, caseSensitive: boolean) {
  const replaced = editorRef.value?.replaceText(searchText, replaceWith, caseSensitive)
  if (!replaced) {
    toastStore.error('未找到匹配的文本或当前选中文本不匹配')
  }
}

function replaceAllText(searchText: string, replaceWith: string, caseSensitive: boolean) {
  const count = editorRef.value?.replaceAllText(searchText, replaceWith, caseSensitive) || 0
  if (count > 0) {
    toastStore.success(`已替换 ${count} 处`)
  } else {
    toastStore.error('未找到匹配的文本')
  }
}

function goToLine(line: number) {
  editorRef.value?.goToLine(line)
}

function selectAll() {
  editorRef.value?.selectAll()
}

function cut() {
  editorRef.value?.cut()
}

function copy() {
  editorRef.value?.copy()
}

function paste() {
  editorRef.value?.paste()
}

function deleteSelection() {
  editorRef.value?.deleteSelection()
}

function insertText(text: string) {
  editorRef.value?.insertText(text)
}

function focus() {
  editorRef.value?.focus()
}

defineExpose({
  findText,
  replaceText,
  replaceAllText,
  goToLine,
  selectAll,
  cut,
  copy,
  paste,
  deleteSelection,
  insertText,
  focus,
})
</script>

<template>
  <div
    class="editor-wrapper"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    :class="{ 'drag-over': isDragOver }"
  >
    <MarkdownPreview
      v-if="editorStore.isMarkdownPreview"
      @close="editorStore.toggleMarkdownPreview()"
    />
    <TextEditor v-else ref="editorRef" />
  </div>
</template>

<style scoped>
.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

.editor-wrapper.drag-over {
  outline: 3px dashed var(--accent-color);
  outline-offset: -4px;
  background: rgba(74, 144, 217, 0.05);
}
</style>
