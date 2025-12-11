/**
 * Flowchart Vue3 Hook
 */

import { ref, shallowRef, onMounted, onUnmounted, watch, type Ref } from 'vue'
import {
  Flowchart,
  type FlowchartOptions,
  type FlowDefinition,
  type FlowNode,
  type FlowEdge,
  type NodeType,
  type Position,
  type FlowchartEventType,
  type FlowchartEventCallback,
  type ValidationResult,
} from '@flowchart/core'

export interface UseFlowchartOptions extends Omit<FlowchartOptions, 'data'> {
  /** 初始数据 */
  initialData?: FlowDefinition
  /** 是否自动初始化 */
  autoInit?: boolean
}

export interface UseFlowchartReturn {
  /** Flowchart 实例 */
  instance: Ref<Flowchart | null>
  /** 是否已初始化 */
  initialized: Ref<boolean>
  /** 当前节点列表 */
  nodes: Ref<FlowNode[]>
  /** 当前连线列表 */
  edges: Ref<FlowEdge[]>
  /** 选中的节点 */
  selectedNodes: Ref<FlowNode[]>
  /** 选中的连线 */
  selectedEdges: Ref<FlowEdge[]>
  /** 当前缩放比例 */
  zoom: Ref<number>
  /** 是否可以撤销 */
  canUndo: Ref<boolean>
  /** 是否可以重做 */
  canRedo: Ref<boolean>

  // 方法
  /** 初始化 */
  init: (container: HTMLElement | string) => void
  /** 销毁 */
  destroy: () => void
  /** 加载数据 */
  loadData: (data: FlowDefinition) => void
  /** 获取数据 */
  getData: () => FlowDefinition | null
  /** 导出JSON */
  toJSON: () => string
  /** 从JSON导入 */
  fromJSON: (json: string) => void
  /** 添加节点 */
  addNode: (type: NodeType, position: Position, data?: Partial<FlowNode['data']>) => FlowNode | null
  /** 更新节点 */
  updateNode: (id: string, updates: Partial<FlowNode>) => FlowNode | undefined
  /** 删除节点 */
  removeNode: (id: string) => FlowNode | undefined
  /** 添加连线 */
  addEdge: (source: string, target: string, data?: FlowEdge['data']) => FlowEdge | undefined
  /** 删除连线 */
  removeEdge: (id: string) => FlowEdge | undefined
  /** 选中节点 */
  selectNode: (id: string, multiple?: boolean) => void
  /** 选中连线 */
  selectEdge: (id: string, multiple?: boolean) => void
  /** 取消所有选中 */
  deselectAll: () => void
  /** 全选 */
  selectAll: () => void
  /** 删除选中的元素 */
  deleteSelected: () => void
  /** 撤销 */
  undo: () => void
  /** 重做 */
  redo: () => void
  /** 缩放到适应视图 */
  fitView: (padding?: number) => void
  /** 设置缩放 */
  setZoom: (scale: number) => void
  /** 验证流程 */
  validate: () => ValidationResult | null
  /** 监听事件 */
  on: (event: FlowchartEventType, callback: FlowchartEventCallback) => () => void
  /** 取消监听 */
  off: (event: FlowchartEventType, callback: FlowchartEventCallback) => void
}

/**
 * Flowchart Vue3 Composable
 */
