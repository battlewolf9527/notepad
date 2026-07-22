<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import ErrorRetry from './ErrorRetry.vue'
import { useDraggable } from '../composables/useDraggable'

type PasswordDialogType = 'verify' | 'set' | 'remove' | 'change' | 'root' | 'forgot'

interface PasswordDialogProps {
  visible: boolean
  type: PasswordDialogType
  path?: string | null
  rootAction?: 'set' | 'remove' | 'change'
}

const props = withDefaults(defineProps<PasswordDialogProps>(), {
  path: null,
  rootAction: 'set',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
  (e: 'forgot'): void
}>()

const authStore = useAuthStore()
const toastStore = useToastStore()

const passwordToVerify = ref('')
const passwordError = ref('')
const removePasswordError = ref('')
const changePasswordError = ref('')
const rootPasswordError = ref('')
const forgotPasswordError = ref('')
const passwordToSet = ref('')
const passwordToConfirm = ref('')
const passwordOld = ref('')
const isProcessing = ref(false)
const processingMessage = ref('')

const dialogRef = ref<HTMLElement | null>(null)
const passwordOldInputRef = ref<HTMLInputElement | null>(null)
const passwordToSetInputRef = ref<HTMLInputElement | null>(null)
const draggable = useDraggable()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      draggable.resetOffset()
      passwordToVerify.value = ''
      passwordError.value = ''
      removePasswordError.value = ''
      changePasswordError.value = ''
      rootPasswordError.value = ''
      forgotPasswordError.value = ''
      passwordToSet.value = ''
      passwordToConfirm.value = ''
      passwordOld.value = ''
    }
  },
)

function getDialogTitle() {
  switch (props.type) {
    case 'verify':
      return '文件夹加密'
    case 'set':
      return '设置文件夹密码'
    case 'remove':
      return '移除文件夹密码'
    case 'change':
      return '修改文件夹密码'
    case 'root':
      if (props.rootAction === 'set') return '设置根目录密码'
      if (props.rootAction === 'change') return '修改根目录密码'
      return '移除根目录密码'
    case 'forgot':
      return '忘记密码'
  }
}

function getDialogMessage() {
  switch (props.type) {
    case 'verify':
      return '此文件夹已加密，请输入密码:'
    case 'set':
      return '为文件夹设置密码保护:'
    case 'remove':
      return '请输入当前密码以移除保护:'
    case 'change':
      return '请输入旧密码和新密码:'
    case 'root':
      if (props.rootAction === 'set') return '为根目录设置密码保护，所有文件和子文件夹都将受保护:'
      if (props.rootAction === 'change') return '请输入旧密码和新密码:'
      return '请输入当前密码以移除根目录保护:'
    case 'forgot':
      return '请输入系统管理员密码以清除文件夹加密信息:'
  }
}

async function handleVerifyPassword() {
  if (!passwordToVerify.value.trim()) {
    toastStore.error('请输入密码')
    return
  }
  if (props.path === null || props.path === undefined) return

  isProcessing.value = true
  processingMessage.value = '正在验证密码...'
  const result = await authStore.verifyFolderPassword(props.path, passwordToVerify.value)
  isProcessing.value = false

  if (result.success) {
    emit('success')
    emit('close')
    toastStore.success('验证成功')
  } else {
    passwordError.value = result.error || '密码错误'
    passwordToVerify.value = ''
  }
}

function retryPasswordVerify() {
  passwordError.value = ''
  passwordToVerify.value = ''
}

async function handleSetPassword() {
  if (props.path === null || props.path === undefined || !passwordToSet.value.trim()) {
    toastStore.error('请输入密码')
    return
  }
  if (passwordToSet.value !== passwordToConfirm.value) {
    toastStore.error('两次输入的密码不一致')
    return
  }

  isProcessing.value = true
  processingMessage.value = '正在设置密码...'
  const success = await authStore.setFolderPassword(props.path, passwordToSet.value)
  isProcessing.value = false

  if (success) {
    await authStore.verifyFolderPassword(props.path, passwordToSet.value)
    emit('success')
    emit('close')
    toastStore.success('密码设置成功')
  } else {
    toastStore.error(authStore.error || '设置失败')
  }
}

async function handleRemovePassword() {
  if (!passwordToVerify.value.trim()) {
    toastStore.error('请输入密码')
    return
  }
  if (props.path === null || props.path === undefined) return

  isProcessing.value = true
  processingMessage.value = '正在验证密码...'
  const result = await authStore.removeFolderPassword(props.path, passwordToVerify.value)
  isProcessing.value = false

  if (result.success) {
    emit('success')
    emit('close')
    toastStore.success('密码已移除')
  } else {
    removePasswordError.value = result.error || '密码错误'
    passwordToVerify.value = ''
  }
}

function retryRemovePassword() {
  removePasswordError.value = ''
  passwordToVerify.value = ''
}

