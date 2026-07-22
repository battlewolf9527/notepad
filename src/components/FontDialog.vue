<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useConfigStore } from '../stores/config'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const editorStore = useEditorStore()
const configStore = useConfigStore()

const fontFamily = ref('Consolas')
const fontSize = ref(14)
const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

const fontFamilies = [
  'Consolas',
  'Courier New',
  'Monaco',
  'Lucida Console',
  'Arial',
  'Times New Roman',
  'Verdana',
  'Georgia',
]

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32]

watch(
  () => props.visible,
  (val) => {
    if (val) {
      const parts = editorStore.fontFamily.split(',')
      fontFamily.value = (parts[0] || 'Consolas').trim().replace(/['"]/g, '')
      fontSize.value = editorStore.fontSize
      dialogDrag.resetOffset()
    }
  },
)

async function applyFont() {
  editorStore.setFontFamily(fontFamily.value)
  editorStore.setFontSize(fontSize.value)
  await configStore.saveConfig({ fontFamily: fontFamily.value, fontSize: fontSize.value })
  emit('close')
}

useModalClose(() => emit('close'))
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog font-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>字体</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="font-section">
          <label>字体:</label>
          <select v-model="fontFamily" class="select">
            <option v-for="font in fontFamilies" :key="font" :value="font">
              {{ font }}
            </option>
          </select>
        </div>

        <div class="font-section">
          <label>字号:</label>
          <select v-model.number="fontSize" class="select">
            <option v-for="size in fontSizes" :key="size" :value="size">
              {{ size }}
            </option>
          </select>
        </div>

        <div class="font-preview">
          <span>示例文本: The quick brown fox jumps over the lazy dog</span>
        </div>
      </div>

      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="applyFont">确定</button>
          <button @click="emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-dialog {
  min-width: 380px;
}

.font-section {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.font-section label {
  width: 60px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.font-section .select {
  flex: 1;
}

.font-preview {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  color: var(--text-primary);
}
</style>
