<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { Flowchart, type FlowDefinition, type NodeType, type FlowNode, type FlowEdge } from '@flowchart/core'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Download,
  Play,
  Square,
  UserCheck,
  Users,
  GitBranch,
  Split,
  Link,
  X,
} from 'lucide-vue-next'

let flowchartInstance: Flowchart | null = null
const canvasRef = ref<HTMLElement | null>(null)
const zoom = ref(100)
const selectedCount = ref(0)

// 选中状态
const selectedNode = ref<FlowNode | null>(null)
const selectedEdge = ref<FlowEdge | null>(null)

// 连线模式（从 core 获取状态）
const isConnecting = ref(false)

// 属性面板表单
const nodeForm = reactive({
  label: '',
  description: '',
})

const edgeForm = reactive({
  label: '',
})

const flowData = ref<FlowDefinition>({
  nodes: [
    { id: 'start-1', type: 'start', position: { x: 300, y: 50 }, data: { label: '开始' } },
    { id: 'end-1', type: 'end', position: { x: 300, y: 400 }, data: { label: '结束' } },
  ],
  edges: [],
})

const nodeTypes = [
  { type: 'start' as NodeType, name: '开始节点', icon: Play, color: 'start' },
  { type: 'end' as NodeType, name: '结束节点', icon: Square, color: 'end' },
  { type: 'approval' as NodeType, name: '审批节点', icon: UserCheck, color: 'approval' },
  { type: 'cc' as NodeType, name: '抄送节点', icon: Users, color: 'cc' },
  { type: 'condition' as NodeType, name: '条件分支', icon: GitBranch, color: 'condition' },
  { type: 'parallel' as NodeType, name: '并行分支', icon: Split, color: 'parallel' },
]

const canUndo = computed(() => flowchartInstance?.canUndo() ?? false)
const canRedo = computed(() => flowchartInstance?.canRedo() ?? false)

// 监听选中节点变化，同步表单
watch(selectedNode, (node) => {
  if (node) {
    nodeForm.label = node.data?.label || ''
    nodeForm.description = node.data?.description || ''
  }
})

// 监听选中连线变化，同步表单
watch(selectedEdge, (edge) => {
  if (edge) {
    edgeForm.label = edge.data?.label || ''
  }
})