async function handleChangePassword() {
  if (props.path === null || props.path === undefined || !passwordOld.value.trim()) {
    toastStore.error('请输入旧密码')
    return
  }
  if (!passwordToSet.value.trim()) {
    toastStore.error('请输入新密码')
    return
  }
  if (passwordToSet.value !== passwordToConfirm.value) {
    toastStore.error('两次输入的新密码不一致')
    return
  }

  isProcessing.value = true
  processingMessage.value = '正在验证旧密码...'
  const verifyResult = await authStore.verifyFolderPassword(props.path, passwordOld.value)
  isProcessing.value = false

  if (!verifyResult.success) {
    changePasswordError.value = verifyResult.error || '旧密码错误'
    passwordOld.value = ''
    passwordToSet.value = ''
    passwordToConfirm.value = ''
    return
  }

  isProcessing.value = true
  processingMessage.value = '正在修改密码...'
  const success = await authStore.setFolderPassword(props.path, passwordToSet.value)
  isProcessing.value = false

  if (success) {
    emit('success')
    emit('close')
    toastStore.success('密码修改成功')
  } else {
    toastStore.error('密码修改失败')
  }
}

function retryChangePassword() {
  changePasswordError.value = ''
  passwordOld.value = ''
  passwordToSet.value = ''
  passwordToConfirm.value = ''
}

async function handleRootPassword() {
  if (!passwordToSet.value.trim()) {
    toastStore.error('请输入密码')
    return
  }

  if (props.rootAction === 'set') {
    if (passwordToSet.value !== passwordToConfirm.value) {
      toastStore.error('两次输入的密码不一致')
      return
    }

    isProcessing.value = true
    processingMessage.value = '正在设置密码...'
    const success = await authStore.setFolderPassword('', passwordToSet.value)
    isProcessing.value = false

    if (success) {
      await authStore.verifyFolderPassword('', passwordToSet.value)
      emit('success')
      emit('close')
      toastStore.success('根目录密码设置成功')
    } else {
      toastStore.error(authStore.error || '设置失败')
    }
  } else if (props.rootAction === 'change') {
    if (!passwordOld.value.trim()) {
      toastStore.error('请输入旧密码')
      return
    }
    if (passwordToSet.value !== passwordToConfirm.value) {
      toastStore.error('两次输入的新密码不一致')
      return
    }

    isProcessing.value = true
    processingMessage.value = '正在验证旧密码...'
    const verifyResult = await authStore.verifyFolderPassword('', passwordOld.value)
    isProcessing.value = false

    if (!verifyResult.success) {
      rootPasswordError.value = verifyResult.error || '旧密码错误'
      passwordOld.value = ''
      passwordToSet.value = ''
      passwordToConfirm.value = ''
      return
    }

    isProcessing.value = true
    processingMessage.value = '正在修改密码...'
    const success = await authStore.setFolderPassword('', passwordToSet.value)
    isProcessing.value = false

    if (success) {
      await authStore.verifyFolderPassword('', passwordToSet.value)
      emit('success')
      emit('close')
      toastStore.success('根目录密码修改成功')
    } else {
      toastStore.error(authStore.error || '修改失败')
    }
  } else {
    isProcessing.value = true
    processingMessage.value = '正在验证密码...'
    const success = await authStore.removeFolderPassword('', passwordToSet.value)
    isProcessing.value = false

    if (success) {
      emit('success')
      emit('close')
      toastStore.success('根目录密码已移除')
    } else {
      rootPasswordError.value = '密码错误'
      passwordToSet.value = ''
    }
  }
}

function retryRootPassword() {
  rootPasswordError.value = ''
  passwordOld.value = ''
  passwordToSet.value = ''
  passwordToConfirm.value = ''
}

async function handleForgotPassword() {
  if (!passwordToVerify.value.trim()) {
    toastStore.error('请输入管理员密码')
    return
  }
  if (props.path === null || props.path === undefined) return

  isProcessing.value = true
  processingMessage.value = '正在验证管理员密码...'
  const result = await authStore.resetFolderPassword(props.path, passwordToVerify.value)
  isProcessing.value = false

  if (result.success) {
    emit('success')
    emit('close')
    toastStore.success('文件夹密码已清除')
  } else {
    forgotPasswordError.value = result.error || '管理员密码错误'
    passwordToVerify.value = ''
  }
}

function retryForgotPassword() {
  forgotPasswordError.value = ''
  passwordToVerify.value = ''
}

function handleForgotClick() {
  emit('forgot')
}

function getConfirmButtonText() {
  if (props.type === 'root') {
    if (props.rootAction === 'set') return '设置'
    if (props.rootAction === 'change') return '修改'
    return '移除'
  }
  if (props.type === 'verify') return '确定'
  if (props.type === 'set') return '设置'
  if (props.type === 'remove') return '移除'
  if (props.type === 'change') return '修改'
  if (props.type === 'forgot') return '清除'
  return '确定'
}

