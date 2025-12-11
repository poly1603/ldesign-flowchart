import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@flowchart/core': resolve(__dirname, '../packages/core/src'),
      '@flowchart/vue': resolve(__dirname, '../packages/vue/src'),
    },
  },
  server: {
    port: 9988,
    open: true,
    host: true
  },
})
