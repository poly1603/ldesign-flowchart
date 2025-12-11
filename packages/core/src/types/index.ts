/**
 * 流程审批插件核心类型定义
 */

// ============ 基础类型 ============

/** 节点类型枚举 */
export type NodeType =
  | 'start'           // 开始节点
  | 'end'             // 结束节点
  | 'approval'        // 审批节点
  | 'cc'              // 抄送节点
  | 'condition'       // 条件分支节点
  | 'parallel'        // 并行分支节点
  | 'exclusive'       // 排他网关
  | 'inclusive'       // 包含网关
  | 'timer'           // 定时器节点
  | 'custom'          // 自定义节点

/** 审批方式 */
export type ApprovalMode =
  | 'sequential'      // 依次审批
  | 'countersign'     // 会签（所有人同意）
  | 'or'              // 或签（一人同意即可）
  | 'any'             // 任一审批人通过
  | 'all'             // 所有审批人通过
  | 'percentage'      // 比例通过

/** 节点状态 */
export type NodeStatus =
  | 'pending'         // 待处理
  | 'processing'      // 处理中
  | 'approved'        // 已通过
  | 'rejected'        // 已拒绝
  | 'canceled'        // 已取消
  | 'skipped'         // 已跳过

/** 连线类型 */
export type EdgeType =
  | 'default'         // 默认连线
  | 'conditional'     // 条件连线
  | 'default-flow'    // 默认流转

// ============ 节点相关类型 ============

/** 节点位置 */
export interface Position {
  x: number
  y: number
}

/** 节点尺寸 */
export interface Size {
  width: number
  height: number
}

/** 审批人配置 */
export interface ApproverConfig {
  /** 审批人ID */
  id?: string
  /** 审批人类型 */
  type: 'user' | 'role' | 'department' | 'form-field' | 'initiator' | 'superior'
  /** 审批人ID或值 */
  value?: string | string[]
  /** 审批人名称 */
  name?: string
}

/** 条件表达式 */
export interface ConditionExpression {
  /** 字段名 */
  field: string
  /** 操作符 */
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not-contains' | 'in' | 'not-in'
  /** 值 */
  value: string | number | boolean | string[]
}

/** 条件组 */
export interface ConditionGroup {
  /** 组内条件关系 */
  relation: 'and' | 'or'
  /** 条件列表 */
  conditions: ConditionExpression[]
}

/** 节点基础数据 */
export interface BaseNodeData {
  /** 节点名称 */
  name?: string
  /** 节点标签（显示名称） */
  label?: string
  /** 节点描述 */
  description?: string
  /** 自定义属性 */
  properties?: Record<string, unknown>
}

/** 开始节点数据 */
export interface StartNodeData extends BaseNodeData {
  /** 发起人配置 */
  initiator?: ApproverConfig
}

/** 结束节点数据 */
export interface EndNodeData extends BaseNodeData {
  /** 结束通知 */
  notification?: {
    enabled: boolean
    template?: string
  }
}

/** 审批节点数据 */
export interface ApprovalNodeData extends BaseNodeData {
  /** 审批人配置 */
  approvers?: ApproverConfig[]
  /** 审批方式 */
  mode?: ApprovalMode
  /** 审批模式（别名） */
  approvalMode?: ApprovalMode
  /** 比例通过的百分比（mode为percentage时有效） */
  percentage?: number
  /** 超时配置 */
  timeout?: {
    enabled: boolean
    /** 超时时间（小时） */
    hours: number
    /** 超时操作 */
    action: 'auto-approve' | 'auto-reject' | 'notify' | 'escalate'
  }
  /** 是否允许转交 */
  allowTransfer?: boolean
  /** 是否允许加签 */
  allowAddSign?: boolean
  /** 是否允许退回 */
  allowReject?: boolean
  /** 审批意见是否必填 */
  commentRequired?: boolean
}

/** 抄送节点数据 */
export interface CCNodeData extends BaseNodeData {
  /** 抄送人配置 */
  ccUsers?: ApproverConfig[]
}

/** 条件项 */
export interface ConditionItem {
  /** 条件ID */
  id: string
  /** 条件名称 */
  name: string
  /** 条件表达式 */
  expression?: ConditionExpression | ConditionGroup
}

