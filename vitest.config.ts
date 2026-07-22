import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['functions/**/*.ts'],
      exclude: ['functions/types/**'],
    },
    typecheck: {
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@functions': path.resolve(__dirname, 'functions'),
    },
  },
})
