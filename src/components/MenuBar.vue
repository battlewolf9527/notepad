<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useConfigStore } from '../stores/config'
import CustomThemeDialog from './CustomThemeDialog.vue'
import AboutDialog from './AboutDialog.vue'

type MenuItem =
  | {
      label: string
      shortcut?: string
      action?: string
      disabled?: boolean
      checked?: boolean
      submenu?: MenuItem[]
    }
  | { type: 'separator' }

const emit = defineEmits<{
  (e: 'newFile'): void
  (e: 'openFile'): void
  (e: 'importLocalFile'): void
  (e: 'saveFile'): void
  (e: 'saveAs'): void
  (e: 'download'): void
  (e: 'shareLink'): void
  (e: 'rawLink'): void
  (e: 'manageShares'): void
  (e: 'exit'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'cut'): void
  (e: 'copy'): void
  (e: 'paste'): void
  (e: 'delete'): void
  (e: 'find'): void
  (e: 'replace'): void
  (e: 'goTo'): void
  (e: 'selectAll'): void
  (e: 'insertDateTime'): void
  (e: 'toggleAutoWrap'): void
  (e: 'fontDialog'): void
  (e: 'setTheme', theme: string): void
  (e: 'toggleMarkdown'): void
  (e: 'settings'): void
  (e: 'about'): void
}>()

const editorStore = useEditorStore()
const configStore = useConfigStore()

const activeMenu = ref<string | null>(null)
const hoveredSubmenu = ref<number | null>(null)
const showCustomThemeDialog = ref(false)
const showAboutDialog = ref(false)

const submenuCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const fileMenu = computed<MenuItem[]>(() => [
  { label: '新建', shortcut: 'Ctrl+N', action: 'newFile' },
  { label: '打开', shortcut: 'Ctrl+O', action: 'openFile' },
  { label: '导入本地文件', action: 'importLocalFile' },
  { label: '保存', shortcut: 'Ctrl+S', action: 'saveFile' },
  { label: '另存为', action: 'saveAs' },
  { type: 'separator' },
  { label: '下载', action: 'download' },
  { type: 'separator' },
  {
    label: '生成分享链接',
    action: 'shareLink',
    disabled: !editorStore.currentFile || editorStore.isLocalFile,
  },
  {
    label: '生成 Raw 链接',
    action: 'rawLink',
    disabled: !editorStore.currentFile || editorStore.isLocalFile,
  },
  { label: '管理分享链接', action: 'manageShares' },
  { type: 'separator' },
  { label: '退出', action: 'exit' },
])

const editMenu: MenuItem[] = [
  { label: '撤销', shortcut: 'Ctrl+Z', action: 'undo' },
  { label: '重做', shortcut: 'Ctrl+Y', action: 'redo' },
  { type: 'separator' },
  { label: '剪切', shortcut: 'Ctrl+X', action: 'cut' },
  { label: '复制', shortcut: 'Ctrl+C', action: 'copy' },
  { label: '粘贴', shortcut: 'Ctrl+V', action: 'paste' },
  { label: '删除', shortcut: 'Del', action: 'delete' },
  { type: 'separator' },
  { label: '查找', shortcut: 'Ctrl+F', action: 'find' },
  { label: '替换', shortcut: 'Ctrl+H', action: 'replace' },
  { label: '转到', shortcut: 'Ctrl+G', action: 'goTo' },
  { type: 'separator' },
  { label: '全选', shortcut: 'Ctrl+A', action: 'selectAll' },
  { label: '时间/日期', shortcut: 'F5', action: 'insertDateTime' },
]

