<script setup lang="ts">
import { ref } from 'vue'
import { Play, Code } from 'lucide-vue-next'

defineSlots<{
  native(): any
  vue(): any
  code(): any
}>()

const props = defineProps<{
  defaultTab?: 'native' | 'vue' | 'code'
}>()

const activeTab = ref<'native' | 'vue' | 'code'>(props.defaultTab || 'native')

const tabs: Array<{ key: 'native' | 'vue' | 'code'; label: string; icon: typeof Play }> = [
  { key: 'native', label: '原生 JS', icon: Play },
  { key: 'vue', label: 'Vue 组件', icon: Play },
  { key: 'code', label: '查看代码', icon: Code },
]
</script>

<template>
  <div class="tab-container">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="16" style="margin-right: 6px" />
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <div v-show="activeTab === 'native'" class="tab-pane active">
        <slot name="native"></slot>
      </div>
      <div v-show="activeTab === 'vue'" class="tab-pane active">
        <slot name="vue"></slot>
      </div>
      <div v-show="activeTab === 'code'" class="tab-pane active">
        <slot name="code"></slot>
      </div>
    </div>
  </div>
</template>
