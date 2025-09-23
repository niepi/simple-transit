import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**' // Exclude E2E tests from Vitest
    ],
  },
  resolve: {
    alias: {
      'virtual:pwa-register': new URL('./src/__mocks__/virtual-pwa-register.ts', import.meta.url).pathname
    }
  }
})
