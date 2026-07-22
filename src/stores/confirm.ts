import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ButtonConfig } from '../types'

export const useConfirmStore = defineStore('confirm', () => {
  const visible = ref(false)
  const title = ref('')
  const message = ref('')
  const buttons = ref<ButtonConfig[]>([])
  const resolve = ref<((value: 'yes' | 'no' | 'cancel') => void) | null>(null)

  function confirm(msg: string, confirmTitle = '确认'): Promise<boolean> {
    return new Promise((res) => {
      title.value = confirmTitle
      message.value = msg
      buttons.value = [
        { label: '确定', action: 'confirm', primary: true },
        { label: '取消', action: 'cancel' },
      ]
      resolve.value = (value: 'yes' | 'no' | 'cancel') => res(value === 'yes')
      visible.value = true
    })
  }

  function confirmThree(
    msg: string,
    confirmTitle = '确认',
    btnYes = '是',
    btnNo = '否',
    btnCancel = '取消',
  ): Promise<'yes' | 'no' | 'cancel'> {
    return new Promise((res) => {
      title.value = confirmTitle
      message.value = msg
      buttons.value = [
        { label: btnYes, action: 'confirm', primary: true },
        { label: btnNo, action: 'third' },
        { label: btnCancel, action: 'cancel' },
      ]
      resolve.value = res
      visible.value = true
    })
  }

  function onConfirm() {
    visible.value = false
    resolve.value?.('yes')
    resolve.value = null
  }

  function onThird() {
    visible.value = false
    resolve.value?.('no')
    resolve.value = null
  }

  function onCancel() {
    visible.value = false
    resolve.value?.('cancel')
    resolve.value = null
  }

  return {
    visible,
    title,
    message,
    buttons,
    confirm,
    confirmThree,
    onConfirm,
    onThird,
    onCancel,
  }
})
