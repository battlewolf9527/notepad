import { ref, onMounted, onUnmounted } from 'vue'

export interface Position {
  x: number
  y: number
}

export function useDraggable() {
  const offset = ref<Position>({ x: 0, y: 0 })

  let isDragging = false
  let startX = 0
  let startY = 0
  let startOffsetX = 0
  let startOffsetY = 0

  function onMouseDown(e: MouseEvent) {
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    startOffsetX = offset.value.x
    startOffsetY = offset.value.y

    e.preventDefault()
    e.stopPropagation()
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    offset.value = {
      x: startOffsetX + deltaX,
      y: startOffsetY + deltaY,
    }
  }

  function onMouseUp() {
    isDragging = false
  }

  function resetOffset() {
    offset.value = { x: 0, y: 0 }
  }

  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  })

  return {
    offset,
    onMouseDown,
    resetOffset,
  }
}
