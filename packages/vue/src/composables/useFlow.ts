/**
 * useFlow Composable - 管理流程图状态
 */
import { ref, computed, Ref } from 'vue'
import { FlowModel } from '@ldesign/flowchart-core/models'
import type { FlowData, NodeData, EdgeData } from '@ldesign/flowchart-core/types'

export interface UseFlowOptions {
  initialData?: FlowData
  readonly?: boolean
  onChange?: (data: FlowData) => void
}

export interface UseFlowReturn {
  // 数据
  data: Ref<FlowData>
  nodes: Ref<NodeData[]>
  edges: Ref<EdgeData[]>

  // 节点操作
  addNode: (node: NodeData) => void
  updateNode: (nodeId: string, updates: Partial<NodeData>) => void
  removeNode: (nodeId: string) => void

  // 连线操作
  addEdge: (edge: EdgeData) => void
  updateEdge: (edgeId: string, updates: Partial<EdgeData>) => void
  removeEdge: (edgeId: string) => void

  // 批量操作
  setData: (data: FlowData) => void
  clear: () => void

  // 历史操作
  undo: () => void
  redo: () => void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>

  // 选择操作
  selectedNodeIds: Ref<string[]>
  selectedEdgeIds: Ref<string[]>
  selectNode: (nodeId: string, multi?: boolean) => void
  selectEdge: (edgeId: string, multi?: boolean) => void
  clearSelection: () => void

  // 工具方法
  getNode: (nodeId: string) => NodeData | undefined
  getEdge: (edgeId: string) => EdgeData | undefined
  getNodeEdges: (nodeId: string) => EdgeData[]
  validateFlow: () => { valid: boolean; errors: string[] }
  exportJSON: () => string
  importJSON: (json: string) => void

  // 内部模型
  flowModel: FlowModel
}

export function useFlow(options: UseFlowOptions = {}): UseFlowReturn {
  const { initialData, readonly = false, onChange } = options

  // 初始化FlowModel
  const flowModel = new FlowModel(initialData)
  flowModel.setReadonly(readonly)

  // 状态
  const data = ref<FlowData>(initialData || { nodes: [], edges: [] })
  const canUndo = ref(false)
  const canRedo = ref(false)
  const selectedNodeIds = ref<string[]>([])
  const selectedEdgeIds = ref<string[]>([])

  // 计算属性
  const nodes = computed(() => data.value.nodes)
  const edges = computed(() => data.value.edges)

  // 更新数据
  const updateData = () => {
    const newData = flowModel.toJSON()
    data.value = newData
    canUndo.value = flowModel.canUndo()
    canRedo.value = flowModel.canRedo()
    selectedNodeIds.value = flowModel.getSelectedNodes().map(n => n.id)
    selectedEdgeIds.value = flowModel.getSelectedEdges().map(e => e.id)
    onChange?.(newData)
  }

  // 监听FlowModel事件
  flowModel.on('nodeAdded', updateData)
  flowModel.on('nodeRemoved', updateData)
  flowModel.on('nodeUpdated', updateData)
  flowModel.on('edgeAdded', updateData)
  flowModel.on('edgeRemoved', updateData)
  flowModel.on('edgeUpdated', updateData)
  flowModel.on('nodeSelected', updateData)
  flowModel.on('nodeUnselected', updateData)
  flowModel.on('edgeSelected', updateData)
  flowModel.on('edgeUnselected', updateData)
  flowModel.on('selectionCleared', updateData)

  // 节点操作
  const addNode = (node: NodeData) => {
    flowModel.addNode(node)
  }

  const updateNode = (nodeId: string, updates: Partial<NodeData>) => {
    flowModel.updateNode(nodeId, updates)
  }

  const removeNode = (nodeId: string) => {
    flowModel.removeNode(nodeId)
  }

  // 连线操作
  const addEdge = (edge: EdgeData) => {
    flowModel.addEdge(edge)
  }

  const updateEdge = (edgeId: string, updates: Partial<EdgeData>) => {
    flowModel.updateEdge(edgeId, updates)
  }

  const removeEdge = (edgeId: string) => {
    flowModel.removeEdge(edgeId)
  }

  // 批量操作
  const setData = (newData: FlowData) => {
    flowModel.load(newData)
    updateData()
  }

  const clear = () => {
    flowModel.clear()
  }

  // 历史操作
  const undo = () => {
    flowModel.undo()
  }

  const redo = () => {
    flowModel.redo()
  }

  // 选择操作
  const selectNode = (nodeId: string, multi = false) => {
    flowModel.selectNode(nodeId, multi)
  }

  const selectEdge = (edgeId: string, multi = false) => {
    flowModel.selectEdge(edgeId, multi)
  }

  const clearSelection = () => {
    flowModel.clearSelection()
  }

  // 工具方法
  const getNode = (nodeId: string): NodeData | undefined => {
    return flowModel.getNode(nodeId)?.toJSON()
  }

  const getEdge = (edgeId: string): EdgeData | undefined => {
    return flowModel.getEdge(edgeId)?.toJSON()
  }

  const getNodeEdges = (nodeId: string): EdgeData[] => {
    return flowModel.getNodeEdges(nodeId).map(e => e.toJSON())
  }

  const validateFlow = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const allNodes = flowModel.getNodes()

    // 检查是否有开始节点
    const startNodes = allNodes.filter(n => n.type === 'start')
    if (startNodes.length === 0) {
      errors.push('流程必须有开始节点')
    } else if (startNodes.length > 1) {
      errors.push('流程只能有一个开始节点')
    }

    // 检查是否有结束节点
    const endNodes = allNodes.filter(n => n.type === 'end')
    if (endNodes.length === 0) {
      errors.push('流程必须有结束节点')
    }

    // 检查孤立节点
    allNodes.forEach(node => {
      const nodeEdges = flowModel.getNodeEdges(node.id)
      if (nodeEdges.length === 0 && node.type !== 'start' && node.type !== 'end') {
        errors.push(`节点 "${node.label}" 没有连接`)
      }
    })

    // 检查网关节点
    allNodes.filter(n => n.type === 'gateway' || n.type === 'decision').forEach(node => {
      const outgoingEdges = flowModel.getOutgoingEdges(node.id)
      if (outgoingEdges.length < 2) {
        errors.push(`网关节点 "${node.label}" 至少需要两个出口`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  const exportJSON = (): string => {
    return JSON.stringify(flowModel.toJSON(), null, 2)
  }

  const importJSON = (json: string) => {
    try {
      const importData = JSON.parse(json) as FlowData
      setData(importData)
    } catch (error) {
      console.error('Invalid JSON format:', error)
      throw new Error('无效的JSON格式')
    }
  }

  return {
    // 数据
    data,
    nodes,
    edges,

    // 节点操作
    addNode,
    updateNode,
    removeNode,

    // 连线操作
    addEdge,
    updateEdge,
    removeEdge,

    // 批量操作
    setData,
    clear,

    // 历史操作
    undo,
    redo,
    canUndo,
    canRedo,

    // 选择操作
    selectedNodeIds,
    selectedEdgeIds,
    selectNode,
    selectEdge,
    clearSelection,

    // 工具方法
    getNode,
    getEdge,
    getNodeEdges,
    validateFlow,
    exportJSON,
    importJSON,

    // 内部模型
    flowModel
  }
}

