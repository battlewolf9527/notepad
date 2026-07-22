<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useConfirmStore } from '../stores/confirm'

const authStore = useAuthStore()
const confirmStore = useConfirmStore()

const isDragging = ref(false)
const isHovering = ref(false)
const position = ref({ x: window.innerWidth / 2 - 20, y: window.innerHeight / 2 - 20 })
const dragOffset = ref({ x: 0, y: 0 })
let leaveTimeout: ReturnType<typeof setTimeout> | null = null

const badgeStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}))

const tooltipStyle = computed(() => {
  const x = position.value.x + 60
  const y = position.value.y - 40
  return {
    left: `${x}px`,
    top: `${y}px`,
  }
})

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  position.value = {
    x: Math.max(0, Math.min(e.clientX - dragOffset.value.x, window.innerWidth - 40)),
    y: Math.max(0, Math.min(e.clientY - dragOffset.value.y, window.innerHeight - 40)),
  }
}

function handleMouseUp() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function handleMouseEnter() {
  if (leaveTimeout) {
    clearTimeout(leaveTimeout)
    leaveTimeout = null
  }
  isHovering.value = true
}

function handleMouseLeave() {
  leaveTimeout = setTimeout(() => {
    isHovering.value = false
    leaveTimeout = null
  }, 150)
}

async function handleLogout() {
  const confirmed = await confirmStore.confirm('确认要退出管理员模式？', '退出管理员模式')
  if (confirmed) {
    authStore.logoutAsAdmin()
  }
}

watch(
  () => authStore.isAdmin,
  (isAdmin) => {
    if (isAdmin) {
      position.value = {
        x: window.innerWidth / 2 - 20,
        y: window.innerHeight / 2 - 20,
      }
    }
  },
)

onMounted(() => {
  position.value = {
    x: window.innerWidth / 2 - 20,
    y: window.innerHeight / 2 - 20,
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  if (leaveTimeout) {
    clearTimeout(leaveTimeout)
  }
})
</script>

<template>
  <div v-if="authStore.isAdmin" class="admin-badge-container">
    <div
      class="admin-badge"
      :class="{ dragging: isDragging }"
      :style="badgeStyle"
      @mousedown="handleMouseDown"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <span class="badge-icon">⚡</span>
      <span class="badge-pulse"></span>
      <span class="badge-pulse badge-pulse-delay"></span>
    </div>

    <Transition name="tooltip">
      <div
        v-if="isHovering"
        class="admin-tooltip"
        :style="tooltipStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="tooltip-arrow"></div>
        <div class="tooltip-content">
          <div class="tooltip-title">
            <span class="title-icon">⚠️</span>
            <span>管理员模式</span>
          </div>
          <div class="tooltip-desc">当前处于管理员权限状态，请注意操作安全</div>
          <button class="tooltip-logout-btn" @click.stop="handleLogout">退出管理员</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.admin-badge-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
}

.admin-badge {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  pointer-events: auto;
  transition: transform 0.2s ease;
  background: transparent;
}

.admin-badge:hover {
  transform: scale(1.15);
}

.admin-badge.dragging {
  cursor: grabbing;
  transform: scale(1.3);
}

.badge-icon {
  font-size: 24px;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(255, 200, 0, 0.4));
}

.badge-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 0, 0.6) 0%,
    rgba(255, 150, 0, 0.3) 50%,
    transparent 70%
  );
  animation: badgePulse 2s ease-out infinite;
  z-index: 1;
}

.badge-pulse-delay {
  animation-delay: 1s;
}

@keyframes badgePulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.admin-tooltip {
  position: absolute;
  min-width: 220px;
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 10px;
  padding: 16px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.tooltip-arrow {
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-right: 8px solid #2d3748;
  border-bottom: 8px solid transparent;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tooltip-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffc107;
  font-size: 14px;
  font-weight: 600;
}

.title-icon {
  font-size: 16px;
}

.tooltip-desc {
  color: #a0aec0;
  font-size: 12px;
  line-height: 1.4;
}

.tooltip-logout-btn {
  margin-top: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.tooltip-logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.tooltip-logout-btn:active {
  transform: translateY(0);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
