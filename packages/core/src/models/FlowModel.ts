/**
 * 流程图数据模型
 */
import { EventEmitter } from 'eventemitter3'
import { NodeModel } from './NodeModel'
import { EdgeModel } from './EdgeModel'
import { HistoryModel } from './HistoryModel'
import type {
  FlowData,
  NodeData,
  EdgeData,
  Position,
  FlowModelEvents
} from '../types'

export class FlowModel extends EventEmitter<FlowModelEvents> {
  private nodes: Map<string, NodeModel> = new Map()
  private edges: Map<string, EdgeModel> = new Map()
  private history: HistoryModel
  private selectedNodeIds: Set<string> = new Set()
  private selectedEdgeIds: Set<string> = new Set()
  private _readonly: boolean = false

  constructor(data?: FlowData) {
    super()
    this.history = new HistoryModel(this)

    if (data) {
      this.load(data)
    }
  }

  /**
   * 加载流程数据
   */
  load(data: FlowData): void {
    this.clear()

    // 加载节点
    if (data.nodes) {
      data.nodes.forEach(nodeData => {
        this.addNode(nodeData, false)
      })
    }

    // 加载连线
    if (data.edges) {
      data.edges.forEach(edgeData => {
        this.addEdge(edgeData, false)
      })
    }

    this.emit('loaded', data)
  }

  /**
   * 导出流程数据
   */
  toJSON(): FlowData {
    return {
      nodes: Array.from(this.nodes.values()).map(node => node.toJSON()),
      edges: Array.from(this.edges.values()).map(edge => edge.toJSON())
    }
  }

  /**
   * 添加节点
   */
  addNode(data: NodeData, record = true): NodeModel {
    const node = new NodeModel(data)

    this.nodes.set(node.id, node)

    if (record) {
      this.history.record('addNode', { node: data })
    }

    this.emit('nodeAdded', { node })

    return node
  }

  /**
   * 删除节点
   */
  removeNode(nodeId: string, record = true): void {
    const node = this.nodes.get(nodeId)
    if (!node) return

    // 删除相关连线
    const relatedEdges = this.getNodeEdges(nodeId)
    relatedEdges.forEach(edge => {
      this.removeEdge(edge.id, false)
    })

    this.nodes.delete(nodeId)
    this.selectedNodeIds.delete(nodeId)

    if (record) {
      this.history.record('removeNode', {
        node: node.toJSON(),
        edges: relatedEdges.map(e => e.toJSON())
      })
    }

    this.emit('nodeRemoved', { nodeId })
  }

  /**
   * 更新节点
   */
  updateNode(nodeId: string, data: Partial<NodeData>, record = true): void {
    const node = this.nodes.get(nodeId)
    if (!node) return

    const oldData = node.toJSON()
    node.update(data)

    if (record) {
      this.history.record('updateNode', {
        nodeId,
        oldData,
        newData: data
      })
    }

    this.emit('nodeUpdated', { node })
  }

  /**
   * 添加连线
   */
  addEdge(data: EdgeData, record = true): EdgeModel {
    const edge = new EdgeModel(data)

    // 验证源节点和目标节点存在
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error('Source or target node not found')
    }

    this.edges.set(edge.id, edge)

    if (record) {
      this.history.record('addEdge', { edge: data })
    }

    this.emit('edgeAdded', { edge })

