/**
 * @ldesign/flowchart-react
 * React components for flowchart designer
 */

// 导出组件
export { FlowDesigner } from './components/FlowDesigner'
export type { FlowDesignerProps } from './components/FlowDesigner'

// 导出Hooks
export { useFlow } from './hooks/useFlow'
export { useFlowEvents } from './hooks/useFlowEvents'

// 导出核心类型
export type {
  FlowData,
  NodeData,
  EdgeData,
  NodeType,
  EdgeType,
  NodeStatus,
  Position,
  Size,
  FlowDesignerConfig,
  WorkflowNode,
  ApprovalNodeConfig,
  GatewayNodeConfig,
  ProcessInstance,
  TaskInstance,
  ApprovalRecord
} from '@ldesign/flowchart-core/types'

// 导出模型类（供高级用户使用）
export {
  FlowModel,
  NodeModel,
  EdgeModel
} from '@ldesign/flowchart-core/models'

