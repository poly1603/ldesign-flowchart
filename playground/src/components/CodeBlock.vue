<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/vs2015.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)

const props = defineProps<{
  code: string
  language?: string
}>()

const copied = ref(false)

const highlightedCode = computed(() => {
  const lang = props.language || 'typescript'
  try {
    return hljs.highlight(props.code.trim(), { language: lang }).value
  } catch {
    return props.code
  }
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code.trim())
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="code-block">
    <div class="code-header">
      <span class="code-lang">{{ language || 'typescript' }}</span>
      <button class="copy-btn" @click="copyCode">
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <div class="code-content">
      <pre><code v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>
