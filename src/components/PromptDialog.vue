<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
  title: string
  label?: string
  defaultValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  confirm: [value: string]
  cancel: []
}>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      inputValue.value = props.defaultValue || ''
      dialogDrag.resetOffset()
      nextTick(() => {
        inputRef.value?.focus()
        inputRef.value?.select()
      })
    }
  },
)

function handleConfirm() {
  emit('confirm', inputValue.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleConfirm()
  } else if (event.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('cancel')">
    <div
      ref="dialogRef"
      class="modal-dialog prompt-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>{{ title }}</span>
        <button class="close-btn" @click="emit('cancel')">×</button>
      </div>
      <div class="dialog-body">
        <label v-if="label">{{ label }}</label>
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          :placeholder="placeholder"
          @keydown="handleKeydown"
          class="input"
        />
      </div>
      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="handleConfirm">确定</button>
          <button @click="emit('cancel')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-body {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.dialog-body label {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.dialog-body input {
  flex: 1;
  padding: calc(10px * var(--scale)) var(--spacing-lg);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.dialog-body input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.dialog-footer button {
  min-width: calc(80px * var(--scale));
  padding: calc(8px * var(--scale)) calc(20px * var(--scale));
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.dialog-footer button:hover {
  background: var(--border-light);
}

.dialog-footer button.primary {
  background: var(--accent-primary);
  color: white;
}

.dialog-footer button.primary:hover {
  background: var(--accent-hover);
}
</style>
