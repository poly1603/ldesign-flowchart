# 🎯 @ldesign/flowchart - 企业级审批流程图设计器

一个功能强大、多框架支持的审批流程图设计器，专为企业级应用打造。

## ✨ 特性

- 🚀 **高性能渲染** - 基于SVG的矢量渲染引擎，支持大规模流程图
- 📦 **多框架支持** - 提供React、Vue、Lit Web Components适配器
- 🔧 **插件系统** - 灵活的插件机制，易于扩展功能
- 🎨 **丰富的节点类型** - 内置审批、网关、决策等多种节点类型
- 💾 **历史记录** - 完整的撤销/重做支持
- 🔍 **小地图导航** - 便于大型流程图的浏览和定位
- 📐 **自动布局** - 智能的流程图自动排版算法
- 🌐 **国际化** - 支持多语言切换

## 📦 包结构

```
@ldesign/flowchart
├── @ldesign/flowchart-core      # 核心引擎
├── @ldesign/flowchart-react     # React组件
├── @ldesign/flowchart-vue       # Vue组件
└── @ldesign/flowchart-lit       # Lit Web Components
```

## 🚀 快速开始

### 安装

```bash
# 核心包
npm install @ldesign/flowchart-core

# React
npm install @ldesign/flowchart-react

# Vue
npm install @ldesign/flowchart-vue

# Lit
npm install @ldesign/flowchart-lit
```

### React 示例

```tsx
import React, { useState } from 'react'
import { FlowDesigner } from '@ldesign/flowchart-react'

function App() {
  const [flowData, setFlowData] = useState({
    nodes: [
      { id: 'start', type: 'start', label: '开始', position: { x: 100, y: 100 } },
      { id: 'approval', type: 'approval', label: '审批', position: { x: 100, y: 200 } },
      { id: 'end', type: 'end', label: '结束', position: { x: 100, y: 300 } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'approval' },
      { id: 'e2', source: 'approval', target: 'end' }
    ]
  })

  return (
    <FlowDesigner
      data={flowData}
      onChange={setFlowData}
      showToolbar
      showSidebar
      showPropertyPanel
      showMinimap
    />
  )
}
```

### Vue 示例

```vue
<template>
  <FlowDesigner
    v-model:data="flowData"
    :show-toolbar="true"
    :show-sidebar="true"
    :show-property-panel="true"
    :show-minimap="true"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue'
import { FlowDesigner } from '@ldesign/flowchart-vue'

const flowData = ref({
  nodes: [
    { id: 'start', type: 'start', label: '开始', position: { x: 100, y: 100 } },
    { id: 'approval', type: 'approval', label: '审批', position: { x: 100, y: 200 } },
    { id: 'end', type: 'end', label: '结束', position: { x: 100, y: 300 } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'approval' },
    { id: 'e2', source: 'approval', target: 'end' }
  ]
})

const handleChange = (data) => {
  console.log('Flow changed:', data)
}
</script>
```

### Lit Web Components 示例

```html
<flow-designer
  show-toolbar
  show-sidebar
  show-property-panel
  show-minimap
></flow-designer>

<script type="module">
  import '@ldesign/flowchart-lit'
  
  const designer = document.querySelector('flow-designer')
  designer.data = {
    nodes: [
      { id: 'start', type: 'start', label: '开始', position: { x: 100, y: 100 } },
      { id: 'approval', type: 'approval', label: '审批', position: { x: 100, y: 200 } },
      { id: 'end', type: 'end', label: '结束', position: { x: 100, y: 300 } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'approval' },
      { id: 'e2', source: 'approval', target: 'end' }
    ]
  }
</script>
```

## 🎯 节点类型

| 类型 | 说明 | 图标 | 用途 |
|------|------|------|------|
| `start` | 开始节点 | 🟢 | 流程起点 |
| `end` | 结束节点 | 🔴 | 流程终点 |
| `process` | 处理节点 | 🔵 | 一般处理步骤 |
| `approval` | 审批节点 | 🟣 | 需要审批的步骤 |
| `decision` | 决策节点 | 🔶 | 条件判断分支 |
| `gateway` | 网关节点 | ⭐ | 并行/排他网关 |

## 🔌 插件系统

### 内置插件

- **SelectionPlugin** - 节点和连线选择
- **MinimapPlugin** - 小地图导航
- **KeyboardPlugin** - 快捷键支持
- **AlignmentPlugin** - 对齐辅助线
- **ExportPlugin** - 导出功能
- **HistoryPlugin** - 历史记录

### 自定义插件

