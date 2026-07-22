import { onMounted, onUnmounted } from 'vue'

/**
 * 用于处理模态对话框 ESC 键关闭逻辑的 composable
 */
export function useModalClose(onClose: () => void) {
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
