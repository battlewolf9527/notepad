<script setup lang="ts">
defineProps<{
  error: string
  centered?: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div v-if="error" :class="['error-retry', { centered }]">
    <span class="error-icon">❌</span>
    <span class="error-message">{{ error }}</span>
    <button class="retry-btn" @click="emit('retry')">重试</button>
  </div>
</template>

<style scoped>
.error-retry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(16px * var(--scale));
  margin-top: calc(12px * var(--scale));
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--text-error);
  border-radius: var(--radius-sm);
  color: var(--text-error);
  font-size: var(--font-size-sm);
  gap: calc(8px * var(--scale));
}

.error-retry.centered {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--bg-primary-rgb), 0.95);
  margin: 0;
  padding: calc(20px * var(--scale)) calc(24px * var(--scale));
  border: none;
  border-radius: var(--radius-md);
  pointer-events: auto;
  z-index: 100;
}

.error-retry .error-icon {
  font-size: calc(32px * var(--scale));
}

.error-retry .error-message {
  font-size: var(--font-size-md);
}

.error-retry .retry-btn {
  padding: calc(6px * var(--scale)) calc(16px * var(--scale));
  background-color: var(--text-error);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-fast);
}

.error-retry .retry-btn:hover {
  background-color: rgba(239, 68, 68, 0.8);
}
</style>
