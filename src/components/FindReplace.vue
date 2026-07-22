<script setup lang="ts">
import { ref, watch } from 'vue'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'find', searchText: string, caseSensitive: boolean): void
  (e: 'replace', searchText: string, replaceText: string, caseSensitive: boolean): void
  (e: 'replaceAll', searchText: string, replaceText: string, caseSensitive: boolean): void
}>()

const searchText = ref('')
const replaceText = ref('')
const caseSensitive = ref(false)
const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

watch(
  () => props.visible,
  (val) => {
    if (val) {
      searchText.value = ''
      replaceText.value = ''
      dialogDrag.resetOffset()
    }
  },
)

function handleFind() {
  emit('find', searchText.value, caseSensitive.value)
}

function handleReplace() {
  emit('replace', searchText.value, replaceText.value, caseSensitive.value)
}

function handleReplaceAll() {
  emit('replaceAll', searchText.value, replaceText.value, caseSensitive.value)
}

useModalClose(() => emit('close'))
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog find-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>查找和替换</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-row">
          <label>查找内容:</label>
          <input v-model="searchText" type="text" @keydown.enter="handleFind" />
        </div>

        <div class="form-row">
          <label>替换为:</label>
          <input v-model="replaceText" type="text" />
        </div>

        <div class="form-row checkbox-row">
          <label>
            <input v-model="caseSensitive" type="checkbox" />
            区分大小写
          </label>
        </div>
      </div>

      <div class="dialog-footer">
        <div>
          <button class="primary" @click="handleFind">查找下一个</button>
          <button @click="handleReplace">替换</button>
          <button @click="handleReplaceAll">全部替换</button>
        </div>
        <div class="dialog-actions">
          <button @click="emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.find-dialog {
  width: calc(500px * var(--scale));
  max-width: 90vw;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row label {
  width: calc(100px * var(--scale));
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.form-row input[type='text'] {
  flex: 1;
  padding: calc(10px * var(--scale)) var(--spacing-lg);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.form-row input[type='text']:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
  outline: none;
}

.form-row.checkbox-row {
  margin-top: var(--spacing-md);
}

.form-row.checkbox-row label {
  width: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  color: var(--text-primary);
}

.form-row.checkbox-row input[type='checkbox'] {
  cursor: pointer;
  transform: scale(var(--scale));
}
</style>