```typescript
import { BasePlugin } from '@ldesign/flowchart-core'

class MyPlugin extends BasePlugin {
  name = 'my-plugin'
  
  onInit() {
    console.log('Plugin initialized')
  }
  
  onEnable() {
    // 添加事件监听等
  }
  
  onDisable() {
    // 清理资源
  }
  
  onDestroy() {
    // 销毁插件
  }
}
```

## 🎨 主题定制

支持通过CSS变量自定义主题：

```css
.flow-designer {
  --flow-primary-color: #1890ff;
  --flow-node-bg: #ffffff;
  --flow-node-border: #d9d9d9;
  --flow-edge-color: #666666;
  --flow-grid-color: #f0f0f0;
}
```

## 📋 API 文档

### FlowDesigner Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `FlowData` | - | 流程图数据 |
| `readonly` | `boolean` | `false` | 只读模式 |
| `showToolbar` | `boolean` | `true` | 显示工具栏 |
| `showSidebar` | `boolean` | `true` | 显示侧边栏 |
| `showPropertyPanel` | `boolean` | `true` | 显示属性面板 |
| `showMinimap` | `boolean` | `true` | 显示小地图 |
| `config` | `FlowDesignerConfig` | - | 设计器配置 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `change` | `(data: FlowData) => void` | 数据变化 |
| `node-select` | `(node: NodeData) => void` | 节点选中 |
| `edge-select` | `(edge: EdgeData) => void` | 连线选中 |
| `node-add` | `(node: NodeData) => void` | 节点添加 |
| `node-remove` | `(nodeId: string) => void` | 节点删除 |
| `edge-add` | `(edge: EdgeData) => void` | 连线添加 |
| `edge-remove` | `(edgeId: string) => void` | 连线删除 |

### Hooks (React)

```typescript
import { useFlow } from '@ldesign/flowchart-react'

const {
  data,
  nodes,
  edges,
  addNode,
  updateNode,
  removeNode,
  addEdge,
  updateEdge,
  removeEdge,
  undo,
  redo,
  canUndo,
  canRedo,
  validateFlow,
  exportJSON,
  importJSON
} = useFlow({
  initialData,
  onChange: (data) => console.log(data)
})
```

### Composables (Vue)

```typescript
import { useFlow } from '@ldesign/flowchart-vue'

const flow = useFlow({
  initialData,
  onChange: (data) => console.log(data)
})

// 使用方法与React Hook相同
```

## 🏗️ 开发

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 运行React演示
pnpm demo:react

# 运行Vue演示
pnpm demo:vue

# 运行Lit演示
pnpm demo:lit
```

## 📝 审批流程示例

### 请假审批流程

```typescript
const leaveApprovalFlow = {
  nodes: [
    { id: 'start', type: 'start', label: '开始', position: { x: 100, y: 100 } },
    { id: 'apply', type: 'process', label: '填写请假申请', position: { x: 100, y: 200 } },
    { id: 'manager', type: 'approval', label: '主管审批', position: { x: 100, y: 300 } },
    { id: 'hr', type: 'approval', label: 'HR审批', position: { x: 100, y: 400 } },
    { id: 'end', type: 'end', label: '结束', position: { x: 100, y: 500 } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'apply' },
    { id: 'e2', source: 'apply', target: 'manager' },
    { id: 'e3', source: 'manager', target: 'hr' },
    { id: 'e4', source: 'hr', target: 'end' }
  ]
}
```

### 报销审批流程（带条件分支）

```typescript
const reimbursementFlow = {
  nodes: [
    { id: 'start', type: 'start', label: '开始', position: { x: 300, y: 50 } },
    { id: 'apply', type: 'process', label: '填写报销单', position: { x: 300, y: 150 } },
    { id: 'check', type: 'decision', label: '金额判断', position: { x: 300, y: 250 } },
    { id: 'manager', type: 'approval', label: '经理审批', position: { x: 200, y: 350 } },
    { id: 'director', type: 'approval', label: '总监审批', position: { x: 400, y: 350 } },
    { id: 'finance', type: 'approval', label: '财务审核', position: { x: 300, y: 450 } },
    { id: 'end', type: 'end', label: '结束', position: { x: 300, y: 550 } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'apply' },
    { id: 'e2', source: 'apply', target: 'check' },
    { id: 'e3', source: 'check', target: 'manager', label: '≤5000' },
    { id: 'e4', source: 'check', target: 'director', label: '>5000' },
    { id: 'e5', source: 'manager', target: 'finance' },
    { id: 'e6', source: 'director', target: 'finance' },
    { id: 'e7', source: 'finance', target: 'end' }
  ]
}
```

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

MIT License © 2024 LDesign Team
