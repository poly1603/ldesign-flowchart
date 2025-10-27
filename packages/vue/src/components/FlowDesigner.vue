<template>
  <div :class="['flow-designer', className]" :style="style">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="flow-designer-toolbar">
      <button @click="handleUndo" :disabled="!canUndo || readonly">
        撤销
      </button>
      <button @click="handleRedo" :disabled="!canRedo || readonly">
        重做
      </button>
      <button @click="handleDelete" :disabled="(!selectedNode && !selectedEdge) || readonly">
        删除
      </button>
      <button @click="handleExport">导出</button>
      <div class="flow-designer-toolbar-spacer" />
      <button v-if="showSidebar" @click="sidebarCollapsed = !sidebarCollapsed">
        {{ sidebarCollapsed ? '显示节点面板' : '隐藏节点面板' }}
      </button>
      <button v-if="showPropertyPanel" @click="propertyPanelCollapsed = !propertyPanelCollapsed">
        {{ propertyPanelCollapsed ? '显示属性面板' : '隐藏属性面板' }}
      </button>
    </div>

    <div class="flow-designer-body">
      <!-- 侧边栏 -->
      <div v-if="showSidebar" :class="['flow-designer-sidebar', { collapsed: sidebarCollapsed }]">
        <div class="flow-designer-sidebar-header">节点面板</div>
        <div class="flow-designer-node-palette">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="flow-designer-node-item"
            :draggable="!readonly"
            @dragstart="handleDragStart($event, nodeType.type)"
            :style="{ borderColor: nodeType.color }"
          >
            <div 
              class="flow-designer-node-icon"
              :style="{ backgroundColor: nodeType.color }"
            />
            <span>{{ nodeType.label }}</span>
          </div>
        </div>
      </div>

      <!-- 主画布 -->
      <div class="flow-designer-main">
        <div
          ref="canvasRef"
          class="flow-designer-canvas"
          @dragover="handleDragOver"
          @drop="handleDrop"
        />
      </div>

      <!-- 属性面板 -->
      <div
        v-if="showPropertyPanel && (selectedNode || selectedEdge)"
        :class="['flow-designer-property-panel', { collapsed: propertyPanelCollapsed }]"
      >
        <div class="flow-designer-property-header">
          {{ selectedNode ? '节点属性' : '连线属性' }}
        </div>
        <div class="flow-designer-property-content">
          <!-- 节点属性 -->
          <template v-if="selectedNode">
            <div class="flow-designer-property-group">
              <label>ID</label>
              <input type="text" :value="selectedNode.id" disabled />
            </div>
            <div class="flow-designer-property-group">
              <label>标签</label>
              <input
                type="text"
                v-model="nodeLabel"
                @change="handlePropertyChange('label', nodeLabel)"
                :disabled="readonly"
              />
            </div>
            <div class="flow-designer-property-group">
              <label>类型</label>
              <select
                v-model="nodeType"
                @change="handlePropertyChange('type', nodeType)"
                :disabled="readonly"
              >
                <option v-for="nt in nodeTypes" :key="nt.type" :value="nt.type">
                  {{ nt.label }}
                </option>
              </select>
            </div>
            <div class="flow-designer-property-group">
              <label>状态</label>
              <select
                v-model="nodeStatus"
                @change="handlePropertyChange('status', nodeStatus)"
                :disabled="readonly"
              >
                <option value="">无</option>
                <option value="pending">待处理</option>
                <option value="running">处理中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="skipped">跳过</option>
              </select>
            </div>
          </template>

          <!-- 连线属性 -->
          <template v-if="selectedEdge">
            <div class="flow-designer-property-group">
              <label>ID</label>
              <input type="text" :value="selectedEdge.id" disabled />
            </div>
            <div class="flow-designer-property-group">
              <label>标签</label>
              <input
                type="text"
                v-model="edgeLabel"
                @change="handlePropertyChange('label', edgeLabel)"
                :disabled="readonly"
              />
            </div>
            <div class="flow-designer-property-group">
              <label>源节点</label>
              <input type="text" :value="selectedEdge.source" disabled />
            </div>
            <div class="flow-designer-property-group">
              <label>目标节点</label>
              <input type="text" :value="selectedEdge.target" disabled />
            </div>
            <div class="flow-designer-property-group">
              <label>动画</label>
              <input
                type="checkbox"
                v-model="edgeAnimated"
                @change="handlePropertyChange('animated', edgeAnimated)"
                :disabled="readonly"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { FlowModel, NodeModel, EdgeModel } from '@ldesign/flowchart-core/models'
import { SVGEngine } from '@ldesign/flowchart-core/engine'
import { SelectionPlugin, MinimapPlugin } from '@ldesign/flowchart-core/plugins'
import type { FlowData, NodeData, EdgeData, FlowDesignerConfig } from '@ldesign/flowchart-core/types'

