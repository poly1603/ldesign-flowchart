/**
 * 工作流类型定义
 */

// 审批动作类型
export type ApprovalAction =
  | 'approve'    // 同意
  | 'reject'     // 拒绝
  | 'return'     // 退回
  | 'delegate'   // 转办
  | 'countersign'// 加签
  | 'skip'       // 跳过
  | 'terminate'  // 终止

// 网关类型
export type GatewayType =
  | 'exclusive'  // 排他网关（XOR）
  | 'parallel'   // 并行网关（AND）
  | 'inclusive'  // 包容网关（OR）
  | 'event'      // 事件网关
  | 'complex'    // 复杂网关

// 任务类型
export type TaskType =
  | 'user'       // 用户任务
  | 'service'    // 服务任务
  | 'script'     // 脚本任务
  | 'manual'     // 手工任务
  | 'receive'    // 接收任务
  | 'send'       // 发送任务
  | 'business'   // 业务规则任务

// 事件类型
export type EventType =
  | 'start'      // 开始事件
  | 'end'        // 结束事件
  | 'intermediate' // 中间事件
  | 'boundary'   // 边界事件

// 事件定义
export type EventDefinition =
  | 'none'       // 空事件
  | 'message'    // 消息事件
  | 'timer'      // 定时事件
  | 'error'      // 错误事件
  | 'signal'     // 信号事件
  | 'cancel'     // 取消事件
  | 'condition'  // 条件事件
  | 'escalation' // 升级事件

// 审批节点配置
export interface ApprovalNodeConfig {
  // 审批人配置
  assignee?: string                  // 指定审批人
  candidateUsers?: string[]           // 候选用户
  candidateGroups?: string[]          // 候选用户组
  assigneeType?: 'user' | 'role' | 'dept' | 'position' | 'expression'

  // 审批模式
  approvalMode?: 'single' | 'multi' | 'sequential' | 'parallel'
  multiApprovalMode?: 'all' | 'any' | 'percentage' | 'count'
  multiApprovalThreshold?: number     // 多人审批阈值

  // 时限配置
  dueDate?: string                    // 到期时间
  reminderDate?: string               // 提醒时间
  escalationDate?: string             // 升级时间

  // 表单配置
  formKey?: string                    // 表单标识
  formData?: Record<string, any>      // 表单数据

  // 权限配置
  allowReturn?: boolean               // 允许退回
  allowDelegate?: boolean             // 允许转办
  allowCountersign?: boolean          // 允许加签
  allowSkip?: boolean                 // 允许跳过

  // 回调配置
  beforeApproval?: string             // 审批前回调
  afterApproval?: string              // 审批后回调
  onTimeout?: string                  // 超时回调
}

// 网关节点配置
export interface GatewayNodeConfig {
  type: GatewayType

  // 条件配置（排他/包容网关）
  conditions?: Array<{
    id: string
    name: string
    expression: string               // 条件表达式
    priority?: number                // 优先级
    target: string                   // 目标节点
  }>

  // 默认分支
  defaultFlow?: string

  // 并行网关配置
  forkMode?: 'all' | 'selected'      // 分支模式
  joinMode?: 'all' | 'partial'       // 汇聚模式
  joinCount?: number                 // 汇聚数量

  // 事件网关配置
  events?: Array<{
    type: EventDefinition
    target: string
  }>
}

// 流程定义
export interface ProcessDefinition {
  id: string
  key: string
  name: string
  version: number
  category?: string
  description?: string

  // 流程配置
  executable?: boolean               // 是否可执行
  isStartableInTasklist?: boolean    // 是否在任务列表中可启动
  candidateStarterUsers?: string[]   // 可启动用户
  candidateStarterGroups?: string[]  // 可启动用户组

  // 流程元素
  nodes: WorkflowNodeDefinition[]
  edges: WorkflowEdgeDefinition[]

  // 流程变量
  variables?: Array<{
    name: string
    type: string
    defaultValue?: any
    required?: boolean
  }>

