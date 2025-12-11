/**
 * @flowchart/core
 * OA流程审批插件核心库
 */

// 主类
export { Flowchart, type FlowchartOptions } from './Flowchart'

// 类型导出
export * from './types'

// 核心模块
export { EventEmitter } from './core/EventEmitter'
export { History, type HistoryState, type HistoryOptions } from './core/History'
export { NodeManager, type NodeManagerOptions } from './core/NodeManager'
export { EdgeManager } from './core/EdgeManager'
export { Validator, type ValidatorOptions } from './core/Validator'

// 渲染器
export { NodeRenderer, type NodeRendererOptions } from './renderer/NodeRenderer'
export { EdgeRenderer, type EdgeRendererOptions } from './renderer/EdgeRenderer'

// 工具函数
export * from './utils'
