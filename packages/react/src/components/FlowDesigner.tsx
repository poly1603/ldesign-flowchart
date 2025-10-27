/**
 * React Flow Designer Component
 */
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { FlowModel, NodeModel, EdgeModel } from '@ldesign/flowchart-core/models'
import { SVGEngine } from '@ldesign/flowchart-core/engine'
import { SelectionPlugin, MinimapPlugin } from '@ldesign/flowchart-core/plugins'
import type { FlowData, NodeData, EdgeData, FlowDesignerConfig } from '@ldesign/flowchart-core/types'
import classNames from 'classnames'
import './FlowDesigner.css'

export interface FlowDesignerProps {
  data?: FlowData
  config?: FlowDesignerConfig
  readonly?: boolean
  showToolbar?: boolean
  showSidebar?: boolean
  showPropertyPanel?: boolean
  showMinimap?: boolean
  onChange?: (data: FlowData) => void
  onNodeSelect?: (node: NodeData | null) => void
  onEdgeSelect?: (edge: EdgeData | null) => void
  className?: string
  style?: React.CSSProperties
}

const nodeTypes = [
  { type: 'start', label: '开始', color: '#52c41a' },
  { type: 'process', label: '处理', color: '#1890ff' },
  { type: 'decision', label: '判断', color: '#faad14' },
  { type: 'approval', label: '审批', color: '#722ed1' },
  { type: 'gateway', label: '网关', color: '#fa8c16' },
  { type: 'end', label: '结束', color: '#ff4d4f' }
]

