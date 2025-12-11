/**
 * 连线渲染器
 */

import type { FlowEdge, FlowNode, EdgeStyleConfig } from '../types'
import { getEdgeControlPoints, classNames } from '../utils'

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
      arrowSize: 8,
      ...options,
    }
    this.classPrefix = options.classPrefix ?? 'fc'
  }

  /**
   * 渲染连线
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

    // 计算路径
    const { start, end, control1, control2 } = getEdgeControlPoints(
      sourceNode,
      targetNode
    )

    // 创建路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const pathData = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`
    path.setAttribute('d', pathData)
    path.setAttribute('class', `${this.classPrefix}-edge-path`)
    this.applyPathStyle(path, edge)
    container.appendChild(path)

    // 添加箭头
    if (this.options.showArrow) {
      const arrow = this.createArrow(edge, end, control2)
      container.appendChild(arrow)
    }

    // 添加标签
    if (edge.data?.label) {
      const label = this.createLabel(edge, start, end)
      container.appendChild(label)
    }

    // 添加可点击区域
    const hitArea = this.createHitArea(pathData)
    container.appendChild(hitArea)
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
    // 重新渲染
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
   * 应用路径样式
   */
  private applyPathStyle(path: SVGPathElement, edge: FlowEdge): void {
    const style = this.options.style ?? {}
    const isConditional = edge.type === 'conditional'
    const isDefault = edge.data?.isDefault

    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', style.strokeColor ?? (isDefault ? '#52c41a' : '#94a3b8'))
    path.setAttribute('stroke-width', String(style.strokeWidth ?? 1.5))

    if (isConditional && !isDefault) {
      path.setAttribute('stroke-dasharray', style.strokeDasharray ?? '5,5')
    }

    if (edge.animated) {
      path.style.strokeDasharray = '10'
      path.style.animation = `${this.classPrefix}-edge-flow 0.5s linear infinite`
    }
  }

  /**
   * 创建箭头
   */
  private createArrow(
    edge: FlowEdge,
    end: { x: number; y: number },
    control2: { x: number; y: number }
  ): SVGPolygonElement {
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const size = this.options.arrowSize ?? 8

    // 计算箭头方向
    const angle = Math.atan2(end.y - control2.y, end.x - control2.x)
    const x1 = end.x - size * Math.cos(angle - Math.PI / 6)
    const y1 = end.y - size * Math.sin(angle - Math.PI / 6)
    const x2 = end.x - size * Math.cos(angle + Math.PI / 6)
    const y2 = end.y - size * Math.sin(angle + Math.PI / 6)

    arrow.setAttribute('points', `${end.x},${end.y} ${x1},${y1} ${x2},${y2}`)
    arrow.setAttribute('class', `${this.classPrefix}-edge-arrow`)

    const style = this.options.style ?? {}
    const isDefault = edge.data?.isDefault
    arrow.setAttribute('fill', style.strokeColor ?? (isDefault ? '#52c41a' : '#b1b1b7'))

    return arrow
  }

  /**
   * 创建标签
   */
  private createLabel(
    edge: FlowEdge,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): SVGForeignObjectElement {
    const foreignObject = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'foreignObject'
    )

    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const width = 100
    const height = 24

    foreignObject.setAttribute('x', String(midX - width / 2))
    foreignObject.setAttribute('y', String(midY - height / 2))
    foreignObject.setAttribute('width', String(width))
    foreignObject.setAttribute('height', String(height))
    foreignObject.setAttribute('class', `${this.classPrefix}-edge-label-container`)

    const div = document.createElement('div')
    div.className = `${this.classPrefix}-edge-label`
    div.textContent = edge.data?.label ?? ''
    div.style.cssText = `
      font-size: 11px;
      color: var(--fc-text-color, #666);
      background: var(--fc-label-bg, #fff);
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid var(--fc-label-border, #e8e8e8);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `

    foreignObject.appendChild(div)
    return foreignObject
  }

  /**
   * 创建可点击区域
   */
  private createHitArea(pathData: string): SVGPathElement {
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    hitArea.setAttribute('d', pathData)
    hitArea.setAttribute('class', `${this.classPrefix}-edge-hit-area`)
    hitArea.setAttribute('fill', 'none')
    hitArea.setAttribute('stroke', 'transparent')
    hitArea.setAttribute('stroke-width', '20')
    hitArea.style.cursor = 'pointer'
    return hitArea
  }

  /**
   * 生成CSS动画样式
   */
  static generateAnimationStyles(classPrefix = 'fc'): string {
    return `
      @keyframes ${classPrefix}-edge-flow {
        from {
          stroke-dashoffset: 20;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
    `
  }
}
