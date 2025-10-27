/**
 * useFlowEvents Hook - 处理流程图事件
 */
import { useEffect, useRef } from 'react'
import { FlowModel } from '@ldesign/flowchart-core/models'
import type { NodeData, EdgeData } from '@ldesign/flowchart-core/types'

export interface FlowEventHandlers {
  // 节点事件
  onNodeClick?: (node: NodeData, event: MouseEvent) => void
  onNodeDoubleClick?: (node: NodeData, event: MouseEvent) => void
  onNodeRightClick?: (node: NodeData, event: MouseEvent) => void
  onNodeMouseEnter?: (node: NodeData, event: MouseEvent) => void
  onNodeMouseLeave?: (node: NodeData, event: MouseEvent) => void
  onNodeDragStart?: (node: NodeData, event: DragEvent) => void
  onNodeDrag?: (node: NodeData, position: { x: number; y: number }) => void
  onNodeDragEnd?: (node: NodeData, position: { x: number; y: number }) => void

  // 连线事件
  onEdgeClick?: (edge: EdgeData, event: MouseEvent) => void
  onEdgeDoubleClick?: (edge: EdgeData, event: MouseEvent) => void
  onEdgeRightClick?: (edge: EdgeData, event: MouseEvent) => void
  onEdgeMouseEnter?: (edge: EdgeData, event: MouseEvent) => void
  onEdgeMouseLeave?: (edge: EdgeData, event: MouseEvent) => void

  // 画布事件
  onCanvasClick?: (position: { x: number; y: number }, event: MouseEvent) => void
  onCanvasDoubleClick?: (position: { x: number; y: number }, event: MouseEvent) => void
  onCanvasRightClick?: (position: { x: number; y: number }, event: MouseEvent) => void
  onCanvasDragStart?: (event: MouseEvent) => void
  onCanvasDrag?: (delta: { x: number; y: number }) => void
  onCanvasDragEnd?: () => void

  // 选择事件
  onSelectionChange?: (nodes: NodeData[], edges: EdgeData[]) => void
  onNodeSelected?: (node: NodeData) => void
  onNodeUnselected?: (node: NodeData) => void
  onEdgeSelected?: (edge: EdgeData) => void
  onEdgeUnselected?: (edge: EdgeData) => void

  // 数据变化事件
  onNodeAdded?: (node: NodeData) => void
  onNodeRemoved?: (nodeId: string) => void
  onNodeUpdated?: (node: NodeData, oldData: NodeData) => void
  onEdgeAdded?: (edge: EdgeData) => void
  onEdgeRemoved?: (edgeId: string) => void
  onEdgeUpdated?: (edge: EdgeData, oldData: EdgeData) => void

  // 连接事件
  onConnectionStart?: (source: NodeData, sourcePort?: string) => void
  onConnection?: (source: NodeData, target: NodeData, edge: EdgeData) => void
  onConnectionEnd?: () => void
  onConnectionValidation?: (source: NodeData, target: NodeData) => boolean

  // 缩放和平移
  onZoomChange?: (zoom: number) => void
  onPanChange?: (position: { x: number; y: number }) => void
  onViewportChange?: (viewport: { zoom: number; position: { x: number; y: number } }) => void
}

