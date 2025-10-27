/**
 * @ldesign/flowchart-lit
 * Lit Web Components for flowchart designer
 */

// 导出组件
export { FlowDesigner } from './flow-designer'
export { FlowViewer } from './flow-viewer'

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
  FlowDesignerConfig
} from '@ldesign/flowchart-core/types'

// 注册所有组件
import './flow-designer'
import './flow-viewer'

