import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'child_process'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_BUILD_NUMBER': JSON.stringify(getGitCommit()),
  },
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '记事本',
        short_name: '记事本',
        description: '一个基于 Cloudflare 的在线记事本应用',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            options: {
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
        navigateFallbackDenylist: [/^\/view\//, /^\/raw\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@theme': fileURLToPath(new URL('./functions/utils/theme.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        'markdown-renderer': fileURLToPath(
          new URL('./src/utils/markdown-renderer.ts', import.meta.url),
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'markdown-renderer') {
            return 'assets/markdown-renderer.js'
          }
          return 'assets/[name]-[hash].js'
        },
        manualChunks(id: string): string | void {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('@vueuse')) {
              return 'vendor'
            }
            if (id.includes('jschardet')) {
              return 'jschardet'
            }
            if (id.includes('markdown-it') || id.includes('dompurify') || id.includes('katex')) {
              return 'markdown'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/view': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/raw': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
