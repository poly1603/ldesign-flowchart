/**
 * @ldesign/flowchart-vue
 * Vue components for flowchart designer
 */

// 导出组件
export { default as FlowDesigner } from './components/FlowDesigner.vue'

// 导出Composables
export { useFlow } from './composables/useFlow'
export type { UseFlowOptions, UseFlowReturn } from './composables/useFlow'

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

// Vue插件
import type { App } from 'vue'
import FlowDesigner from './components/FlowDesigner.vue'

export const FlowchartPlugin = {
  install(app: App) {
    app.component('FlowDesigner', FlowDesigner)
  }
}

export default FlowchartPlugin

