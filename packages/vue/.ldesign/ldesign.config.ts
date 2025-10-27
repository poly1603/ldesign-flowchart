import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  framework: 'vue3',

  output: {
    format: ['esm', 'cjs'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  skipUMD: true,

  external: [
    '@ldesign/flowchart-core',
    'vue',
    '@vueuse/core',
  ],
})
