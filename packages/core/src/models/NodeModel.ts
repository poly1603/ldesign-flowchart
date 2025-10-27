/**
 * 节点数据模型
 */
import { EventEmitter } from 'eventemitter3'
import { v4 as uuid } from 'uuid'
import type { NodeData, Position, Size, NodeType, NodeStatus } from '../types'

export class NodeModel extends EventEmitter {
  public id: string
  public type: NodeType
  public label: string
  public position: Position
  public size: Size
  public data: Record<string, any>
  public style: Record<string, any>
  public status?: NodeStatus
  public selected: boolean = false
  public hovered: boolean = false
  public dragging: boolean = false
  public ports?: Array<{
    id: string
    type: 'input' | 'output'
    position?: 'top' | 'right' | 'bottom' | 'left'
  }>

  constructor(data: NodeData) {
    super()

    this.id = data.id || uuid()
    this.type = data.type || 'default'
    this.label = data.label || ''
    this.position = { ...data.position }
    this.size = data.size ? { ...data.size } : { width: 120, height: 60 }
    this.data = data.data ? { ...data.data } : {}
    this.style = data.style ? { ...data.style } : {}
    this.status = data.status
    this.ports = data.ports ? [...data.ports] : undefined
  }

  /**
   * 更新节点数据
   */
  update(data: Partial<NodeData>): void {
    const oldData = this.toJSON()

    if (data.type !== undefined) this.type = data.type
    if (data.label !== undefined) this.label = data.label
    if (data.position) this.position = { ...data.position }
    if (data.size) this.size = { ...data.size }
    if (data.data) this.data = { ...this.data, ...data.data }
    if (data.style) this.style = { ...this.style, ...data.style }
    if (data.status !== undefined) this.status = data.status
    if (data.ports !== undefined) this.ports = data.ports ? [...data.ports] : undefined

    this.emit('updated', { oldData, newData: this.toJSON() })
  }

  /**
   * 移动节点
   */
  move(deltaX: number, deltaY: number): void {
    const oldPosition = { ...this.position }

    this.position.x += deltaX
    this.position.y += deltaY

    this.emit('moved', { oldPosition, newPosition: this.position })
  }

  /**
   * 设置节点位置
   */
  setPosition(position: Position): void {
    const oldPosition = { ...this.position }

    this.position = { ...position }

    this.emit('moved', { oldPosition, newPosition: this.position })
  }

  /**
   * 设置节点大小
   */
  setSize(size: Size): void {
    const oldSize = { ...this.size }

    this.size = { ...size }

    this.emit('resized', { oldSize, newSize: this.size })
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
   * 设置拖拽状态
   */
  setDragging(dragging: boolean): void {
    if (this.dragging === dragging) return

    this.dragging = dragging
    this.emit('draggingChanged', { dragging })
  }

  /**
   * 设置节点状态
   */
  setStatus(status: NodeStatus | undefined): void {
    if (this.status === status) return

    this.status = status
    this.emit('statusChanged', { status })
  }

  /**
   * 获取节点中心点
   */
  getCenter(): Position {
    return {
      x: this.position.x + this.size.width / 2,
      y: this.position.y + this.size.height / 2
    }
  }

  /**
   * 获取节点边界框
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height
    }
  }

  /**
   * 点是否在节点内
   */
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.position.x &&
      x <= this.position.x + this.size.width &&
      y >= this.position.y &&
      y <= this.position.y + this.size.height
    )
  }

  /**
   * 获取连接点位置
   */
  getPortPosition(portId: string): Position | null {
    if (!this.ports) return null

    const port = this.ports.find(p => p.id === portId)
    if (!port) return null

    const position = port.position || (port.type === 'input' ? 'left' : 'right')
    const center = this.getCenter()

    switch (position) {
      case 'top':
        return { x: center.x, y: this.position.y }
      case 'right':
        return { x: this.position.x + this.size.width, y: center.y }
      case 'bottom':
        return { x: center.x, y: this.position.y + this.size.height }
      case 'left':
        return { x: this.position.x, y: center.y }
      default:
        return center
    }
  }

  /**
   * 获取最近的连接点
   */
  getNearestPort(position: Position, type?: 'input' | 'output'): string | null {
    if (!this.ports || this.ports.length === 0) return null

    let nearestPort: typeof this.ports[0] | null = null
    let minDistance = Infinity

    this.ports.forEach(port => {
      if (type && port.type !== type) return

      const portPos = this.getPortPosition(port.id)
      if (!portPos) return

      const distance = Math.sqrt(
        Math.pow(position.x - portPos.x, 2) +
        Math.pow(position.y - portPos.y, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestPort = port
      }
    })

    return nearestPort?.id || null
  }

  /**
   * 克隆节点
   */
  clone(): NodeModel {
    return new NodeModel({
      ...this.toJSON(),
      id: uuid(),
      position: {
        x: this.position.x + 20,
        y: this.position.y + 20
      }
    })
  }

  /**
   * 导出为JSON
   */
  toJSON(): NodeData {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      position: { ...this.position },
      size: { ...this.size },
      data: { ...this.data },
      style: { ...this.style },
      status: this.status,
      ports: this.ports ? [...this.ports] : undefined
    }
  }
}

