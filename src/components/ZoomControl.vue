<script setup lang="ts">
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const zoomLevels = [50, 75, 100, 125, 150, 175, 200]

function handleZoomChange(event: Event) {
  const target = event.target as HTMLSelectElement
  configStore.setScale(parseInt(target.value))
}

function handleZoomInput(event: Event) {
  const target = event.target as HTMLInputElement
  configStore.setScale(parseInt(target.value))
}
</script>

<template>
  <div class="zoom-control-container">
    <button
      class="zoom-btn"
      @click="configStore.zoomOut()"
      :disabled="configStore.scale <= 50"
      title="缩小"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <div class="zoom-display">
      <input
        type="range"
        min="50"
        max="200"
        step="10"
        :value="configStore.scale"
        @input="handleZoomInput"
        class="zoom-slider"
      />
      <span class="zoom-percentage">{{ configStore.scale }}%</span>
      <select :value="configStore.scale" @change="handleZoomChange" class="zoom-select">
        <option v-for="level in zoomLevels" :key="level" :value="level">{{ level }}%</option>
      </select>
    </div>
    <button
      class="zoom-btn"
      @click="configStore.zoomIn()"
      :disabled="configStore.scale >= 200"
      title="放大"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      class="zoom-btn zoom-reset"
      @click="configStore.resetZoom()"
      :disabled="configStore.scale === 100"
      title="重置为100%"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.zoom-control-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-reset {
  width: 28px;
}

.zoom-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}

.zoom-slider {
  width: 70px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  border-radius: 2px;
  cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zoom-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.zoom-percentage {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 36px;
  text-align: right;
}

.zoom-select {
  display: none;
}

@media (max-width: 640px) {
  .zoom-slider {
    display: none;
  }

  .zoom-percentage {
    display: none;
  }

  .zoom-select {
    display: block;
    width: auto;
    padding: 2px 6px;
    font-size: 11px;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
  }
}
</style>
