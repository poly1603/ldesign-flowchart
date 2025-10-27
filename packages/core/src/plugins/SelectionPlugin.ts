/**
 * 选择插件 - 处理节点和连线的选择
 */
import { BasePlugin } from '../types/plugin'
import type { FlowModel } from '../models/FlowModel'
import type { Position } from '../types'

export class SelectionPlugin extends BasePlugin {
  name = 'selection'
  version = '1.0.0'
  description = 'Handle node and edge selection'

  private flowModel!: FlowModel
  private container!: HTMLElement
  private selectionBox: HTMLElement | null = null
  private isSelecting = false
  private startPosition: Position | null = null
  private currentPosition: Position | null = null

  protected onInit(): void {
    if (!this.context) return

    this.flowModel = this.context.flowModel
    this.container = this.context.container

    // 初始化选择框
    this.initSelectionBox()
  }

  protected onDestroy(): void {
    this.removeEventListeners()
    if (this.selectionBox && this.selectionBox.parentNode) {
      this.selectionBox.parentNode.removeChild(this.selectionBox)
    }
  }

  protected onEnable(): void {
    this.addEventListeners()
  }

  protected onDisable(): void {
    this.removeEventListeners()
    this.clearSelection()
  }

  private initSelectionBox(): void {
    this.selectionBox = document.createElement('div')
    this.selectionBox.className = 'flow-selection-box'
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 1px dashed #1890ff;
      background: rgba(24, 144, 255, 0.1);
      pointer-events: none;
      display: none;
      z-index: 1000;
    `
    this.container.appendChild(this.selectionBox)
  }

  private addEventListeners(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown)
    this.container.addEventListener('mousemove', this.handleMouseMove)
    this.container.addEventListener('mouseup', this.handleMouseUp)
    this.container.addEventListener('click', this.handleClick)
    document.addEventListener('keydown', this.handleKeyDown)
  }

  private removeEventListeners(): void {
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    this.container.removeEventListener('mousemove', this.handleMouseMove)
    this.container.removeEventListener('mouseup', this.handleMouseUp)
    this.container.removeEventListener('click', this.handleClick)
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  private handleMouseDown = (e: MouseEvent): void => {
    // 如果点击的是节点或连线，不启动框选
    const target = e.target as HTMLElement
    if (target.closest('.flow-node') || target.closest('.flow-edge')) {
      return
    }

    // 启动框选
    this.isSelecting = true
    this.startPosition = this.getMousePosition(e)
    this.currentPosition = this.startPosition

    if (this.selectionBox) {
      this.selectionBox.style.display = 'block'
      this.updateSelectionBox()
    }

    e.preventDefault()
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isSelecting || !this.startPosition) return

    this.currentPosition = this.getMousePosition(e)
    this.updateSelectionBox()
    this.selectNodesInBox()
  }

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isSelecting) return

    this.isSelecting = false
    this.startPosition = null
    this.currentPosition = null

    if (this.selectionBox) {
      this.selectionBox.style.display = 'none'
    }
  }

  private handleClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement
    const multi = e.ctrlKey || e.metaKey

    // 点击节点
    const nodeElement = target.closest('.flow-node')
    if (nodeElement) {
      const nodeId = nodeElement.id.replace('node-', '')
      this.selectNode(nodeId, multi)
      e.stopPropagation()
      return
    }

    // 点击连线
    const edgeElement = target.closest('.flow-edge')
    if (edgeElement) {
      const edgeId = edgeElement.id.replace('edge-', '')
      this.selectEdge(edgeId, multi)
      e.stopPropagation()
      return
    }

    // 点击空白区域，清空选择
    if (!multi) {
      this.clearSelection()
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ctrl/Cmd + A 全选
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      this.selectAll()
    }

    // Delete 删除选中
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      this.deleteSelected()
    }

    // Escape 清空选择
    if (e.key === 'Escape') {
      this.clearSelection()
    }
  }

  private getMousePosition(e: MouseEvent): Position {
    const rect = this.container.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  private updateSelectionBox(): void {
    if (!this.selectionBox || !this.startPosition || !this.currentPosition) return

    const x = Math.min(this.startPosition.x, this.currentPosition.x)
    const y = Math.min(this.startPosition.y, this.currentPosition.y)
    const width = Math.abs(this.currentPosition.x - this.startPosition.x)
    const height = Math.abs(this.currentPosition.y - this.startPosition.y)

    this.selectionBox.style.left = `${x}px`
    this.selectionBox.style.top = `${y}px`
    this.selectionBox.style.width = `${width}px`
    this.selectionBox.style.height = `${height}px`
  }

  private selectNodesInBox(): void {
    if (!this.startPosition || !this.currentPosition) return

    const x1 = Math.min(this.startPosition.x, this.currentPosition.x)
    const y1 = Math.min(this.startPosition.y, this.currentPosition.y)
    const x2 = Math.max(this.startPosition.x, this.currentPosition.x)
    const y2 = Math.max(this.startPosition.y, this.currentPosition.y)

    // 清空之前的选择
    this.flowModel.clearSelection()

    // 选择框内的节点
    this.flowModel.getNodes().forEach(node => {
      const bounds = node.getBounds()
      if (
        bounds.x >= x1 &&
        bounds.y >= y1 &&
        bounds.x + bounds.width <= x2 &&
        bounds.y + bounds.height <= y2
      ) {
        this.flowModel.selectNode(node.id, true)
      }
    })
  }

  selectNode(nodeId: string, multi = false): void {
    this.flowModel.selectNode(nodeId, multi)
  }

  selectEdge(edgeId: string, multi = false): void {
    this.flowModel.selectEdge(edgeId, multi)
  }

  selectAll(): void {
    this.flowModel.getNodes().forEach(node => {
      this.flowModel.selectNode(node.id, true)
    })
    this.flowModel.getEdges().forEach(edge => {
      this.flowModel.selectEdge(edge.id, true)
    })
  }

  clearSelection(): void {
    this.flowModel.clearSelection()
  }

  getSelectedNodes(): string[] {
    return this.flowModel.getSelectedNodes().map(node => node.id)
  }

  getSelectedEdges(): string[] {
    return this.flowModel.getSelectedEdges().map(edge => edge.id)
  }

  private deleteSelected(): void {
    const selectedNodes = this.flowModel.getSelectedNodes()
    const selectedEdges = this.flowModel.getSelectedEdges()

    // 先删除连线
    selectedEdges.forEach(edge => {
      this.flowModel.removeEdge(edge.id)
    })

    // 再删除节点
    selectedNodes.forEach(node => {
      this.flowModel.removeNode(node.id)
    })
  }
}

