<script setup lang="ts">
import type { ButtonConfig } from '../types'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    message: string
    buttons?: ButtonConfig[]
  }>(),
  {
    buttons: () => [
      { label: '确定', action: 'confirm', primary: true },
      { label: '取消', action: 'cancel' },
    ],
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
  third: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      dialogDrag.resetOffset()
    }
  },
)

function handleButtonClick(action: string) {
  if (action === 'confirm') emit('confirm')
  else if (action === 'cancel') emit('cancel')
  else if (action === 'third') emit('third')
}

useModalClose(() => emit('cancel'))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay">
      <div
        ref="dialogRef"
        class="modal-dialog confirm-dialog"
        :style="
          dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
            ? {
                transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
              }
            : {}
        "
      >
        <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
          <span>{{ title }}</span>
          <button class="close-btn" @click="emit('cancel')">×</button>
        </div>
        <div class="dialog-body">
          <p>{{ message }}</p>
        </div>
        <div class="dialog-footer">
          <div></div>
          <div class="dialog-actions">
            <button
              v-for="btn in buttons"
              :key="btn.action"
              :class="{ primary: btn.primary }"
              @click="handleButtonClick(btn.action)"
            >
              {{ btn.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 确认对话框样式已移至全局样式文件 notepad.css */
/* 此处仅保留必要的 scoped 样式覆盖 */

.confirm-dialog {
  min-width: 360px;
}
</style>
