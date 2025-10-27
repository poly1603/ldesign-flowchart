/**
 * SVG渲染引擎
 */
import type {
  RenderEngine,
  RenderContext,
  RenderOptions,
  RenderElement,
  RenderLayer,
  RenderPerformance,
  ViewportConfig,
  SVGRenderEngine as ISVGRenderEngine
} from '../types/engine'
import { NodeModel } from '../models/NodeModel'
import { EdgeModel } from '../models/EdgeModel'

export class SVGEngine implements ISVGRenderEngine {
  public type: 'svg' = 'svg'
  public context!: RenderContext & { svg: SVGElement }
  public defs!: SVGDefsElement

  private container!: HTMLElement
  private svg!: SVGSVGElement
  private mainGroup!: SVGGElement
  private layers: Map<string, SVGGElement> = new Map()
  private viewport: ViewportConfig = {
    zoom: 1,
    position: { x: 0, y: 0 }
  }
  private elements: Map<string, SVGElement> = new Map()
  private performanceData: RenderPerformance = {
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    nodeCount: 0,
    edgeCount: 0,
    visibleNodes: 0,
    visibleEdges: 0
  }

  init(container: HTMLElement, options?: RenderOptions): void {
    this.container = container

    // 创建SVG元素
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.setAttribute('width', '100%')
    this.svg.setAttribute('height', '100%')
    this.svg.style.position = 'absolute'
    this.svg.style.top = '0'
    this.svg.style.left = '0'

    // 创建defs元素
    this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    this.svg.appendChild(this.defs)

    // 创建默认标记
    this.createDefaultMarkers()

    // 创建主组
    this.mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    this.mainGroup.setAttribute('class', 'flow-main-group')
    this.svg.appendChild(this.mainGroup)

    // 创建默认层
    this.createDefaultLayers()

    // 添加到容器
    container.appendChild(this.svg)

    // 设置上下文
    this.context = {
      svg: this.svg,
      width: container.offsetWidth,
      height: container.offsetHeight,
      pixelRatio: window.devicePixelRatio || 1
    }

    // 更新视口
    this.updateViewport()
  }

