<script setup lang="ts">
import { useFilesStore } from '../stores/files'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  itemName: string | null
  itemType: 'file' | 'folder' | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'rename'): void
  (e: 'move'): void
  (e: 'delete'): void
  (e: 'set-password'): void
  (e: 'remove-password'): void
  (e: 'change-password'): void
  (e: 'set-no-encrypt'): void
  (e: 'remove-no-encrypt'): void
}>()

const filesStore = useFilesStore()
const authStore = useAuthStore()

function isFolderProtected() {
  if (!props.itemName || props.itemType !== 'folder') return false
  return filesStore.folders.find((f) => f.name === props.itemName)?.protected
}

function isFolderNoEncrypt() {
  if (!props.itemName || props.itemType !== 'folder') return false
  return filesStore.folders.find((f) => f.name === props.itemName)?.noEncrypt
}

function handleSetOrRemovePassword() {
  if (isFolderProtected()) {
    emit('remove-password')
  } else {
    emit('set-password')
  }
}

function handleSetOrRemoveNoEncrypt() {
  if (isFolderNoEncrypt()) {
    emit('remove-no-encrypt')
  } else {
    emit('set-no-encrypt')
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="context-menu-overlay" @click="emit('close')">
      <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }" @click.stop>
        <button @click="emit('rename')">重命名</button>
        <button v-if="itemType === 'file'" @click="emit('move')">移动</button>
        <template v-if="itemType === 'folder'">
          <button
            v-if="isFolderProtected()"
            @click="emit('change-password')"
            :disabled="isFolderNoEncrypt()"
            :class="{ disabled: isFolderNoEncrypt() }"
            :title="isFolderNoEncrypt() ? '该目录已被设置为禁止加密' : ''"
          >
            修改密码
          </button>
          <button
            @click="handleSetOrRemovePassword()"
            :disabled="isFolderNoEncrypt() && !isFolderProtected()"
            :class="{ disabled: isFolderNoEncrypt() && !isFolderProtected() }"
            :title="isFolderNoEncrypt() && !isFolderProtected() ? '该目录已被设置为禁止加密' : ''"
          >
            {{ isFolderProtected() ? '移除密码' : '设置密码' }}
          </button>
          <hr />
          <button
            @click="handleSetOrRemoveNoEncrypt()"
            class="admin-action"
            :disabled="isFolderProtected()"
            :class="{ disabled: isFolderProtected() }"
            :title="
              isFolderProtected()
                ? '请先移除密码后再禁止加密'
                : authStore.isAdmin
                  ? ''
                  : '需要管理员权限'
            "
          >
            {{ isFolderNoEncrypt() ? '允许加密' : '禁止加密' }}
          </button>
        </template>
        <hr />
        <button class="danger" @click="emit('delete')">删除</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
}

.context-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: calc(4px * var(--scale));
  z-index: 2000;
  min-width: calc(120px * var(--scale));
}

.context-menu button {
  display: block;
  width: 100%;
  padding: calc(8px * var(--scale)) calc(12px * var(--scale));
  text-align: left;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.context-menu button:hover:not(.danger) {
  background: var(--bg-secondary);
}

.context-menu button.danger {
  color: var(--text-error);
}

.context-menu button.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.context-menu button.requires-admin {
  color: var(--text-secondary);
  font-style: italic;
}

.context-menu button.requires-admin:hover {
  background: var(--bg-secondary);
}

.context-menu button.disabled {
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.context-menu hr {
  border: none;
  border-top: 1px solid var(--border-light);
  margin: calc(4px * var(--scale)) 0;
}
</style>
