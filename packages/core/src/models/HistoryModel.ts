/**
 * 历史记录模型 - 支持撤销/重做
 */
import type { FlowModel } from './FlowModel'

export interface HistoryRecord {
  type: string
  data: any
  timestamp: number
}

export class HistoryModel {
  private flowModel: FlowModel
  private history: HistoryRecord[] = []
  private currentIndex: number = -1
  private maxHistorySize: number = 100
  private recording: boolean = true

  constructor(flowModel: FlowModel, maxHistorySize = 100) {
    this.flowModel = flowModel
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 记录操作
   */
  record(type: string, data: any): void {
    if (!this.recording) return

    // 删除当前索引之后的所有记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // 添加新记录
    const record: HistoryRecord = {
      type,
      data: this.cloneData(data),
      timestamp: Date.now()
    }

    this.history.push(record)
    this.currentIndex++

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.currentIndex--
    }
  }

  /**
   * 撤销
   */
  undo(): void {
    if (!this.canUndo()) return

    const record = this.history[this.currentIndex]

    // 暂停记录
    this.recording = false

    try {
      this.executeUndo(record)
      this.currentIndex--
    } finally {
      this.recording = true
    }
  }

  /**
   * 重做
   */
  redo(): void {
    if (!this.canRedo()) return

    const record = this.history[this.currentIndex + 1]

    // 暂停记录
    this.recording = false

    try {
      this.executeRedo(record)
      this.currentIndex++
    } finally {
      this.recording = true
    }
  }

  /**
   * 执行撤销操作
   */
  private executeUndo(record: HistoryRecord): void {
    switch (record.type) {
      case 'addNode':
        this.flowModel.removeNode(record.data.node.id, false)
        break

      case 'removeNode':
        this.flowModel.addNode(record.data.node, false)
        // 恢复相关连线
        if (record.data.edges) {
          record.data.edges.forEach((edge: any) => {
            this.flowModel.addEdge(edge, false)
          })
        }
        break

      case 'updateNode':
        this.flowModel.updateNode(record.data.nodeId, record.data.oldData, false)
        break

      case 'addEdge':
        this.flowModel.removeEdge(record.data.edge.id, false)
        break

      case 'removeEdge':
        this.flowModel.addEdge(record.data.edge, false)
        break

      case 'updateEdge':
        this.flowModel.updateEdge(record.data.edgeId, record.data.oldData, false)
        break

      case 'moveNodes':
        record.data.nodes.forEach((item: any) => {
          const node = this.flowModel.getNode(item.nodeId)
          if (node) {
            node.setPosition(item.oldPosition)
          }
        })
        break
    }
  }

  /**
   * 执行重做操作
   */
  private executeRedo(record: HistoryRecord): void {
    switch (record.type) {
      case 'addNode':
        this.flowModel.addNode(record.data.node, false)
        break

      case 'removeNode':
        this.flowModel.removeNode(record.data.node.id, false)
        break

      case 'updateNode':
        this.flowModel.updateNode(record.data.nodeId, record.data.newData, false)
        break

      case 'addEdge':
        this.flowModel.addEdge(record.data.edge, false)
        break

      case 'removeEdge':
        this.flowModel.removeEdge(record.data.edge.id, false)
        break

      case 'updateEdge':
        this.flowModel.updateEdge(record.data.edgeId, record.data.newData, false)
        break

      case 'moveNodes':
        record.data.nodes.forEach((item: any) => {
          const node = this.flowModel.getNode(item.nodeId)
          if (node) {
            node.setPosition(item.newPosition)
          }
        })
        break
    }
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * 获取历史记录
   */
  getHistory(): HistoryRecord[] {
    return [...this.history]
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * 开始批量操作
   */
  beginBatch(): void {
    this.recording = false
  }

  /**
   * 结束批量操作
   */
  endBatch(type: string, data: any): void {
    this.recording = true
    this.record(type, data)
  }

  /**
   * 克隆数据
   */
  private cloneData(data: any): any {
    return JSON.parse(JSON.stringify(data))
  }
}

