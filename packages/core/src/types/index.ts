/**
 * 核心类型定义
 */

// 基础类型
export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

// 节点类型
export type NodeType =
  | 'default'
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'approval'
  | 'gateway'
  | 'subprocess'
  | 'event'
  | 'data'
  | 'document'
  | 'custom'

export type NodeStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'paused'

export interface NodePort {
  id: string
  type: 'input' | 'output'
  position?: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  multiple?: boolean
}

export interface NodeData {
  id?: string
  type?: NodeType
  label: string
  position: Position
  size?: Size
  data?: Record<string, any>
  style?: Record<string, any>
  status?: NodeStatus
  ports?: NodePort[]
}

// 连线类型
export type EdgeType =
  | 'default'
  | 'straight'
  | 'bezier'
  | 'orthogonal'
  | 'smooth'
  | 'custom'

export interface EdgeStyle {
  strokeColor?: string
  strokeWidth?: number
  strokeDasharray?: string
  fill?: string
  opacity?: number
}

export interface EdgeData {
  id?: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  type?: EdgeType
  label?: string
  data?: Record<string, any>
  style?: EdgeStyle
  animated?: boolean
  points?: Position[]
  path?: string
  markerStart?: string
  markerEnd?: string | false
}

// 流程图数据
export interface FlowData {
  nodes: NodeData[]
  edges: EdgeData[]
  viewport?: {
    zoom?: number
    position?: Position
  }
  metadata?: Record<string, any>
}

// 事件类型
export interface FlowModelEvents {
  loaded: [data: FlowData]
  cleared: []
  nodeAdded: [{ node: any }]
  nodeRemoved: [{ nodeId: string }]
  nodeUpdated: [{ node: any }]
  nodeSelected: [{ node: any }]
  nodeUnselected: [{ node: any }]
  nodesMoved: [{ nodes: any[] }]
  edgeAdded: [{ edge: any }]
  edgeRemoved: [{ edgeId: string }]
  edgeUpdated: [{ edge: any }]
  edgeSelected: [{ edge: any }]
  edgeUnselected: [{ edge: any }]
  selectionCleared: []
  readonlyChanged: [{ readonly: boolean }]
}

// 渲染器配置
export interface RendererConfig {
  container: HTMLElement
  width?: number
  height?: number
  background?: string
  grid?: {
    enabled?: boolean
    size?: number
    color?: string
    type?: 'dot' | 'line'
  }
  zoom?: {
    enabled?: boolean
    min?: number
    max?: number
    step?: number
  }
  pan?: {
    enabled?: boolean
    button?: 0 | 1 | 2
  }
}

// 插件接口
export interface Plugin {
  name: string
  version?: string
  init(designer: any): void
  destroy?(): void
  enable?(): void
  disable?(): void
}

// 工作流相关类型
export interface WorkflowNode {
  id: string
  name: string
  type: 'start' | 'end' | 'task' | 'approval' | 'gateway' | 'subprocess'
  assignee?: string
  candidateUsers?: string[]
  candidateGroups?: string[]
  dueDate?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  form?: Record<string, any>
  actions?: Array<{
    id: string
    name: string
    type: 'approve' | 'reject' | 'return' | 'delegate'
    next?: string
    condition?: string
  }>
  gateway?: {
    type: 'exclusive' | 'parallel' | 'inclusive'
    conditions?: Array<{
      id: string
      expression: string
      next: string
    }>
  }
}

export interface WorkflowInstance {
  id: string
  processId: string
  status: 'running' | 'completed' | 'terminated' | 'suspended'
  currentNode?: string
  variables: Record<string, any>
  history: Array<{
    nodeId: string
    action?: string
    operator: string
    timestamp: number
    comment?: string
  }>
}

// 设计器配置
export interface FlowDesignerConfig {
  mode?: 'design' | 'preview' | 'runtime'
  readonly?: boolean
  showGrid?: boolean
  showMinimap?: boolean
  showToolbar?: boolean
  showPropertyPanel?: boolean
  showContextMenu?: boolean
  theme?: 'light' | 'dark'
  locale?: 'zh-CN' | 'en-US'
  plugins?: Plugin[]
  nodeTypes?: Record<string, any>
  edgeTypes?: Record<string, any>
}

// 导出所有类型
export * from './engine'
export * from './plugin'
export * from './workflow'