function getCurrentError() {
  switch (props.type) {
    case 'verify':
      return passwordError.value
    case 'remove':
      return removePasswordError.value
    case 'change':
      return changePasswordError.value
    case 'root':
      return rootPasswordError.value
    case 'forgot':
      return forgotPasswordError.value
    default:
      return ''
  }
}

function handleConfirmAction() {
  switch (props.type) {
    case 'verify':
      handleVerifyPassword()
      break
    case 'set':
      handleSetPassword()
      break
    case 'remove':
      handleRemovePassword()
      break
    case 'change':
      handleChangePassword()
      break
    case 'root':
      handleRootPassword()
      break
    case 'forgot':
      handleForgotPassword()
      break
  }
}

function handleRetry() {
  switch (props.type) {
    case 'verify':
      retryPasswordVerify()
      break
    case 'remove':
      retryRemovePassword()
      break
    case 'change':
      retryChangePassword()
      break
    case 'root':
      retryRootPassword()
      break
    case 'forgot':
      retryForgotPassword()
      break
  }
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog password-dialog"
      :style="
        draggable.offset.value.x !== 0 || draggable.offset.value.y !== 0
          ? { transform: `translate(${draggable.offset.value.x}px, ${draggable.offset.value.y}px)` }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="draggable.onMouseDown">
        <span>{{ getDialogTitle() }}</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      <div class="dialog-body">
        <div v-if="isProcessing" class="processing-overlay">
          <div class="loading-spinner"></div>
          <span class="loading-text">{{ processingMessage }}</span>
        </div>
        <template v-else>
          <template v-if="getCurrentError()">
            <ErrorRetry :error="getCurrentError()" :centered="true" @retry="handleRetry" />
          </template>
          <template v-else>
            <p>{{ getDialogMessage() }}</p>
            <input
              v-if="type === 'change' || (type === 'root' && rootAction === 'change')"
              v-model="passwordOld"
              type="password"
              placeholder="请输入旧密码"
              class="input"
              @keydown.enter="
                (passwordOldInputRef?.nextElementSibling as HTMLInputElement | null)?.focus()
              "
              ref="passwordOldInputRef"
            />
            <input
              v-if="type === 'verify' || type === 'remove'"
              v-model="passwordToVerify"
              type="password"
              placeholder="密码"
              @keydown.enter="handleVerifyPassword"
            />
            <a
              v-if="type === 'verify' && !getCurrentError()"
              href="#"
              class="forgot-password-link"
              @click.prevent="handleForgotClick"
            >
              忘记密码？
            </a>
            <input
              v-if="type === 'forgot'"
              v-model="passwordToVerify"
              type="password"
              placeholder="管理员密码"
              class="input"
              @keydown.enter="handleForgotPassword"
            />
            <input
              v-if="type === 'set' || type === 'change' || type === 'root'"
              v-model="passwordToSet"
              type="password"
              placeholder="请输入密码"
              class="input"
              @keydown.enter="
                (passwordToSetInputRef?.nextElementSibling as HTMLInputElement | null)?.focus()
              "
              ref="passwordToSetInputRef"
            />
            <input
              v-if="
                type === 'set' ||
                type === 'change' ||
                (type === 'root' && (rootAction === 'set' || rootAction === 'change'))
              "
              v-model="passwordToConfirm"
              type="password"
              placeholder="请再次输入密码"
              class="input"
              @keydown.enter="handleConfirmAction"
            />
          </template>
        </template>
      </div>
      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button
            class="primary"
            :disabled="isProcessing"
            @click="handleConfirmAction"
          >
            {{ getConfirmButtonText() }}
          </button>
          <button @click="emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-dialog {
  width: calc(360px * var(--scale));
  max-width: 90vw;
}

.password-dialog .dialog-body {
  padding: calc(20px * var(--scale)) calc(24px * var(--scale));
  position: relative;
  min-height: calc(220px * var(--scale));
  max-height: calc(300px * var(--scale));
}

.password-dialog .dialog-body p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: calc(16px * var(--scale));
}

.password-dialog .dialog-body input {
  width: 100%;
  padding: calc(12px * var(--scale)) calc(16px * var(--scale));
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  box-sizing: border-box;
  transition: all var(--transition-fast);
}

.password-dialog .dialog-body input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 calc(3px * var(--scale)) rgba(74, 144, 217, 0.15);
  outline: none;
}

.forgot-password-link {
  display: block;
  text-align: right;
  margin-top: calc(8px * var(--scale));
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.forgot-password-link:hover {
  color: var(--accent-secondary);
  text-decoration: underline;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--bg-primary-rgb), 0.85);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.loading-spinner {
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  border: 3px solid var(--border-light);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
  padding: calc(10px * var(--scale)) calc(14px * var(--scale));
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--text-error);
  border-radius: var(--radius-sm);
  color: var(--text-error);
  font-size: var(--font-size-sm);
  margin-bottom: calc(8px * var(--scale));
}

.error-message .error-icon {
  font-size: var(--font-size-md);
}
</style>