// Props
interface Props {
  data?: FlowData
  config?: FlowDesignerConfig
  readonly?: boolean
  showToolbar?: boolean
  showSidebar?: boolean
  showPropertyPanel?: boolean
  showMinimap?: boolean
  className?: string
  style?: any
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showToolbar: true,
  showSidebar: true,
  showPropertyPanel: true,
  showMinimap: true
})

// Emits
const emit = defineEmits<{
  'update:data': [data: FlowData]
  'node-select': [node: NodeData | null]
  'edge-select': [edge: EdgeData | null]
  'change': [data: FlowData]
}>()

// 节点类型定义
const nodeTypes = [
  { type: 'start', label: '开始', color: '#52c41a' },
  { type: 'process', label: '处理', color: '#1890ff' },
  { type: 'decision', label: '判断', color: '#faad14' },
  { type: 'approval', label: '审批', color: '#722ed1' },
  { type: 'gateway', label: '网关', color: '#fa8c16' },
  { type: 'end', label: '结束', color: '#ff4d4f' }
]

// Refs
const canvasRef = ref<HTMLElement>()
const flowModel = ref<FlowModel>()
const renderer = ref<SVGEngine>()
const selectionPlugin = ref<SelectionPlugin>()
const minimapPlugin = ref<MinimapPlugin>()

// State
const selectedNode = ref<NodeModel | null>(null)
const selectedEdge = ref<EdgeModel | null>(null)
const canUndo = ref(false)
const canRedo = ref(false)
const sidebarCollapsed = ref(false)
const propertyPanelCollapsed = ref(false)

// 属性编辑的临时变量
const nodeLabel = computed({
  get: () => selectedNode.value?.label || '',
  set: (value) => {
    if (selectedNode.value) {
      selectedNode.value.label = value
    }
  }
})

const nodeType = computed({
  get: () => selectedNode.value?.type || 'default',
  set: (value) => {
    if (selectedNode.value) {
      selectedNode.value.type = value as any
    }
  }
})

const nodeStatus = computed({
  get: () => selectedNode.value?.status || '',
  set: (value) => {
    if (selectedNode.value) {
      selectedNode.value.status = value as any
    }
  }
})

const edgeLabel = computed({
  get: () => selectedEdge.value?.label || '',
  set: (value) => {
    if (selectedEdge.value) {
      selectedEdge.value.label = value
    }
  }
})

const edgeAnimated = computed({
  get: () => selectedEdge.value?.animated || false,
  set: (value) => {
    if (selectedEdge.value) {
      selectedEdge.value.animated = value
    }
  }
})

// 初始化设计器
const initDesigner = () => {
  if (!canvasRef.value) return

  // 初始化数据模型
  flowModel.value = new FlowModel(props.data)
  
  // 初始化渲染引擎
  renderer.value = new SVGEngine()
  renderer.value.init(canvasRef.value)
  
  // 初始化插件
  const pluginContext = {
    flowModel: flowModel.value,
    renderer: renderer.value,
    container: canvasRef.value,
    config: props.config || {},
    plugins: new Map()
  }
  
  // 选择插件
  selectionPlugin.value = new SelectionPlugin()
  selectionPlugin.value.init(pluginContext)
  selectionPlugin.value.enable()
  
  // 小地图插件
  if (props.showMinimap) {
    minimapPlugin.value = new MinimapPlugin()
    minimapPlugin.value.init(pluginContext)
    minimapPlugin.value.enable()
  }
  
  // 监听事件
  flowModel.value.on('nodeSelected', ({ node }: any) => {
    selectedNode.value = node
    selectedEdge.value = null
    emit('node-select', node.toJSON())
  })
  
  flowModel.value.on('edgeSelected', ({ edge }: any) => {
    selectedEdge.value = edge
    selectedNode.value = null
    emit('edge-select', edge.toJSON())
  })
  
  flowModel.value.on('selectionCleared', () => {
    selectedNode.value = null
    selectedEdge.value = null
    emit('node-select', null)
    emit('edge-select', null)
  })
  
  // 监听数据变化
  const handleDataChanged = () => {
    const data = flowModel.value!.toJSON()
    emit('update:data', data)
    emit('change', data)
    updateHistoryState()
    renderFlow()
  }
  
  flowModel.value.on('nodeAdded', handleDataChanged)
  flowModel.value.on('nodeRemoved', handleDataChanged)
  flowModel.value.on('nodeUpdated', handleDataChanged)
  flowModel.value.on('edgeAdded', handleDataChanged)
  flowModel.value.on('edgeRemoved', handleDataChanged)
  flowModel.value.on('edgeUpdated', handleDataChanged)
  
  // 初始渲染
  renderFlow()
  updateHistoryState()
}

