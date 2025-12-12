/**
 * 流程审批插件主类
 */

import type {
  FlowchartConfig,
  FlowDefinition,
  FlowNode,
  FlowEdge,
  NodeType,
  Position,
  FlowchartEventType,
  FlowchartEventCallback,
  FlowchartEventData,
  ValidationResult,
} from './types'
import { EventEmitter } from './core/EventEmitter'
import { History, HistoryState } from './core/History'
import { NodeManager } from './core/NodeManager'
import { EdgeManager } from './core/EdgeManager'
import { Validator } from './core/Validator'
import { NodeRenderer } from './renderer/NodeRenderer'
import { EdgeRenderer } from './renderer/EdgeRenderer'
import { throttle, deepClone, generateId, autoLayout, adjustNodePositions } from './utils'

export interface FlowchartOptions extends FlowchartConfig {
  /** 初始流程数据 */
  data?: FlowDefinition
}

export class Flowchart {
  private container: HTMLElement
  private config: FlowchartConfig
  private eventEmitter: EventEmitter
  private history: History
  private nodeManager: NodeManager
  private edgeManager: EdgeManager
  private validator: Validator
  private nodeRenderer: NodeRenderer
  private edgeRenderer: EdgeRenderer

  // DOM 元素
  private canvas!: HTMLElement
  private nodesLayer!: HTMLElement
  private edgesLayer!: SVGElement
  private nodeElements: Map<string, HTMLElement> = new Map()
  private edgeElements: Map<string, SVGGElement> = new Map()

  // 状态
  private scale = 1
  private panOffset = { x: 0, y: 0 }
  private isDragging = false
  private isPanning = false
  private dragNode: FlowNode | null = null
  private dragStartPos = { x: 0, y: 0 }
  private isDestroyed = false

  // 连线模式状态
  private isConnecting = false
  private connectSourceId: string | null = null
  private connectSourceHandle: string | null = null
  private connectLine: SVGLineElement | null = null

