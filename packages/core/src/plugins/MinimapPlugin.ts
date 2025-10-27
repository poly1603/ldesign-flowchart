/**
 * 小地图插件 - 提供流程图缩略视图
 */
import { BasePlugin } from '../types/plugin'
import type { FlowModel } from '../models/FlowModel'
import type { Position, Bounds } from '../types'

export class MinimapPlugin extends BasePlugin {
  name = 'minimap'
  version = '1.0.0'
  description = 'Provide minimap for flowchart navigation'

  private flowModel!: FlowModel
  private container!: HTMLElement
  private minimapContainer: HTMLElement | null = null
  private minimapCanvas: HTMLCanvasElement | null = null
  private minimapViewport: HTMLElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  private position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'
  private width = 200
  private height = 150
  private visible = true
  private isDragging = false

  protected onInit(): void {
    if (!this.context) return

    this.flowModel = this.context.flowModel
    this.container = this.context.container

    // 初始化小地图
    this.initMinimap()

    // 监听流程图变化
    this.flowModel.on('nodeAdded', this.refresh)
    this.flowModel.on('nodeRemoved', this.refresh)
    this.flowModel.on('nodeUpdated', this.refresh)
    this.flowModel.on('edgeAdded', this.refresh)
    this.flowModel.on('edgeRemoved', this.refresh)
    this.flowModel.on('edgeUpdated', this.refresh)
  }

  protected onDestroy(): void {
    this.removeEventListeners()
    if (this.minimapContainer && this.minimapContainer.parentNode) {
      this.minimapContainer.parentNode.removeChild(this.minimapContainer)
    }

    // 移除事件监听
    this.flowModel.off('nodeAdded', this.refresh)
    this.flowModel.off('nodeRemoved', this.refresh)
    this.flowModel.off('nodeUpdated', this.refresh)
    this.flowModel.off('edgeAdded', this.refresh)
    this.flowModel.off('edgeRemoved', this.refresh)
    this.flowModel.off('edgeUpdated', this.refresh)
  }

  protected onEnable(): void {
    this.show()
    this.addEventListeners()
  }

  protected onDisable(): void {
    this.hide()
    this.removeEventListeners()
  }

  private initMinimap(): void {
    // 创建小地图容器
    this.minimapContainer = document.createElement('div')
    this.minimapContainer.className = 'flow-minimap'
    this.minimapContainer.style.cssText = `
      position: absolute;
      width: ${this.width}px;
      height: ${this.height}px;
      background: white;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 100;
      display: ${this.visible ? 'block' : 'none'};
    `
    this.updatePosition()

    // 创建画布
    this.minimapCanvas = document.createElement('canvas')
    this.minimapCanvas.width = this.width
    this.minimapCanvas.height = this.height
    this.minimapCanvas.style.position = 'absolute'
    this.minimapCanvas.style.top = '0'
    this.minimapCanvas.style.left = '0'
    this.minimapContainer.appendChild(this.minimapCanvas)

    this.ctx = this.minimapCanvas.getContext('2d')

    // 创建视口指示器
    this.minimapViewport = document.createElement('div')
    this.minimapViewport.className = 'flow-minimap-viewport'
    this.minimapViewport.style.cssText = `
      position: absolute;
      border: 2px solid #1890ff;
      background: rgba(24, 144, 255, 0.1);
      cursor: move;
      pointer-events: all;
    `
    this.minimapContainer.appendChild(this.minimapViewport)

    // 添加到容器
    this.container.appendChild(this.minimapContainer)

    // 初始渲染
    this.refresh()
  }

  private addEventListeners(): void {
    if (this.minimapViewport) {
      this.minimapViewport.addEventListener('mousedown', this.handleViewportMouseDown)
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
    }

    if (this.minimapCanvas) {
      this.minimapCanvas.addEventListener('click', this.handleCanvasClick)
    }
  }

  private removeEventListeners(): void {
    if (this.minimapViewport) {
      this.minimapViewport.removeEventListener('mousedown', this.handleViewportMouseDown)
    }

    if (this.minimapCanvas) {
      this.minimapCanvas.removeEventListener('click', this.handleCanvasClick)
    }

    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  private handleViewportMouseDown = (e: MouseEvent): void => {
    this.isDragging = true
    e.preventDefault()
    e.stopPropagation()
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging || !this.minimapContainer) return

    const rect = this.minimapContainer.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    this.updateMainViewport(x, y)
  }

  private handleMouseUp = (): void => {
    this.isDragging = false
  }

  private handleCanvasClick = (e: MouseEvent): void => {
    if (!this.minimapCanvas) return

    const rect = this.minimapCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    this.updateMainViewport(x, y)
  }

  private updateMainViewport(x: number, y: number): void {
    // 根据小地图坐标更新主视图
    const bounds = this.calculateBounds()
    const scale = this.calculateScale(bounds)

    const mainX = (x / scale) + bounds.x
    const mainY = (y / scale) + bounds.y

    // 通知主视图更新
    if (this.context?.renderer) {
      this.context.renderer.setViewport({
        position: { x: -mainX, y: -mainY }
      })
    }
  }

