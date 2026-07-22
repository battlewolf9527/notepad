import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  const timers = ref<Record<string, ReturnType<typeof setTimeout>>>({})

  const show = (message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2)

    if (timers.value[id]) {
      clearTimeout(timers.value[id])
      delete timers.value[id]
    }

    toasts.value.push({ id, message, type })

    const timer = setTimeout(() => {
      remove(id)
    }, duration)

    timers.value[id] = timer
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }

    if (timers.value[id]) {
      clearTimeout(timers.value[id])
      delete timers.value[id]
    }
  }

  const clear = () => {
    Object.values(timers.value).forEach((timer) => {
      clearTimeout(timer)
    })
    timers.value = {}
    toasts.value = []
  }

  const success = (message: string, duration?: number) => show(message, 'success', duration)
  const error = (message: string, duration?: number) => show(message, 'error', duration)
  const info = (message: string, duration?: number) => show(message, 'info', duration)
  const warning = (message: string, duration?: number) => show(message, 'warning', duration)

  return { toasts, show, remove, clear, success, error, info, warning }
})
