export interface ThemeColors {
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  bgError: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textError: string
  borderLight: string
  borderMedium: string
  borderError: string
  accentPrimary: string
  accentSecondary: string
  accentHover: string
  shadowSm: string
  shadowMd: string
  shadowLg: string
}

export type ThemeName =
  | 'light'
  | 'dark'
  | 'deep-blue'
  | 'eye-green'
  | 'rose'
  | 'amber'
  | 'purple'
  | 'custom'

export const DEFAULT_THEME_COLORS: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#e9ecef',
  bgError: '#fef2f2',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  textError: '#dc2626',
  borderLight: '#dee2e6',
  borderMedium: '#ced4da',
  borderError: '#fecaca',
  accentPrimary: '#4a90d9',
  accentSecondary: '#6ba3e0',
  accentHover: '#3a7bc8',
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  shadowMd: '0 4px 12px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 8px 24px rgba(0, 0, 0, 0.12)',
}

export const THEMES: Record<string, ThemeColors> = {
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

export const LEGACY_THEME_MAP: Record<string, string> = {
  blue: 'deep-blue',
  green: 'eye-green',
}

export function normalizeThemeName(theme: string): string {
  return LEGACY_THEME_MAP[theme] || theme
}

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

export function generateCustomThemeStyles(customTheme: Record<string, string>): string {
  return `.custom {
        --bg-primary: ${customTheme.bgPrimary || ''};
        --bg-secondary: ${customTheme.bgSecondary || ''};
        --bg-tertiary: ${customTheme.bgTertiary || ''};
        --bg-error: ${customTheme.bgError || ''};
        --text-primary: ${customTheme.textPrimary || ''};
        --text-secondary: ${customTheme.textSecondary || ''};
        --text-muted: ${customTheme.textMuted || ''};
        --text-error: ${customTheme.textError || ''};
        --border-light: ${customTheme.borderLight || ''};
        --border-medium: ${customTheme.borderMedium || ''};
        --border-error: ${customTheme.borderError || ''};
        --accent-primary: ${customTheme.accentPrimary || ''};
        --accent-secondary: ${customTheme.accentSecondary || ''};
        --accent-hover: ${customTheme.accentHover || ''};
        --shadow-sm: ${customTheme.shadowSm || ''};
        --shadow-md: ${customTheme.shadowMd || ''};
        --shadow-lg: ${customTheme.shadowLg || ''};
      }`
}

export function getHtmlClass(theme: string): string {
  return normalizeThemeName(theme)
}
