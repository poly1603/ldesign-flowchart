import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  output: {
    format: ['esm'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    '@ldesign/flowchart-core',
    'lit',
    '@lit/reactive-element',
    'lit-html',
  ],
})
