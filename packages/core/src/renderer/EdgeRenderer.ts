/**
 * 连线渲染器 - 参考 React Flow 风格
 */

import type { FlowEdge, FlowNode, EdgeStyleConfig } from '../types'
import { classNames } from '../utils'

/** 默认边缘颜色 - 参考 React Flow */
const DEFAULT_EDGE_COLOR = '#b1b1b7'
const SELECTED_EDGE_COLOR = '#555'

export interface EdgeRendererOptions {
  /** 自定义样式 */
  style?: EdgeStyleConfig
  /** 类名前缀 */
  classPrefix?: string
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 箭头大小 */
  arrowSize?: number
}

export class EdgeRenderer {
  private options: EdgeRendererOptions
  private classPrefix: string

  constructor(options: EdgeRendererOptions = {}) {
    this.options = {
      showArrow: true,
      arrowSize: 6,
      ...options,
    }
    this.classPrefix = options.classPrefix ?? 'fc'
  }

  /**
   * 渲染连线 - React Flow 风格的贝塞尔曲线
   */
  render(
    edge: FlowEdge,
    sourceNode: FlowNode,
    targetNode: FlowNode,
    container: SVGElement
  ): void {
    container.innerHTML = ''
    container.setAttribute('class', this.getEdgeClassName(edge))
    container.setAttribute('data-edge-id', edge.id)

    // 计算连接点
    const { start, end, sourcePos, targetPos } = this.getConnectionPoints(sourceNode, targetNode)

    // 生成正交路径（直线+折线）
    const pathData = this.getOrthogonalPath(start, end, sourcePos, targetPos)

    // 获取边缘颜色
    const edgeColor = this.getEdgeColor(edge)

    // 创建主路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', pathData)
    path.setAttribute('class', `${this.classPrefix}-edge-path`)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', edgeColor)
    path.setAttribute('stroke-width', '1')

    if (edge.type === 'conditional' && !edge.data?.isDefault) {
      path.style.strokeDasharray = '5,5'
    }

    if (edge.animated) {
      path.style.strokeDasharray = '5'
      path.style.animation = `${this.classPrefix}-edge-flow 0.5s linear infinite`
    }

    container.appendChild(path)

    // 添加箭头标记
    if (this.options.showArrow) {
      const markerId = `arrow-${edge.id}`
      const defs = this.createArrowMarker(markerId, edgeColor)
      container.appendChild(defs)
      path.style.markerEnd = `url(#${markerId})`
    }

    // 添加标签
    if (edge.data?.label) {
      const label = this.createLabel(edge, start, end, sourcePos, targetPos)
      container.appendChild(label)
    }

    // 添加交互层（透明宽线用于点击）- 使用pointer-events而不是粗线
    const interactionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    interactionPath.setAttribute('d', pathData)
    interactionPath.style.fill = 'none'
    interactionPath.style.stroke = 'rgba(0,0,0,0)'
    interactionPath.style.strokeWidth = '10px'
    interactionPath.style.cursor = 'pointer'
    interactionPath.style.pointerEvents = 'stroke'
    container.appendChild(interactionPath)
  }

