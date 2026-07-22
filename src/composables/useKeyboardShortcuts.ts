import { parseShortcut } from '../utils/shortcuts'

export interface ShortcutActions {
  newFile: () => void
  openFile: () => void
  saveFile: () => void
  undo: () => void
  redo: () => void
  cut: () => void
  copy: () => void
  paste: () => void
  selectAll: () => void
  find: () => void
  replace: () => void
  goTo: () => void
  insertDateTime: () => void
  delete: () => void
}

type ShortcutKey = keyof ShortcutActions

function isInputFocused(): boolean {
  const activeElement = document.activeElement
  if (!activeElement) return false

  const tagName = activeElement.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  const type = (activeElement as HTMLInputElement).type?.toLowerCase()
  if (type === 'text' || type === 'password' || type === 'search') {
    return true
  }

  if ((activeElement as HTMLElement).isContentEditable) {
    return true
  }

  return false
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  function handleKeydown(event: KeyboardEvent) {
    const action = parseShortcut(event) as ShortcutKey | null
    if (!action || !(action in actions)) return

    if (isInputFocused()) {
      const textEditingActions: ShortcutKey[] = ['cut', 'copy', 'paste', 'selectAll', 'delete']
      if (textEditingActions.includes(action)) {
        return
      }
    }

    event.preventDefault()
    actions[action]()
  }

  return {
    handleKeydown,
  }
}
