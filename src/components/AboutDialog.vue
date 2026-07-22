<script setup lang="ts">
import { ref, computed } from 'vue'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
const BUILD_NUMBER = import.meta.env.VITE_BUILD_NUMBER || '0'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

function close() {
  emit('close')
}

const buildDate = computed(() => {
  try {
    return new Date(BUILD_TIME).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return BUILD_TIME
  }
})

useModalClose(() => close())
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div
      ref="dialogRef"
      class="modal-dialog about-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>关于记事本</span>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body">
        <div class="header-row">
          <img class="app-icon" src="/favicon.ico" alt="记事本" />
          <div class="header-info">
            <div class="name-row">
              <h2 class="app-name">记事本</h2>
              <span class="app-version">Ver {{ APP_VERSION }}</span>
            </div>
            <div class="build-row">
              <span class="build-info">Commit {{ BUILD_NUMBER }}</span>
              <span class="version-divider">•</span>
              <span class="build-date">{{ buildDate }}</span>
            </div>
          </div>
          <a
            href="https://github.com/battlewolf9527/notepad"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
            title="GitHub"
          >
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </a>
        </div>
        <p class="app-description">一个基于 Cloudflare 的在线记事本应用</p>
        <div class="feature-list">
          <div class="feature-item">📁 文件夹级密码保护</div>
          <div class="feature-item">📄 支持多种文件格式</div>
          <div class="feature-item">🔗 分享链接生成</div>
          <div class="feature-item">📑 Markdown 实时预览</div>
          <div class="feature-item">🎨 多种配色方案</div>
          <div class="feature-item">💾 自动保存功能</div>
        </div>
        <div class="tech-stack">
          <span class="tech-label">技术栈:</span>
          <span class="tech-items">Vue 3 • TypeScript • Cloudflare Pages</span>
        </div>
      </div>

      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="close">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-dialog {
  width: calc(420px * var(--scale));
  max-width: 90vw;
}

.dialog-body {
  padding: calc(20px * var(--scale));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: calc(12px * var(--scale));
}

.header-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: calc(12px * var(--scale));
}

.app-icon {
  width: calc(36px * var(--scale));
  height: calc(36px * var(--scale));
  flex-shrink: 0;
  border-radius: calc(4px * var(--scale));
}

.header-info {
  flex: 1;
  text-align: left;
}

.app-name {
  font-size: calc(18px * var(--scale));
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.name-row {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
}

.build-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(4px * var(--scale));
}

.app-version {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.version-divider {
  margin: 0 calc(4px * var(--scale));
  color: var(--text-muted);
}

.build-info {
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
}

.build-date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.app-description {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.feature-list {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: calc(8px * var(--scale));
}

.feature-item {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: left;
  padding: calc(4px * var(--scale)) calc(8px * var(--scale));
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.tech-stack {
  width: 100%;
  padding: calc(8px * var(--scale)) calc(12px * var(--scale));
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.tech-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  display: block;
  margin-bottom: calc(2px * var(--scale));
}

.tech-items {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.github-link {
  flex-shrink: 0;
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.github-link:hover {
  background: var(--bg-tertiary);
  transform: scale(1.1);
}

.github-icon {
  width: calc(18px * var(--scale));
  height: calc(18px * var(--scale));
  color: var(--text-secondary);
}

.dialog-footer button {
  padding: calc(8px * var(--scale)) calc(32px * var(--scale));
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent-primary);
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dialog-footer button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}
</style>
