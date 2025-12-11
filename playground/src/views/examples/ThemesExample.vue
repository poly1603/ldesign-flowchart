<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Flowchart, type FlowDefinition } from '@flowchart/core'

type FlowchartTheme = 'default' | 'dark' | 'colorful' | 'minimal' | 'blueprint'

let flowchartInstance: Flowchart | null = null
const canvasRef = ref<HTMLElement | null>(null)
const currentTheme = ref<FlowchartTheme>('default')

const themes: { id: FlowchartTheme; name: string; description: string }[] = [
  { id: 'default', name: '默认主题', description: '清新简约的默认样式' },
  { id: 'dark', name: '暗黑主题', description: '适合深色背景的主题' },
  { id: 'colorful', name: '多彩主题', description: '色彩丰富的节点样式' },
  { id: 'minimal', name: '极简主题', description: '简洁的线条风格' },
  { id: 'blueprint', name: '蓝图主题', description: '工程图纸风格' },
]

const themeStyles: Record<FlowchartTheme, Record<string, string>> = {
  default: {
    '--fc-bg': '#f8fafc',
    '--fc-grid': '#e2e8f0',
    '--fc-node-bg': '#ffffff',
    '--fc-node-border': '#e2e8f0',
    '--fc-edge-color': '#94a3b8',
  },
  dark: {
    '--fc-bg': '#1a1a2e',
    '--fc-grid': '#16213e',
    '--fc-node-bg': '#0f3460',
    '--fc-node-border': '#1a1a2e',
    '--fc-edge-color': '#e94560',
  },
  colorful: {
    '--fc-bg': '#fef3c7',
    '--fc-grid': '#fcd34d',
    '--fc-node-bg': '#ffffff',
    '--fc-node-border': '#f59e0b',
    '--fc-edge-color': '#8b5cf6',
  },
  minimal: {
    '--fc-bg': '#ffffff',
    '--fc-grid': '#f3f4f6',
    '--fc-node-bg': '#ffffff',
    '--fc-node-border': '#d1d5db',
    '--fc-edge-color': '#9ca3af',
  },
  blueprint: {
    '--fc-bg': '#1e3a5f',
    '--fc-grid': '#2d4a6f',
    '--fc-node-bg': '#2d4a6f',
    '--fc-node-border': '#4a90d9',
    '--fc-edge-color': '#4a90d9',
  },
}

const flowData: FlowDefinition = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 300, y: 50 }, data: { label: '开始' } },
    { id: 'approval-1', type: 'approval', position: { x: 300, y: 150 }, data: { label: '主管审批', approvers: [{ id: '1', name: '主管', type: 'role' }], approvalMode: 'any' } },
    { id: 'condition', type: 'condition', position: { x: 300, y: 260 }, data: { label: '金额判断' } },
    { id: 'approval-2', type: 'approval', position: { x: 150, y: 370 }, data: { label: '财务审批', approvers: [{ id: '2', name: '财务', type: 'role' }], approvalMode: 'any' } },
    { id: 'approval-3', type: 'approval', position: { x: 450, y: 370 }, data: { label: '总监审批', approvers: [{ id: '3', name: '总监', type: 'role' }], approvalMode: 'any' } },
    { id: 'end', type: 'end', position: { x: 300, y: 480 }, data: { label: '结束' } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'approval-1' },
    { id: 'e2', source: 'approval-1', target: 'condition' },
    { id: 'e3', source: 'condition', target: 'approval-2', data: { label: '< 1万' } },
    { id: 'e4', source: 'condition', target: 'approval-3', data: { label: '>= 1万' } },
    { id: 'e5', source: 'approval-2', target: 'end' },
    { id: 'e6', source: 'approval-3', target: 'end' },
  ],
}

const applyTheme = (theme: FlowchartTheme) => {
  if (!canvasRef.value) return
  
  const styles = themeStyles[theme]
  Object.entries(styles).forEach(([key, value]) => {
    canvasRef.value!.style.setProperty(key, value)
  })
  
  // 设置文字颜色
  const isDark = theme === 'dark' || theme === 'blueprint'
  canvasRef.value.style.setProperty('--fc-text-color', isDark ? '#f1f5f9' : '#262626')
}

watch(currentTheme, (theme) => {
  applyTheme(theme)
})

onMounted(() => {
  if (canvasRef.value) {
    flowchartInstance = new Flowchart(canvasRef.value, {
      data: flowData,
      canvas: {
        height: 550,
        grid: { enabled: true, size: 20, color: 'var(--fc-grid)' },
      },
    })
    
    applyTheme(currentTheme.value)
  }
})

onUnmounted(() => {
  flowchartInstance?.destroy()
})
</script>

<template>
  <div class="example-page">
    <div class="example-header">
      <h1 class="example-title">主题样式</h1>
      <p class="example-desc">
        流程图支持多种主题样式，可以根据不同的使用场景选择合适的主题。
        点击下方主题卡片切换查看效果。
      </p>
    </div>

    <!-- 主题选择 -->
    <div class="themes-grid">
      <div
        v-for="theme in themes"
        :key="theme.id"
        class="theme-card"
        :class="{ active: currentTheme === theme.id }"
        @click="currentTheme = theme.id"
      >
        <div class="theme-preview" :class="theme.id"></div>
        <div class="theme-info">
          <div class="theme-name">{{ theme.name }}</div>
          <div class="theme-desc">{{ theme.description }}</div>
        </div>
      </div>
    </div>

    <div class="example-section">
      <div ref="canvasRef" class="flowchart-container theme-canvas" style="height: 550px;"></div>
    </div>
  </div>
</template>

<style scoped>
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.theme-card {
  background: var(--bg-elevated);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

.theme-preview {
  height: 80px;
  position: relative;
}

.theme-preview::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid;
}

.theme-preview.default {
  background: #f8fafc;
}
.theme-preview.default::before {
  background: #fff;
  border-color: #e2e8f0;
}

.theme-preview.dark {
  background: #1a1a2e;
}
.theme-preview.dark::before {
  background: #0f3460;
  border-color: #e94560;
}

.theme-preview.colorful {
  background: #fef3c7;
}
.theme-preview.colorful::before {
  background: #fff;
  border-color: #f59e0b;
}

.theme-preview.minimal {
  background: #fff;
}
.theme-preview.minimal::before {
  background: #fff;
  border-color: #d1d5db;
}

.theme-preview.blueprint {
  background: #1e3a5f;
}
.theme-preview.blueprint::before {
  background: #2d4a6f;
  border-color: #4a90d9;
}

.theme-info {
  padding: 12px;
}

.theme-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.theme-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.theme-canvas {
  transition: all 0.3s ease;
}
</style>
