/**
 * @flowchart/vue
 * OA流程审批插件Vue3组件封装
 */

// 组件
export { FlowchartApproval, type FlowchartApprovalInstance } from './components/FlowchartApproval'

// Hooks
export { useFlowchart, type UseFlowchartOptions, type UseFlowchartReturn } from './hooks/useFlowchart'

// 从 core 重新导出类型
export type {
  // 基础类型
  NodeType,
  ApprovalMode,
  NodeStatus,
  EdgeType,
  Position,
  Size,

  // 节点类型
  FlowNode,
  NodeData,
  StartNodeData,
  EndNodeData,
  ApprovalNodeData,
  CCNodeData,
  ConditionNodeData,
  ParallelNodeData,
  TimerNodeData,

  // 连线类型
  FlowEdge,
  EdgeData,

  // 流程定义
  FlowDefinition,

  // 配置类型
  FlowchartConfig,
  CanvasConfig,
  ToolbarConfig,
  NodeStyleConfig,
  EdgeStyleConfig,

  // 事件类型
  FlowchartEventType,
  FlowchartEventData,
  FlowchartEventCallback,

  // 验证类型
  ValidationResult,
  ValidationError,

  // 审批人配置
  ApproverConfig,
  ConditionExpression,
  ConditionGroup,
} from '@flowchart/core'

// 从 core 重新导出工具函数
export {
  generateId,
  deepClone,
} from '@flowchart/core'
