/**
 * Lit Web Components - 流程查看器组件
 */
import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { FlowModel } from '@ldesign/flowchart-core/models'
import { SVGEngine } from '@ldesign/flowchart-core/engine'
import { MinimapPlugin } from '@ldesign/flowchart-core/plugins'
import type { FlowData, NodeStatus } from '@ldesign/flowchart-core/types'

@customElement('flow-viewer')
export class FlowViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      background: #f5f5f5;
    }
    
    .flow-viewer-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    
    .flow-viewer-canvas {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .flow-viewer-toolbar {
      position: absolute;
      top: 16px;
      right: 16px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 10;
    }
    
    .flow-viewer-button {
      width: 36px;
      height: 36px;
      border: 1px solid #d9d9d9;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    
    .flow-viewer-button:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
    
    .flow-viewer-button:active {
      background: #e6f7ff;
    }
    
    .flow-viewer-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 12px;
      z-index: 10;
    }
    
    .flow-viewer-legend-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }
    
    .flow-viewer-legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
      color: #666;
    }
    
    .flow-viewer-legend-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      border-radius: 2px;
    }
    
    .flow-viewer-info {
      position: absolute;
      top: 16px;
      left: 16px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 12px;
      z-index: 10;
      max-width: 300px;
    }
    
    .flow-viewer-info-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }
    
    .flow-viewer-info-item {
      display: flex;
      margin-bottom: 6px;
      font-size: 14px;
    }
    
    .flow-viewer-info-label {
      color: #999;
      margin-right: 8px;
      min-width: 60px;
    }
    
    .flow-viewer-info-value {
      color: #333;
      flex: 1;
    }
  `

  @property({ type: Object })
  data?: FlowData

  @property({ type: Boolean })
  showMinimap = true

  @property({ type: Boolean })
  showLegend = true

  @property({ type: Boolean })
  showInfo = false

  @property({ type: String })
  title = ''

  @property({ type: String })
  description = ''

  @property({ type: Number })
  zoom = 1

  @property({ type: Object })
  nodeStatuses?: Record<string, NodeStatus>

  @query('.flow-viewer-canvas')
  private canvas!: HTMLElement

  private flowModel!: FlowModel
  private renderer!: SVGEngine
  private minimapPlugin?: MinimapPlugin

  connectedCallback(): void {
    super.connectedCallback()
  }

  firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties)
    this.initViewer()
  }

  updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('data') && this.data) {
      this.loadFlow(this.data)
    }

    if (changedProperties.has('nodeStatuses') && this.nodeStatuses) {
      this.updateNodeStatuses()
    }

    if (changedProperties.has('zoom')) {
      this.setZoom(this.zoom)
    }
  }

  private initViewer(): void {
    // 初始化数据模型（只读模式）
    this.flowModel = new FlowModel()
    this.flowModel.setReadonly(true)

    // 初始化渲染引擎
    this.renderer = new SVGEngine()
    this.renderer.init(this.canvas)

    // 初始化插件
    if (this.showMinimap) {
      const pluginContext = {
        flowModel: this.flowModel,
        renderer: this.renderer,
        container: this.canvas,
        config: {},
        plugins: new Map()
      }

      this.minimapPlugin = new MinimapPlugin()
      this.minimapPlugin.init(pluginContext)
      this.minimapPlugin.enable()
    }

    // 加载数据
    if (this.data) {
      this.loadFlow(this.data)
    }

    // 设置初始缩放
    this.setZoom(this.zoom)
  }

  private loadFlow(data: FlowData): void {
    this.flowModel.load(data)
    this.updateNodeStatuses()
    this.renderFlow()
    this.centerFlow()
  }

  private updateNodeStatuses(): void {
    if (!this.nodeStatuses) return

    Object.entries(this.nodeStatuses).forEach(([nodeId, status]) => {
      const node = this.flowModel.getNode(nodeId)
      if (node) {
        node.setStatus(status)
      }
    })

    this.renderFlow()
  }

  private renderFlow(): void {
    const nodes = this.flowModel.getNodes()
    const edges = this.flowModel.getEdges()

    const elements = [
      ...edges.map(edge => ({
        id: edge.id,
        type: 'edge' as const,
        data: edge.toJSON(),
        layer: 'edges',
        visible: true,
        interactive: false,
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      })),
      ...nodes.map(node => {
        const data = node.toJSON()
        // 根据状态设置样式
        if (node.status) {
          data.style = {
            ...data.style,
            fill: this.getStatusColor(node.status)
          }
        }
        return {
          id: node.id,
          type: 'node' as const,
          data,
          layer: 'nodes',
          visible: true,
          interactive: false,
          bounds: node.getBounds()
        }
      })
    ]

    this.renderer.render(elements)
  }

  private getStatusColor(status: NodeStatus): string {
    const colors: Record<NodeStatus, string> = {
      'pending': '#d9d9d9',
      'running': '#1890ff',
      'completed': '#52c41a',
      'failed': '#ff4d4f',
      'skipped': '#faad14',
      'paused': '#722ed1'
    }
    return colors[status] || '#d9d9d9'
  }

  private centerFlow(): void {
    const nodes = this.flowModel.getNodes()
    if (nodes.length === 0) return

    // 计算边界
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

    const flowWidth = maxX - minX
    const flowHeight = maxY - minY
    const containerWidth = this.canvas.offsetWidth
    const containerHeight = this.canvas.offsetHeight

    // 计算缩放和位置
    const scaleX = containerWidth / flowWidth
    const scaleY = containerHeight / flowHeight
    const scale = Math.min(scaleX, scaleY, 1) * 0.9

    const centerX = (containerWidth - flowWidth * scale) / 2
    const centerY = (containerHeight - flowHeight * scale) / 2

    this.renderer.setViewport({
      zoom: scale,
      position: {
        x: centerX - minX * scale,
        y: centerY - minY * scale
      }
    })
  }

  private setZoom(zoom: number): void {
    const viewport = this.renderer.getViewport()
    this.renderer.setViewport({
      ...viewport,
      zoom: Math.max(0.1, Math.min(2, zoom))
    })
  }

  private handleZoomIn(): void {
    this.zoom = Math.min(2, this.zoom * 1.2)
    this.setZoom(this.zoom)
  }

  private handleZoomOut(): void {
    this.zoom = Math.max(0.1, this.zoom / 1.2)
    this.setZoom(this.zoom)
  }

  private handleZoomReset(): void {
    this.zoom = 1
    this.centerFlow()
  }

  private handleToggleMinimap(): void {
    if (this.minimapPlugin) {
      if (this.showMinimap) {
        this.minimapPlugin.hide()
      } else {
        this.minimapPlugin.show()
      }
      this.showMinimap = !this.showMinimap
    }
  }

  render() {
    return html`
      <div class="flow-viewer-container">
        <div class="flow-viewer-canvas"></div>
        
        <div class="flow-viewer-toolbar">
          <button 
            class="flow-viewer-button"
            @click=${this.handleZoomIn}
            title="放大"
          >+</button>
          <button 
            class="flow-viewer-button"
            @click=${this.handleZoomOut}
            title="缩小"
          >-</button>
          <button 
            class="flow-viewer-button"
            @click=${this.handleZoomReset}
            title="重置"
          >⊙</button>
          ${this.minimapPlugin ? html`
            <button 
              class="flow-viewer-button"
              @click=${this.handleToggleMinimap}
              title=${this.showMinimap ? '隐藏小地图' : '显示小地图'}
            >☰</button>
          ` : ''}
        </div>
        
        ${this.showInfo && (this.title || this.description) ? html`
          <div class="flow-viewer-info">
            ${this.title ? html`
              <div class="flow-viewer-info-title">${this.title}</div>
            ` : ''}
            ${this.description ? html`
              <div class="flow-viewer-info-item">
                <div class="flow-viewer-info-value">${this.description}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${this.showLegend ? html`
          <div class="flow-viewer-legend">
            <div class="flow-viewer-legend-title">状态说明</div>
            <div class="flow-viewer-legend-item">
              <div class="flow-viewer-legend-icon" style="background: #d9d9d9"></div>
              <span>待处理</span>
            </div>
            <div class="flow-viewer-legend-item">
              <div class="flow-viewer-legend-icon" style="background: #1890ff"></div>
              <span>处理中</span>
            </div>
            <div class="flow-viewer-legend-item">
              <div class="flow-viewer-legend-icon" style="background: #52c41a"></div>
              <span>已完成</span>
            </div>
            <div class="flow-viewer-legend-item">
              <div class="flow-viewer-legend-icon" style="background: #ff4d4f"></div>
              <span>失败</span>
            </div>
            <div class="flow-viewer-legend-item">
              <div class="flow-viewer-legend-icon" style="background: #faad14"></div>
              <span>跳过</span>
            </div>
          </div>
        ` : ''}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flow-viewer': FlowViewer
  }
}

