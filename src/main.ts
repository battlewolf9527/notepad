import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'

import './styles/notepad.css'
import { injectThemeStyles } from './utils/theme-styles'

import App from './App.vue'

injectThemeStyles()

const app = createApp(App)

app.use(createPinia())

app.mount('#app')

registerSW({
  onNeedRefresh() {
    if (confirm('发现新版本，是否刷新？')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('应用已缓存，可离线使用')
  },
})
