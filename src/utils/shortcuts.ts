export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: string
}

export const shortcuts: ShortcutConfig[] = [
  { key: 'n', ctrl: true, action: 'newFile' },
  { key: 'o', ctrl: true, action: 'openFile' },
  { key: 's', ctrl: true, action: 'saveFile' },
  { key: 'z', ctrl: true, action: 'undo' },
  { key: 'z', ctrl: true, shift: true, action: 'redo' },
  { key: 'x', ctrl: true, action: 'cut' },
  { key: 'c', ctrl: true, action: 'copy' },
  { key: 'v', ctrl: true, action: 'paste' },
  { key: 'a', ctrl: true, action: 'selectAll' },
  { key: 'f', ctrl: true, action: 'find' },
  { key: 'h', ctrl: true, action: 'replace' },
  { key: 'g', ctrl: true, action: 'goTo' },
  { key: 'F5', action: 'insertDateTime' },
  { key: 'Delete', action: 'delete' },
]

export function parseShortcut(event: KeyboardEvent): string | null {
  const key = event.key.toLowerCase()
  const ctrl = event.ctrlKey || event.metaKey
  const shift = event.shiftKey
  const alt = event.altKey

  const shortcut = shortcuts.find((s) => {
    if (s.key.toLowerCase() !== key && s.key !== event.key) return false
    if (s.ctrl && !ctrl) return false
    if (s.shift && !shift) return false
    if (s.alt && !alt) return false
    if (!s.ctrl && ctrl) return false
    if (!s.shift && shift) return false
    if (!s.alt && alt) return false
    return true
  })

  return shortcut?.action || null
}