/** 条件分支节点数据 */
export interface ConditionNodeData extends BaseNodeData {
  /** 条件组 */
  conditions?: ConditionGroup | ConditionItem[]
  /** 优先级 */
  priority?: number
}

/** 并行分支节点数据 */
export interface ParallelNodeData extends BaseNodeData {
  /** 分支数量 */
  branchCount?: number
}

/** 定时器节点数据 */
export interface TimerNodeData extends BaseNodeData {
  /** 定时类型 */
  timerType: 'delay' | 'date' | 'cycle'
  /** 延迟时间配置 */
  delay?: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
  }
  /** 具体日期 */
  date?: string
  /** 循环表达式(cron) */
  cron?: string
}

/** 节点数据联合类型 */
export type NodeData =
  | StartNodeData
  | EndNodeData
  | ApprovalNodeData
  | CCNodeData
  | ConditionNodeData
  | ParallelNodeData
  | TimerNodeData
  | BaseNodeData

/** 流程节点 */
export interface FlowNode<T extends NodeData = NodeData> {
  /** 节点ID */
  id: string
  /** 节点类型 */
  type: NodeType
  /** 节点位置 */
  position: Position
  /** 节点尺寸 */
  size?: Size
  /** 节点数据 */
  data: T
  /** 节点状态 */
  status?: NodeStatus
  /** 是否选中 */
  selected?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 样式类名 */
  className?: string
  /** 行内样式 */
  style?: Partial<CSSStyleDeclaration>
}

// ============ 连线相关类型 ============

/** 连线数据 */
export interface EdgeData {
  /** 连线标签 */
  label?: string
  /** 条件表达式（用于条件分支） */
  condition?: ConditionGroup
  /** 是否为默认流转 */
  isDefault?: boolean
  /** 自定义属性 */
  properties?: Record<string, unknown>
}

/** 流程连线 */
export interface FlowEdge {
  /** 连线ID */
  id: string
  /** 连线类型 */
  type?: EdgeType
  /** 源节点ID */
  source: string
  /** 目标节点ID */
  target: string
  /** 源节点连接点 */
  sourceHandle?: string
  /** 目标节点连接点 */
  targetHandle?: string
  /** 连线数据 */
  data?: EdgeData
  /** 是否选中 */
  selected?: boolean
  /** 是否动画 */
  animated?: boolean
  /** 样式类名 */
  className?: string
  /** 行内样式 */
  style?: Partial<CSSStyleDeclaration>
}

// ============ 流程定义 ============