export function useFlowEvents(
  container: HTMLElement | null,
  flowModel: FlowModel | null,
  handlers: FlowEventHandlers
): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!container || !flowModel) return

    const cleanupFunctions: Array<() => void> = []

    // 绑定DOM事件
    const bindDOMEvents = () => {
      // 节点事件
      const handleNodeClick = (e: MouseEvent) => {
        const nodeElement = (e.target as HTMLElement).closest('.flow-node')
        if (nodeElement) {
          const nodeId = nodeElement.id.replace('node-', '')
          const node = flowModel.getNode(nodeId)
          if (node) {
            handlersRef.current.onNodeClick?.(node.toJSON(), e)
          }
        }
      }

      const handleNodeDoubleClick = (e: MouseEvent) => {
        const nodeElement = (e.target as HTMLElement).closest('.flow-node')
        if (nodeElement) {
          const nodeId = nodeElement.id.replace('node-', '')
          const node = flowModel.getNode(nodeId)
          if (node) {
            handlersRef.current.onNodeDoubleClick?.(node.toJSON(), e)
          }
        }
      }

      const handleNodeRightClick = (e: MouseEvent) => {
        e.preventDefault()
        const nodeElement = (e.target as HTMLElement).closest('.flow-node')
        if (nodeElement) {
          const nodeId = nodeElement.id.replace('node-', '')
          const node = flowModel.getNode(nodeId)
          if (node) {
            handlersRef.current.onNodeRightClick?.(node.toJSON(), e)
          }
        }
      }

      // 连线事件
      const handleEdgeClick = (e: MouseEvent) => {
        const edgeElement = (e.target as HTMLElement).closest('.flow-edge')
        if (edgeElement) {
          const edgeId = edgeElement.id.replace('edge-', '')
          const edge = flowModel.getEdge(edgeId)
          if (edge) {
            handlersRef.current.onEdgeClick?.(edge.toJSON(), e)
          }
        }
      }

      const handleEdgeDoubleClick = (e: MouseEvent) => {
        const edgeElement = (e.target as HTMLElement).closest('.flow-edge')
        if (edgeElement) {
          const edgeId = edgeElement.id.replace('edge-', '')
          const edge = flowModel.getEdge(edgeId)
          if (edge) {
            handlersRef.current.onEdgeDoubleClick?.(edge.toJSON(), e)
          }
        }
      }

      // 画布事件
      const handleCanvasClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('.flow-node') && !target.closest('.flow-edge')) {
          const rect = container.getBoundingClientRect()
          const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }
          handlersRef.current.onCanvasClick?.(position, e)
        }
      }

      container.addEventListener('click', handleNodeClick)
      container.addEventListener('click', handleEdgeClick)
      container.addEventListener('click', handleCanvasClick)
      container.addEventListener('dblclick', handleNodeDoubleClick)
      container.addEventListener('dblclick', handleEdgeDoubleClick)
      container.addEventListener('contextmenu', handleNodeRightClick)

      cleanupFunctions.push(() => {
        container.removeEventListener('click', handleNodeClick)
        container.removeEventListener('click', handleEdgeClick)
        container.removeEventListener('click', handleCanvasClick)
        container.removeEventListener('dblclick', handleNodeDoubleClick)
        container.removeEventListener('dblclick', handleEdgeDoubleClick)
        container.removeEventListener('contextmenu', handleNodeRightClick)
      })
    }

    // 绑定FlowModel事件
    const bindModelEvents = () => {
      // 选择事件
      const handleNodeSelected = ({ node }: any) => {
        handlersRef.current.onNodeSelected?.(node.toJSON())
        updateSelectionState()
      }

      const handleNodeUnselected = ({ node }: any) => {
        handlersRef.current.onNodeUnselected?.(node.toJSON())
        updateSelectionState()
      }

      const handleEdgeSelected = ({ edge }: any) => {
        handlersRef.current.onEdgeSelected?.(edge.toJSON())
        updateSelectionState()
      }

      const handleEdgeUnselected = ({ edge }: any) => {
        handlersRef.current.onEdgeUnselected?.(edge.toJSON())
        updateSelectionState()
      }

      const updateSelectionState = () => {
        const selectedNodes = flowModel.getSelectedNodes().map(n => n.toJSON())
        const selectedEdges = flowModel.getSelectedEdges().map(e => e.toJSON())
        handlersRef.current.onSelectionChange?.(selectedNodes, selectedEdges)
      }

      // 数据变化事件
      const handleNodeAdded = ({ node }: any) => {
        handlersRef.current.onNodeAdded?.(node.toJSON())
      }

      const handleNodeRemoved = ({ nodeId }: any) => {
        handlersRef.current.onNodeRemoved?.(nodeId)
      }

      const handleNodeUpdated = ({ node, oldData }: any) => {
        handlersRef.current.onNodeUpdated?.(node.toJSON(), oldData)
      }

      const handleEdgeAdded = ({ edge }: any) => {
        handlersRef.current.onEdgeAdded?.(edge.toJSON())
      }

      const handleEdgeRemoved = ({ edgeId }: any) => {
        handlersRef.current.onEdgeRemoved?.(edgeId)
      }

      const handleEdgeUpdated = ({ edge, oldData }: any) => {
        handlersRef.current.onEdgeUpdated?.(edge.toJSON(), oldData)
      }

      flowModel.on('nodeSelected', handleNodeSelected)
      flowModel.on('nodeUnselected', handleNodeUnselected)
      flowModel.on('edgeSelected', handleEdgeSelected)
      flowModel.on('edgeUnselected', handleEdgeUnselected)
      flowModel.on('nodeAdded', handleNodeAdded)
      flowModel.on('nodeRemoved', handleNodeRemoved)
      flowModel.on('nodeUpdated', handleNodeUpdated)
      flowModel.on('edgeAdded', handleEdgeAdded)
      flowModel.on('edgeRemoved', handleEdgeRemoved)
      flowModel.on('edgeUpdated', handleEdgeUpdated)

      cleanupFunctions.push(() => {
        flowModel.off('nodeSelected', handleNodeSelected)
        flowModel.off('nodeUnselected', handleNodeUnselected)
        flowModel.off('edgeSelected', handleEdgeSelected)
        flowModel.off('edgeUnselected', handleEdgeUnselected)
        flowModel.off('nodeAdded', handleNodeAdded)
        flowModel.off('nodeRemoved', handleNodeRemoved)
        flowModel.off('nodeUpdated', handleNodeUpdated)
        flowModel.off('edgeAdded', handleEdgeAdded)
        flowModel.off('edgeRemoved', handleEdgeRemoved)
        flowModel.off('edgeUpdated', handleEdgeUpdated)
      })
    }

    bindDOMEvents()
    bindModelEvents()

    // 清理函数
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [container, flowModel])
}

