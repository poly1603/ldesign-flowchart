/**
 * 节点管理器
 */

import type { FlowNode, NodeType, NodeData, Position, Size } from '../types'
import { generateId, deepClone } from '../utils'

export interface NodeManagerOptions {
  /** 默认节点尺寸 */
  defaultSize?: Size
}

export class NodeManager {
  private nodes: Map<string, FlowNode> = new Map()
  private defaultSize: Size

  constructor(options: NodeManagerOptions = {}) {
    this.defaultSize = options.defaultSize ?? { width: 180, height: 60 }
  }

  /**
   * 获取所有节点
   */
  getNodes(): FlowNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取节点
   */
  getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id)
  }

  /**
   * 添加节点
   */
  addNode(node: Partial<FlowNode> & { type: NodeType; position: Position }): FlowNode {
    const newNode: FlowNode = {
      id: node.id ?? generateId('node'),
      type: node.type,
      position: { ...node.position },
      size: node.size ?? { ...this.defaultSize },
      data: node.data ?? this.getDefaultNodeData(node.type),
      status: node.status ?? 'pending',
      selected: node.selected ?? false,
      disabled: node.disabled ?? false,
    }

    this.nodes.set(newNode.id, newNode)
    return newNode
  }

  /**
   * 更新节点
   */
  updateNode(id: string, updates: Partial<FlowNode>): FlowNode | undefined {
    const node = this.nodes.get(id)
    if (!node) return undefined

    const updatedNode = {
      ...node,
      ...updates,
      id: node.id, // ID不可更改
    }

    this.nodes.set(id, updatedNode)
    return updatedNode
  }

  /**
   * 更新节点数据
   */
  updateNodeData(id: string, data: Partial<NodeData>): FlowNode | undefined {
    const node = this.nodes.get(id)
    if (!node) return undefined

    return this.updateNode(id, {
      data: { ...node.data, ...data },
    })
  }

  /**
   * 更新节点位置
   */
  updateNodePosition(id: string, position: Position): FlowNode | undefined {
    return this.updateNode(id, { position: { ...position } })
  }

  /**
   * 删除节点
   */
  removeNode(id: string): FlowNode | undefined {
    const node = this.nodes.get(id)
    if (node) {
      this.nodes.delete(id)
    }
    return node
  }

  /**
   * 批量删除节点
   */
  removeNodes(ids: string[]): FlowNode[] {
    return ids.map((id) => this.removeNode(id)).filter(Boolean) as FlowNode[]
  }

  /**
   * 选中节点
   */
  selectNode(id: string, multiple = false): void {
    if (!multiple) {
      // 取消所有选中
      this.nodes.forEach((node) => {
        if (node.selected) {
          this.updateNode(node.id, { selected: false })
        }
      })
    }
    this.updateNode(id, { selected: true })
  }

  /**
   * 取消选中节点
   */
  deselectNode(id: string): void {
    this.updateNode(id, { selected: false })
  }

  /**
   * 取消所有选中
   */
  deselectAll(): void {
    this.nodes.forEach((node) => {
      if (node.selected) {
        this.updateNode(node.id, { selected: false })
      }
    })
  }

  /**
   * 获取选中的节点
   */
  getSelectedNodes(): FlowNode[] {
    return this.getNodes().filter((node) => node.selected)
  }

  /**
   * 根据类型查找节点
   */
  findNodesByType(type: NodeType): FlowNode[] {
    return this.getNodes().filter((node) => node.type === type)
  }

  /**
   * 查找开始节点
   */
  findStartNode(): FlowNode | undefined {
    return this.findNodesByType('start')[0]
  }

  /**
   * 查找结束节点
   */
  findEndNodes(): FlowNode[] {
    return this.findNodesByType('end')
  }

  /**
   * 克隆节点
   */
  cloneNode(id: string, offset: Position = { x: 20, y: 20 }): FlowNode | undefined {
    const node = this.nodes.get(id)
    if (!node) return undefined

    const clonedNode = deepClone(node)
    clonedNode.id = generateId('node')
    clonedNode.position = {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    }
    clonedNode.selected = false

    this.nodes.set(clonedNode.id, clonedNode)
    return clonedNode
  }

  /**
   * 设置节点数据
   */
  setNodes(nodes: FlowNode[]): void {
    this.nodes.clear()
    nodes.forEach((node) => {
      this.nodes.set(node.id, deepClone(node))
    })
  }

  /**
   * 清空节点
   */
  clear(): void {
    this.nodes.clear()
  }

  /**
   * 获取默认节点数据
   */
  private getDefaultNodeData(type: NodeType): NodeData {
    switch (type) {
      case 'start':
        return { name: '开始' }
      case 'end':
        return { name: '结束' }
      case 'approval':
        return {
          name: '审批节点',
          approvers: [],
          mode: 'sequential',
        }
      case 'cc':
        return {
          name: '抄送节点',
          ccUsers: [],
        }
      case 'condition':
        return {
          name: '条件分支',
          conditions: { relation: 'and', conditions: [] },
        }
      case 'parallel':
        return {
          name: '并行分支',
          branchCount: 2,
        }
      case 'exclusive':
        return { name: '排他网关' }
      case 'inclusive':
        return { name: '包含网关' }
      case 'timer':
        return {
          name: '定时器',
          timerType: 'delay',
        }
      default:
        return { name: '节点' }
    }
  }

  /**
   * 获取节点数量
   */
  get count(): number {
    return this.nodes.size
  }
}
