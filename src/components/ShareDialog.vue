<script setup lang="ts">
import { ref, watch } from 'vue'
import { useShareStore } from '../stores/share'
import { useToastStore } from '../stores/toast'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'
import { getOrigin } from '../utils/constants'

const props = defineProps<{
  visible: boolean
  filename: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const shareStore = useShareStore()
const toastStore = useToastStore()

const expiresInHours = ref(24)
const oneTime = ref(false)
const password = ref('')
const allowIframe = ref(false)
const generatedUrl = ref('')

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

const expireOptions = [
  { label: '1小时', value: 1 },
  { label: '1天', value: 24 },
  { label: '7天', value: 168 },
  { label: '30天', value: 720 },
  { label: '永久有效', value: 0 },
]

watch(
  () => props.visible,
  (val) => {
    if (val) {
      expiresInHours.value = 24
      oneTime.value = false
      password.value = ''
      allowIframe.value = false
      generatedUrl.value = ''
      dialogDrag.resetOffset()
    }
  },
)

async function generateLink() {
  const url = await shareStore.generateViewLink(
    props.filename,
    expiresInHours.value,
    oneTime.value,
    password.value || null,
    allowIframe.value,
  )

  if (url) {
    generatedUrl.value = getOrigin() + url
  }
}

async function copyLink() {
  if (generatedUrl.value) {
    await navigator.clipboard.writeText(generatedUrl.value)
    toastStore.success('链接已复制到剪贴板')
  }
}

useModalClose(() => emit('close'))
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog share-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>生成分享链接</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>时效:</label>
          <select v-model.number="expiresInHours" class="select">
            <option v-for="opt in expireOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <input v-model="oneTime" type="checkbox" />
            一次性阅读（首次访问后自动失效）
          </label>
        </div>

        <div class="form-group">
          <label>访问密码（可选）:</label>
          <input v-model="password" type="password" placeholder="留空则不设密码" class="input" />
        </div>

        <div class="form-group">
          <label>
            <input v-model="allowIframe" type="checkbox" />
            允许 iframe 嵌入
          </label>
        </div>

        <div v-if="generatedUrl" class="url-result">
          <label>生成的链接:</label>
          <div class="input-row">
            <input type="text" :value="generatedUrl" readonly class="input" />
            <button @click="copyLink" class="btn btn-secondary">复制链接</button>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div>
          <button class="primary" @click="generateLink">生成链接</button>
        </div>
        <div class="dialog-actions">
          <button @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-dialog {
  min-width: calc(400px * var(--scale));
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input[type='checkbox'] {
  margin-right: var(--spacing-md);
}

.url-result {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.url-result label {
  display: block;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.url-result .input-row {
  display: flex;
  gap: var(--spacing-md);
}

.url-result .input-row input {
  flex: 1;
}

.url-result .input-row button {
  flex-shrink: 0;
}
</style>