  /**
   * 获取连接点位置 - 智能选择最优连接方式
   * 原则：
   * 1. 一个节点的一侧尽可能只有一条连线
   * 2. 拐点最少
   * 3. 左边目标从左出，右边从右出，正下方从底部出
   */
  private getConnectionPoints(sourceNode: FlowNode, targetNode: FlowNode): {
    start: { x: number; y: number }
    end: { x: number; y: number }
    sourcePos: 'top' | 'bottom' | 'left' | 'right'
    targetPos: 'top' | 'bottom' | 'left' | 'right'
  } {
    const sourceW = sourceNode.size?.width ?? 150
    const sourceH = sourceNode.size?.height ?? 50
    const targetW = targetNode.size?.width ?? 150
    const targetH = targetNode.size?.height ?? 50

    // 节点边界
    const sourceLeft = sourceNode.position.x
    const sourceRight = sourceNode.position.x + sourceW
    const sourceTop = sourceNode.position.y
    const sourceBottom = sourceNode.position.y + sourceH

    const targetLeft = targetNode.position.x
    const targetRight = targetNode.position.x + targetW
    const targetTop = targetNode.position.y
    const targetBottom = targetNode.position.y + targetH

    // 中心点
    const sourceCenterX = sourceLeft + sourceW / 2
    const targetCenterX = targetLeft + targetW / 2
    const targetCenterY = targetTop + targetH / 2

    let sourcePos: 'top' | 'bottom' | 'left' | 'right'
    let targetPos: 'top' | 'bottom' | 'left' | 'right'

    // 判断目标相对位置
    const isTargetBelow = targetTop >= sourceBottom - 5
    const isTargetAbove = targetBottom <= sourceTop + 5
    const isTargetCompletelyRight = targetLeft > sourceRight
    const isTargetCompletelyLeft = targetRight < sourceLeft

    // 简化原则：
    // 1. 目标在下方 → 底出顶进（最简洁）
    // 2. 目标在上方 → 顶出底进
    // 3. 目标在同一水平线 → 左右连接

    if (isTargetBelow) {
      // 目标在下方，始终用 底→顶，路径生成会处理水平偏移
      sourcePos = 'bottom'
      targetPos = 'top'
    } else if (isTargetAbove) {
      // 目标在上方，始终用 顶→底
      sourcePos = 'top'
      targetPos = 'bottom'
    } else if (isTargetCompletelyRight) {
      // 目标在右边同一水平线
      sourcePos = 'right'
      targetPos = 'left'
    } else if (isTargetCompletelyLeft) {
      // 目标在左边同一水平线
      sourcePos = 'left'
      targetPos = 'right'
    } else {
      // 有重叠，根据中心点判断
      const sourceCenterY = sourceTop + sourceH / 2
      if (targetCenterY > sourceCenterY) {
        sourcePos = 'bottom'
        targetPos = 'top'
      } else {
        sourcePos = 'top'
        targetPos = 'bottom'
      }
    }

    const start = this.getHandlePosition(sourceNode, sourcePos)
    const end = this.getHandlePosition(targetNode, targetPos)

    return { start, end, sourcePos, targetPos }
  }

  /**
   * 获取节点边缘连接点位置
   */
  private getHandlePosition(node: FlowNode, position: 'top' | 'bottom' | 'left' | 'right'): { x: number; y: number } {
    const w = node.size?.width ?? 150
    const h = node.size?.height ?? 50

    switch (position) {
      case 'top':
        return { x: node.position.x + w / 2, y: node.position.y }
      case 'bottom':
        return { x: node.position.x + w / 2, y: node.position.y + h }
      case 'left':
        return { x: node.position.x, y: node.position.y + h / 2 }
      case 'right':
        return { x: node.position.x + w, y: node.position.y + h / 2 }
    }
  }

