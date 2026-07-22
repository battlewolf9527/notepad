<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore, type CustomTheme } from '../stores/config'
import { useToastStore } from '../stores/toast'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const configStore = useConfigStore()
const toastStore = useToastStore()

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bgPrimary: '#1e1e2e',
  bgSecondary: '#252536',
  bgTertiary: '#2a2a3e',
  bgError: '#3f1a1a',
  textPrimary: '#e4e4ef',
  textSecondary: '#a0a0b8',
  textMuted: '#6c6c80',
  textError: '#fca5a5',
  borderLight: '#3a3a4e',
  borderMedium: '#454558',
  borderError: '#7f1d1d',
  accentPrimary: '#6ba3e0',
  accentSecondary: '#8bb8f0',
  accentHover: '#5a93d0',
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.2)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.25)',
  shadowLg: '0 8px 24px rgba(0, 0, 0, 0.3)',
}

const SYSTEM_THEMES: Record<string, CustomTheme> = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f0f0f0',
    bgTertiary: '#e0e0e0',
    bgError: '#fef2f2',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    textError: '#dc2626',
    borderLight: '#e0e0e0',
    borderMedium: '#cccccc',
    borderError: '#fecaca',
    accentPrimary: '#0078d4',
    accentSecondary: '#4da6ff',
    accentHover: '#005a9e',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.1)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
  dark: {
    bgPrimary: '#1e1e2e',
    bgSecondary: '#252536',
    bgTertiary: '#2a2a3e',
    bgError: '#3f1a1a',
    textPrimary: '#e4e4ef',
    textSecondary: '#a0a0b8',
    textMuted: '#6c6c80',
    textError: '#fca5a5',
    borderLight: '#3a3a4e',
    borderMedium: '#454558',
    borderError: '#7f1d1d',
    accentPrimary: '#6ba3e0',
    accentSecondary: '#8bb8f0',
    accentHover: '#5a93d0',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.2)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.25)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  'deep-blue': {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgError: '#451a1a',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textError: '#fca5a5',
    borderLight: '#334155',
    borderMedium: '#475569',
    borderError: '#7f1d1d',
    accentPrimary: '#38bdf8',
    accentSecondary: '#7dd3fc',
    accentHover: '#0ea5e9',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.35)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
  'eye-green': {
    bgPrimary: '#1a2f1a',
    bgSecondary: '#244224',
    bgTertiary: '#2d522d',
    bgError: '#451a1a',
    textPrimary: '#e8f5e9',
    textSecondary: '#a5d6a7',
    textMuted: '#66bb6a',
    textError: '#fca5a5',
    borderLight: '#2d522d',
    borderMedium: '#386138',
    borderError: '#7f1d1d',
    accentPrimary: '#81c784',
    accentSecondary: '#a5d6a7',
    accentHover: '#66bb6a',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.25)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  rose: {
    bgPrimary: '#2a1a1f',
    bgSecondary: '#3d242a',
    bgTertiary: '#503038',
    bgError: '#451a1a',
    textPrimary: '#fce7f3',
    textSecondary: '#f9a8d4',
    textMuted: '#f472b6',
    textError: '#fca5a5',
    borderLight: '#503038',
    borderMedium: '#6b3a48',
    borderError: '#7f1d1d',
    accentPrimary: '#fb7185',
    accentSecondary: '#fda4af',
    accentHover: '#f43f5e',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.25)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  amber: {
    bgPrimary: '#2a2314',
    bgSecondary: '#3d3520',
    bgTertiary: '#50472c',
    bgError: '#451a1a',
    textPrimary: '#fef3c7',
    textSecondary: '#fcd34d',
    textMuted: '#f59e0b',
    textError: '#fca5a5',
    borderLight: '#50472c',
    borderMedium: '#6b5c38',
    borderError: '#7f1d1d',
    accentPrimary: '#fbbf24',
    accentSecondary: '#fcd34d',
    accentHover: '#f59e0b',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.25)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  purple: {
    bgPrimary: '#1f1a2e',
    bgSecondary: '#30264a',
    bgTertiary: '#413060',
    bgError: '#451a1a',
    textPrimary: '#ede9fe',
    textSecondary: '#c4b5fd',
    textMuted: '#a78bfa',
    textError: '#fca5a5',
    borderLight: '#413060',
    borderMedium: '#57417a',
    borderError: '#7f1d1d',
    accentPrimary: '#a855f7',
    accentSecondary: '#c084fc',
    accentHover: '#9333ea',
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.25)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
}

const themeOptions = [
  { value: '', label: '请选择套用的方案' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'deep-blue', label: '深蓝' },
  { value: 'eye-green', label: '护眼绿' },
  { value: 'rose', label: '玫瑰' },
  { value: 'amber', label: '琥珀' },
  { value: 'purple', label: '紫色' },
]

const selectedTheme = ref('')

const originalTheme = ref<CustomTheme>({ ...DEFAULT_CUSTOM_THEME })
const customTheme = ref<CustomTheme>({ ...DEFAULT_CUSTOM_THEME })

function isValidColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) && hex !== '#000000'
}