/** 流程定义 */
export interface FlowDefinition {
  /** 流程ID */
  id?: string
  /** 流程名称 */
  name?: string
  /** 流程描述 */
  description?: string
  /** 流程版本 */
  version?: string
  /** 节点列表 */
  nodes: FlowNode[]
  /** 连线列表 */
  edges: FlowEdge[]
  /** 流程变量 */
  variables?: Record<string, unknown>
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

// ============ 配置类型 ============

/** 节点样式配置 */
export interface NodeStyleConfig {
  /** 背景色 */
  backgroundColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框宽度 */
  borderWidth?: number
  /** 边框圆角 */
  borderRadius?: number
  /** 文字颜色 */
  textColor?: string
  /** 图标颜色 */
  iconColor?: string
  /** 阴影 */
  shadow?: string
}

/** 连线样式配置 */
export interface EdgeStyleConfig {
  /** 线条颜色 */
  strokeColor?: string
  /** 线条宽度 */
  strokeWidth?: number
  /** 线条样式 */
  strokeDasharray?: string
  /** 箭头大小 */
  arrowSize?: number
}

/** 画布配置 */
export interface CanvasConfig {
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 背景色 */
  backgroundColor?: string
  /** 网格配置 */
  grid?: {
    enabled: boolean
    size: number
    color: string
  }
  /** 缩放范围 */
  zoom?: {
    min: number
    max: number
    step: number
  }
  /** 是否可拖拽 */
  draggable?: boolean
  /** 是否可缩放 */
  zoomable?: boolean
  /** 是否可选择 */
  selectable?: boolean
  /** 是否显示小地图 */
  minimap?: boolean
}

/** 工具栏配置 */
export interface ToolbarConfig {
  /** 是否显示 */
  visible?: boolean
  /** 位置 */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 显示的工具 */
  tools?: Array<
    | 'zoom-in'
    | 'zoom-out'
    | 'zoom-reset'
    | 'fit-view'
    | 'undo'
    | 'redo'
    | 'delete'
    | 'copy'
    | 'paste'
    | 'export'
    | 'import'
  >
}

/** 流程图配置 */
export interface FlowchartConfig {
  /** 画布配置 */
  canvas?: CanvasConfig
  /** 工具栏配置 */
  toolbar?: ToolbarConfig
  /** 节点默认样式 */
  nodeStyle?: Partial<Record<NodeType, NodeStyleConfig>>
  /** 连线默认样式 */
  edgeStyle?: EdgeStyleConfig
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否可编辑（显示连接点等） */
  editable?: boolean
  /** 主题 */
  theme?: 'light' | 'dark'
  /** 国际化 */
  locale?: 'zh-CN' | 'en-US'
}

// ============ 事件类型 ============

/** 事件类型 */
export type FlowchartEventType =
  | 'node:click'
  | 'node:dblclick'
  | 'node:contextmenu'
  | 'node:mouseenter'
  | 'node:mouseleave'
  | 'node:drag'
  | 'node:dragstart'
  | 'node:dragend'
  | 'node:select'
  | 'node:add'
  | 'node:remove'
  | 'node:change'
  | 'edge:click'
  | 'edge:dblclick'
  | 'edge:contextmenu'
  | 'edge:mouseenter'
  | 'edge:mouseleave'
  | 'edge:select'
  | 'edge:add'
  | 'edge:remove'
  | 'edge:change'
  | 'canvas:click'
  | 'canvas:dblclick'
  | 'canvas:contextmenu'
  | 'canvas:zoom'
  | 'canvas:pan'
  | 'selection:change'
  | 'history:undo'
  | 'history:redo'
  | 'flow:change'
  | 'flow:validate'

/** 事件数据 */
export interface FlowchartEventData {
  /** 原生事件 */
  originalEvent?: Event
  /** 节点（如适用） */
  node?: FlowNode
  /** 连线（如适用） */
  edge?: FlowEdge
  /** 节点列表（用于选择事件） */
  nodes?: FlowNode[]
  /** 连线列表（用于选择事件） */
  edges?: FlowEdge[]
  /** 位置（如适用） */
  position?: Position
  /** 缩放比例（如适用） */
  zoom?: number
  /** 选中的节点列表 */
  selectedNodes?: FlowNode[]
  /** 选中的连线列表 */
  selectedEdges?: FlowEdge[]
  /** 变更数据 */
  changes?: {
    type: 'add' | 'remove' | 'update'
    nodes?: FlowNode[]
    edges?: FlowEdge[]
  }
}

/** 事件回调 */
export type FlowchartEventCallback = (data: FlowchartEventData) => void

// ============ 渲染器类型 ============

/** 自定义节点渲染器 */
export interface NodeRenderer {
  /** 渲染函数 */
  render: (node: FlowNode, container: HTMLElement) => void
  /** 更新函数 */
  update?: (node: FlowNode, container: HTMLElement) => void
  /** 销毁函数 */
  destroy?: (container: HTMLElement) => void
}

/** 自定义连线渲染器 */
export interface EdgeRenderer {
  /** 渲染函数 */
  render: (edge: FlowEdge, container: SVGElement) => void
  /** 更新函数 */
  update?: (edge: FlowEdge, container: SVGElement) => void
  /** 销毁函数 */
  destroy?: (container: SVGElement) => void
}

// ============ 验证类型 ============

/** 验证错误 */
export interface ValidationError {
  /** 错误类型 */
  type: 'error' | 'warning'
  /** 错误代码 */
  code?: string
  /** 错误消息 */
  message: string
  /** 相关节点ID */
  nodeId?: string
  /** 相关连线ID */
  edgeId?: string
}

/** 验证结果 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: ValidationError[]
}
