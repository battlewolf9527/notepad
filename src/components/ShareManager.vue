<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import { useShareStore } from '../stores/share'
import { useToastStore } from '../stores/toast'
import { useConfirmStore } from '../stores/confirm'
import { useAuthStore } from '../stores/auth'
import { useModalClose } from '../composables/useModalClose'
import { useDraggable } from '../composables/useDraggable'
import { formatExpires, formatCreatedAt } from '../utils/share'
import { getOrigin } from '../utils/constants'
import { basename } from '../../types/shared'
import ConfirmDialog from './ConfirmDialog.vue'
import AdminLoginDialog from './AdminLoginDialog.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const shareStore = useShareStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const authStore = useAuthStore()

const dialogRef = ref<HTMLElement | null>(null)
const dialogDrag = useDraggable()

const selectedTokens = ref<string[]>([])
const showAdminLogin = ref(false)
const adminLoginError = ref('')

// 受保护链接验证相关状态
const showVerifyDialog = ref(false)
const verifyLinkId = ref<string>('')
const verifyFolderPath = ref<string>('')
const verifyPassword = ref('')
const verifyError = ref('')
const verifyDrag = useDraggable()

const allSelected = computed(() => {
  return shareStore.links.length > 0 && selectedTokens.value.length === shareStore.links.length
})

const hasSelection = computed(() => selectedTokens.value.length > 0)

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      dialogDrag.resetOffset()
      await shareStore.listLinks()
      selectedTokens.value = []
    }
  },
  { immediate: true },
)

watch(
  () => shareStore.links,
  () => {
    selectedTokens.value = []
  },
)

useModalClose(() => emit('close'))

function toggleSelect(token: string) {
  const index = selectedTokens.value.indexOf(token)
  if (index > -1) {
    selectedTokens.value = selectedTokens.value.filter((t) => t !== token)
  } else {
    selectedTokens.value = [...selectedTokens.value, token]
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedTokens.value = []
  } else {
    selectedTokens.value = shareStore.links.filter((link) => link.token).map((link) => link.token!)
  }
}

async function deleteLink(token: string) {
  const confirmed = await confirmStore.confirm('确定要删除这个分享链接吗？', '确认删除')
  if (confirmed) {
    await shareStore.deleteLink(token)
  }
}

async function deleteSelected() {
  const count = selectedTokens.value.length
  const confirmed = await confirmStore.confirm(
    `确定要删除选中的 ${count} 个分享链接吗？`,
    '确认删除',
  )
  if (confirmed) {
    const tokens = [...selectedTokens.value]
    await Promise.all(tokens.map((token) => shareStore.deleteLink(token)))
    selectedTokens.value = []
    toastStore.success(`已删除 ${count} 个分享链接`)
  }
}

async function deleteAll() {
  const count = shareStore.links.length
  const confirmed = await confirmStore.confirm(`确定要删除全部 ${count} 个分享链接吗？`, '确认删除')
  if (confirmed) {
    const tokens = shareStore.links.filter((link) => link.token).map((link) => link.token!)
    await Promise.all(tokens.map((token) => shareStore.deleteLink(token)))
    selectedTokens.value = []
    toastStore.success(`已删除全部 ${count} 个分享链接`)
  }
}

async function copyLink(url: string) {
  await navigator.clipboard.writeText(url)
  toastStore.success('链接已复制到剪贴板')
}

async function handleAdminLogin(password: string) {
  adminLoginError.value = ''
  const success = await authStore.loginAsAdmin(password)
  if (success) {
    showAdminLogin.value = false
    toastStore.success('管理员登录成功')
    await shareStore.listLinks()
  } else {
    adminLoginError.value = authStore.error || '管理员密码错误'
  }
}

function openAdminLogin() {
  adminLoginError.value = ''
  showAdminLogin.value = true
}

function closeAdminLogin() {
  showAdminLogin.value = false
  adminLoginError.value = ''
}

// 受保护链接的验证逻辑
function openVerifyDialog(id: string, folderPath: string) {
  verifyLinkId.value = id
  verifyFolderPath.value = folderPath
  verifyPassword.value = ''
  verifyError.value = ''
  verifyDrag.resetOffset()
  showVerifyDialog.value = true
}

function closeVerifyDialog() {
  showVerifyDialog.value = false
  verifyFolderPath.value = ''
  verifyPassword.value = ''
  verifyError.value = ''
}