    return edge
  }

  /**
   * 删除连线
   */
  removeEdge(edgeId: string, record = true): void {
    const edge = this.edges.get(edgeId)
    if (!edge) return

    this.edges.delete(edgeId)
    this.selectedEdgeIds.delete(edgeId)

    if (record) {
      this.history.record('removeEdge', { edge: edge.toJSON() })
    }

    this.emit('edgeRemoved', { edgeId })
  }

  /**
   * 更新连线
   */
  updateEdge(edgeId: string, data: Partial<EdgeData>, record = true): void {
    const edge = this.edges.get(edgeId)
    if (!edge) return

    const oldData = edge.toJSON()
    edge.update(data)

    if (record) {
      this.history.record('updateEdge', {
        edgeId,
        oldData,
        newData: data
      })
    }

    this.emit('edgeUpdated', { edge })
  }

  /**
   * 选中节点
   */
  selectNode(nodeId: string, multi = false): void {
    if (!multi) {
      this.clearSelection()
    }

    this.selectedNodeIds.add(nodeId)
    const node = this.nodes.get(nodeId)

    if (node) {
      node.setSelected(true)
      this.emit('nodeSelected', { node })
    }
  }

  /**
   * 取消选中节点
   */
  unselectNode(nodeId: string): void {
    this.selectedNodeIds.delete(nodeId)
    const node = this.nodes.get(nodeId)

    if (node) {
      node.setSelected(false)
      this.emit('nodeUnselected', { node })
    }
  }

  /**
   * 选中连线
   */
  selectEdge(edgeId: string, multi = false): void {
    if (!multi) {
      this.clearSelection()
    }

    this.selectedEdgeIds.add(edgeId)
    const edge = this.edges.get(edgeId)

    if (edge) {
      edge.setSelected(true)
      this.emit('edgeSelected', { edge })
    }
  }

  /**
   * 取消选中连线
   */
  unselectEdge(edgeId: string): void {
    this.selectedEdgeIds.delete(edgeId)
    const edge = this.edges.get(edgeId)

    if (edge) {
      edge.setSelected(false)
      this.emit('edgeUnselected', { edge })
    }
  }

  /**
   * 清空选择
   */
  clearSelection(): void {
    this.selectedNodeIds.forEach(id => {
      const node = this.nodes.get(id)
      if (node) node.setSelected(false)
    })

    this.selectedEdgeIds.forEach(id => {
      const edge = this.edges.get(id)
      if (edge) edge.setSelected(false)
    })

    this.selectedNodeIds.clear()
    this.selectedEdgeIds.clear()

    this.emit('selectionCleared')
  }

  /**
   * 获取节点相关的连线
   */
  getNodeEdges(nodeId: string): EdgeModel[] {
    const edges: EdgeModel[] = []

    this.edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edges.push(edge)
      }
    })

    return edges
  }

  /**
   * 获取节点的入边
   */
  getIncomingEdges(nodeId: string): EdgeModel[] {
    return Array.from(this.edges.values()).filter(
      edge => edge.target === nodeId
    )
  }

  /**
   * 获取节点的出边
   */
  getOutgoingEdges(nodeId: string): EdgeModel[] {
    return Array.from(this.edges.values()).filter(
      edge => edge.source === nodeId
    )
  }

  /**
   * 批量移动节点
   */
  moveNodes(nodeIds: string[], deltaX: number, deltaY: number, record = true): void {
    const movedNodes: Array<{ nodeId: string; oldPosition: Position; newPosition: Position }> = []

    nodeIds.forEach(nodeId => {
      const node = this.nodes.get(nodeId)
      if (node) {
        const oldPosition = { ...node.position }
        node.move(deltaX, deltaY)
        movedNodes.push({
          nodeId,
          oldPosition,
          newPosition: { ...node.position }
        })
      }
    })

    if (record && movedNodes.length > 0) {
      this.history.record('moveNodes', { nodes: movedNodes })
    }

    this.emit('nodesMoved', { nodes: movedNodes })
  }

  /**
   * 清空流程图
   */
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.selectedNodeIds.clear()
    this.selectedEdgeIds.clear()
    this.history.clear()
    this.emit('cleared')
  }

  /**
   * 撤销操作
   */
  undo(): void {
    this.history.undo()
  }

  /**
   * 重做操作
   */
  redo(): void {
    this.history.redo()
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.history.canUndo()
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.history.canRedo()
  }

  /**
   * 设置只读模式
   */
  setReadonly(readonly: boolean): void {
    this._readonly = readonly
    this.emit('readonlyChanged', { readonly })
  }

  /**
   * 获取所有节点
   */
  getNodes(): NodeModel[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): NodeModel | undefined {
    return this.nodes.get(nodeId)
  }

  /**
   * 获取所有连线
   */
  getEdges(): EdgeModel[] {
    return Array.from(this.edges.values())
  }

  /**
   * 获取连线
   */
  getEdge(edgeId: string): EdgeModel | undefined {
    return this.edges.get(edgeId)
  }

  /**
   * 获取选中的节点
   */
  getSelectedNodes(): NodeModel[] {
    return Array.from(this.selectedNodeIds)
      .map(id => this.nodes.get(id))
      .filter(Boolean) as NodeModel[]
  }

  /**
   * 获取选中的连线
   */
  getSelectedEdges(): EdgeModel[] {
    return Array.from(this.selectedEdgeIds)
      .map(id => this.edges.get(id))
      .filter(Boolean) as EdgeModel[]
  }

  /**
   * 是否只读
   */
  get readonly(): boolean {
    return this._readonly
  }
}