const themeMenuItems = computed<MenuItem[]>(() => [
  { label: '浅色', action: 'setTheme', checked: configStore.theme === 'light' },
  { label: '暗色', action: 'setTheme', checked: configStore.theme === 'dark' },
  { type: 'separator' },
  { label: '深蓝', action: 'setTheme', checked: configStore.theme === 'deep-blue' },
  { label: '护眼绿', action: 'setTheme', checked: configStore.theme === 'eye-green' },
  { label: '玫瑰', action: 'setTheme', checked: configStore.theme === 'rose' },
  { label: '琥珀', action: 'setTheme', checked: configStore.theme === 'amber' },
  { label: '紫色', action: 'setTheme', checked: configStore.theme === 'purple' },
  { type: 'separator' },
  { label: '自定义', action: 'setTheme', checked: configStore.theme === 'custom' },
])

const formatMenu = computed<MenuItem[]>(() => [
  { label: '自动换行', action: 'toggleAutoWrap', checked: editorStore.isAutoWrap },
  { type: 'separator' },
  { label: '字体', action: 'fontDialog' },
  { type: 'separator' },
  { label: `配色方案`, submenu: themeMenuItems.value },
])

const viewMenu = computed<MenuItem[]>(() => [
  { label: 'Markdown 预览', action: 'toggleMarkdown', checked: editorStore.isMarkdownPreview },
])

const helpMenu: MenuItem[] = [
  { label: '设置', action: 'settings' },
  { type: 'separator' },
  { label: '关于', action: 'about' },
]

const menus = computed(() => [
  { name: '文件', items: fileMenu.value },
  { name: '编辑', items: editMenu },
  { name: '格式', items: formatMenu.value },
  { name: '查看', items: viewMenu.value },
  { name: '帮助', items: helpMenu },
])

function openMenu(name: string) {
  activeMenu.value = activeMenu.value === name ? null : name
}

function closeMenu(e?: MouseEvent) {
  if (submenuCloseTimer.value) {
    clearTimeout(submenuCloseTimer.value)
    submenuCloseTimer.value = null
  }

  activeMenu.value = null
  hoveredSubmenu.value = null
}

function handleMenuBarMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  const menuItem = target.closest('.menu-item')
  if (!menuItem) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function openSubmenu(itemIndex: number) {
  if (submenuCloseTimer.value) {
    clearTimeout(submenuCloseTimer.value)
    submenuCloseTimer.value = null
  }
  hoveredSubmenu.value = itemIndex
}

function closeSubmenu(e?: MouseEvent) {
  const clientX = e?.clientX ?? 0
  const clientY = e?.clientY ?? 0

  submenuCloseTimer.value = setTimeout(() => {
    const element = document.elementFromPoint(clientX, clientY)
    const menuElement = document.querySelector('.menu-option-with-submenu:hover')
    const submenuElement = document.querySelector('.menu-subdropdown:hover')

    if (
      element?.closest('.menu-option-with-submenu') ||
      element?.closest('.menu-subdropdown') ||
      menuElement ||
      submenuElement
    ) {
      return
    }

    hoveredSubmenu.value = null
    submenuCloseTimer.value = null
  }, 150)
}

function handleAction(action: string) {
  emit(action as never)
  closeMenu()
}

const themeLabelMap: Record<string, string> = {
  浅色: 'light',
  暗色: 'dark',
  深蓝: 'deep-blue',
  护眼绿: 'eye-green',
  玫瑰: 'rose',
  琥珀: 'amber',
  紫色: 'purple',
  自定义: 'custom',
}

function handleSetTheme(label: string) {
  const themeValue = themeLabelMap[label] || 'custom'

  if (themeValue === 'custom') {
    showCustomThemeDialog.value = true
    closeMenu()
  } else {
    emit('setTheme', themeValue)
    closeMenu()
  }
}

function handleMenuItemClick(item: MenuItem, e: Event) {
  e.stopPropagation()
  if ('action' in item && item.action) {
    if (item.action === 'setTheme' && 'label' in item) {
      handleSetTheme(item.label)
    } else {
      handleAction(item.action)
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.menu-bar')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (submenuCloseTimer.value) {
    clearTimeout(submenuCloseTimer.value)
    submenuCloseTimer.value = null
  }
})
</script>