  destroy(): void {
    this.clear()
    this.layers.clear()
    this.elements.clear()
    if (this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg)
    }
  }

  render(elements: RenderElement[]): void {
    const startTime = performance.now()

    // 清除旧元素
    this.clear()

    // 分类元素
    const nodes: RenderElement[] = []
    const edges: RenderElement[] = []
    const others: RenderElement[] = []

    elements.forEach(element => {
      if (element.type === 'node') {
        nodes.push(element)
      } else if (element.type === 'edge') {
        edges.push(element)
      } else {
        others.push(element)
      }
    })

    // 按顺序渲染：先边后节点
    edges.forEach(element => this.renderEdge(element))
    nodes.forEach(element => this.renderNode(element))
    others.forEach(element => this.renderElement(element))

    // 更新性能数据
    this.performanceData.renderTime = performance.now() - startTime
    this.performanceData.nodeCount = nodes.length
    this.performanceData.edgeCount = edges.length
    this.performanceData.visibleNodes = nodes.filter(n => n.visible).length
    this.performanceData.visibleEdges = edges.filter(e => e.visible).length
  }

  private renderNode(element: RenderElement): void {
    const nodeData = element.data as any
    const layer = this.getLayer('nodes')

    // 创建节点组
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('id', `node-${element.id}`)
    g.setAttribute('class', 'flow-node')
    g.setAttribute('transform', `translate(${nodeData.position.x}, ${nodeData.position.y})`)

    // 绘制节点形状
    const shape = this.createNodeShape(nodeData)
    g.appendChild(shape)

    // 绘制节点标签
    if (nodeData.label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', String(nodeData.size.width / 2))
      text.setAttribute('y', String(nodeData.size.height / 2))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.setAttribute('class', 'flow-node-label')
      text.textContent = nodeData.label
      g.appendChild(text)
    }

    // 添加到层
    layer.appendChild(g)
    this.elements.set(element.id, g)
  }

  private renderEdge(element: RenderElement): void {
    const edgeData = element.data as any
    const layer = this.getLayer('edges')

    // 创建连线组
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('id', `edge-${element.id}`)
    g.setAttribute('class', 'flow-edge')

    // 绘制连线路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', edgeData.path || this.calculateEdgePath(edgeData))
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', edgeData.style?.strokeColor || '#666')
    path.setAttribute('stroke-width', String(edgeData.style?.strokeWidth || 2))

    // 添加箭头
    if (edgeData.markerEnd) {
      path.setAttribute('marker-end', `url(#arrow-${edgeData.style?.strokeColor?.replace('#', '') || 'default'})`)
    }

    g.appendChild(path)

    // 绘制标签
    if (edgeData.label) {
      const labelG = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const midPoint = this.getEdgeMidPoint(edgeData)

      // 背景
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', String(midPoint.x - 30))
      rect.setAttribute('y', String(midPoint.y - 10))
      rect.setAttribute('width', '60')
      rect.setAttribute('height', '20')
      rect.setAttribute('fill', 'white')
      rect.setAttribute('stroke', '#ccc')
      labelG.appendChild(rect)

      // 文本
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', String(midPoint.x))
      text.setAttribute('y', String(midPoint.y))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.setAttribute('class', 'flow-edge-label')
      text.textContent = edgeData.label
      labelG.appendChild(text)

      g.appendChild(labelG)
    }

    // 添加到层
    layer.appendChild(g)
    this.elements.set(element.id, g)
  }

  private renderElement(element: RenderElement): void {
    // 渲染其他类型的元素
    const layer = this.getLayer('decorations')
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('id', `element-${element.id}`)
    layer.appendChild(g)
    this.elements.set(element.id, g)
  }

  private createNodeShape(nodeData: any): SVGElement {
    const { type, size, style } = nodeData

    switch (type) {
      case 'start':
      case 'end':
        // 圆形
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('cx', String(size.width / 2))
        circle.setAttribute('cy', String(size.height / 2))
        circle.setAttribute('r', String(Math.min(size.width, size.height) / 2))
        circle.setAttribute('fill', style?.fill || (type === 'start' ? '#52c41a' : '#ff4d4f'))
        circle.setAttribute('stroke', style?.stroke || '#fff')
        circle.setAttribute('stroke-width', '2')
        return circle

      case 'decision':
      case 'gateway':
        // 菱形
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        const points = [
          `${size.width / 2},0`,
          `${size.width},${size.height / 2}`,
          `${size.width / 2},${size.height}`,
          `0,${size.height / 2}`
        ].join(' ')
        polygon.setAttribute('points', points)
        polygon.setAttribute('fill', style?.fill || '#faad14')
        polygon.setAttribute('stroke', style?.stroke || '#fff')
        polygon.setAttribute('stroke-width', '2')
        return polygon

      default:
        // 矩形
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('width', String(size.width))
        rect.setAttribute('height', String(size.height))
        rect.setAttribute('rx', '4')
        rect.setAttribute('fill', style?.fill || '#1890ff')
        rect.setAttribute('stroke', style?.stroke || '#fff')
        rect.setAttribute('stroke-width', '2')
        return rect
    }
  }

  private calculateEdgePath(edgeData: any): string {
    // 简单的直线路径，实际应该使用路由算法
    if (edgeData.points && edgeData.points.length >= 2) {
      const commands: string[] = []
      edgeData.points.forEach((point: any, index: number) => {
        commands.push(`${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      })
      return commands.join(' ')
    }
    return 'M 0 0'
  }

  private getEdgeMidPoint(edgeData: any): { x: number; y: number } {
    if (edgeData.points && edgeData.points.length >= 2) {
      const midIndex = Math.floor(edgeData.points.length / 2)
      return edgeData.points[midIndex]
    }
    return { x: 0, y: 0 }
  }

  clear(): void {
    this.elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    this.elements.clear()
  }

  setViewport(config: ViewportConfig): void {
    Object.assign(this.viewport, config)
    this.updateViewport()
  }

  getViewport(): ViewportConfig {
    return { ...this.viewport }
  }

  private updateViewport(): void {
    const { zoom = 1, position = { x: 0, y: 0 } } = this.viewport
    this.mainGroup.setAttribute(
      'transform',
      `translate(${position.x}, ${position.y}) scale(${zoom})`
    )
  }

  addLayer(layer: RenderLayer): void {
    if (this.layers.has(layer.id)) return

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('id', `layer-${layer.id}`)
    g.setAttribute('class', `flow-layer flow-layer-${layer.name}`)
    g.style.opacity = String(layer.opacity)

    // 根据order插入到正确位置
    const layers = Array.from(this.layers.entries())
      .sort((a, b) => {
        const orderA = parseInt(a[1].getAttribute('data-order') || '0')
        const orderB = parseInt(b[1].getAttribute('data-order') || '0')
        return orderA - orderB
      })

    g.setAttribute('data-order', String(layer.order))

    let inserted = false
    for (const [, existingLayer] of layers) {
      const existingOrder = parseInt(existingLayer.getAttribute('data-order') || '0')
      if (layer.order < existingOrder) {
        this.mainGroup.insertBefore(g, existingLayer)
        inserted = true
        break
      }
    }

    if (!inserted) {
      this.mainGroup.appendChild(g)
    }

    this.layers.set(layer.id, g)
  }

  removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (layer && layer.parentNode) {
      layer.parentNode.removeChild(layer)
      this.layers.delete(layerId)
    }
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.style.display = visible ? '' : 'none'
    }
  }

  private getLayer(name: string): SVGGElement {
    return this.layers.get(name) || this.mainGroup
  }

  private createDefaultLayers(): void {
    // 创建默认层
    const defaultLayers: RenderLayer[] = [
      { id: 'grid', name: 'grid', visible: true, opacity: 1, order: 0, interactive: false },
      { id: 'edges', name: 'edges', visible: true, opacity: 1, order: 1, interactive: true },
      { id: 'nodes', name: 'nodes', visible: true, opacity: 1, order: 2, interactive: true },
      { id: 'decorations', name: 'decorations', visible: true, opacity: 1, order: 3, interactive: false }
    ]

    defaultLayers.forEach(layer => this.addLayer(layer))
  }

  private createDefaultMarkers(): void {
    // 创建默认箭头标记
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', 'arrow-default')
    marker.setAttribute('markerWidth', '10')
    marker.setAttribute('markerHeight', '10')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '5')
    marker.setAttribute('orient', 'auto')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z')
    path.setAttribute('fill', '#666')

    marker.appendChild(path)
    this.defs.appendChild(marker)
  }

  createPattern(id: string, pattern: SVGPatternElement): void {
    pattern.setAttribute('id', id)
    this.defs.appendChild(pattern)
  }

  createGradient(id: string, gradient: SVGGradientElement): void {
    gradient.setAttribute('id', id)
    this.defs.appendChild(gradient)
  }

  createMarker(id: string, marker: SVGMarkerElement): void {
    marker.setAttribute('id', id)
    this.defs.appendChild(marker)
  }

  createFilter(id: string, filter: SVGFilterElement): void {
    filter.setAttribute('id', id)
    this.defs.appendChild(filter)
  }

  toDataURL(type?: string, quality?: number): string {
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(this.svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(svgBlob)
  }

  toBlob(callback: BlobCallback, type?: string, quality?: number): void {
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(this.svg)
    const svgBlob = new Blob([svgString], { type: type || 'image/svg+xml;charset=utf-8' })
    callback(svgBlob)
  }

  getPerformance(): RenderPerformance {
    return { ...this.performanceData }
  }
}

