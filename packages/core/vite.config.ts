import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FlowchartCore',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['eventemitter3', 'uuid', 'lodash-es'],
      output: {
        globals: {
          'eventemitter3': 'EventEmitter3',
          'uuid': 'uuid',
          'lodash-es': '_'
        }
      }
    }
  }
})
