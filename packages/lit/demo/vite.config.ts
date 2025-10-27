import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5003,
    open: true
  },
  optimizeDeps: {
    include: ['lit']
  }
})
