/**
 * useFlow Hook - 管理流程图状态
 */
import { useState, useCallback, useMemo } from 'react'
import { FlowModel } from '@ldesign/flowchart-core/models'
import type { FlowData, NodeData, EdgeData } from '@ldesign/flowchart-core/types'

export interface UseFlowOptions {
  initialData?: FlowData
  readonly?: boolean
  onChange?: (data: FlowData) => void
}

export interface UseFlowResult {
  // 数据
  data: FlowData
  nodes: NodeData[]
  edges: EdgeData[]

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
  canUndo: boolean
  canRedo: boolean

  // 选择操作
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
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
}

export function useFlow(options: UseFlowOptions = {}): UseFlowResult {
  const { initialData, readonly = false, onChange } = options

  // 初始化FlowModel
  const flowModel = useMemo(() => {
    const model = new FlowModel(initialData)
    model.setReadonly(readonly)
    return model
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 状态
  const [data, setData] = useState<FlowData>(() =>
    initialData || { nodes: [], edges: [] }
  )
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

  // 更新数据
  const updateData = useCallback(() => {
    const newData = flowModel.toJSON()
    setData(newData)
    setCanUndo(flowModel.canUndo())
    setCanRedo(flowModel.canRedo())
    setSelectedNodeIds(flowModel.getSelectedNodes().map(n => n.id))
    setSelectedEdgeIds(flowModel.getSelectedEdges().map(e => e.id))
    onChange?.(newData)
  }, [flowModel, onChange])

  // 节点操作
  const addNode = useCallback((node: NodeData) => {
    flowModel.addNode(node)
    updateData()
  }, [flowModel, updateData])

  const updateNode = useCallback((nodeId: string, updates: Partial<NodeData>) => {
    flowModel.updateNode(nodeId, updates)
    updateData()
  }, [flowModel, updateData])

  const removeNode = useCallback((nodeId: string) => {
    flowModel.removeNode(nodeId)
    updateData()
  }, [flowModel, updateData])

  // 连线操作
  const addEdge = useCallback((edge: EdgeData) => {
    flowModel.addEdge(edge)
    updateData()
  }, [flowModel, updateData])

  const updateEdge = useCallback((edgeId: string, updates: Partial<EdgeData>) => {
    flowModel.updateEdge(edgeId, updates)
    updateData()
  }, [flowModel, updateData])

  const removeEdge = useCallback((edgeId: string) => {
    flowModel.removeEdge(edgeId)
    updateData()
  }, [flowModel, updateData])

  // 批量操作
  const setFlowData = useCallback((newData: FlowData) => {
    flowModel.load(newData)
    updateData()
  }, [flowModel, updateData])

  const clear = useCallback(() => {
    flowModel.clear()
    updateData()
  }, [flowModel, updateData])

  // 历史操作
  const undo = useCallback(() => {
    flowModel.undo()
    updateData()
  }, [flowModel, updateData])

  const redo = useCallback(() => {
    flowModel.redo()
    updateData()
  }, [flowModel, updateData])

  // 选择操作
  const selectNode = useCallback((nodeId: string, multi = false) => {
    flowModel.selectNode(nodeId, multi)
    updateData()
  }, [flowModel, updateData])

  const selectEdge = useCallback((edgeId: string, multi = false) => {
    flowModel.selectEdge(edgeId, multi)
    updateData()
  }, [flowModel, updateData])

  const clearSelection = useCallback(() => {
    flowModel.clearSelection()
    updateData()
  }, [flowModel, updateData])

  // 工具方法
  const getNode = useCallback((nodeId: string): NodeData | undefined => {
    return flowModel.getNode(nodeId)?.toJSON()
  }, [flowModel])

  const getEdge = useCallback((edgeId: string): EdgeData | undefined => {
    return flowModel.getEdge(edgeId)?.toJSON()
  }, [flowModel])

  const getNodeEdges = useCallback((nodeId: string): EdgeData[] => {
    return flowModel.getNodeEdges(nodeId).map(e => e.toJSON())
  }, [flowModel])

  const validateFlow = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const nodes = flowModel.getNodes()
    const edges = flowModel.getEdges()

    // 检查是否有开始节点
    const startNodes = nodes.filter(n => n.type === 'start')
    if (startNodes.length === 0) {
      errors.push('流程必须有开始节点')
    } else if (startNodes.length > 1) {
      errors.push('流程只能有一个开始节点')
    }

    // 检查是否有结束节点
    const endNodes = nodes.filter(n => n.type === 'end')
    if (endNodes.length === 0) {
      errors.push('流程必须有结束节点')
    }

    // 检查孤立节点
    nodes.forEach(node => {
      const nodeEdges = flowModel.getNodeEdges(node.id)
      if (nodeEdges.length === 0 && node.type !== 'start' && node.type !== 'end') {
        errors.push(`节点 "${node.label}" 没有连接`)
      }
    })

    // 检查网关节点
    nodes.filter(n => n.type === 'gateway' || n.type === 'decision').forEach(node => {
      const outgoingEdges = flowModel.getOutgoingEdges(node.id)
      if (outgoingEdges.length < 2) {
        errors.push(`网关节点 "${node.label}" 至少需要两个出口`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }, [flowModel])

  const exportJSON = useCallback((): string => {
    return JSON.stringify(flowModel.toJSON(), null, 2)
  }, [flowModel])

  const importJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json) as FlowData
      setFlowData(data)
    } catch (error) {
      console.error('Invalid JSON format:', error)
      throw new Error('无效的JSON格式')
    }
  }, [setFlowData])

  return {
    // 数据
    data,
    nodes: data.nodes,
    edges: data.edges,

    // 节点操作
    addNode,
    updateNode,
    removeNode,

    // 连线操作
    addEdge,
    updateEdge,
    removeEdge,

    // 批量操作
    setData: setFlowData,
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
    importJSON
  }
}

