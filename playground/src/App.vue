<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  GitBranch,
  Users,
  Split,
  MousePointer,
  CheckCircle,
  Play,
  Edit3,
  Layers,
  Palette,
} from 'lucide-vue-next'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const router = useRouter()

const basicExamples = [
  { path: '/', name: '首页', icon: Home },
  { path: '/basic', name: '基础示例', icon: Play },
  { path: '/approval-flow', name: '审批流程', icon: Users },
  { path: '/condition-branch', name: '条件分支', icon: GitBranch },
  { path: '/parallel-branch', name: '并行分支', icon: Split },
]

const advancedExamples = [
  { path: '/complex-flow', name: '复杂流程', icon: Layers },
  { path: '/events', name: '事件交互', icon: MousePointer },
  { path: '/validation', name: '流程验证', icon: CheckCircle },
]

const editorExamples = [
  { path: '/editor', name: '流程编辑器', icon: Edit3 },
  { path: '/themes', name: '主题样式', icon: Palette },
]

const currentPath = computed(() => route.path)

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="app-sidebar">
      <div class="app-logo">
        <h1>Flowchart</h1>
        <p>OA流程审批插件</p>
      </div>
      <nav class="app-nav">
        <div class="nav-group">
          <div class="nav-group-title">基础示例</div>
          <div
            v-for="item in basicExamples"
            :key="item.path"
            class="nav-item"
            :class="{ active: currentPath === item.path }"
            @click="navigateTo(item.path)"
          >
            <component :is="item.icon" class="nav-item-icon" :size="18" />
            <span class="nav-item-text">{{ item.name }}</span>
          </div>
        </div>
        <div class="nav-group">
          <div class="nav-group-title">高级示例</div>
          <div
            v-for="item in advancedExamples"
            :key="item.path"
            class="nav-item"
            :class="{ active: currentPath === item.path }"
            @click="navigateTo(item.path)"
          >
            <component :is="item.icon" class="nav-item-icon" :size="18" />
            <span class="nav-item-text">{{ item.name }}</span>
          </div>
        </div>
        <div class="nav-group">
          <div class="nav-group-title">编辑器</div>
          <div
            v-for="item in editorExamples"
            :key="item.path"
            class="nav-item"
            :class="{ active: currentPath === item.path }"
            @click="navigateTo(item.path)"
          >
            <component :is="item.icon" class="nav-item-icon" :size="18" />
            <span class="nav-item-text">{{ item.name }}</span>
          </div>
        </div>
      </nav>
      <!-- 主题切换 -->
      <div style="padding: 16px; border-top: 1px solid var(--border-color);">
        <ThemeSwitcher />
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="app-main">
      <div class="app-content">
        <router-view />
      </div>
    </main>
  </div>
</template>
