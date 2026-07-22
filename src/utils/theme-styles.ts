import { DEFAULT_THEME_COLORS, THEMES, LEGACY_THEME_MAP, type ThemeColors } from '@theme'

const THEME_STYLE_ID = 'theme-styles'

export function generateThemeStyles(): string {
  let styles = `:root {
        --bg-primary: ${DEFAULT_THEME_COLORS.bgPrimary};
        --bg-secondary: ${DEFAULT_THEME_COLORS.bgSecondary};
        --bg-tertiary: ${DEFAULT_THEME_COLORS.bgTertiary};
        --bg-error: ${DEFAULT_THEME_COLORS.bgError};
        --text-primary: ${DEFAULT_THEME_COLORS.textPrimary};
        --text-secondary: ${DEFAULT_THEME_COLORS.textSecondary};
        --text-muted: ${DEFAULT_THEME_COLORS.textMuted};
        --text-error: ${DEFAULT_THEME_COLORS.textError};
        --border-light: ${DEFAULT_THEME_COLORS.borderLight};
        --border-medium: ${DEFAULT_THEME_COLORS.borderMedium};
        --border-error: ${DEFAULT_THEME_COLORS.borderError};
        --accent-primary: ${DEFAULT_THEME_COLORS.accentPrimary};
        --accent-secondary: ${DEFAULT_THEME_COLORS.accentSecondary};
        --accent-hover: ${DEFAULT_THEME_COLORS.accentHover};
        --shadow-sm: ${DEFAULT_THEME_COLORS.shadowSm};
        --shadow-md: ${DEFAULT_THEME_COLORS.shadowMd};
        --shadow-lg: ${DEFAULT_THEME_COLORS.shadowLg};
      }`

  for (const [name, colors] of Object.entries(THEMES)) {
    const legacyNames = Object.entries(LEGACY_THEME_MAP)
      .filter(([, value]) => value === name)
      .map(([key]) => key)
    const selectors = [name, ...legacyNames].join(', ')
    styles += `
      .${selectors.replace(/, /g, ', .')} {
        --bg-primary: ${colors.bgPrimary};
        --bg-secondary: ${colors.bgSecondary};
        --bg-tertiary: ${colors.bgTertiary};
        --bg-error: ${colors.bgError};
        --text-primary: ${colors.textPrimary};
        --text-secondary: ${colors.textSecondary};
        --text-muted: ${colors.textMuted};
        --text-error: ${colors.textError};
        --border-light: ${colors.borderLight};
        --border-medium: ${colors.borderMedium};
        --border-error: ${colors.borderError};
        --accent-primary: ${colors.accentPrimary};
        --accent-secondary: ${colors.accentSecondary};
        --accent-hover: ${colors.accentHover};
        --shadow-sm: ${colors.shadowSm};
        --shadow-md: ${colors.shadowMd};
        --shadow-lg: ${colors.shadowLg};
      }`
  }

  return styles
}

export function injectThemeStyles(): void {
  let styleElement = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null

  if (styleElement) {
    styleElement.textContent = generateThemeStyles()
  } else {
    styleElement = document.createElement('style')
    styleElement.id = THEME_STYLE_ID
    styleElement.textContent = generateThemeStyles()
    document.head.appendChild(styleElement)
  }
}

export function applyCustomTheme(customTheme: ThemeColors): void {
  const root = document.documentElement
  root.style.setProperty('--bg-primary', customTheme.bgPrimary)
  root.style.setProperty('--bg-secondary', customTheme.bgSecondary)
  root.style.setProperty('--bg-tertiary', customTheme.bgTertiary)
  root.style.setProperty('--bg-error', customTheme.bgError || '#3f1a1a')
  root.style.setProperty('--text-primary', customTheme.textPrimary)
  root.style.setProperty('--text-secondary', customTheme.textSecondary)
  root.style.setProperty('--text-muted', customTheme.textMuted)
  root.style.setProperty('--text-error', customTheme.textError || '#fca5a5')
  root.style.setProperty('--border-light', customTheme.borderLight)
  root.style.setProperty('--border-medium', customTheme.borderMedium)
  root.style.setProperty('--border-error', customTheme.borderError || '#7f1d1d')
  root.style.setProperty('--accent-primary', customTheme.accentPrimary)
  root.style.setProperty('--accent-secondary', customTheme.accentSecondary)
  root.style.setProperty('--accent-hover', customTheme.accentHover)
  root.style.setProperty('--shadow-sm', customTheme.shadowSm || '0 1px 3px rgba(0, 0, 0, 0.2)')
  root.style.setProperty('--shadow-md', customTheme.shadowMd || '0 4px 12px rgba(0, 0, 0, 0.25)')
  root.style.setProperty('--shadow-lg', customTheme.shadowLg || '0 8px 24px rgba(0, 0, 0, 0.3)')
}

export function clearCustomTheme(): void {
  const root = document.documentElement
  root.style.setProperty('--bg-primary', '')
  root.style.setProperty('--bg-secondary', '')
  root.style.setProperty('--bg-tertiary', '')
  root.style.setProperty('--bg-error', '')
  root.style.setProperty('--text-primary', '')
  root.style.setProperty('--text-secondary', '')
  root.style.setProperty('--text-muted', '')
  root.style.setProperty('--text-error', '')
  root.style.setProperty('--border-light', '')
  root.style.setProperty('--border-medium', '')
  root.style.setProperty('--border-error', '')
  root.style.setProperty('--accent-primary', '')
  root.style.setProperty('--accent-secondary', '')
  root.style.setProperty('--accent-hover', '')
  root.style.setProperty('--shadow-sm', '')
  root.style.setProperty('--shadow-md', '')
  root.style.setProperty('--shadow-lg', '')
}