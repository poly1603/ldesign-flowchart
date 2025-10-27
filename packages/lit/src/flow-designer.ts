/**
 * Lit Web Components - 流程设计器组件
 */
import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import { FlowModel, NodeModel, EdgeModel } from '@ldesign/flowchart-core/models'
import { SVGEngine } from '@ldesign/flowchart-core/engine'
import { SelectionPlugin, MinimapPlugin } from '@ldesign/flowchart-core/plugins'
import type { FlowData, NodeData, EdgeData, FlowDesignerConfig } from '@ldesign/flowchart-core/types'

@customElement('flow-designer')
export class FlowDesigner extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      background: #f5f5f5;
    }
    
    .flow-designer-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
    
    .flow-designer-canvas {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .flow-toolbar {
      position: absolute;
      top: 16px;
      left: 16px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    
    .flow-toolbar button {
      padding: 8px 16px;
      border: 1px solid #d9d9d9;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .flow-toolbar button:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
    
    .flow-toolbar button:active {
      background: #e6f7ff;
    }
    
    .flow-toolbar button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .flow-sidebar {
      position: absolute;
      left: 0;
      top: 0;
      width: 260px;
      height: 100%;
      background: white;
      border-right: 1px solid #e8e8e8;
      z-index: 5;
      transition: transform 0.3s;
    }
    
    .flow-sidebar.collapsed {
      transform: translateX(-100%);
    }
    
    .flow-sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e8e8e8;
      font-size: 16px;
      font-weight: 500;
    }
    
    .flow-node-palette {
      padding: 16px;
    }
    
    .flow-node-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      cursor: move;
      text-align: center;
      transition: all 0.3s;
    }
    
    .flow-node-item:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 8px rgba(24,144,255,0.2);
    }
    
    .flow-node-item[draggable="true"] {
      user-select: none;
    }
    
    .flow-property-panel {
      position: absolute;
      right: 0;
      top: 0;
      width: 320px;
      height: 100%;
      background: white;
      border-left: 1px solid #e8e8e8;
      z-index: 5;
      transition: transform 0.3s;
    }
    
    .flow-property-panel.collapsed {
      transform: translateX(100%);
    }
    
    .flow-property-header {
      padding: 16px;
      border-bottom: 1px solid #e8e8e8;
      font-size: 16px;
      font-weight: 500;
    }
    
    .flow-property-content {
      padding: 16px;
    }
    
    .flow-property-group {
      margin-bottom: 24px;
    }
    
    .flow-property-label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-size: 14px;
    }
    
    .flow-property-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    
    .flow-property-input:focus {
      outline: none;
      border-color: #1890ff;
    }
    
    .flow-property-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      resize: vertical;
    }
    
    .flow-property-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }
  `

  @property({ type: Object })
  data?: FlowData

  @property({ type: Object })
  config?: FlowDesignerConfig

  @property({ type: Boolean })
  readonly = false

  @property({ type: Boolean })
  showToolbar = true

  @property({ type: Boolean })
  showSidebar = true

  @property({ type: Boolean })
  showPropertyPanel = true

  @property({ type: Boolean })
  showMinimap = true

  @state()
  private selectedNode: NodeModel | null = null

  @state()
  private selectedEdge: EdgeModel | null = null

  @state()
  private canUndo = false

  @state()
  private canRedo = false

  @query('.flow-designer-canvas')
  private canvas!: HTMLElement

  private flowModel!: FlowModel
  private renderer!: SVGEngine
  private selectionPlugin!: SelectionPlugin
  private minimapPlugin!: MinimapPlugin

  connectedCallback(): void {
    super.connectedCallback()
  }

  firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties)
    this.initDesigner()
  }

  updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('data') && this.data) {
      this.flowModel.load(this.data)
    }

    if (changedProperties.has('readonly')) {
      this.flowModel.setReadonly(this.readonly)
    }
  }

  private initDesigner(): void {
    // 初始化数据模型
    this.flowModel = new FlowModel(this.data)

    // 初始化渲染引擎
    this.renderer = new SVGEngine()
    this.renderer.init(this.canvas)

    // 初始化插件
    const pluginContext = {
      flowModel: this.flowModel,
      renderer: this.renderer,
      container: this.canvas,
      config: this.config || {},
      plugins: new Map()
    }

    // 选择插件
    this.selectionPlugin = new SelectionPlugin()
    this.selectionPlugin.init(pluginContext)
    this.selectionPlugin.enable()

    // 小地图插件
    if (this.showMinimap) {
      this.minimapPlugin = new MinimapPlugin()
      this.minimapPlugin.init(pluginContext)
      this.minimapPlugin.enable()
    }

    // 监听事件
    this.flowModel.on('nodeSelected', ({ node }) => {
      this.selectedNode = node
      this.selectedEdge = null
      this.requestUpdate()
    })

    this.flowModel.on('edgeSelected', ({ edge }) => {
      this.selectedEdge = edge
      this.selectedNode = null
      this.requestUpdate()
    })

    this.flowModel.on('selectionCleared', () => {
      this.selectedNode = null
      this.selectedEdge = null
      this.requestUpdate()
    })

    // 监听历史记录变化
    this.updateHistoryState()
    this.flowModel.on('nodeAdded', () => this.updateHistoryState())
    this.flowModel.on('nodeRemoved', () => this.updateHistoryState())
    this.flowModel.on('edgeAdded', () => this.updateHistoryState())
    this.flowModel.on('edgeRemoved', () => this.updateHistoryState())

    // 初始渲染
    this.renderFlow()
  }

  private updateHistoryState(): void {
    this.canUndo = this.flowModel.canUndo()
    this.canRedo = this.flowModel.canRedo()
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
        interactive: !this.readonly,
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      })),
      ...nodes.map(node => ({
        id: node.id,
        type: 'node' as const,
        data: node.toJSON(),
        layer: 'nodes',
        visible: true,
        interactive: !this.readonly,
        bounds: node.getBounds()
      }))
    ]

    this.renderer.render(elements)
  }

  private handleDragStart(e: DragEvent, nodeType: string): void {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('nodeType', nodeType)
    }
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault()

    if (!e.dataTransfer) return

    const nodeType = e.dataTransfer.getData('nodeType')
    if (!nodeType) return

    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const nodeData: NodeData = {
      type: nodeType as any,
      label: this.getNodeLabel(nodeType),
      position: { x: x - 60, y: y - 30 },
      size: { width: 120, height: 60 }
    }

    this.flowModel.addNode(nodeData)
    this.renderFlow()
  }

  private getNodeLabel(type: string): string {
    const labels: Record<string, string> = {
      'start': '开始',
      'end': '结束',
      'process': '处理',
      'decision': '判断',
      'approval': '审批',
      'gateway': '网关'
    }
    return labels[type] || type
  }

  private handleUndo(): void {
    this.flowModel.undo()
    this.renderFlow()
  }

  private handleRedo(): void {
    this.flowModel.redo()
    this.renderFlow()
  }

  private handleDelete(): void {
    if (this.selectedNode) {
      this.flowModel.removeNode(this.selectedNode.id)
    }
    if (this.selectedEdge) {
      this.flowModel.removeEdge(this.selectedEdge.id)
    }
    this.renderFlow()
  }

  private handleExport(): void {
    const data = this.flowModel.toJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowchart.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  private handlePropertyChange(property: string, value: any): void {
    if (this.selectedNode) {
      this.flowModel.updateNode(this.selectedNode.id, { [property]: value })
    }
    if (this.selectedEdge) {
      this.flowModel.updateEdge(this.selectedEdge.id, { [property]: value })
    }
    this.renderFlow()
  }

  render() {
    return html`
      <div class="flow-designer-container">
        ${this.showToolbar ? this.renderToolbar() : ''}
        ${this.showSidebar ? this.renderSidebar() : ''}
        <div 
          class="flow-designer-canvas"
          @dragover=${this.handleDragOver}
          @drop=${this.handleDrop}
        ></div>
        ${this.showPropertyPanel ? this.renderPropertyPanel() : ''}
      </div>
    `
  }

  private renderToolbar() {
    return html`
      <div class="flow-toolbar">
        <button 
          @click=${this.handleUndo}
          ?disabled=${!this.canUndo || this.readonly}
        >撤销</button>
        <button 
          @click=${this.handleRedo}
          ?disabled=${!this.canRedo || this.readonly}
        >重做</button>
        <button 
          @click=${this.handleDelete}
          ?disabled=${!this.selectedNode && !this.selectedEdge || this.readonly}
        >删除</button>
        <button @click=${this.handleExport}>导出</button>
      </div>
    `
  }

  private renderSidebar() {
    const nodeTypes = ['start', 'process', 'decision', 'approval', 'gateway', 'end']

    return html`
      <div class="flow-sidebar">
        <div class="flow-sidebar-header">节点面板</div>
        <div class="flow-node-palette">
          ${nodeTypes.map(type => html`
            <div 
              class="flow-node-item"
              draggable="true"
              @dragstart=${(e: DragEvent) => this.handleDragStart(e, type)}
            >
              ${this.getNodeLabel(type)}
            </div>
          `)}
        </div>
      </div>
    `
  }

  private renderPropertyPanel() {
    if (!this.selectedNode && !this.selectedEdge) {
      return html``
    }

    return html`
      <div class="flow-property-panel">
        <div class="flow-property-header">
          ${this.selectedNode ? '节点属性' : '连线属性'}
        </div>
        <div class="flow-property-content">
          ${this.selectedNode ? this.renderNodeProperties() : this.renderEdgeProperties()}
        </div>
      </div>
    `
  }

  private renderNodeProperties() {
    if (!this.selectedNode) return html``

    return html`
      <div class="flow-property-group">
        <label class="flow-property-label">ID</label>
        <input 
          class="flow-property-input"
          type="text"
          value=${this.selectedNode.id}
          disabled
        />
      </div>
      
      <div class="flow-property-group">
        <label class="flow-property-label">标签</label>
        <input 
          class="flow-property-input"
          type="text"
          .value=${this.selectedNode.label}
          @change=${(e: Event) => {
        const input = e.target as HTMLInputElement
        this.handlePropertyChange('label', input.value)
      }}
          ?disabled=${this.readonly}
        />
      </div>
      
      <div class="flow-property-group">
        <label class="flow-property-label">类型</label>
        <select 
          class="flow-property-select"
          .value=${this.selectedNode.type}
          @change=${(e: Event) => {
        const select = e.target as HTMLSelectElement
        this.handlePropertyChange('type', select.value)
      }}
          ?disabled=${this.readonly}
        >
          <option value="default">默认</option>
          <option value="start">开始</option>
          <option value="end">结束</option>
          <option value="process">处理</option>
          <option value="decision">判断</option>
          <option value="approval">审批</option>
          <option value="gateway">网关</option>
        </select>
      </div>
    `
  }

  private renderEdgeProperties() {
    if (!this.selectedEdge) return html``

    return html`
      <div class="flow-property-group">
        <label class="flow-property-label">ID</label>
        <input 
          class="flow-property-input"
          type="text"
          value=${this.selectedEdge.id}
          disabled
        />
      </div>
      
      <div class="flow-property-group">
        <label class="flow-property-label">标签</label>
        <input 
          class="flow-property-input"
          type="text"
          .value=${this.selectedEdge.label || ''}
          @change=${(e: Event) => {
        const input = e.target as HTMLInputElement
        this.handlePropertyChange('label', input.value)
      }}
          ?disabled=${this.readonly}
        />
      </div>
      
      <div class="flow-property-group">
        <label class="flow-property-label">源节点</label>
        <input 
          class="flow-property-input"
          type="text"
          value=${this.selectedEdge.source}
          disabled
        />
      </div>
      
      <div class="flow-property-group">
        <label class="flow-property-label">目标节点</label>
        <input 
          class="flow-property-input"
          type="text"
          value=${this.selectedEdge.target}
          disabled
        />
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flow-designer': FlowDesigner
  }
}

