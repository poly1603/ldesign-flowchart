/**
 * 流程图验证器
 */

import type {
  FlowNode,
  FlowEdge,
  ValidationResult,
  ValidationError,
} from '../types'
import { findIncomingEdges, findOutgoingEdges, detectCycle } from '../utils'

export interface ValidatorOptions {
  /** 是否允许多个开始节点 */
  allowMultipleStart?: boolean
  /** 是否允许多个结束节点 */
  allowMultipleEnd?: boolean
  /** 是否允许孤立节点 */
  allowOrphanNodes?: boolean
  /** 是否允许环路 */
  allowCycle?: boolean
}

export class Validator {
  private options: ValidatorOptions

  constructor(options: ValidatorOptions = {}) {
    this.options = {
      allowMultipleStart: false,
      allowMultipleEnd: true,
      allowOrphanNodes: false,
      allowCycle: false,
      ...options,
    }
  }

  /**
   * 验证流程图
   */
  validate(nodes: FlowNode[], edges: FlowEdge[]): ValidationResult {
    const errors: ValidationError[] = []

    // 验证开始节点
    const startErrors = this.validateStartNodes(nodes)
    errors.push(...startErrors)

    // 验证结束节点
    const endErrors = this.validateEndNodes(nodes)
    errors.push(...endErrors)

    // 验证节点连接
    const connectionErrors = this.validateConnections(nodes, edges)
    errors.push(...connectionErrors)

    // 验证环路
    if (!this.options.allowCycle) {
      const cycleErrors = this.validateNoCycle(nodes, edges)
      errors.push(...cycleErrors)
    }

    // 验证孤立节点
    if (!this.options.allowOrphanNodes) {
      const orphanErrors = this.validateNoOrphanNodes(nodes, edges)
      errors.push(...orphanErrors)
    }

    // 验证审批节点
    const approvalErrors = this.validateApprovalNodes(nodes)
    errors.push(...approvalErrors)

    // 验证条件节点
    const conditionErrors = this.validateConditionNodes(nodes, edges)
    errors.push(...conditionErrors)

    return {
      valid: errors.filter((e) => e.type === 'error').length === 0,
      errors,
    }
  }

  /**
   * 验证开始节点
   */
  private validateStartNodes(nodes: FlowNode[]): ValidationError[] {
    const errors: ValidationError[] = []
    const startNodes = nodes.filter((n) => n.type === 'start')

    if (startNodes.length === 0) {
      errors.push({
        type: 'error',
        message: '流程图必须包含一个开始节点',
      })
    } else if (startNodes.length > 1 && !this.options.allowMultipleStart) {
      errors.push({
        type: 'error',
        message: '流程图只能有一个开始节点',
        nodeId: startNodes[1].id,
      })
    }

    return errors
  }

  /**
   * 验证结束节点
   */
  private validateEndNodes(nodes: FlowNode[]): ValidationError[] {
    const errors: ValidationError[] = []
    const endNodes = nodes.filter((n) => n.type === 'end')

    if (endNodes.length === 0) {
      errors.push({
        type: 'error',
        message: '流程图必须包含至少一个结束节点',
      })
    } else if (endNodes.length > 1 && !this.options.allowMultipleEnd) {
      errors.push({
        type: 'warning',
        message: '流程图有多个结束节点',
        nodeId: endNodes[1].id,
      })
    }

    return errors
  }

  /**
   * 验证节点连接
   */
  private validateConnections(
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): ValidationError[] {
    const errors: ValidationError[] = []

    for (const node of nodes) {
      const incoming = findIncomingEdges(node.id, edges)
      const outgoing = findOutgoingEdges(node.id, edges)

      // 开始节点不应有入边
      if (node.type === 'start' && incoming.length > 0) {
        errors.push({
          type: 'error',
          message: '开始节点不应有入边',
          nodeId: node.id,
        })
      }

      // 开始节点必须有出边
      if (node.type === 'start' && outgoing.length === 0) {
        errors.push({
          type: 'error',
          message: '开始节点必须连接到下一个节点',
          nodeId: node.id,
        })
      }

      // 结束节点不应有出边
      if (node.type === 'end' && outgoing.length > 0) {
        errors.push({
          type: 'error',
          message: '结束节点不应有出边',
          nodeId: node.id,
        })
      }

      // 结束节点必须有入边
      if (node.type === 'end' && incoming.length === 0) {
        errors.push({
          type: 'error',
          message: '结束节点必须有前置节点',
          nodeId: node.id,
        })
      }

      // 条件节点必须有多个出边
      if (node.type === 'condition' && outgoing.length < 2) {
        errors.push({
          type: 'warning',
          message: '条件分支节点应该有至少两个分支',
          nodeId: node.id,
        })
      }

      // 并行节点必须有多个出边
      if (node.type === 'parallel' && outgoing.length < 2) {
        errors.push({
          type: 'warning',
          message: '并行分支节点应该有至少两个分支',
          nodeId: node.id,
        })
      }
    }

    return errors
  }

  /**
   * 验证无环路
   */
  private validateNoCycle(
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): ValidationError[] {
    const errors: ValidationError[] = []

    if (detectCycle(nodes, edges)) {
      errors.push({
        type: 'error',
        message: '流程图不允许包含环路',
      })
    }

    return errors
  }

  /**
   * 验证无孤立节点
   */
  private validateNoOrphanNodes(
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): ValidationError[] {
    const errors: ValidationError[] = []

    for (const node of nodes) {
      // 开始节点和结束节点除外
      if (node.type === 'start' || node.type === 'end') continue

      const incoming = findIncomingEdges(node.id, edges)
      const outgoing = findOutgoingEdges(node.id, edges)

      if (incoming.length === 0 && outgoing.length === 0) {
        errors.push({
          type: 'warning',
          message: '存在孤立的节点',
          nodeId: node.id,
        })
      }
    }

    return errors
  }

  /**
   * 验证审批节点
   */
  private validateApprovalNodes(nodes: FlowNode[]): ValidationError[] {
    const errors: ValidationError[] = []

    const approvalNodes = nodes.filter((n) => n.type === 'approval')

    for (const node of approvalNodes) {
      const data = node.data as { approvers?: unknown[]; mode?: string }

      if (!data.approvers || data.approvers.length === 0) {
        errors.push({
          type: 'warning',
          message: '审批节点未配置审批人',
          nodeId: node.id,
        })
      }

      if (!data.mode) {
        errors.push({
          type: 'warning',
          message: '审批节点未配置审批方式',
          nodeId: node.id,
        })
      }
    }

    return errors
  }

  /**
   * 验证条件节点
   */
  private validateConditionNodes(
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): ValidationError[] {
    const errors: ValidationError[] = []

    const conditionNodes = nodes.filter((n) => n.type === 'condition')

    for (const node of conditionNodes) {
      const outgoing = findOutgoingEdges(node.id, edges)

      // 检查是否有默认分支
      const hasDefault = outgoing.some((e) => e.data?.isDefault)
      if (outgoing.length > 0 && !hasDefault) {
        errors.push({
          type: 'warning',
          message: '条件分支建议设置一个默认分支',
          nodeId: node.id,
        })
      }

      // 检查条件配置
      const data = node.data as { conditions?: { conditions?: unknown[] } }
      if (!data.conditions || !data.conditions.conditions?.length) {
        errors.push({
          type: 'warning',
          message: '条件分支节点未配置条件',
          nodeId: node.id,
        })
      }
    }

    return errors
  }
}