function getValidTheme(theme: CustomTheme | null): CustomTheme {
  if (!theme) return { ...DEFAULT_CUSTOM_THEME }

  const result: CustomTheme = { ...DEFAULT_CUSTOM_THEME }
  const keys = Object.keys(theme) as (keyof CustomTheme)[]

  for (const key of keys) {
    if (isValidColor(theme[key])) {
      result[key] = theme[key]
    }
  }

  return result
}

function applySystemTheme(themeKey: string) {
  const theme = SYSTEM_THEMES[themeKey]
  if (theme) {
    customTheme.value = { ...theme }
    originalTheme.value = { ...theme }
    selectedTheme.value = ''
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      originalTheme.value = getValidTheme(configStore.customTheme)
      customTheme.value = { ...originalTheme.value }
      selectedTheme.value = ''
    }
  },
)

function resetCustomTheme() {
  customTheme.value = { ...originalTheme.value }
}

function applyCustomThemePreview() {
  const themeData = customTheme.value
  document.documentElement.style.setProperty('--bg-primary', themeData.bgPrimary)
  document.documentElement.style.setProperty('--bg-secondary', themeData.bgSecondary)
  document.documentElement.style.setProperty('--bg-tertiary', themeData.bgTertiary)
  document.documentElement.style.setProperty('--bg-error', themeData.bgError)
  document.documentElement.style.setProperty('--text-primary', themeData.textPrimary)
  document.documentElement.style.setProperty('--text-secondary', themeData.textSecondary)
  document.documentElement.style.setProperty('--text-muted', themeData.textMuted)
  document.documentElement.style.setProperty('--text-error', themeData.textError)
  document.documentElement.style.setProperty('--border-light', themeData.borderLight)
  document.documentElement.style.setProperty('--border-medium', themeData.borderMedium)
  document.documentElement.style.setProperty('--border-error', themeData.borderError)
  document.documentElement.style.setProperty('--accent-primary', themeData.accentPrimary)
  document.documentElement.style.setProperty('--accent-secondary', themeData.accentSecondary)
  document.documentElement.style.setProperty('--accent-hover', themeData.accentHover)
  document.documentElement.style.setProperty('--shadow-sm', themeData.shadowSm)
  document.documentElement.style.setProperty('--shadow-md', themeData.shadowMd)
  document.documentElement.style.setProperty('--shadow-lg', themeData.shadowLg)
}

async function confirm() {
  const success = await configStore.saveConfig({
    theme: 'custom',
    customTheme: { ...customTheme.value },
  })
  if (success) {
    toastStore.success('自定义配色已保存')
    emit('confirm')
    emit('close')
  } else {
    toastStore.error('保存自定义配色失败')
  }
}

function cancel() {
  configStore.applyTheme()
  emit('close')
}

useModalClose(() => cancel())

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      dialogDrag.resetOffset()
    }
  },
)
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="cancel">
    <div
      ref="dialogRef"
      class="modal-dialog custom-theme-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>自定义配色方案</span>
        <button class="close-btn" @click="cancel">×</button>
      </div>

      <div class="dialog-body">
        <div class="apply-theme-section">
          <label>套用现有方案:</label>
          <select
            v-model="selectedTheme"
            class="theme-select"
            @change="applySystemTheme(selectedTheme)"
          >
            <option v-for="option in themeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <span class="hint">选择后可在此基础上二次调整</span>
        </div>

        <div class="color-grid">
          <div class="color-item">
            <label>背景主色</label>
            <input v-model="customTheme.bgPrimary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.bgPrimary }}</span>
          </div>
          <div class="color-item">
            <label>背景次色</label>
            <input v-model="customTheme.bgSecondary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.bgSecondary }}</span>
          </div>
          <div class="color-item">
            <label>背景三色</label>
            <input v-model="customTheme.bgTertiary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.bgTertiary }}</span>
          </div>
          <div class="color-item">
            <label>文字主色</label>
            <input v-model="customTheme.textPrimary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.textPrimary }}</span>
          </div>
          <div class="color-item">
            <label>文字次色</label>
            <input v-model="customTheme.textSecondary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.textSecondary }}</span>
          </div>
          <div class="color-item">
            <label>文字暗色</label>
            <input v-model="customTheme.textMuted" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.textMuted }}</span>
          </div>
          <div class="color-item">
            <label>边框亮色</label>
            <input v-model="customTheme.borderLight" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.borderLight }}</span>
          </div>
          <div class="color-item">
            <label>边框暗色</label>
            <input v-model="customTheme.borderMedium" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.borderMedium }}</span>
          </div>
          <div class="color-item">
            <label>强调色</label>
            <input v-model="customTheme.accentPrimary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.accentPrimary }}</span>
          </div>
          <div class="color-item">
            <label>强调亮色</label>
            <input v-model="customTheme.accentSecondary" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.accentSecondary }}</span>
          </div>
          <div class="color-item">
            <label>强调暗色</label>
            <input v-model="customTheme.accentHover" type="color" class="color-picker" />
            <span class="color-value">{{ customTheme.accentHover }}</span>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div>
          <button @click="resetCustomTheme">重置</button>
          <button @click="applyCustomThemePreview">预览</button>
        </div>
        <div class="dialog-actions">
          <button class="primary" @click="confirm">确定</button>
          <button @click="cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-theme-dialog {
  width: calc(500px * var(--scale));
  max-width: 90vw;
}

.apply-theme-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
}

.apply-theme-section label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.theme-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-width: 120px;
}

.theme-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.theme-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
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
