/**
 * 连线管理器
 */

import type { FlowEdge, EdgeType, EdgeData } from '../types'
import { generateId, deepClone } from '../utils'

export class EdgeManager {
  private edges: Map<string, FlowEdge> = new Map()

  /**
   * 获取所有连线
   */
  getEdges(): FlowEdge[] {
    return Array.from(this.edges.values())
  }

  /**
   * 获取连线
   */
  getEdge(id: string): FlowEdge | undefined {
    return this.edges.get(id)
  }

  /**
   * 添加连线
   */
  addEdge(edge: Partial<FlowEdge> & { source: string; target: string }): FlowEdge {
    // 检查是否已存在相同的连线
    const existingEdge = this.findEdge(edge.source, edge.target)
    if (existingEdge) {
      return existingEdge
    }

    const newEdge: FlowEdge = {
      id: edge.id ?? generateId('edge'),
      type: edge.type ?? 'default',
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      data: edge.data ?? {},
      selected: edge.selected ?? false,
      animated: edge.animated ?? false,
    }

    this.edges.set(newEdge.id, newEdge)
    return newEdge
  }

  /**
   * 更新连线
   */
  updateEdge(id: string, updates: Partial<FlowEdge>): FlowEdge | undefined {
    const edge = this.edges.get(id)
    if (!edge) return undefined

    const updatedEdge = {
      ...edge,
      ...updates,
      id: edge.id, // ID不可更改
    }

    this.edges.set(id, updatedEdge)
    return updatedEdge
  }

  /**
   * 更新连线数据
   */
  updateEdgeData(id: string, data: Partial<EdgeData>): FlowEdge | undefined {
    const edge = this.edges.get(id)
    if (!edge) return undefined

    return this.updateEdge(id, {
      data: { ...edge.data, ...data },
    })
  }

  /**
   * 删除连线
   */
  removeEdge(id: string): FlowEdge | undefined {
    const edge = this.edges.get(id)
    if (edge) {
      this.edges.delete(id)
    }
    return edge
  }

  /**
   * 批量删除连线
   */
  removeEdges(ids: string[]): FlowEdge[] {
    return ids.map((id) => this.removeEdge(id)).filter(Boolean) as FlowEdge[]
  }

  /**
   * 删除与节点相关的所有连线
   */
  removeEdgesByNode(nodeId: string): FlowEdge[] {
    const connectedEdges = this.findEdgesByNode(nodeId)
    return this.removeEdges(connectedEdges.map((e) => e.id))
  }

  /**
   * 选中连线
   */
  selectEdge(id: string, multiple = false): void {
    if (!multiple) {
      // 取消所有选中
      this.edges.forEach((edge) => {
        if (edge.selected) {
          this.updateEdge(edge.id, { selected: false })
        }
      })
    }
    this.updateEdge(id, { selected: true })
  }

  /**
   * 取消选中连线
   */
  deselectEdge(id: string): void {
    this.updateEdge(id, { selected: false })
  }

  /**
   * 取消所有选中
   */
  deselectAll(): void {
    this.edges.forEach((edge) => {
      if (edge.selected) {
        this.updateEdge(edge.id, { selected: false })
      }
    })
  }

  /**
   * 获取选中的连线
   */
  getSelectedEdges(): FlowEdge[] {
    return this.getEdges().filter((edge) => edge.selected)
  }

  /**
   * 查找连线
   */
  findEdge(source: string, target: string): FlowEdge | undefined {
    return this.getEdges().find(
      (edge) => edge.source === source && edge.target === target
    )
  }

  /**
   * 查找与节点相关的所有连线
   */
  findEdgesByNode(nodeId: string): FlowEdge[] {
    return this.getEdges().filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    )
  }

  /**
   * 查找从节点出发的连线
   */
  findOutgoingEdges(nodeId: string): FlowEdge[] {
    return this.getEdges().filter((edge) => edge.source === nodeId)
  }

  /**
   * 查找到达节点的连线
   */
  findIncomingEdges(nodeId: string): FlowEdge[] {
    return this.getEdges().filter((edge) => edge.target === nodeId)
  }

  /**
   * 根据类型查找连线
   */
  findEdgesByType(type: EdgeType): FlowEdge[] {
    return this.getEdges().filter((edge) => edge.type === type)
  }

  /**
   * 设置连线数据
   */
  setEdges(edges: FlowEdge[]): void {
    this.edges.clear()
    edges.forEach((edge) => {
      this.edges.set(edge.id, deepClone(edge))
    })
  }

  /**
   * 清空连线
   */
  clear(): void {
    this.edges.clear()
  }

  /**
   * 验证连线是否有效
   */
  validateEdge(source: string, target: string, existingNodeIds: string[]): boolean {
    // 不能连接到自己
    if (source === target) return false

    // 源节点和目标节点必须存在
    if (!existingNodeIds.includes(source) || !existingNodeIds.includes(target)) {
      return false
    }

    // 不能重复连线
    if (this.findEdge(source, target)) return false

    return true
  }

  /**
   * 获取连线数量
   */
  get count(): number {
    return this.edges.size
  }
}