// 处理节点拖拽开始
const handleDragStart = (e: DragEvent, nodeType: NodeType) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('nodeType', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

// 处理拖拽放置
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const nodeType = e.dataTransfer?.getData('nodeType') as NodeType
  if (!nodeType || !flowchartInstance || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const nodeLabels: Record<NodeType, string> = {
    start: '开始',
    end: '结束',
    approval: '审批节点',
    cc: '抄送节点',
    condition: '条件分支',
    parallel: '并行分支',
    exclusive: '排他网关',
    inclusive: '包含网关',
    timer: '定时器',
    custom: '自定义节点',
  }

  flowchartInstance.addNode({
    type: nodeType,
    position: { x, y },
    data: { 
      label: nodeLabels[nodeType],
      approvers: nodeType === 'approval' ? [{ id: '1', name: '待配置', type: 'user' as const }] : undefined,
      approvalMode: nodeType === 'approval' ? 'any' as const : undefined,
    },
  })
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

// 工具栏操作
const handleZoomIn = () => {
  flowchartInstance?.zoomIn()
  zoom.value = Math.round((flowchartInstance?.getZoom() ?? 1) * 100)
}

const handleZoomOut = () => {
  flowchartInstance?.zoomOut()
  zoom.value = Math.round((flowchartInstance?.getZoom() ?? 1) * 100)
}

const handleFitView = () => {
  flowchartInstance?.fitView()
  zoom.value = Math.round((flowchartInstance?.getZoom() ?? 1) * 100)
}

const handleUndo = () => {
  flowchartInstance?.undo()
}

const handleRedo = () => {
  flowchartInstance?.redo()
}

const handleDelete = () => {
  if (selectedNode.value) {
    flowchartInstance?.removeNode(selectedNode.value.id)
    selectedNode.value = null
  }
  if (selectedEdge.value) {
    flowchartInstance?.removeEdge(selectedEdge.value.id)
    selectedEdge.value = null
  }
}

const handleSave = () => {
  const data = flowchartInstance?.getData()
  console.log('保存流程数据:', JSON.stringify(data, null, 2))
  alert('流程数据已输出到控制台')
}

const handleExport = () => {
  const data = flowchartInstance?.getData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flowchart.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 开始连线
const startConnecting = () => {
  if (selectedNode.value && flowchartInstance) {
    flowchartInstance.startConnecting(selectedNode.value.id)
    isConnecting.value = true
  }
}

// 取消连线
const cancelConnecting = () => {
  flowchartInstance?.cancelConnecting()
  isConnecting.value = false
}

// 更新节点属性
const updateNodeLabel = () => {
  if (selectedNode.value && flowchartInstance) {
    flowchartInstance.updateNode(selectedNode.value.id, {
      data: { ...selectedNode.value.data, label: nodeForm.label, description: nodeForm.description }
    })
    // 刷新选中状态
    const updated = flowchartInstance.getNode(selectedNode.value.id)
    if (updated) selectedNode.value = updated
  }
}

// 更新连线标签
const updateEdgeLabel = () => {
  if (selectedEdge.value && flowchartInstance) {
    // 需要添加 updateEdge 方法或者通过删除重建实现
    const data = flowchartInstance.getData()
    const edgeIndex = data.edges.findIndex(e => e.id === selectedEdge.value!.id)
    if (edgeIndex >= 0) {
      data.edges[edgeIndex].data = { ...data.edges[edgeIndex].data, label: edgeForm.label }
      flowchartInstance.loadData(data)
    }
  }
}

onMounted(() => {
  if (canvasRef.value) {
    flowchartInstance = new Flowchart(canvasRef.value, {
      data: flowData.value,
      canvas: {
        grid: { enabled: true, size: 20, color: 'var(--fc-grid)' },
      },
    })

    // 监听选中变化
    flowchartInstance.on('selection:change', (data) => {
      selectedCount.value = (data.nodes?.length ?? 0) + (data.edges?.length ?? 0)
      
      // 更新选中的节点/连线
      if (data.nodes && data.nodes.length > 0) {
        selectedNode.value = data.nodes[0]
        selectedEdge.value = null
      } else if (data.edges && data.edges.length > 0) {
        selectedEdge.value = data.edges[0]
        selectedNode.value = null
      } else {
        selectedNode.value = null
        selectedEdge.value = null
      }
    })

    // 监听节点点击（连线模式）
    flowchartInstance.on('node:click', (data) => {
      if (flowchartInstance?.isInConnectingMode() && data.node) {
        // 完成连线
        flowchartInstance?.finishConnecting(data.node.id)
        isConnecting.value = false
      }
    })

    flowchartInstance.on('canvas:zoom', (data) => {
      zoom.value = Math.round((data.zoom ?? 1) * 100)
    })
  }
})

onUnmounted(() => {
  flowchartInstance?.destroy()
})
</script>

<template>
  <div class="example-page">
    <div class="example-header">
      <h1 class="example-title">流程编辑器</h1>
      <p class="example-desc">
        完整的流程编辑器示例，支持拖拽添加节点、创建连线、编辑属性。
      </p>
    </div>

    <div class="fc-editor-layout">
      <!-- 节点面板 -->
      <div class="fc-node-panel">
        <div class="fc-panel-title">节点类型</div>
        <div
          v-for="node in nodeTypes"
          :key="node.type"
          class="fc-node-item"
          draggable="true"
          @dragstart="handleDragStart($event, node.type)"
        >
          <div :class="['fc-node-item-icon', node.color]">
            <component :is="node.icon" :size="16" />
          </div>
          <span class="fc-node-item-text">{{ node.name }}</span>
        </div>
        
        <div class="fc-panel-title" style="margin-top: 24px;">使用说明</div>
        <div class="help-text">
          <p>1. 拖拽节点到画布</p>
          <p>2. 选中节点后点击"连线"</p>
          <p>3. 再点击目标节点完成连线</p>
          <p>4. 选中元素后右侧编辑属性</p>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="fc-editor-canvas">
        <!-- 工具栏 -->
        <div class="fc-toolbar">
          <div class="fc-toolbar-group">
            <button class="fc-toolbar-btn" @click="handleZoomOut" title="缩小">
              <ZoomOut :size="18" />
            </button>
            <span class="fc-zoom-text">{{ zoom }}%</span>
            <button class="fc-toolbar-btn" @click="handleZoomIn" title="放大">
              <ZoomIn :size="18" />
            </button>
            <button class="fc-toolbar-btn" @click="handleFitView" title="适应画布">
              <Maximize :size="18" />
            </button>
          </div>

          <div class="fc-toolbar-divider"></div>

          <div class="fc-toolbar-group">
            <button class="fc-toolbar-btn" :disabled="!canUndo" @click="handleUndo" title="撤销">
              <Undo2 :size="18" />
            </button>
            <button class="fc-toolbar-btn" :disabled="!canRedo" @click="handleRedo" title="重做">
              <Redo2 :size="18" />
            </button>
          </div>

          <div class="fc-toolbar-divider"></div>

          <div class="fc-toolbar-group">
            <button 
              class="fc-toolbar-btn" 
              :class="{ active: isConnecting }"
              :disabled="!selectedNode" 
              @click="isConnecting ? cancelConnecting() : startConnecting()" 
              title="连线"
            >
              <Link :size="18" />
            </button>
            <button class="fc-toolbar-btn" :disabled="selectedCount === 0" @click="handleDelete" title="删除">
              <Trash2 :size="18" />
            </button>
          </div>

          <div style="flex: 1;"></div>

          <div class="fc-toolbar-group">
            <button class="fc-toolbar-btn" @click="handleSave" title="保存">
              <Save :size="18" />
            </button>
            <button class="fc-toolbar-btn" @click="handleExport" title="导出">
              <Download :size="18" />
            </button>
          </div>
        </div>

        <!-- 连线模式提示 -->
        <div v-if="isConnecting" class="connecting-hint">
          <span>连线模式：点击目标节点完成连线</span>
          <button class="cancel-btn" @click="cancelConnecting">
            <X :size="14" /> 取消
          </button>
        </div>

        <!-- 画布 -->
        <div
          ref="canvasRef"
          class="flowchart-container"
          :class="{ connecting: isConnecting }"
          :style="{ height: isConnecting ? 'calc(100% - 89px)' : 'calc(100% - 57px)' }"
          @drop="handleDrop"
          @dragover="handleDragOver"
        ></div>
      </div>

      <!-- 属性面板 -->
      <div class="fc-property-panel">
        <div class="fc-panel-title">属性面板</div>
        
        <!-- 无选中 -->
        <div v-if="!selectedNode && !selectedEdge" class="empty-state">
          <p>请选择节点或连线查看属性</p>
        </div>

        <!-- 节点属性 -->
        <div v-else-if="selectedNode" class="property-form">
          <div class="property-section">
            <div class="property-label">节点类型</div>
            <div class="property-value type-badge">{{ selectedNode.type }}</div>
          </div>
          
          <div class="property-section">
            <div class="property-label">节点ID</div>
            <div class="property-value id-text">{{ selectedNode.id }}</div>
          </div>

          <div class="property-section">
            <label class="property-label" for="node-label">节点名称</label>
            <input 
              id="node-label"
              v-model="nodeForm.label" 
              type="text" 
              class="property-input"
              placeholder="输入节点名称"
              @change="updateNodeLabel"
            />
          </div>

          <div class="property-section">
            <label class="property-label" for="node-desc">描述</label>
            <textarea 
              id="node-desc"
              v-model="nodeForm.description" 
              class="property-textarea"
              placeholder="输入节点描述"
              rows="3"
              @change="updateNodeLabel"
            ></textarea>
          </div>

          <div class="property-section">
            <div class="property-label">位置</div>
            <div class="property-value">
              X: {{ Math.round(selectedNode.position.x) }}, Y: {{ Math.round(selectedNode.position.y) }}
            </div>
          </div>

          <button class="delete-btn" @click="handleDelete">
            <Trash2 :size="14" /> 删除节点
          </button>
        </div>

        <!-- 连线属性 -->
        <div v-else-if="selectedEdge" class="property-form">
          <div class="property-section">
            <div class="property-label">连线ID</div>
            <div class="property-value id-text">{{ selectedEdge.id }}</div>
          </div>

          <div class="property-section">
            <div class="property-label">起始节点</div>
            <div class="property-value">{{ selectedEdge.source }}</div>
          </div>

          <div class="property-section">
            <div class="property-label">目标节点</div>
            <div class="property-value">{{ selectedEdge.target }}</div>
          </div>

          <div class="property-section">
            <label class="property-label" for="edge-label">连线标签</label>
            <input 
              id="edge-label"
              v-model="edgeForm.label" 
              type="text" 
              class="property-input"
              placeholder="输入连线标签（如：是/否）"
              @change="updateEdgeLabel"
            />
          </div>

          <button class="delete-btn" @click="handleDelete">
            <Trash2 :size="14" /> 删除连线
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fc-toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fc-toolbar-btn.active {
  background: var(--primary-color);
  color: white;
}

.fc-editor-layout {
  display: flex;
  gap: 0;
  height: 600px;
}

.fc-property-panel {
  width: 280px;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-light);
  padding: 16px;
  overflow-y: auto;
}

.help-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.help-text p {
  margin: 0;
}

.connecting-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  font-size: 13px;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.cancel-btn:hover {
  background: rgba(255,255,255,0.3);
}

.flowchart-container.connecting {
  cursor: crosshair;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.property-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.property-value {
  font-size: 13px;
  color: var(--text-primary);
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 12px;
  width: fit-content;
}

.id-text {
  font-family: monospace;
  font-size: 11px;
  color: var(--text-secondary);
  word-break: break-all;
}

.property-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-base);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.property-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.property-textarea {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-base);
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
}

.property-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}
</style>
