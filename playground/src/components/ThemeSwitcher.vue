<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

type ThemeMode = 'light' | 'dark' | 'system'

const currentTheme = ref<ThemeMode>('system')

const applyTheme = (theme: ThemeMode) => {
  let effectiveTheme: 'light' | 'dark' = 'light'
  
  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    effectiveTheme = theme
  }
  
  document.documentElement.setAttribute('data-theme', effectiveTheme)
  localStorage.setItem('theme', theme)
}

const setTheme = (theme: ThemeMode) => {
  currentTheme.value = theme
  applyTheme(theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as ThemeMode | null
  if (savedTheme) {
    currentTheme.value = savedTheme
    applyTheme(savedTheme)
  }
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme.value === 'system') {
      applyTheme('system')
    }
  })
})

watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
})
</script>

<template>
  <div class="theme-switcher">
    <button 
      class="theme-btn" 
      :class="{ active: currentTheme === 'light' }"
      @click="setTheme('light')"
      title="浅色模式"
    >
      <Sun :size="16" />
    </button>
    <button 
      class="theme-btn" 
      :class="{ active: currentTheme === 'dark' }"
      @click="setTheme('dark')"
      title="深色模式"
    >
      <Moon :size="16" />
    </button>
    <button 
      class="theme-btn" 
      :class="{ active: currentTheme === 'system' }"
      @click="setTheme('system')"
      title="跟随系统"
    >
      <Monitor :size="16" />
    </button>
  </div>
</template>
