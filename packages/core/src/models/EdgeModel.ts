/**
 * 连线数据模型
 */
import { EventEmitter } from 'eventemitter3'
import { v4 as uuid } from 'uuid'
import type { EdgeData, Position, EdgeType, EdgeStyle } from '../types'

export class EdgeModel extends EventEmitter {
  public id: string
  public source: string
  public target: string
  public sourcePort?: string
  public targetPort?: string
  public type: EdgeType
  public label?: string
  public data: Record<string, any>
  public style: EdgeStyle
  public selected: boolean = false
  public hovered: boolean = false
  public animated: boolean = false
  public points?: Position[]
  public path?: string
  public markerStart?: string
  public markerEnd?: string = 'arrow'

  constructor(data: EdgeData) {
    super()

    this.id = data.id || uuid()
    this.source = data.source
    this.target = data.target
    this.sourcePort = data.sourcePort
    this.targetPort = data.targetPort
    this.type = data.type || 'default'
    this.label = data.label
    this.data = data.data ? { ...data.data } : {}
    this.style = data.style ? { ...data.style } : {}
    this.animated = data.animated || false
    this.points = data.points ? [...data.points] : undefined
    this.path = data.path
    this.markerStart = data.markerStart
    this.markerEnd = data.markerEnd !== undefined ? data.markerEnd : 'arrow'
  }

  /**
   * 更新连线数据
   */
  update(data: Partial<EdgeData>): void {
    const oldData = this.toJSON()

    if (data.source !== undefined) this.source = data.source
    if (data.target !== undefined) this.target = data.target
    if (data.sourcePort !== undefined) this.sourcePort = data.sourcePort
    if (data.targetPort !== undefined) this.targetPort = data.targetPort
    if (data.type !== undefined) this.type = data.type
    if (data.label !== undefined) this.label = data.label
    if (data.data) this.data = { ...this.data, ...data.data }
    if (data.style) this.style = { ...this.style, ...data.style }
    if (data.animated !== undefined) this.animated = data.animated
    if (data.points !== undefined) this.points = data.points ? [...data.points] : undefined
    if (data.path !== undefined) this.path = data.path
    if (data.markerStart !== undefined) this.markerStart = data.markerStart
    if (data.markerEnd !== undefined) this.markerEnd = data.markerEnd

    this.emit('updated', { oldData, newData: this.toJSON() })
  }

  /**
   * 设置选中状态
   */
  setSelected(selected: boolean): void {
    if (this.selected === selected) return

    this.selected = selected
    this.emit('selectedChanged', { selected })
  }

  /**
   * 设置悬停状态
   */
  setHovered(hovered: boolean): void {
    if (this.hovered === hovered) return

    this.hovered = hovered
    this.emit('hoveredChanged', { hovered })
  }

  /**
   * 设置动画状态
   */
  setAnimated(animated: boolean): void {
    if (this.animated === animated) return

    this.animated = animated
    this.emit('animatedChanged', { animated })
  }

  /**
   * 设置路径点
   */
  setPoints(points: Position[]): void {
    this.points = [...points]
    this.emit('pointsChanged', { points: this.points })
  }

  /**
   * 添加路径点
   */
  addPoint(point: Position, index?: number): void {
    if (!this.points) {
      this.points = []
    }

    if (index !== undefined) {
      this.points.splice(index, 0, point)
    } else {
      this.points.push(point)
    }

    this.emit('pointAdded', { point, index })
  }

  /**
   * 删除路径点
   */
  removePoint(index: number): void {
    if (!this.points || index < 0 || index >= this.points.length) return

    const point = this.points[index]
    this.points.splice(index, 1)

    if (this.points.length === 0) {
      this.points = undefined
    }

    this.emit('pointRemoved', { point, index })
  }

  /**
   * 移动路径点
   */
  movePoint(index: number, position: Position): void {
    if (!this.points || index < 0 || index >= this.points.length) return

    const oldPosition = { ...this.points[index] }
    this.points[index] = { ...position }

    this.emit('pointMoved', { index, oldPosition, newPosition: position })
  }

  /**
   * 获取中点
   */
  getMidPoint(): Position | null {
    if (!this.points || this.points.length < 2) return null

    const midIndex = Math.floor(this.points.length / 2)

    if (this.points.length % 2 === 1) {
      return { ...this.points[midIndex] }
    } else {
      const p1 = this.points[midIndex - 1]
      const p2 = this.points[midIndex]
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      }
    }
  }

  /**
   * 获取标签位置
   */
  getLabelPosition(): Position | null {
    if (!this.label) return null

    // 如果有自定义路径点，使用中点
    if (this.points && this.points.length >= 2) {
      return this.getMidPoint()
    }

    // 否则需要从渲染器获取实际路径
    return null
  }

  /**
   * 反转连线方向
   */
  reverse(): void {
    const oldSource = this.source
    const oldTarget = this.target
    const oldSourcePort = this.sourcePort
    const oldTargetPort = this.targetPort

    this.source = oldTarget
    this.target = oldSource
    this.sourcePort = oldTargetPort
    this.targetPort = oldSourcePort

    // 反转路径点
    if (this.points) {
      this.points.reverse()
    }

    // 交换标记
    const oldMarkerStart = this.markerStart
    this.markerStart = this.markerEnd
    this.markerEnd = oldMarkerStart

    this.emit('reversed')
  }

  /**
   * 是否连接到指定节点
   */
  isConnectedTo(nodeId: string): boolean {
    return this.source === nodeId || this.target === nodeId
  }

  /**
   * 是否是自循环
   */
  isSelfLoop(): boolean {
    return this.source === this.target
  }

  /**
   * 克隆连线
   */
  clone(): EdgeModel {
    return new EdgeModel({
      ...this.toJSON(),
      id: uuid()
    })
  }

  /**
   * 导出为JSON
   */
  toJSON(): EdgeData {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      sourcePort: this.sourcePort,
      targetPort: this.targetPort,
      type: this.type,
      label: this.label,
      data: { ...this.data },
      style: { ...this.style },
      animated: this.animated,
      points: this.points ? [...this.points] : undefined,
      path: this.path,
      markerStart: this.markerStart,
      markerEnd: this.markerEnd
    }
  }
}

