<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { renderMarkdown, renderMermaidContainers } from '../utils/markdown-renderer'
import 'katex/dist/katex.min.css'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const editorStore = useEditorStore()

const renderedContent = ref('')
let renderCounter = 0
let isUnmounted = false

async function doRender(content: string) {
  const counter = ++renderCounter
  const { html, mermaidContainers } = await renderMarkdown(content)

  if (isUnmounted) return

  if (counter === renderCounter) {
    renderedContent.value = html

    await nextTick()
    if (isUnmounted) return
    await renderMermaidContainers(mermaidContainers)
  }
}

watch(
  () => editorStore.content,
  (content) => {
    doRender(content)
  },
  { immediate: true },
)

onUnmounted(() => {
  isUnmounted = true
})
</script>

<template>
  <div class="markdown-preview">
    <div class="preview-header">
      <span>Markdown 预览</span>
      <button @click="emit('close')">关闭</button>
    </div>
    <div class="preview-content" v-html="renderedContent"></div>
  </div>
</template>

<style scoped>
.markdown-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-medium);
  font-weight: bold;
  color: var(--text-primary);
}

.preview-header button {
  padding: 4px 12px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
}

.preview-header button:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.preview-content h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 0.3em;
}

.preview-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 0.3em;
}

.preview-content h3 {
  font-size: 1.25em;
}

.preview-content pre {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  border: 1px solid var(--border-light);
}

.preview-content code {
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  font-family: Consolas, 'Courier New', monospace;
}

.preview-content pre code {
  background: none;
  padding: 0;
}

.preview-content blockquote {
  border-left: 4px solid var(--border-medium);
  margin: 0;
  padding-left: 16px;
  color: var(--text-muted);
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
}

.preview-content th,
.preview-content td {
  border: 1px solid var(--border-light);
  padding: 8px;
  text-align: left;
}

.preview-content th {
  background: var(--bg-secondary);
}

.preview-content ul,
.preview-content ol {
  padding-left: 24px;
}

.preview-content a {
  color: var(--accent-primary);
  text-decoration: none;
}

.preview-content a:hover {
  text-decoration: underline;
}

:deep(.mermaid-container) {
  margin: 16px 0;
}

:deep(.mermaid-container svg) {
  max-width: 100%;
  height: auto;
  color: inherit;
}

:deep(.mermaid-container svg text) {
  fill: currentColor !important;
}

.preview-content input[type='checkbox'] {
  margin-right: 8px;
  cursor: default;
}

.preview-content li.task-list-item {
  list-style: none;
}

.preview-content li.task-list-item label {
  display: flex;
  align-items: center;
  cursor: default;
}

.preview-content li.task-list-item.task-list-item-done label {
  text-decoration: line-through;
  color: var(--text-muted);
}
</style>
