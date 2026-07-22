<script setup lang="ts">
import { ref, watch } from 'vue'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  error?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', password: string): void
}>()

const _dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()
const password = ref('')
const localError = ref('')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      password.value = ''
      localError.value = ''
      dialogDrag.resetOffset()
    }
  },
)

function close() {
  password.value = ''
  localError.value = ''
  emit('close')
}

function confirm() {
  if (!password.value.trim()) {
    localError.value = '请输入管理员密码'
    return
  }
  localError.value = ''
  emit('confirm', password.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    confirm()
  } else if (e.key === 'Escape') {
    close()
  }
}

useModalClose(() => close())
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div
      ref="_dialogRef"
      class="modal-dialog admin-login-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>{{ title || '管理员认证' }}</span>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body">
        <div class="warning-icon">🔒</div>
        <p class="dialog-message">{{ message || '此操作需要管理员权限，请输入管理员密码。' }}</p>
        <div class="form-group">
          <label for="admin-password">管理员密码:</label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            class="input"
            placeholder="请输入管理员密码"
            @keydown="handleKeydown"
            autofocus
          />
          <p v-if="$props.error || localError" class="error-message">
            {{ $props.error || localError }}
          </p>
        </div>
      </div>

      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="confirm">确定</button>
          <button @click="close">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login-dialog {
  width: calc(380px * var(--scale));
  max-width: 90vw;
}

.dialog-body {
  padding: calc(24px * var(--scale));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.warning-icon {
  font-size: calc(48px * var(--scale));
  margin-bottom: calc(16px * var(--scale));
}

.dialog-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 calc(20px * var(--scale)) 0;
  line-height: 1.5;
}

.form-group {
  width: 100%;
  text-align: left;
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin-bottom: calc(8px * var(--scale));
}

.form-group .input {
  width: 100%;
  padding: calc(10px * var(--scale)) calc(12px * var(--scale));
  font-size: var(--font-size-md);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
  transition: all var(--transition-fast);
}

.form-group .input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.form-group .input::placeholder {
  color: var(--text-muted);
}

.error-message {
  margin: calc(8px * var(--scale)) 0 0 0;
  font-size: var(--font-size-xs);
  color: var(--error-color);
}
</style>
