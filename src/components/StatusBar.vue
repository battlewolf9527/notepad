<script setup lang="ts">
import { useEditorStore } from '../stores/editor'

const editorStore = useEditorStore()
</script>

<template>
  <div class="status-bar">
    <div class="status-left">
      <span>Ln {{ editorStore.cursorLine }}, Col {{ editorStore.cursorColumn }}</span>
    </div>
    <div class="status-right">
      <span>{{ editorStore.fileSize }}</span>
      <span class="status-separator">|</span>
      <span>UTF-8</span>
      <span class="status-separator">|</span>
      <span>{{ editorStore.lineCount }} 行</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  font-size: var(--font-size-xs);
}

.status-separator {
  color: var(--border-medium);
}
</style>