<template>
  <div class="menu-bar" @click="closeMenu">
    <div
      v-for="menu in menus"
      :key="menu.name"
      class="menu-item"
      :class="{ active: activeMenu === menu.name }"
      @click.stop="openMenu(menu.name)"
    >
      {{ menu.name }}

      <div v-if="activeMenu === menu.name" class="menu-dropdown">
        <template v-for="(item, index) in menu.items" :key="index">
          <div v-if="'type' in item && item.type === 'separator'" class="menu-separator"></div>
          <div
            v-else-if="'submenu' in item && item.submenu"
            class="menu-option menu-option-with-submenu"
            :class="{ checked: 'checked' in item && item.checked }"
            @mouseenter.stop="openSubmenu(index)"
            @mouseleave.stop="closeSubmenu($event)"
            @click.stop="openSubmenu(index)"
          >
            <span class="option-label">{{ 'label' in item ? item.label : '' }}</span>
            <span class="submenu-indicator">▶</span>

            <div
              v-if="hoveredSubmenu === index"
              class="menu-dropdown menu-subdropdown"
              @mouseenter.stop="openSubmenu(index)"
              @mouseleave.stop="closeSubmenu($event)"
            >
              <template v-for="(subItem, subIndex) in item.submenu" :key="subIndex">
                <div
                  v-if="'type' in subItem && subItem.type === 'separator'"
                  class="menu-separator"
                ></div>
                <button
                  v-else
                  class="menu-option"
                  :class="{
                    disabled: 'disabled' in subItem && subItem.disabled,
                    checked: 'checked' in subItem && subItem.checked,
                  }"
                  :disabled="'disabled' in subItem && subItem.disabled"
                  @click="(e) => handleMenuItemClick(subItem, e)"
                >
                  <span class="option-label">{{ 'label' in subItem ? subItem.label : '' }}</span>
                  <span v-if="'shortcut' in subItem && subItem.shortcut" class="option-shortcut">{{
                    subItem.shortcut
                  }}</span>
                </button>
              </template>
            </div>
          </div>
          <button
            v-else
            class="menu-option"
            :class="{
              disabled: 'disabled' in item && item.disabled,
              checked: 'checked' in item && item.checked,
            }"
            :disabled="'disabled' in item && item.disabled"
            @click="(e) => handleMenuItemClick(item, e)"
          >
            <span class="option-label">{{ 'label' in item ? item.label : '' }}</span>
            <span v-if="'shortcut' in item && item.shortcut" class="option-shortcut">{{
              item.shortcut
            }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>

  <CustomThemeDialog :visible="showCustomThemeDialog" @close="showCustomThemeDialog = false" />
  <AboutDialog :visible="showAboutDialog" @close="showAboutDialog = false" />
</template>

<style scoped>
.menu-option {
  padding-left: calc(32px * var(--scale));
}

.menu-option.checked::before {
  content: '✓';
  position: absolute;
  left: calc(12px * var(--scale));
  font-weight: 600;
}

.menu-option:hover.checked::before {
  color: white;
}

.menu-option-with-submenu {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: calc(8px * var(--scale)) calc(16px * var(--scale)) calc(8px * var(--scale))
    calc(32px * var(--scale));
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: left;
  font-weight: 400;
  transition: all var(--transition-fast);
}

.menu-option-with-submenu:hover {
  background: var(--accent-primary);
  color: white;
}

.submenu-indicator {
  font-size: calc(10px * var(--scale));
  margin-left: calc(8px * var(--scale));
  color: var(--text-secondary);
}

.menu-option-with-submenu:hover .submenu-indicator {
  color: rgba(255, 255, 255, 0.8);
}

.menu-subdropdown {
  position: absolute;
  top: 0;
  left: calc(100% + 4px);
  min-width: calc(140px * var(--scale));
}
</style>