export const FlowDesigner: React.FC<FlowDesignerProps> = ({
  data,
  config,
  readonly = false,
  showToolbar = true,
  showSidebar = true,
  showPropertyPanel = true,
  showMinimap = true,
  onChange,
  onNodeSelect,
  onEdgeSelect,
  className,
  style
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const flowModelRef = useRef<FlowModel | null>(null)
  const rendererRef = useRef<SVGEngine | null>(null)
  const selectionPluginRef = useRef<SelectionPlugin | null>(null)
  const minimapPluginRef = useRef<MinimapPlugin | null>(null)

  const [selectedNode, setSelectedNode] = useState<NodeModel | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeModel | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false)

  // 初始化设计器
  useEffect(() => {
    if (!canvasRef.current) return

    // 初始化数据模型
    const flowModel = new FlowModel(data)
    flowModelRef.current = flowModel

    // 初始化渲染引擎
    const renderer = new SVGEngine()
    renderer.init(canvasRef.current)
    rendererRef.current = renderer

    // 初始化插件
    const pluginContext = {
      flowModel,
      renderer,
      container: canvasRef.current,
      config: config || {},
      plugins: new Map()
    }

    // 选择插件
    const selectionPlugin = new SelectionPlugin()
    selectionPlugin.init(pluginContext)
    selectionPlugin.enable()
    selectionPluginRef.current = selectionPlugin

    // 小地图插件
    if (showMinimap) {
      const minimapPlugin = new MinimapPlugin()
      minimapPlugin.init(pluginContext)
      minimapPlugin.enable()
      minimapPluginRef.current = minimapPlugin
    }

    // 监听事件
    const handleNodeSelected = ({ node }: { node: NodeModel }) => {
      setSelectedNode(node)
      setSelectedEdge(null)
      onNodeSelect?.(node.toJSON())
    }

    const handleEdgeSelected = ({ edge }: { edge: EdgeModel }) => {
      setSelectedEdge(edge)
      setSelectedNode(null)
      onEdgeSelect?.(edge.toJSON())
    }

    const handleSelectionCleared = () => {
      setSelectedNode(null)
      setSelectedEdge(null)
      onNodeSelect?.(null)
      onEdgeSelect?.(null)
    }

    const handleDataChanged = () => {
      onChange?.(flowModel.toJSON())
      updateHistoryState()
      renderFlow()
    }

    flowModel.on('nodeSelected', handleNodeSelected)
    flowModel.on('edgeSelected', handleEdgeSelected)
    flowModel.on('selectionCleared', handleSelectionCleared)
    flowModel.on('nodeAdded', handleDataChanged)
    flowModel.on('nodeRemoved', handleDataChanged)
    flowModel.on('nodeUpdated', handleDataChanged)
    flowModel.on('edgeAdded', handleDataChanged)
    flowModel.on('edgeRemoved', handleDataChanged)
    flowModel.on('edgeUpdated', handleDataChanged)

    // 初始渲染
    renderFlow()
    updateHistoryState()

    // 清理函数
    return () => {
      flowModel.off('nodeSelected', handleNodeSelected)
      flowModel.off('edgeSelected', handleEdgeSelected)
      flowModel.off('selectionCleared', handleSelectionCleared)
      flowModel.off('nodeAdded', handleDataChanged)
      flowModel.off('nodeRemoved', handleDataChanged)
      flowModel.off('nodeUpdated', handleDataChanged)
      flowModel.off('edgeAdded', handleDataChanged)
      flowModel.off('edgeRemoved', handleDataChanged)
      flowModel.off('edgeUpdated', handleDataChanged)

      selectionPlugin.destroy()
      minimapPlugin?.destroy()
      renderer.destroy()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 更新数据
  useEffect(() => {
    if (data && flowModelRef.current) {
      flowModelRef.current.load(data)
      renderFlow()
    }
  }, [data])

  // 更新只读状态
  useEffect(() => {
    if (flowModelRef.current) {
      flowModelRef.current.setReadonly(readonly)
    }
  }, [readonly])

  const renderFlow = useCallback(() => {
    if (!flowModelRef.current || !rendererRef.current) return

    const nodes = flowModelRef.current.getNodes()
    const edges = flowModelRef.current.getEdges()

    const elements = [
      ...edges.map(edge => ({
        id: edge.id,
        type: 'edge' as const,
        data: edge.toJSON(),
        layer: 'edges',
        visible: true,
        interactive: !readonly,
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      })),
      ...nodes.map(node => ({
        id: node.id,
        type: 'node' as const,
        data: node.toJSON(),
        layer: 'nodes',
        visible: true,
        interactive: !readonly,
        bounds: node.getBounds()
      }))
    ]

    rendererRef.current.render(elements)
  }, [readonly])

  const updateHistoryState = useCallback(() => {
    if (!flowModelRef.current) return
    setCanUndo(flowModelRef.current.canUndo())
    setCanRedo(flowModelRef.current.canRedo())
  }, [])

  // 处理拖拽
  const handleDragStart = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('nodeType', nodeType)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()

    if (!flowModelRef.current || !canvasRef.current) return

    const nodeType = e.dataTransfer.getData('nodeType')
    if (!nodeType) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const nodeData: NodeData = {
      type: nodeType as any,
      label: nodeTypes.find(t => t.type === nodeType)?.label || nodeType,
      position: { x: x - 60, y: y - 30 },
      size: { width: 120, height: 60 }
    }

    flowModelRef.current.addNode(nodeData)
  }, [])

  // 工具栏操作
  const handleUndo = useCallback(() => {
    flowModelRef.current?.undo()
  }, [])

  const handleRedo = useCallback(() => {
    flowModelRef.current?.redo()
  }, [])

  const handleDelete = useCallback(() => {
    if (!flowModelRef.current) return

    if (selectedNode) {
      flowModelRef.current.removeNode(selectedNode.id)
    }
    if (selectedEdge) {
      flowModelRef.current.removeEdge(selectedEdge.id)
    }
  }, [selectedNode, selectedEdge])

  const handleExport = useCallback(() => {
    if (!flowModelRef.current) return

    const data = flowModelRef.current.toJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowchart.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // 属性面板操作
  const handlePropertyChange = useCallback((property: string, value: any) => {
    if (!flowModelRef.current) return

    if (selectedNode) {
      flowModelRef.current.updateNode(selectedNode.id, { [property]: value })
    }
    if (selectedEdge) {
      flowModelRef.current.updateEdge(selectedEdge.id, { [property]: value })
    }
  }, [selectedNode, selectedEdge])

  return (
    <div
      className={classNames('flow-designer', className)}
      style={style}
    >
      {showToolbar && (
        <div className="flow-designer-toolbar">
          <button
            onClick={handleUndo}
            disabled={!canUndo || readonly}
          >
            撤销
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo || readonly}
          >
            重做
          </button>
          <button
            onClick={handleDelete}
            disabled={(!selectedNode && !selectedEdge) || readonly}
          >
            删除
          </button>
          <button onClick={handleExport}>
            导出
          </button>
          <div className="flow-designer-toolbar-spacer" />
          {showSidebar && (
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '显示节点面板' : '隐藏节点面板'}
            </button>
          )}
          {showPropertyPanel && (
            <button onClick={() => setPropertyPanelCollapsed(!propertyPanelCollapsed)}>
              {propertyPanelCollapsed ? '显示属性面板' : '隐藏属性面板'}
            </button>
          )}
        </div>
      )}

      <div className="flow-designer-body">
        {showSidebar && (
          <div className={classNames('flow-designer-sidebar', { collapsed: sidebarCollapsed })}>
            <div className="flow-designer-sidebar-header">节点面板</div>
            <div className="flow-designer-node-palette">
              {nodeTypes.map(({ type, label, color }) => (
                <div
                  key={type}
                  className="flow-designer-node-item"
                  draggable={!readonly}
                  onDragStart={(e) => handleDragStart(e, type)}
                  style={{ borderColor: color }}
                >
                  <div
                    className="flow-designer-node-icon"
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flow-designer-main">
          <div
            ref={canvasRef}
            className="flow-designer-canvas"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>

        {showPropertyPanel && (selectedNode || selectedEdge) && (
          <div className={classNames('flow-designer-property-panel', { collapsed: propertyPanelCollapsed })}>
            <div className="flow-designer-property-header">
              {selectedNode ? '节点属性' : '连线属性'}
            </div>
            <div className="flow-designer-property-content">
              {selectedNode && (
                <>
                  <div className="flow-designer-property-group">
                    <label>ID</label>
                    <input type="text" value={selectedNode.id} disabled />
                  </div>
                  <div className="flow-designer-property-group">
                    <label>标签</label>
                    <input
                      type="text"
                      value={selectedNode.label}
                      onChange={(e) => handlePropertyChange('label', e.target.value)}
                      disabled={readonly}
                    />
                  </div>
                  <div className="flow-designer-property-group">
                    <label>类型</label>
                    <select
                      value={selectedNode.type}
                      onChange={(e) => handlePropertyChange('type', e.target.value)}
                      disabled={readonly}
                    >
                      {nodeTypes.map(({ type, label }) => (
                        <option key={type} value={type}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedEdge && (
                <>
                  <div className="flow-designer-property-group">
                    <label>ID</label>
                    <input type="text" value={selectedEdge.id} disabled />
                  </div>
                  <div className="flow-designer-property-group">
                    <label>标签</label>
                    <input
                      type="text"
                      value={selectedEdge.label || ''}
                      onChange={(e) => handlePropertyChange('label', e.target.value)}
                      disabled={readonly}
                    />
                  </div>
                  <div className="flow-designer-property-group">
                    <label>源节点</label>
                    <input type="text" value={selectedEdge.source} disabled />
                  </div>
                  <div className="flow-designer-property-group">
                    <label>目标节点</label>
                    <input type="text" value={selectedEdge.target} disabled />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

