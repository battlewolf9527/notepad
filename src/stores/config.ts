import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPut } from '../utils/api'
import type { Config, ThemeType } from '../types/index'
import { applyCustomTheme, clearCustomTheme } from '../utils/theme-styles'
import type { ThemeColors } from '@theme'
import { getErrorMessage } from '../utils/error'

async function rerenderMermaidOnThemeChange(): Promise<void> {
  try {
    const { rerenderMermaidContainers } = await import('../utils/markdown-renderer')
    await rerenderMermaidContainers()
  } catch {}
}

export type CustomTheme = ThemeColors

export type ConfigState = Required<Config> & {
  fontFamily: string
  fontSize: number
  customTheme: CustomTheme | null
  isLoading: boolean
  error: string
}

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

function parseBoolean(value: string | null | undefined): boolean {
  return value === 'true'
}

function parseIntOrDefault(value: string | null | undefined, defaultValue: number): number {
  const parsed = parseInt(value || '', 10)
  return isNaN(parsed) ? defaultValue : parsed
}

function isValidColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) && hex !== '#000000'
}

function parseCustomTheme(value: string | null | undefined): CustomTheme | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (
      parsed &&
      typeof parsed === 'object' &&
      isValidColor(parsed.bgPrimary) &&
      isValidColor(parsed.textPrimary) &&
      isValidColor(parsed.accentPrimary)
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export const useConfigStore = defineStore('config', () => {
  const siteTitle = ref('记事本')
  const theme = ref<ThemeType>('light')
  const customTheme = ref<CustomTheme | null>(null)
  const autoWrap = ref(false)
  const autoSave = ref(false)
  const defaultExtension = ref('.txt')
  const scale = ref(100)
  const defaultEncoding = ref('gbk')
  const isLoading = ref(false)
  const error = ref('')

  const themeClassList: string[] = ['dark', 'deep-blue', 'eye-green', 'rose', 'amber', 'purple']

  async function loadConfig(): Promise<void> {
    isLoading.value = true
    error.value = ''
    try {
      const data = await apiGet<Record<string, string | null>>('/config')
      siteTitle.value = data.siteTitle || '记事本'
      theme.value = (data.theme as ThemeType) || 'light'
      customTheme.value = parseCustomTheme(data.customTheme)
      autoWrap.value = parseBoolean(data.autoWrap)
      autoSave.value = parseBoolean(data.autoSave)
      defaultExtension.value = data.defaultExtension || '.txt'
      scale.value = parseIntOrDefault(data.scale, 100)
      defaultEncoding.value = data.defaultEncoding || 'gbk'
      applyTheme()
      applyScale()
    } catch (err) {
      error.value = getErrorMessage(err, '加载配置失败')
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(
    newConfig: Partial<Omit<ConfigState, 'customTheme'>> & {
      customTheme?: CustomTheme | string | null
    },
  ): Promise<boolean> {
    try {
      const saveData: Record<string, unknown> = { ...newConfig }
      if (saveData.customTheme !== undefined) {
        saveData.customTheme = JSON.stringify(saveData.customTheme)
      }
      await apiPut('/config', saveData)

      if (newConfig.siteTitle !== undefined) siteTitle.value = newConfig.siteTitle
      if (newConfig.autoWrap !== undefined) autoWrap.value = newConfig.autoWrap
      if (newConfig.autoSave !== undefined) autoSave.value = newConfig.autoSave
      if (newConfig.defaultExtension !== undefined)
        defaultExtension.value = newConfig.defaultExtension
      if (newConfig.defaultEncoding !== undefined) defaultEncoding.value = newConfig.defaultEncoding
      if (newConfig.customTheme !== undefined && typeof newConfig.customTheme !== 'string') {
        customTheme.value = newConfig.customTheme
      }

      if (newConfig.theme !== undefined) {
        theme.value = newConfig.theme as ThemeType
        applyTheme()
      }

      if (newConfig.scale !== undefined) {
        scale.value = newConfig.scale
        applyScale()
      }

      return true
    } catch (err) {
      error.value = getErrorMessage(err, '保存配置失败')
      return false
    }
  }

  function applyTheme(): void {
    themeClassList.forEach((cls) => {
      document.documentElement.classList.remove(cls)
    })

    if (theme.value === 'custom') {
      const themeData = customTheme.value || DEFAULT_CUSTOM_THEME
      applyCustomTheme(themeData)
    } else {
      if (theme.value !== 'light') {
        document.documentElement.classList.add(theme.value)
      }
      clearCustomTheme()
    }

    rerenderMermaidOnThemeChange()
  }

  function applyScale(): void {
    const scaleValue = scale.value / 100
    document.documentElement.style.setProperty('--scale', scaleValue.toString())
  }

  function toggleTheme(): void {
    const themes: ThemeType[] = [
      'light',
      'dark',
      'deep-blue',
      'eye-green',
      'rose',
      'amber',
      'purple',
    ]
    let currentIndex = themes.indexOf(theme.value)
    if (currentIndex === -1) currentIndex = 0
    theme.value = themes[(currentIndex + 1) % themes.length]!
    applyTheme()
    saveConfig({ theme: theme.value })
  }

  function setTheme(themeValue: string): void {
    const validThemes: ThemeType[] = [
      'light',
      'dark',
      'deep-blue',
      'eye-green',
      'rose',
      'amber',
      'purple',
      'custom',
    ]
    if (validThemes.includes(themeValue as ThemeType)) {
      theme.value = themeValue as ThemeType
      applyTheme()
      saveConfig({ theme: theme.value })
    }
  }

  let scaleSaveTimer: ReturnType<typeof setTimeout> | null = null

  function setScale(value: number): void {
    if (value >= 50 && value <= 200) {
      scale.value = value
      applyScale()

      if (scaleSaveTimer) {
        clearTimeout(scaleSaveTimer)
      }
      scaleSaveTimer = setTimeout(() => {
        saveConfig({ scale: value })
        scaleSaveTimer = null
      }, 500)
    }
  }

  function zoomIn(): void {
    if (scale.value < 200) {
      setScale(scale.value + 10)
    }
  }

  function zoomOut(): void {
    if (scale.value > 50) {
      setScale(scale.value - 10)
    }
  }

  function resetZoom(): void {
    setScale(100)
  }

  return {
    siteTitle,
    theme,
    customTheme,
    autoWrap,
    autoSave,
    defaultExtension,
    scale,
    defaultEncoding,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    applyTheme,
    applyScale,
    toggleTheme,
    setTheme,
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
  }
})