  constructor(container: HTMLElement | string, options: FlowchartOptions = {}) {
    // 获取容器
    this.container =
      typeof container === 'string'
        ? document.querySelector(container) as HTMLElement
        : container

    if (!this.container) {
      throw new Error('Flowchart: Container not found')
    }

    // 初始化配置
    this.config = this.mergeConfig(options)

    // 初始化组件
    this.eventEmitter = new EventEmitter()
    this.history = new History({ maxLength: 50 })
    this.nodeManager = new NodeManager()
    this.edgeManager = new EdgeManager()
    this.validator = new Validator()
    this.nodeRenderer = new NodeRenderer({
      styles: this.config.nodeStyle,
      classPrefix: 'fc',
    })
    this.edgeRenderer = new EdgeRenderer({
      style: this.config.edgeStyle,
      classPrefix: 'fc',
    })

    // 初始化DOM
    this.initDOM()

    // 绑定事件
    this.bindEvents()

    // 加载初始数据
    if (options.data) {
      this.loadData(options.data)
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(options: FlowchartOptions): FlowchartConfig {
    return {
      canvas: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        grid: {
          enabled: true,
          size: 20,
          color: '#e8e8e8',
        },
        zoom: {
          min: 0.5,
          max: 2,
          step: 0.1,
        },
        draggable: true,
        zoomable: true,
        selectable: true,
        minimap: false,
        ...options.canvas,
      },
      toolbar: {
        visible: true,
        position: 'top',
        tools: ['zoom-in', 'zoom-out', 'zoom-reset', 'fit-view', 'undo', 'redo'],
        ...options.toolbar,
      },
      nodeStyle: options.nodeStyle,
      edgeStyle: options.edgeStyle,
      readonly: options.readonly ?? false,
      theme: options.theme ?? 'light',
      locale: options.locale ?? 'zh-CN',
    }
  }

  /**
   * 初始化DOM结构
   */
  private initDOM(): void {
    // 设置容器样式（保留已有的宽高设置）
    const existingWidth = this.container.style.width || this.container.offsetWidth
    const existingHeight = this.container.style.height || this.container.offsetHeight

    this.container.style.position = 'relative'
    this.container.style.overflow = 'hidden'
    this.container.style.backgroundColor = this.config.canvas?.backgroundColor ?? '#f5f5f5'

    // 只有在没有设置宽高时才使用配置或默认值
    if (!this.container.style.width && !existingWidth) {
      this.container.style.width = typeof this.config.canvas?.width === 'number'
        ? `${this.config.canvas.width}px`
        : (this.config.canvas?.width ?? '100%')
    }
    if (!this.container.style.height && !existingHeight) {
      this.container.style.height = typeof this.config.canvas?.height === 'number'
        ? `${this.config.canvas.height}px`
        : (this.config.canvas?.height ?? '600px')
    }

    this.container.classList.add('fc-container')

    // 创建画布
    this.canvas = document.createElement('div')
    this.canvas.className = 'fc-canvas'
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
    `

    // 绘制网格
    if (this.config.canvas?.grid?.enabled) {
      this.drawGrid()
    }

    // 创建连线层
    this.edgesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.edgesLayer.setAttribute('class', 'fc-edges-layer')
    this.edgesLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    `

    // 添加箭头标记定义
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = `
      <marker id="fc-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#b1b1b7"/>
      </marker>
    `
    this.edgesLayer.appendChild(defs)

    // 创建节点层
    this.nodesLayer = document.createElement('div')
    this.nodesLayer.className = 'fc-nodes-layer'
    this.nodesLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `

    this.canvas.appendChild(this.edgesLayer)
    this.canvas.appendChild(this.nodesLayer)
    this.container.appendChild(this.canvas)

    // 添加样式
    this.injectStyles()
  }

  /**
   * 绘制网格 - 在容器层绘制，不随画布缩放
   */
  private drawGrid(): void {
    const gridConfig = this.config.canvas?.grid
    if (!gridConfig?.enabled) return

    const { size, color } = gridConfig
    // 网格绘制在容器上，不随画布缩放
    this.container.style.backgroundImage = `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `
    this.container.style.backgroundSize = `${size}px ${size}px`
  }

  /**
   * 注入样式
   */
  private injectStyles(): void {
    const styleId = 'fc-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .fc-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .fc-node:hover .fc-handle {
        opacity: 1;
      }
      .fc-handle:hover {
        transform: scale(1.3) !important;
        background: #1890ff !important;
        border-color: #1890ff !important;
      }
      .fc-handle-source {
        cursor: crosshair;
      }
      .fc-handle-target {
        cursor: pointer;
      }
      .fc-node-selected {
        box-shadow: 0 0 0 2px #1890ff !important;
      }
      .fc-node-disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      .fc-edge-selected .fc-edge-path {
        stroke: #1890ff !important;
        stroke-width: 2px !important;
      }
      .fc-edge {
        cursor: pointer;
        pointer-events: auto;
      }
      .fc-edge .fc-edge-path {
        transition: stroke 0.2s, stroke-width 0.2s, filter 0.2s;
        pointer-events: stroke;
      }
      .fc-edge:hover .fc-edge-path {
        stroke: var(--fc-primary, #1890ff) !important;
        stroke-width: 2px !important;
        filter: drop-shadow(0 0 4px var(--fc-primary, #1890ff));
      }
      .fc-edge:hover .fc-edge-label {
        background: var(--fc-primary, #1890ff) !important;
        color: #fff !important;
        border-color: var(--fc-primary, #1890ff) !important;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4) !important;
        transform: scale(1.05);
      }
      .fc-edge-label {
        transition: all 0.2s ease;
      }
      .fc-edge-selected .fc-edge-path {
        stroke: var(--fc-primary, #1890ff) !important;
        stroke-width: 2px !important;
      }
      .fc-edge-selected .fc-edge-label {
        background: var(--fc-primary, #1890ff) !important;
        color: #fff !important;
        border-color: var(--fc-primary, #1890ff) !important;
      }
      ${EdgeRenderer.generateAnimationStyles('fc')}
    `
    document.head.appendChild(style)
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 画布点击事件
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this))
    this.canvas.addEventListener('dblclick', this.handleCanvasDblClick.bind(this))
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this))

    // 拖拽和缩放事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mousemove', throttle(this.handleMouseMove.bind(this), 16))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))

    // 缩放事件
    if (this.config.canvas?.zoomable) {
      this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false })
    }

    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  /**
   * 处理画布点击
   */
  private handleCanvasClick(e: MouseEvent): void {
    const target = e.target as HTMLElement

    // 检查是否点击了节点
    const nodeEl = target.closest('.fc-node') as HTMLElement
    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-node-id')
      if (nodeId) {
        const node = this.nodeManager.getNode(nodeId)
        if (node) {
          this.selectNode(nodeId, e.ctrlKey || e.metaKey)
          this.emit('node:click', { node, originalEvent: e })
          return
        }
      }
    }

    // 检查是否点击了连线
    const edgeEl = target.closest('.fc-edge') as SVGElement
    if (edgeEl) {
      const edgeId = edgeEl.getAttribute('data-edge-id')
      if (edgeId) {
        const edge = this.edgeManager.getEdge(edgeId)
        if (edge) {
          this.selectEdge(edgeId, e.ctrlKey || e.metaKey)
          this.emit('edge:click', { edge, originalEvent: e })
          return
        }
      }
    }

    // 点击空白区域，取消选中
    this.deselectAll()
    this.emit('canvas:click', { originalEvent: e })
  }

  /**
   * 处理双击
   */
  private handleCanvasDblClick(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const nodeEl = target.closest('.fc-node') as HTMLElement

    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-node-id')
      if (nodeId) {
        const node = this.nodeManager.getNode(nodeId)
        if (node) {
          this.emit('node:dblclick', { node, originalEvent: e })
        }
      }
    } else {
      this.emit('canvas:dblclick', { originalEvent: e })
    }
  }

  /**
   * 处理右键菜单
   */
  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault()
    const target = e.target as HTMLElement
    const nodeEl = target.closest('.fc-node') as HTMLElement

    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-node-id')
      if (nodeId) {
        const node = this.nodeManager.getNode(nodeId)
        if (node) {
          this.emit('node:contextmenu', { node, originalEvent: e })
        }
      }
    } else {
      this.emit('canvas:contextmenu', { originalEvent: e, position: this.getCanvasPosition(e) })
    }
  }

  /**
   * 处理鼠标按下
   */
  private handleMouseDown(e: MouseEvent): void {
    if (this.config.readonly) return

    const target = e.target as HTMLElement

    // 检查是否点击了连接点（handle）- 用于拖拽连线
    const handleEl = target.closest('.fc-handle') as HTMLElement
    if (handleEl) {
      const handleType = handleEl.getAttribute('data-handle-type')
      const handlePosition = handleEl.getAttribute('data-handle')
      const nodeId = handleEl.getAttribute('data-node-id')

      // 只有从 source handle 才能开始连线
      if (handleType === 'source' && nodeId) {
        e.preventDefault()
        e.stopPropagation()
        this.startConnectingFromHandle(nodeId, handlePosition || 'bottom')
        return
      }
    }

    const nodeEl = target.closest('.fc-node') as HTMLElement

    if (nodeEl && this.config.canvas?.draggable) {
      // 开始拖拽节点
      const nodeId = nodeEl.getAttribute('data-node-id')
      if (nodeId) {
        this.dragNode = this.nodeManager.getNode(nodeId) ?? null
        if (this.dragNode) {
          this.isDragging = true
          this.dragStartPos = {
            x: e.clientX - this.dragNode.position.x * this.scale,
            y: e.clientY - this.dragNode.position.y * this.scale,
          }
          this.emit('node:dragstart', { node: this.dragNode, originalEvent: e })
        }
      }
    } else if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // 中键或 Alt+左键，开始平移
      this.isPanning = true
      this.dragStartPos = {
        x: e.clientX - this.panOffset.x,
        y: e.clientY - this.panOffset.y,
      }
      this.canvas.style.cursor = 'grabbing'
    } else if (e.button === 0 && !nodeEl && !handleEl) {
      // 左键点击空白区域，开始平移画布
      this.isPanning = true
      this.dragStartPos = {
        x: e.clientX - this.panOffset.x,
        y: e.clientY - this.panOffset.y,
      }
      this.canvas.style.cursor = 'grabbing'
    }
  }

  /**
   * 处理鼠标移动
   */
  private handleMouseMove(e: MouseEvent): void {
    // 更新连线模式下的临时连线
    if (this.isConnecting && this.connectLine) {
      const pos = this.getCanvasPosition(e)
      this.connectLine.setAttribute('x2', String(pos.x))
      this.connectLine.setAttribute('y2', String(pos.y))
    }

    if (this.isDragging && this.dragNode) {
      const newX = (e.clientX - this.dragStartPos.x) / this.scale
      const newY = (e.clientY - this.dragStartPos.y) / this.scale

      this.nodeManager.updateNodePosition(this.dragNode.id, { x: newX, y: newY })
      this.renderNode(this.dragNode.id)
      this.renderConnectedEdges(this.dragNode.id)
      this.emit('node:drag', { node: this.dragNode, originalEvent: e })
    } else if (this.isPanning) {
      this.panOffset = {
        x: e.clientX - this.dragStartPos.x,
        y: e.clientY - this.dragStartPos.y,
      }
      this.updateTransform()
      this.emit('canvas:pan', { originalEvent: e })
    }
  }

  /**
   * 处理鼠标松开
   */
  private handleMouseUp(e: MouseEvent): void {
    // 处理连线模式下的鼠标松开
    if (this.isConnecting && this.connectSourceId) {
      const target = e.target as HTMLElement

      // 检查是否松开在目标 handle 上
      const handleEl = target.closest('.fc-handle') as HTMLElement
      if (handleEl) {
        const handleType = handleEl.getAttribute('data-handle-type')
        const targetNodeId = handleEl.getAttribute('data-node-id')

        if (handleType === 'target' && targetNodeId && targetNodeId !== this.connectSourceId) {
          this.finishConnecting(targetNodeId)
          return
        }
      }

      // 检查是否松开在节点上（使用节点的默认入口 handle）
      const nodeEl = target.closest('.fc-node') as HTMLElement
      if (nodeEl) {
        const targetNodeId = nodeEl.getAttribute('data-node-id')
        if (targetNodeId && targetNodeId !== this.connectSourceId) {
          this.finishConnecting(targetNodeId)
          return
        }
      }

      // 否则取消连线
      this.cancelConnecting()
    }

    if (this.isDragging && this.dragNode) {
      this.recordHistory()
      this.emit('node:dragend', { node: this.dragNode, originalEvent: e })
    }

    if (this.isPanning) {
      this.canvas.style.cursor = ''
    }

    this.isDragging = false
    this.isPanning = false
    this.dragNode = null
  }

  /**
   * 处理滚轮缩放
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()

    const zoomConfig = this.config.canvas?.zoom
    if (!zoomConfig) return

    const delta = e.deltaY > 0 ? -zoomConfig.step : zoomConfig.step
    const newScale = Math.max(zoomConfig.min, Math.min(zoomConfig.max, this.scale + delta))

    if (newScale !== this.scale) {
      // 以鼠标位置为中心缩放
      const rect = this.container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      this.panOffset.x = mouseX - ((mouseX - this.panOffset.x) * newScale) / this.scale
      this.panOffset.y = mouseY - ((mouseY - this.panOffset.y) * newScale) / this.scale

      this.scale = newScale
      this.updateTransform()
      this.emit('canvas:zoom', { zoom: this.scale, originalEvent: e })
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (this.config.readonly) return

    // Delete 删除选中的节点/连线
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedNodes = this.nodeManager.getSelectedNodes()
      const selectedEdges = this.edgeManager.getSelectedEdges()

      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        e.preventDefault()
        this.deleteSelected()
      }
    }

    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.undo()
    }

    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      this.redo()
    }

    // Ctrl+A 全选
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      this.selectAll()
    }
  }

  /**
   * 更新画布变换
   */
  private updateTransform(): void {
    this.canvas.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.scale})`
  }

  /**
   * 获取画布坐标
   */
  private getCanvasPosition(e: MouseEvent): Position {
    const rect = this.container.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - this.panOffset.x) / this.scale,
      y: (e.clientY - rect.top - this.panOffset.y) / this.scale,
    }
  }

  // ============ 公共API ============

  /**
   * 加载流程数据
   */
  loadData(data: FlowDefinition): void {
    let nodes = data.nodes

    // 如果启用自动布局，重新计算节点位置
    if (this.config.layout?.autoLayout) {
      nodes = autoLayout(nodes, data.edges, this.config.layout)
    } else {
      // 否则只调整重叠的节点
      nodes = adjustNodePositions(nodes, this.config.layout)
    }

    this.nodeManager.setNodes(nodes)
    this.edgeManager.setEdges(data.edges)
    this.render()

    // 自动居中显示
    this.centerView()

    this.history.clear()
    this.recordHistory()
    this.emit('flow:change', { changes: { type: 'add', nodes, edges: data.edges } })
  }

  /**
   * 重新布局
   */
  relayout(): void {
    const nodes = this.nodeManager.getNodes()
    const edges = this.edgeManager.getEdges()
    const layoutedNodes = autoLayout(nodes, edges, this.config.layout)
    this.nodeManager.setNodes(layoutedNodes)
    this.render()
    this.recordHistory()
  }

  /**
   * 获取流程数据
   */
  getData(): FlowDefinition {
    return {
      id: generateId('flow'),
      name: 'Untitled Flow',
      nodes: deepClone(this.nodeManager.getNodes()),
      edges: deepClone(this.edgeManager.getEdges()),
    }
  }

  /**
   * 导出为JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getData(), null, 2)
  }

  /**
   * 从JSON导入
   */
  fromJSON(json: string): void {
    try {
      const data = JSON.parse(json) as FlowDefinition
      this.loadData(data)
    } catch (error) {
      console.error('Flowchart: Failed to parse JSON', error)
    }
  }

  /**
   * 添加节点
   */
  addNode(config: { type: NodeType; position: Position; data?: Partial<FlowNode['data']> }): FlowNode {
    const node = this.nodeManager.addNode({
      type: config.type,
      position: config.position,
      data: config.data as FlowNode['data'],
    })

    this.renderNode(node.id)
    this.recordHistory()
    this.emit('node:add', { node })
    this.emit('flow:change', { changes: { type: 'add', nodes: [node] } })

    return node
  }

  /**
   * 更新节点
   */
  updateNode(id: string, updates: Partial<FlowNode>): FlowNode | undefined {
    const node = this.nodeManager.updateNode(id, updates)
    if (node) {
      this.renderNode(id)
      this.recordHistory()
      this.emit('node:change', { node })
      this.emit('flow:change', { changes: { type: 'update', nodes: [node] } })
    }
    return node
  }

  /**
   * 删除节点
   */
  removeNode(id: string): FlowNode | undefined {
    const node = this.nodeManager.removeNode(id)
    if (node) {
      // 删除相关连线
      const removedEdges = this.edgeManager.removeEdgesByNode(id)

      // 移除DOM元素
      const nodeEl = this.nodeElements.get(id)
      if (nodeEl) {
        nodeEl.remove()
        this.nodeElements.delete(id)
      }

      removedEdges.forEach((edge) => {
        const edgeEl = this.edgeElements.get(edge.id)
        if (edgeEl) {
          edgeEl.remove()
          this.edgeElements.delete(edge.id)
        }
      })

      this.recordHistory()
      this.emit('node:remove', { node })
      this.emit('flow:change', { changes: { type: 'remove', nodes: [node], edges: removedEdges } })
    }
    return node
  }

  /**
   * 添加连线
   */
  addEdge(source: string, target: string, data?: FlowEdge['data']): FlowEdge | undefined {
    const nodeIds = this.nodeManager.getNodes().map((n) => n.id)
    if (!this.edgeManager.validateEdge(source, target, nodeIds)) {
      return undefined
    }

    const edge = this.edgeManager.addEdge({ source, target, data })
    this.renderEdge(edge.id)
    this.recordHistory()
    this.emit('edge:add', { edge })
    this.emit('flow:change', { changes: { type: 'add', edges: [edge] } })

    return edge
  }

  /**
   * 删除连线
   */
  removeEdge(id: string): FlowEdge | undefined {
    const edge = this.edgeManager.removeEdge(id)
    if (edge) {
      const edgeEl = this.edgeElements.get(id)
      if (edgeEl) {
        edgeEl.remove()
        this.edgeElements.delete(id)
      }

      this.recordHistory()
      this.emit('edge:remove', { edge })
      this.emit('flow:change', { changes: { type: 'remove', edges: [edge] } })
    }
    return edge
  }

  /**
   * 选中节点
   */
  selectNode(id: string, multiple = false): void {
    this.nodeManager.selectNode(id, multiple)
    if (!multiple) {
      this.edgeManager.deselectAll()
    }
    this.render()
    this.emitSelectionChange()
  }

  /**
   * 选中连线
   */
  selectEdge(id: string, multiple = false): void {
    this.edgeManager.selectEdge(id, multiple)
    if (!multiple) {
      this.nodeManager.deselectAll()
    }
    this.render()
    this.emitSelectionChange()
  }

  /**
   * 取消所有选中
   */
  deselectAll(): void {
    this.nodeManager.deselectAll()
    this.edgeManager.deselectAll()
    this.render()
    this.emitSelectionChange()
  }

  /**
   * 全选
   */
  selectAll(): void {
    this.nodeManager.getNodes().forEach((node) => {
      this.nodeManager.selectNode(node.id, true)
    })
    this.edgeManager.getEdges().forEach((edge) => {
      this.edgeManager.selectEdge(edge.id, true)
    })
    this.render()
    this.emitSelectionChange()
  }

  /**
   * 触发选择变化事件
   */
  private emitSelectionChange(): void {
    const selectedNodes = this.nodeManager.getSelectedNodes()
    const selectedEdges = this.edgeManager.getSelectedEdges()
    this.emit('selection:change', {
      nodes: selectedNodes,
      edges: selectedEdges,
      selectedNodes,
      selectedEdges,
    })
  }

  // ============ 连线模式 ============

  /**
   * 从 handle 开始拖拽连线
   */
  private startConnectingFromHandle(sourceId: string, handlePosition: string): void {
    if (this.config.readonly) return
    this.isConnecting = true
    this.connectSourceId = sourceId
    this.connectSourceHandle = handlePosition

    // 创建临时连线
    this.connectLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    this.connectLine.setAttribute('stroke', '#1890ff')
    this.connectLine.setAttribute('stroke-width', '1.5')
    this.connectLine.setAttribute('stroke-dasharray', '4,4')
    this.connectLine.style.pointerEvents = 'none'
    this.edgesLayer.appendChild(this.connectLine)

    // 获取源节点位置 - 根据 handle 位置确定起点
    const sourceNode = this.nodeManager.getNode(sourceId)
    if (sourceNode) {
      const nodeWidth = sourceNode.size?.width ?? 180
      const nodeHeight = sourceNode.size?.height ?? 60
      let startX: number, startY: number

      switch (handlePosition) {
        case 'right':
          startX = sourceNode.position.x + nodeWidth
          startY = sourceNode.position.y + nodeHeight / 2
          break
        case 'left':
          startX = sourceNode.position.x
          startY = sourceNode.position.y + nodeHeight / 2
          break
        case 'top':
          startX = sourceNode.position.x + nodeWidth / 2
          startY = sourceNode.position.y
          break
        case 'bottom':
        default:
          startX = sourceNode.position.x + nodeWidth / 2
          startY = sourceNode.position.y + nodeHeight
          break
      }

      this.connectLine.setAttribute('x1', String(startX))
      this.connectLine.setAttribute('y1', String(startY))
      this.connectLine.setAttribute('x2', String(startX))
      this.connectLine.setAttribute('y2', String(startY))
    }

    this.canvas.style.cursor = 'crosshair'

    // 高亮所有可能的目标 handle
    this.highlightTargetHandles(true)
  }

  /**
   * 开始连线
   */
  startConnecting(sourceId: string): void {
    if (this.config.readonly) return
    this.isConnecting = true
    this.connectSourceId = sourceId
    this.connectSourceHandle = 'bottom'

    // 创建临时连线
    this.connectLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    this.connectLine.setAttribute('stroke', '#1890ff')
    this.connectLine.setAttribute('stroke-width', '1.5')
    this.connectLine.setAttribute('stroke-dasharray', '4,4')
    this.connectLine.style.pointerEvents = 'none'
    this.edgesLayer.appendChild(this.connectLine)

    // 获取源节点位置
    const sourceNode = this.nodeManager.getNode(sourceId)
    if (sourceNode) {
      const startX = sourceNode.position.x + (sourceNode.size?.width ?? 180) / 2
      const startY = sourceNode.position.y + (sourceNode.size?.height ?? 60)
      this.connectLine.setAttribute('x1', String(startX))
      this.connectLine.setAttribute('y1', String(startY))
      this.connectLine.setAttribute('x2', String(startX))
      this.connectLine.setAttribute('y2', String(startY))
    }

    this.canvas.style.cursor = 'crosshair'
    this.highlightTargetHandles(true)
  }

  /**
   * 高亮目标连接点
   */
  private highlightTargetHandles(show: boolean): void {
    const handles = this.nodesLayer.querySelectorAll('.fc-handle-target')
    handles.forEach((handle) => {
      const el = handle as HTMLElement
      if (show) {
        // 排除源节点的 handle
        const nodeId = el.getAttribute('data-node-id')
        if (nodeId !== this.connectSourceId) {
          el.style.opacity = '1'
          el.style.transform = el.style.transform.replace('scale(1)', '') + ' scale(1.2)'
        }
      } else {
        el.style.opacity = ''
        el.style.transform = el.style.transform.replace(' scale(1.2)', '')
      }
    })
  }

  /**
   * 取消连线
   */
  cancelConnecting(): void {
    this.highlightTargetHandles(false)
    this.isConnecting = false
    this.connectSourceId = null
    this.connectSourceHandle = null
    if (this.connectLine) {
      this.connectLine.remove()
      this.connectLine = null
    }
    this.canvas.style.cursor = ''
  }

  /**
   * 完成连线
   */
  finishConnecting(targetId: string): FlowEdge | undefined {
    if (!this.isConnecting || !this.connectSourceId) return undefined
    if (this.connectSourceId === targetId) {
      this.cancelConnecting()
      return undefined
    }

    const edge = this.addEdge(this.connectSourceId, targetId)
    this.cancelConnecting()
    return edge
  }

  /**
   * 是否在连线模式
   */
  isInConnectingMode(): boolean {
    return this.isConnecting
  }

  /**
   * 获取连线源节点ID
   */
  getConnectSourceId(): string | null {
    return this.connectSourceId
  }

  /**
   * 删除选中的元素
   */
  deleteSelected(): void {
    const selectedNodes = this.nodeManager.getSelectedNodes()
    const selectedEdges = this.edgeManager.getSelectedEdges()

    selectedEdges.forEach((edge) => this.removeEdge(edge.id))
    selectedNodes.forEach((node) => this.removeNode(node.id))
  }

  /**
   * 撤销
   */
  undo(): void {
    const currentState: HistoryState = {
      nodes: this.nodeManager.getNodes(),
      edges: this.edgeManager.getEdges(),
    }

    const prevState = this.history.undo(currentState)
    if (prevState) {
      this.nodeManager.setNodes(prevState.nodes)
      this.edgeManager.setEdges(prevState.edges)
      this.render()
      this.emit('history:undo', {})
    }
  }

  /**
   * 重做
   */
  redo(): void {
    const currentState: HistoryState = {
      nodes: this.nodeManager.getNodes(),
      edges: this.edgeManager.getEdges(),
    }

    const nextState = this.history.redo(currentState)
    if (nextState) {
      this.nodeManager.setNodes(nextState.nodes)
      this.edgeManager.setEdges(nextState.edges)
      this.render()
      this.emit('history:redo', {})
    }
  }

  /**
   * 水平居中视图（不改变缩放）
   */
  centerView(padding = 30): void {
    const nodes = this.nodeManager.getNodes()
    if (nodes.length === 0) return

    const bounds = this.getNodesBounds(nodes)
    const containerRect = this.container.getBoundingClientRect()

    // 只水平居中，垂直方向保持上方有padding
    this.panOffset = {
      x: (containerRect.width - bounds.width * this.scale) / 2 - bounds.x * this.scale,
      y: padding - bounds.y * this.scale,
    }

    this.updateTransform()
  }

  /**
   * 缩放到适应视图
   */
  fitView(padding = 50): void {
    const nodes = this.nodeManager.getNodes()
    if (nodes.length === 0) return

    const bounds = this.getNodesBounds(nodes)
    const containerRect = this.container.getBoundingClientRect()

    const scaleX = (containerRect.width - padding * 2) / bounds.width
    const scaleY = (containerRect.height - padding * 2) / bounds.height
    const newScale = Math.min(scaleX, scaleY, 1)

    this.scale = newScale
    this.panOffset = {
      x: (containerRect.width - bounds.width * newScale) / 2 - bounds.x * newScale,
      y: (containerRect.height - bounds.height * newScale) / 2 - bounds.y * newScale,
    }

    this.updateTransform()
  }

  /**
   * 设置缩放
   */
  setZoom(scale: number): void {
    const zoomConfig = this.config.canvas?.zoom
    if (zoomConfig) {
      this.scale = Math.max(zoomConfig.min, Math.min(zoomConfig.max, scale))
      this.updateTransform()
      this.emit('canvas:zoom', { zoom: this.scale })
    }
  }

  /**
   * 获取缩放
   */
  getZoom(): number {
    return this.scale
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const zoomConfig = this.config.canvas?.zoom
    if (zoomConfig) {
      this.setZoom(this.scale + zoomConfig.step)
    }
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const zoomConfig = this.config.canvas?.zoom
    if (zoomConfig) {
      this.setZoom(this.scale - zoomConfig.step)
    }
  }

  /**
   * 重置缩放
   */
  resetZoom(): void {
    this.setZoom(1)
    this.panOffset = { x: 0, y: 0 }
    this.updateTransform()
  }

  /**
   * 验证流程
   */
  validate(): ValidationResult {
    return this.validator.validate(
      this.nodeManager.getNodes(),
      this.edgeManager.getEdges()
    )
  }

  /**
   * 监听事件
   */
  on(event: FlowchartEventType, callback: FlowchartEventCallback): () => void {
    return this.eventEmitter.on(event, callback)
  }

  /**
   * 取消监听
   */
  off(event: FlowchartEventType, callback: FlowchartEventCallback): void {
    this.eventEmitter.off(event, callback)
  }

  /**
   * 触发事件
   */
  private emit(event: FlowchartEventType, data: FlowchartEventData): void {
    this.eventEmitter.emit(event, data)
  }

  /**
   * 记录历史
   */
  private recordHistory(): void {
    this.history.push({
      nodes: deepClone(this.nodeManager.getNodes()),
      edges: deepClone(this.edgeManager.getEdges()),
    })
  }

  // ============ 渲染方法 ============

  /**
   * 渲染所有
   */
  render(): void {
    if (this.isDestroyed) return

    // 渲染节点
    this.nodeManager.getNodes().forEach((node) => {
      this.renderNode(node.id)
    })

    // 渲染连线
    this.edgeManager.getEdges().forEach((edge) => {
      this.renderEdge(edge.id)
    })
  }

  /**
   * 渲染节点
   */
  private renderNode(id: string): void {
    const node = this.nodeManager.getNode(id)
    if (!node) return

    let nodeEl = this.nodeElements.get(id)

    if (!nodeEl) {
      nodeEl = document.createElement('div')
      this.nodesLayer.appendChild(nodeEl)
      this.nodeElements.set(id, nodeEl)
    }

    this.nodeRenderer.render(node, nodeEl)
  }

  /**
   * 渲染连线
   */
  private renderEdge(id: string): void {
    const edge = this.edgeManager.getEdge(id)
    if (!edge) return

    const sourceNode = this.nodeManager.getNode(edge.source)
    const targetNode = this.nodeManager.getNode(edge.target)
    if (!sourceNode || !targetNode) return

    // 获取实际渲染的节点尺寸
    const sourceEl = this.nodeElements.get(edge.source)
    const targetEl = this.nodeElements.get(edge.target)

    // 使用实际 DOM 尺寸覆盖 node.size
    const sourceWithSize = { ...sourceNode }
    const targetWithSize = { ...targetNode }

    if (sourceEl) {
      sourceWithSize.size = {
        width: sourceEl.offsetWidth || 150,
        height: sourceEl.offsetHeight || 50
      }
    }
    if (targetEl) {
      targetWithSize.size = {
        width: targetEl.offsetWidth || 150,
        height: targetEl.offsetHeight || 50
      }
    }

    let edgeEl = this.edgeElements.get(id)

    if (!edgeEl) {
      edgeEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.edgesLayer.appendChild(edgeEl)
      this.edgeElements.set(id, edgeEl)
    }

    this.edgeRenderer.render(edge, sourceWithSize, targetWithSize, edgeEl)
  }

  /**
   * 渲染与节点相连的连线
   */
  private renderConnectedEdges(nodeId: string): void {
    const edges = this.edgeManager.findEdgesByNode(nodeId)
    edges.forEach((edge) => this.renderEdge(edge.id))
  }

  /**
   * 获取节点边界
   */
  private getNodesBounds(nodes: FlowNode[]): {
    x: number
    y: number
    width: number
    height: number
  } {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach((node) => {
      const width = node.size?.width ?? 180
      const height = node.size?.height ?? 60

      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + width)
      maxY = Math.max(maxY, node.position.y + height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.isDestroyed = true
    this.eventEmitter.removeAllListeners()
    this.container.innerHTML = ''
    this.nodeElements.clear()
    this.edgeElements.clear()
  }

  // ============ 获取器 ============

  /**
   * 获取所有节点
   */
  getNodes(): FlowNode[] {
    return this.nodeManager.getNodes()
  }

  /**
   * 获取所有连线
   */
  getEdges(): FlowEdge[] {
    return this.edgeManager.getEdges()
  }

  /**
   * 获取节点
   */
  getNode(id: string): FlowNode | undefined {
    return this.nodeManager.getNode(id)
  }

  /**
   * 获取连线
   */
  getEdge(id: string): FlowEdge | undefined {
    return this.edgeManager.getEdge(id)
  }

  /**
   * 获取选中的节点
   */
  getSelectedNodes(): FlowNode[] {
    return this.nodeManager.getSelectedNodes()
  }

  /**
   * 获取选中的连线
   */
  getSelectedEdges(): FlowEdge[] {
    return this.edgeManager.getSelectedEdges()
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
}