  /**
   * 生成正交路径 - 确保折点在节点外部，箭头方向正确
   */
  private getOrthogonalPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    sourcePos: 'top' | 'bottom' | 'left' | 'right',
    targetPos: 'top' | 'bottom' | 'left' | 'right'
  ): string {
    const { x: sx, y: sy } = start
    const { x: tx, y: ty } = end
    const margin = 25 // 折点距离节点的最小距离

    // 直线连接（垂直或水平基本对齐，放宽到30px容差）
    if (sourcePos === 'bottom' && targetPos === 'top' && Math.abs(sx - tx) < 30) {
      // 垂直方向直线，x差异小则直连，否则用简单Z型
      if (Math.abs(sx - tx) < 5) {
        return `M${sx},${sy} L${tx},${ty}`
      }
      // 简单Z型：中间水平线
      const midY = (sy + ty) / 2
      return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`
    }
    if (sourcePos === 'top' && targetPos === 'bottom' && Math.abs(sx - tx) < 30) {
      if (Math.abs(sx - tx) < 5) {
        return `M${sx},${sy} L${tx},${ty}`
      }
      const midY = (sy + ty) / 2
      return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`
    }
    if (sourcePos === 'right' && targetPos === 'left' && Math.abs(sy - ty) < 30) {
      if (Math.abs(sy - ty) < 5) {
        return `M${sx},${sy} L${tx},${ty}`
      }
      const midX = (sx + tx) / 2
      return `M${sx},${sy} L${midX},${sy} L${midX},${ty} L${tx},${ty}`
    }
    if (sourcePos === 'left' && targetPos === 'right' && Math.abs(sy - ty) < 30) {
      if (Math.abs(sy - ty) < 5) {
        return `M${sx},${sy} L${tx},${ty}`
      }
      const midX = (sx + tx) / 2
      return `M${sx},${sy} L${midX},${sy} L${midX},${ty} L${tx},${ty}`
    }

    // Z型路径：底出顶进 - 水平线紧贴目标节点上方，减少穿过其他节点的可能
    if (sourcePos === 'bottom' && targetPos === 'top') {
      const midY = ty - margin  // 紧贴目标上方
      return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`
    }

    // Z型路径：顶出底进 - 水平线紧贴目标节点下方
    if (sourcePos === 'top' && targetPos === 'bottom') {
      const midY = ty + margin
      return `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`
    }

    // Z型路径：右出左进 - 垂直线紧贴目标节点左侧
    if (sourcePos === 'right' && targetPos === 'left') {
      const midX = tx - margin
      return `M${sx},${sy} L${midX},${sy} L${midX},${ty} L${tx},${ty}`
    }

    // Z型路径：左出右进 - 垂直线紧贴目标节点右侧
    if (sourcePos === 'left' && targetPos === 'right') {
      const midX = tx + margin
      return `M${sx},${sy} L${midX},${sy} L${midX},${ty} L${tx},${ty}`
    }

    // 默认直线
    return `M${sx},${sy} L${tx},${ty}`
  }

  /**
   * 获取连线颜色
   */
  private getEdgeColor(edge: FlowEdge): string {
    if (edge.selected) return 'var(--fc-edge-selected, #555)'
    return 'var(--fc-edge-color, #64748b)'
  }

  private createArrowMarker(id: string, color: string): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')

    marker.setAttribute('id', id)
    marker.setAttribute('markerWidth', '12')
    marker.setAttribute('markerHeight', '12')
    marker.setAttribute('refX', '10')
    marker.setAttribute('refY', '3')
    marker.setAttribute('orient', 'auto')
    marker.setAttribute('markerUnits', 'strokeWidth')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M0,0 L0,6 L9,3 z')
    path.setAttribute('fill', color)

    marker.appendChild(path)
    defs.appendChild(marker)

    return defs
  }

  /**
   * 更新连线
   */
  update(
    edge: FlowEdge,
    sourceNode: FlowNode,
    targetNode: FlowNode,
    container: SVGElement
  ): void {
    this.render(edge, sourceNode, targetNode, container)
  }

  /**
   * 获取连线类名
   */
  private getEdgeClassName(edge: FlowEdge): string {
    return classNames(
      `${this.classPrefix}-edge`,
      `${this.classPrefix}-edge-${edge.type ?? 'default'}`,
      edge.selected && `${this.classPrefix}-edge-selected`,
      edge.animated && `${this.classPrefix}-edge-animated`,
      edge.className
    )
  }

  /**
   * 创建标签 - 靠近源节点，宽度自适应
   */
  private createLabel(
    edge: FlowEdge,
    start: { x: number; y: number },
    end: { x: number; y: number },
    sourcePos: 'top' | 'bottom' | 'left' | 'right',
    targetPos: 'top' | 'bottom' | 'left' | 'right'
  ): SVGForeignObjectElement {
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    const labelText = edge.data?.label ?? ''

    // 根据文本长度估算宽度（每个字符约12px + padding）
    const estimatedWidth = Math.max(40, labelText.length * 14 + 20)
    const height = 22

    // 计算标签位置 - 靠近源节点出口处（约30%位置）
    let labelX: number
    let labelY: number
    const offset = 25 // 距离源节点的偏移

    if (sourcePos === 'left') {
      labelX = start.x - offset - estimatedWidth / 2
      labelY = start.y
    } else if (sourcePos === 'right') {
      labelX = start.x + offset + estimatedWidth / 2
      labelY = start.y
    } else if (sourcePos === 'bottom') {
      labelX = start.x
      labelY = start.y + offset
    } else if (sourcePos === 'top') {
      labelX = start.x
      labelY = start.y - offset
    } else {
      labelX = (start.x + end.x) / 2
      labelY = (start.y + end.y) / 2
    }

    // foreignObject 使用较大的容器，让内部div自适应
    foreignObject.setAttribute('x', String(labelX - estimatedWidth / 2))
    foreignObject.setAttribute('y', String(labelY - height / 2))
    foreignObject.setAttribute('width', String(estimatedWidth + 20))
    foreignObject.setAttribute('height', String(height + 4))
    foreignObject.setAttribute('class', `${this.classPrefix}-edge-label-container`)
    foreignObject.style.overflow = 'visible'

    const div = document.createElement('div')
    div.className = `${this.classPrefix}-edge-label`
    div.textContent = labelText
    div.style.cssText = `
      font-size: 12px;
      color: var(--fc-text-color, #666);
      background: var(--fc-node-bg, #fff);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--fc-node-border, #d9d9d9);
      text-align: center;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 20px;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `

    foreignObject.appendChild(div)
    return foreignObject
  }

  /**
   * 生成CSS动画样式
   */
  static generateAnimationStyles(classPrefix = 'fc'): string {
    return `
      @keyframes ${classPrefix}-edge-flow {
        from { stroke-dashoffset: 10; }
        to { stroke-dashoffset: 0; }
      }
    `
  }
}