  // 监听器
  executionListeners?: Array<{
    event: 'start' | 'end'
    type: 'class' | 'expression' | 'delegateExpression'
    value: string
  }>
}

// 工作流节点定义
export interface WorkflowNodeDefinition {
  id: string
  name: string
  type: 'start' | 'end' | 'task' | 'approval' | 'gateway' | 'subprocess' | 'event'

  // 任务配置
  taskType?: TaskType
  taskConfig?: Record<string, any>

  // 审批配置
  approvalConfig?: ApprovalNodeConfig

  // 网关配置
  gatewayConfig?: GatewayNodeConfig

  // 事件配置
  eventType?: EventType
  eventDefinition?: EventDefinition
  eventConfig?: Record<string, any>

  // 子流程配置
  subprocessId?: string
  subprocessVariables?: Record<string, any>

  // 通用配置
  skipCondition?: string             // 跳过条件
  isForCompensation?: boolean        // 是否补偿
  documentation?: string              // 文档说明

  // 多实例配置
  multiInstance?: {
    type: 'none' | 'parallel' | 'sequential'
    collection?: string              // 集合变量
    elementVariable?: string         // 元素变量
    completionCondition?: string    // 完成条件
  }
}

// 工作流连线定义
export interface WorkflowEdgeDefinition {
  id: string
  name?: string
  source: string
  target: string

  // 条件配置
  conditionExpression?: string       // 条件表达式
  isDefault?: boolean               // 是否默认分支

  // 流转配置
  skipExpression?: string            // 跳过表达式
  documentation?: string             // 文档说明
}

// 流程实例
export interface ProcessInstance {
  id: string
  processDefinitionId: string
  processDefinitionKey: string
  businessKey?: string

  // 状态信息
  status: 'running' | 'completed' | 'terminated' | 'suspended' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number

  // 当前状态
  currentActivities: string[]        // 当前活动节点

  // 发起人信息
  startUserId: string
  startUserName?: string

  // 流程变量
  variables: Record<string, any>

  // 父流程
  parentProcessInstanceId?: string
  superProcessInstanceId?: string
}

// 任务实例
export interface TaskInstance {
  id: string
  processInstanceId: string
  processDefinitionId: string
  taskDefinitionKey: string

  // 任务信息
  name: string
  description?: string
  priority?: number
  category?: string

  // 任务状态
  status: 'created' | 'claimed' | 'completed' | 'delegated' | 'terminated'
  createTime: Date
  claimTime?: Date
  completeTime?: Date
  dueDate?: Date

  // 执行人信息
  assignee?: string
  owner?: string
  candidateUsers?: string[]
  candidateGroups?: string[]

  // 任务数据
  formKey?: string
  formData?: Record<string, any>
  variables?: Record<string, any>

  // 父任务
  parentTaskId?: string
}

// 审批记录
export interface ApprovalRecord {
  id: string
  processInstanceId: string
  taskInstanceId: string
  nodeId: string
  nodeName: string

  // 审批信息
  action: ApprovalAction
  comment?: string
  attachments?: string[]

  // 审批人信息
  userId: string
  userName: string
  userDept?: string

  // 时间信息
  startTime: Date
  endTime: Date
  duration: number

  // 表单数据
  formData?: Record<string, any>

  // 代理信息
  delegateFrom?: string
  delegateTo?: string
}

// 流程监控数据
export interface ProcessMonitor {
  processDefinitionId: string

  // 统计数据
  totalInstances: number
  runningInstances: number
  completedInstances: number
  failedInstances: number

  // 性能指标
  averageDuration: number
  minDuration: number
  maxDuration: number

  // 节点统计
  nodeStatistics: Array<{
    nodeId: string
    nodeName: string
    executeCount: number
    averageDuration: number
    errorCount: number
  }>

  // 瓶颈分析
  bottlenecks: Array<{
    nodeId: string
    nodeName: string
    waitingTasks: number
    averageWaitTime: number
  }>
}