  private updatePosition(): void {
    if (!this.minimapContainer) return

    const margin = 20

    switch (this.position) {
      case 'top-left':
        this.minimapContainer.style.top = `${margin}px`
        this.minimapContainer.style.left = `${margin}px`
        this.minimapContainer.style.right = 'auto'
        this.minimapContainer.style.bottom = 'auto'
        break
      case 'top-right':
        this.minimapContainer.style.top = `${margin}px`
        this.minimapContainer.style.right = `${margin}px`
        this.minimapContainer.style.left = 'auto'
        this.minimapContainer.style.bottom = 'auto'
        break
      case 'bottom-left':
        this.minimapContainer.style.bottom = `${margin}px`
        this.minimapContainer.style.left = `${margin}px`
        this.minimapContainer.style.right = 'auto'
        this.minimapContainer.style.top = 'auto'
        break
      case 'bottom-right':
        this.minimapContainer.style.bottom = `${margin}px`
        this.minimapContainer.style.right = `${margin}px`
        this.minimapContainer.style.left = 'auto'
        this.minimapContainer.style.top = 'auto'
        break
    }
  }

  show(): void {
    this.visible = true
    if (this.minimapContainer) {
      this.minimapContainer.style.display = 'block'
      this.refresh()
    }
  }

  hide(): void {
    this.visible = false
    if (this.minimapContainer) {
      this.minimapContainer.style.display = 'none'
    }
  }

  setPosition(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void {
    this.position = position
    this.updatePosition()
  }

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height

    if (this.minimapContainer) {
      this.minimapContainer.style.width = `${width}px`
      this.minimapContainer.style.height = `${height}px`
    }

    if (this.minimapCanvas) {
      this.minimapCanvas.width = width
      this.minimapCanvas.height = height
      this.refresh()
    }
  }

  refresh = (): void => {
    if (!this.ctx || !this.visible) return

    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height)

    // 计算边界和缩放
    const bounds = this.calculateBounds()
    const scale = this.calculateScale(bounds)

    // 保存上下文
    this.ctx.save()

    // 应用变换
    this.ctx.scale(scale, scale)
    this.ctx.translate(-bounds.x, -bounds.y)

    // 绘制连线
    this.drawEdges()

    // 绘制节点
    this.drawNodes()

    // 恢复上下文
    this.ctx.restore()

    // 更新视口指示器
    this.updateViewportIndicator(bounds, scale)
  }

  private calculateBounds(): Bounds {
    const nodes = this.flowModel.getNodes()

    if (nodes.length === 0) {
      return { x: 0, y: 0, width: this.width, height: this.height }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach(node => {
      const bounds = node.getBounds()
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    const padding = 20
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    }
  }

  private calculateScale(bounds: Bounds): number {
    const scaleX = this.width / bounds.width
    const scaleY = this.height / bounds.height
    return Math.min(scaleX, scaleY, 1) * 0.9 // 留一些边距
  }

  private drawNodes(): void {
    if (!this.ctx) return

    const nodes = this.flowModel.getNodes()

    nodes.forEach(node => {
      const bounds = node.getBounds()

      // 设置样式
      this.ctx.fillStyle = node.selected ? '#1890ff' : '#f0f0f0'
      this.ctx.strokeStyle = node.selected ? '#1890ff' : '#d9d9d9'
      this.ctx.lineWidth = 1

      // 绘制节点
      this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    })
  }

  private drawEdges(): void {
    if (!this.ctx) return

    const edges = this.flowModel.getEdges()

    edges.forEach(edge => {
      const sourceNode = this.flowModel.getNode(edge.source)
      const targetNode = this.flowModel.getNode(edge.target)

      if (!sourceNode || !targetNode) return

      const sourceCenter = sourceNode.getCenter()
      const targetCenter = targetNode.getCenter()

      // 设置样式
      this.ctx.strokeStyle = edge.selected ? '#1890ff' : '#d9d9d9'
      this.ctx.lineWidth = 1

      // 绘制连线
      this.ctx.beginPath()
      this.ctx.moveTo(sourceCenter.x, sourceCenter.y)
      this.ctx.lineTo(targetCenter.x, targetCenter.y)
      this.ctx.stroke()
    })
  }

  private updateViewportIndicator(bounds: Bounds, scale: number): void {
    if (!this.minimapViewport || !this.context?.renderer) return

    // 获取主视图的视口信息
    const mainViewport = this.context.renderer.getViewport()
    const containerBounds = {
      x: -mainViewport.position.x,
      y: -mainViewport.position.y,
      width: this.container.offsetWidth / (mainViewport.zoom || 1),
      height: this.container.offsetHeight / (mainViewport.zoom || 1)
    }

    // 计算在小地图中的位置
    const x = (containerBounds.x - bounds.x) * scale
    const y = (containerBounds.y - bounds.y) * scale
    const width = containerBounds.width * scale
    const height = containerBounds.height * scale

    // 更新视口指示器
    this.minimapViewport.style.left = `${Math.max(0, x)}px`
    this.minimapViewport.style.top = `${Math.max(0, y)}px`
    this.minimapViewport.style.width = `${Math.min(width, this.width - x)}px`
    this.minimapViewport.style.height = `${Math.min(height, this.height - y)}px`
  }
}