async function handleVerifyPassword() {
  if (!verifyPassword.value.trim()) {
    verifyError.value = '请输入密码'
    return
  }

  const result = await shareStore.verifyLink(verifyLinkId.value, verifyPassword.value)
  if (result) {
    showVerifyDialog.value = false
    toastStore.success('验证成功')
  } else {
    verifyError.value = shareStore.error || '密码错误'
    verifyPassword.value = ''
  }
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div
      ref="dialogRef"
      class="modal-dialog share-manager-dialog"
      :style="
        dialogDrag.offset.value.x !== 0 || dialogDrag.offset.value.y !== 0
          ? {
              transform: `translate(${dialogDrag.offset.value.x}px, ${dialogDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="dialogDrag.onMouseDown">
        <span>管理分享链接</span>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div v-if="shareStore.links.length === 0" class="empty-state">暂无分享链接</div>

        <div v-else>
          <div class="toolbar">
            <div class="toolbar-left">
              <label v-if="authStore.isAdmin" class="select-all">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                全选
              </label>
              <button
                v-if="authStore.isAdmin && hasSelection"
                @click="deleteSelected"
                class="delete-selected-btn"
              >
                删除选中 ({{ selectedTokens.length }})
              </button>
            </div>
            <div class="toolbar-right">
              <button v-if="!authStore.isAdmin" @click="openAdminLogin" class="login-btn">
                管理员登录
              </button>
            </div>
          </div>

          <table class="links-table">
            <thead>
              <tr>
                <th v-if="authStore.isAdmin" class="checkbox-column">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                </th>
                <th>类型</th>
                <th>文件名</th>
                <th>创建时间</th>
                <th>过期时间</th>
                <th>一次性</th>
                <th>密码</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="link in shareStore.links"
                :key="link.token || link.id"
                :class="{ selected: link.token && selectedTokens.includes(link.token) }"
              >
                <td v-if="authStore.isAdmin" class="checkbox-column">
                  <input
                    v-if="link.token"
                    type="checkbox"
                    :checked="selectedTokens.includes(link.token)"
                    @change="toggleSelect(link.token)"
                  />
                </td>
                <td>
                  <span v-if="link.protected">🔒</span>
                  <template v-else>{{ link.type === 'view' ? '阅读视图' : 'Raw' }}</template>
                </td>
                <td :title="link.filename" class="filename-cell">{{ basename(link.filename) }}</td>
                <td>{{ formatCreatedAt(link.createdAt) }}</td>
                <td>{{ formatExpires(link.expires) }}</td>
                <td>{{ link.oneTime ? '是' : '否' }}</td>
                <td>{{ link.password ? '有' : '无' }}</td>
                <td class="actions">
                  <template v-if="link.protected">
                    <button
                      @click="openVerifyDialog(link.id!, link.protectedPath || '')"
                      class="verify-btn"
                    >
                      验证密码
                    </button>
                  </template>
                  <template v-else>
                    <button @click="copyLink(`${getOrigin()}/${link.type}/${link.token}`)">
                      复制
                    </button>
                  </template>
                  <button
                    v-if="authStore.isAdmin && link.token"
                    @click="deleteLink(link.token)"
                    class="delete-btn"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="footer-left">
          <button v-if="authStore.isAdmin" @click="deleteAll" class="delete-all-btn">
            删除全部
          </button>
        </div>
        <div class="footer-right">
          <button @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 受保护链接密码验证对话框 -->
  <div v-if="showVerifyDialog" class="modal-overlay" @click.self="closeVerifyDialog">
    <div
      class="modal-dialog verify-dialog"
      :style="
        verifyDrag.offset.value.x !== 0 || verifyDrag.offset.value.y !== 0
          ? {
              transform: `translate(${verifyDrag.offset.value.x}px, ${verifyDrag.offset.value.y}px)`,
            }
          : {}
      "
    >
      <div class="dialog-header" @mousedown="verifyDrag.onMouseDown">
        <span>验证文件夹密码</span>
        <button class="close-btn" @click="closeVerifyDialog">×</button>
      </div>
      <div class="dialog-body">
        <p>此分享链接属于受保护的文件夹</p>
        <p v-if="verifyFolderPath" class="folder-path">📁 {{ verifyFolderPath }}</p>
        <p>请输入文件夹密码以查看和复制链接。</p>
        <input
          v-model="verifyPassword"
          type="password"
          placeholder="密码"
          @keydown.enter="handleVerifyPassword"
        />
        <div v-if="verifyError" class="verify-error">{{ verifyError }}</div>
      </div>
      <div class="dialog-footer">
        <div></div>
        <div class="dialog-actions">
          <button class="primary" @click="handleVerifyPassword">确定</button>
          <button @click="closeVerifyDialog">取消</button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :visible="confirmStore.visible"
    :title="confirmStore.title"
    :message="confirmStore.message"
    @confirm="confirmStore.onConfirm"
    @cancel="confirmStore.onCancel"
  />

  <AdminLoginDialog
    :visible="showAdminLogin"
    title="管理员登录"
    message="删除分享链接需要管理员权限，请输入管理员密码。"
    :error="adminLoginError"
    @close="closeAdminLogin"
    @confirm="handleAdminLogin"
  />
</template>

<style scoped>
.share-manager-dialog {
  width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.login-btn {
  background: var(--accent-primary);
  color: white;
}

.login-btn:hover {
  background: var(--accent-hover);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
}

.select-all input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.toolbar button {
  padding: 5px 14px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.delete-selected-btn {
  background: var(--accent-primary);
  color: white;
}

.delete-selected-btn:hover {
  background: var(--accent-hover);
}

.delete-all-btn {
  background: #e74c3c;
  color: white;
}

.delete-all-btn:hover {
  background: #c0392b;
}

.links-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.links-table th,
.links-table td {
  border: none;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.links-table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
  padding: 10px 12px;
}

.links-table th:nth-child(1) {
  width: 40px;
  text-align: center;
}
.links-table th:nth-child(2) {
  width: 70px;
}
.links-table th:nth-child(3) {
  width: 200px;
}
.links-table th:nth-child(4) {
  width: 140px;
}
.links-table th:nth-child(5) {
  width: 100px;
}
.links-table th:nth-child(6) {
  width: 60px;
  text-align: center;
}
.links-table th:nth-child(7) {
  width: 50px;
  text-align: center;
}
.links-table th:nth-child(8) {
  width: 100px;
  text-align: center;
}

.links-table td:nth-child(1) {
  text-align: center;
}
.links-table td:nth-child(3) {
  white-space: normal;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.links-table td:nth-child(6) {
  text-align: center;
}
.links-table td:nth-child(7) {
  text-align: center;
}
.links-table td:nth-child(8) {
  text-align: center;
}

.checkbox-column input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.links-table tr:hover td {
  background: var(--bg-secondary);
}

.links-table tr.selected td {
  background: var(--accent-primary);
  color: white;
}

.links-table tr.selected .delete-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.links-table tr.selected .delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.actions button {
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.verify-btn {
  background: #f39c12;
  color: white;
}

.verify-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.dialog-footer button {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dialog-footer button:hover {
  background: var(--bg-secondary);
}

.dialog-footer .delete-all-btn {
  background: #e74c3c;
  color: white;
  border-color: #c0392b;
}

.dialog-footer .delete-all-btn:hover {
  background: #c0392b;
}

/* 验证密码对话框 */
.verify-dialog {
  width: calc(360px * var(--scale));
  max-width: 90vw;
}

.verify-dialog .dialog-body {
  padding: calc(20px * var(--scale)) calc(24px * var(--scale));
  min-height: calc(180px * var(--scale));
}

.verify-dialog .dialog-body p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: calc(8px * var(--scale));
}

.verify-dialog .dialog-body .folder-path {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 600;
  background: var(--bg-secondary);
  padding: calc(8px * var(--scale)) calc(12px * var(--scale));
  border-radius: var(--radius-sm);
  margin-bottom: calc(12px * var(--scale));
}

.verify-dialog .dialog-body input {
  width: 100%;
  padding: calc(12px * var(--scale)) calc(16px * var(--scale));
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  box-sizing: border-box;
  transition: all var(--transition-fast);
}

.verify-dialog .dialog-body input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 calc(3px * var(--scale)) rgba(74, 144, 217, 0.15);
  outline: none;
}

.verify-error {
  margin-top: calc(8px * var(--scale));
  padding: calc(8px * var(--scale)) calc(12px * var(--scale));
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--text-error);
  border-radius: var(--radius-sm);
  color: var(--text-error);
  font-size: var(--font-size-sm);
}

.dialog-actions {
  display: flex;
  gap: 8px;
}

.dialog-actions .primary {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.dialog-actions .primary:hover {
  background: var(--accent-hover);
}
</style>
