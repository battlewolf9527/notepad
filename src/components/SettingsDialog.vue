<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore } from '../stores/config'
import type { ThemeType } from '../types/index'
import { useToastStore } from '../stores/toast'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'
import CustomThemeDialog from './CustomThemeDialog.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const configStore = useConfigStore()
const toastStore = useToastStore()

const siteTitle = ref('')
const theme = ref<ThemeType>('light')
const autoWrap = ref(false)
const autoSave = ref(false)
const defaultExtension = ref('.txt')
const scale = ref(100)
const defaultEncoding = ref('gbk')

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()
const showCustomThemeDialog = ref(false)

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '暗色' },
  { value: 'deep-blue', label: '深蓝' },
  { value: 'eye-green', label: '护眼绿' },
  { value: 'rose', label: '玫瑰' },
  { value: 'amber', label: '琥珀' },
  { value: 'purple', label: '紫色' },
  { value: 'custom', label: '自定义' },
]

const encodingOptions = [
  { value: 'gbk', label: 'GBK (简体中文)' },
  { value: 'gb18030', label: 'GB18030 (简体中文)' },
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'big5', label: 'Big5 (繁体中文)' },
  { value: 'shift-jis', label: 'Shift-JIS (日文)' },
  { value: 'euc-kr', label: 'EUC-KR (韩文)' },
  { value: 'iso-8859-1', label: 'ISO-8859-1 (西欧)' },
]

watch(
  () => props.visible,
  (val) => {
    if (val) {
      siteTitle.value = configStore.siteTitle
      theme.value = configStore.theme
      autoWrap.value = configStore.autoWrap
      autoSave.value = configStore.autoSave
      defaultExtension.value = configStore.defaultExtension || '.txt'
      scale.value = configStore.scale || 100
      defaultEncoding.value = configStore.defaultEncoding || 'gbk'
      dialogDrag.resetOffset()
    }
  },
)

function handleThemeChange() {
  if (theme.value === 'custom') {
    showCustomThemeDialog.value = true
  }
}

function openCustomThemeDialog() {
  showCustomThemeDialog.value = true
}

async function saveSettings() {
  const saveData: Record<string, unknown> = {
    siteTitle: siteTitle.value,
    theme: theme.value,
    autoWrap: autoWrap.value,
    autoSave: autoSave.value,
    defaultExtension: defaultExtension.value,
    scale: scale.value,
    defaultEncoding: defaultEncoding.value,
  }

  const success = await configStore.saveConfig(saveData)
  if (success) {
    toastStore.success('设置已保存')
    emit('close')
  } else {
    toastStore.error('保存设置失败')
  }
}

function handleCustomThemeConfirm() {
  theme.value = 'custom'
}

function handleCustomThemeClose() {
  showCustomThemeDialog.value = false
  if (configStore.theme !== 'custom') {
    theme.value = configStore.theme
  }
}

useModalClose(() => emit('close'))
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog settings-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>设置</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="settings-section">
          <h3>常规设置</h3>

          <div class="form-row">
            <label>网站标题:</label>
            <input v-model="siteTitle" type="text" class="input" />
          </div>

          <div class="form-row">
            <label>配色方案:</label>
            <div class="theme-select-wrapper">
              <select v-model="theme" class="select" @change="handleThemeChange">
                <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <button v-if="theme === 'custom'" class="btn-sm" @click="openCustomThemeDialog">
                调整
              </button>
            </div>
          </div>

          <div class="form-row">
            <label>界面缩放:</label>
            <div class="scale-control">
              <input v-model.number="scale" type="range" min="50" max="200" step="5" />
              <span>{{ scale }}%</span>
            </div>
          </div>

          <div class="form-row checkbox-row">
            <label>
              <input v-model="autoWrap" type="checkbox" />
              默认自动换行
            </label>
          </div>

          <div class="form-row checkbox-row">
            <label>
              <input v-model="autoSave" type="checkbox" />
              自动保存（停止输入 3 秒后）
            </label>
          </div>

          <div class="form-row">
            <label>默认后缀:</label>
            <input v-model="defaultExtension" type="text" placeholder=".txt" class="input" />
          </div>

          <div class="form-row">
            <label>默认编码:</label>
            <select v-model="defaultEncoding" class="select">
              <option v-for="option in encodingOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="saveSettings">保存设置</button>
          <button @click="emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>

  <CustomThemeDialog
    :visible="showCustomThemeDialog"
    @close="handleCustomThemeClose"
    @confirm="handleCustomThemeConfirm"
  />
</template>

<style scoped>
.settings-dialog {
  width: calc(550px * var(--scale));
  max-width: 90vw;
}

.dialog-body {
  max-height: 600px;
}

.settings-section {
  margin-bottom: calc(24px * var(--scale));
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: var(--spacing-md);
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

.form-row .input,
.form-row .select {
  flex: 1;
}

.theme-select-wrapper {
  flex: 1;
  display: flex;
  align-items: stretch;
  gap: var(--spacing-sm);
}

.theme-select-wrapper .select {
  flex: 1;
}

.form-row .scale-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.form-row .scale-control input[type='range'] {
  flex: 1;
  height: calc(6px * var(--scale));
  cursor: pointer;
  accent-color: var(--accent-primary);
}

.form-row .scale-control span {
  min-width: calc(50px * var(--scale));
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.custom-theme-panel {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.custom-theme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.btn-sm {
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  border: 1px solid var(--border-medium);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sm:hover {
  background: var(--bg-tertiary);
}

.btn-sm.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
}

.btn-sm.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-item label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  width: auto;
}

.color-picker {
  width: 100%;
  height: calc(32px * var(--scale));
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0;
}

.color-value {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: monospace;
}
</style>
