import { useEditorStore } from '../stores/editor'
import { useAppDialogs } from './useAppDialogs'
type AppDialogsType = ReturnType<typeof useAppDialogs>

export function useEditorCommands(
  editorRef: {
    value: InstanceType<typeof import('../components/EditorWrapper.vue').default> | null
  },
  dialogs: AppDialogsType,
) {
  const editorStore = useEditorStore()

  const undo = () => {
    editorStore.undo()
  }

  const redo = () => {
    editorStore.redo()
  }

  const cut = async () => {
    await editorRef.value?.cut()
  }

  const copy = async () => {
    await editorRef.value?.copy()
  }

  const paste = async () => {
    await editorRef.value?.paste()
  }

  const deleteSelection = () => {
    editorRef.value?.deleteSelection()
  }

  const find = () => {
    dialogs.openFindReplace()
  }

  const replace = () => {
    dialogs.openFindReplace()
  }

  const goTo = () => {
    dialogs.openGoToDialog()
  }

  const goToConfirm = (line: string) => {
    const lineNum = parseInt(line, 10)
    if (!isNaN(lineNum)) {
      editorRef.value?.goToLine(lineNum)
    }
    dialogs.closeGoToDialog()
  }

  const selectAll = () => {
    editorRef.value?.selectAll()
  }

  const insertDateTime = () => {
    const now = new Date()
    const dateStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    editorRef.value?.insertText(dateStr)
  }

  const toggleAutoWrap = () => {
    editorStore.toggleAutoWrap()
  }

  const fontDialog = () => {
    dialogs.openFontDialog()
  }

  const toggleMarkdown = () => {
    editorStore.toggleMarkdownPreview()
  }

  return {
    undo,
    redo,
    cut,
    copy,
    paste,
    deleteSelection,
    find,
    replace,
    goTo,
    goToConfirm,
    selectAll,
    insertDateTime,
    toggleAutoWrap,
    fontDialog,
    toggleMarkdown,
  }
}