// 渲染流程图
const renderFlow = () => {
  if (!flowModel.value || !renderer.value) return
  
  const nodes = flowModel.value.getNodes()
  const edges = flowModel.value.getEdges()
  
  const elements = [
    ...edges.map(edge => ({
      id: edge.id,
      type: 'edge' as const,
      data: edge.toJSON(),
      layer: 'edges',
      visible: true,
      interactive: !props.readonly,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    })),
    ...nodes.map(node => ({
      id: node.id,
      type: 'node' as const,
      data: node.toJSON(),
      layer: 'nodes',
      visible: true,
      interactive: !props.readonly,
      bounds: node.getBounds()
    }))
  ]
  
  renderer.value.render(elements)
}

// 更新历史状态
const updateHistoryState = () => {
  if (!flowModel.value) return
  canUndo.value = flowModel.value.canUndo()
  canRedo.value = flowModel.value.canRedo()
}

// 处理拖拽开始
const handleDragStart = (e: DragEvent, nodeType: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('nodeType', nodeType)
  }
}

// 处理拖拽经过
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

// 处理放置
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  
  if (!e.dataTransfer || !flowModel.value || !canvasRef.value) return
  
  const nodeType = e.dataTransfer.getData('nodeType')
  if (!nodeType) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const nodeData: NodeData = {
    type: nodeType as any,
    label: nodeTypes.find(t => t.type === nodeType)?.label || nodeType,
    position: { x: x - 60, y: y - 30 },
    size: { width: 120, height: 60 }
  }
  
  flowModel.value.addNode(nodeData)
}

// 工具栏操作
const handleUndo = () => {
  flowModel.value?.undo()
}

const handleRedo = () => {
  flowModel.value?.redo()
}

const handleDelete = () => {
  if (!flowModel.value) return
  
  if (selectedNode.value) {
    flowModel.value.removeNode(selectedNode.value.id)
  }
  if (selectedEdge.value) {
    flowModel.value.removeEdge(selectedEdge.value.id)
  }
}

const handleExport = () => {
  if (!flowModel.value) return
  
  const data = flowModel.value.toJSON()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flowchart.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 属性变更
const handlePropertyChange = (property: string, value: any) => {
  if (!flowModel.value) return
  
  if (selectedNode.value) {
    flowModel.value.updateNode(selectedNode.value.id, { [property]: value })
  }
  if (selectedEdge.value) {
    flowModel.value.updateEdge(selectedEdge.value.id, { [property]: value })
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && flowModel.value) {
    flowModel.value.load(newData)
    renderFlow()
  }
})

// 监听只读状态
watch(() => props.readonly, (readonly) => {
  if (flowModel.value) {
    flowModel.value.setReadonly(readonly)
  }
})

// 生命周期
onMounted(() => {
  initDesigner()
})

onUnmounted(() => {
  selectionPlugin.value?.destroy()
  minimapPlugin.value?.destroy()
  renderer.value?.destroy()
})

// 暴露方法
defineExpose({
  getFlowData: () => flowModel.value?.toJSON(),
  validateFlow: () => {
    if (!flowModel.value) return { valid: false, errors: ['流程图未初始化'] }
    
    const errors: string[] = []
    const nodes = flowModel.value.getNodes()
    
    // 验证逻辑
    const startNodes = nodes.filter(n => n.type === 'start')
    if (startNodes.length === 0) {
      errors.push('流程必须有开始节点')
    } else if (startNodes.length > 1) {
      errors.push('流程只能有一个开始节点')
    }
    
    const endNodes = nodes.filter(n => n.type === 'end')
    if (endNodes.length === 0) {
      errors.push('流程必须有结束节点')
    }
    
    return { valid: errors.length === 0, errors }
  }
})
</script>

<style scoped>
.flow-designer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  position: relative;
}

.flow-designer-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  z-index: 10;
}

.flow-designer-toolbar button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.flow-designer-toolbar button:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.flow-designer-toolbar button:active:not(:disabled) {
  background: #e6f7ff;
}

.flow-designer-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.flow-designer-toolbar-spacer {
  flex: 1;
}

.flow-designer-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.flow-designer-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e8e8e8;
  transition: margin-left 0.3s;
  display: flex;
  flex-direction: column;
}

.flow-designer-sidebar.collapsed {
  margin-left: -260px;
}

.flow-designer-sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: 500;
}

.flow-designer-node-palette {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.flow-designer-node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #d9d9d9;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
  user-select: none;
}

.flow-designer-node-item:hover {
  border-color: currentColor;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.flow-designer-node-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.flow-designer-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.flow-designer-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.flow-designer-property-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e8e8e8;
  transition: margin-right 0.3s;
  display: flex;
  flex-direction: column;
}

.flow-designer-property-panel.collapsed {
  margin-right: -320px;
}

.flow-designer-property-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: 500;
}

.flow-designer-property-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.flow-designer-property-group {
  margin-bottom: 16px;
}

.flow-designer-property-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.flow-designer-property-group input[type="text"],
.flow-designer-property-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.flow-designer-property-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.flow-designer-property-group input:focus,
.flow-designer-property-group select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}

.flow-designer-property-group input:disabled,
.flow-designer-property-group select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
</style>