export function useFlowchart(options: UseFlowchartOptions = {}): UseFlowchartReturn {
  const { initialData, autoInit = false, ...flowchartOptions } = options

  // 状态
  const instance = shallowRef<Flowchart | null>(null)
  const initialized = ref(false)
  const nodes = ref<FlowNode[]>([])
  const edges = ref<FlowEdge[]>([])
  const selectedNodes = ref<FlowNode[]>([])
  const selectedEdges = ref<FlowEdge[]>([])
  const zoom = ref(1)
  const canUndo = ref(false)
  const canRedo = ref(false)

  // 更新状态
  const updateState = () => {
    if (!instance.value) return

    nodes.value = instance.value.getNodes()
    edges.value = instance.value.getEdges()
    selectedNodes.value = instance.value.getSelectedNodes()
    selectedEdges.value = instance.value.getSelectedEdges()
    zoom.value = instance.value.getZoom()
    canUndo.value = instance.value.canUndo()
    canRedo.value = instance.value.canRedo()
  }

  // 初始化
  const init = (container: HTMLElement | string) => {
    if (instance.value) {
      instance.value.destroy()
    }

    instance.value = new Flowchart(container, {
      ...flowchartOptions,
      data: initialData,
    })

    // 监听变化事件
    instance.value.on('flow:change', updateState)
    instance.value.on('selection:change', updateState)
    instance.value.on('canvas:zoom', updateState)
    instance.value.on('history:undo', updateState)
    instance.value.on('history:redo', updateState)

    initialized.value = true
    updateState()
  }

  // 销毁
  const destroy = () => {
    if (instance.value) {
      instance.value.destroy()
      instance.value = null
      initialized.value = false
    }
  }

  // 加载数据
  const loadData = (data: FlowDefinition) => {
    instance.value?.loadData(data)
    updateState()
  }

  // 获取数据
  const getData = (): FlowDefinition | null => {
    return instance.value?.getData() ?? null
  }

  // 导出JSON
  const toJSON = (): string => {
    return instance.value?.toJSON() ?? '{}'
  }

  // 从JSON导入
  const fromJSON = (json: string) => {
    instance.value?.fromJSON(json)
    updateState()
  }

  // 添加节点
  const addNode = (
    type: NodeType,
    position: Position,
    data?: Partial<FlowNode['data']>
  ): FlowNode | null => {
    const node = instance.value?.addNode(type, position, data)
    updateState()
    return node ?? null
  }

  // 更新节点
  const updateNode = (id: string, updates: Partial<FlowNode>): FlowNode | undefined => {
    const node = instance.value?.updateNode(id, updates)
    updateState()
    return node
  }

  // 删除节点
  const removeNode = (id: string): FlowNode | undefined => {
    const node = instance.value?.removeNode(id)
    updateState()
    return node
  }

  // 添加连线
  const addEdge = (
    source: string,
    target: string,
    data?: FlowEdge['data']
  ): FlowEdge | undefined => {
    const edge = instance.value?.addEdge(source, target, data)
    updateState()
    return edge
  }

  // 删除连线
  const removeEdge = (id: string): FlowEdge | undefined => {
    const edge = instance.value?.removeEdge(id)
    updateState()
    return edge
  }

  // 选中节点
  const selectNode = (id: string, multiple = false) => {
    instance.value?.selectNode(id, multiple)
  }

  // 选中连线
  const selectEdge = (id: string, multiple = false) => {
    instance.value?.selectEdge(id, multiple)
  }

  // 取消所有选中
  const deselectAll = () => {
    instance.value?.deselectAll()
  }

  // 全选
  const selectAll = () => {
    instance.value?.selectAll()
  }

  // 删除选中的元素
  const deleteSelected = () => {
    instance.value?.deleteSelected()
  }

  // 撤销
  const undo = () => {
    instance.value?.undo()
  }

  // 重做
  const redo = () => {
    instance.value?.redo()
  }

  // 缩放到适应视图
  const fitView = (padding?: number) => {
    instance.value?.fitView(padding)
    updateState()
  }

  // 设置缩放
  const setZoom = (scale: number) => {
    instance.value?.setZoom(scale)
    updateState()
  }

  // 验证流程
  const validate = (): ValidationResult | null => {
    return instance.value?.validate() ?? null
  }

  // 监听事件
  const on = (event: FlowchartEventType, callback: FlowchartEventCallback): (() => void) => {
    return instance.value?.on(event, callback) ?? (() => { })
  }

  // 取消监听
  const off = (event: FlowchartEventType, callback: FlowchartEventCallback) => {
    instance.value?.off(event, callback)
  }

  // 生命周期
  onUnmounted(() => {
    destroy()
  })

  return {
    // 状态
    instance,
    initialized,
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    zoom,
    canUndo,
    canRedo,

    // 方法
    init,
    destroy,
    loadData,
    getData,
    toJSON,
    fromJSON,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    selectNode,
    selectEdge,
    deselectAll,
    selectAll,
    deleteSelected,
    undo,
    redo,
    fitView,
    setZoom,
    validate,
    on,
    off,
  }
}
