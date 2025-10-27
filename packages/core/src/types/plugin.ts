/**
 * 插件系统类型定义
 */

import type { FlowModel } from '../models/FlowModel'
import type { Position, NodeData, EdgeData } from './index'

// 插件生命周期
export interface PluginLifecycle {
  beforeInit?(): void | Promise<void>
  afterInit?(): void | Promise<void>
  beforeDestroy?(): void | Promise<void>
  afterDestroy?(): void | Promise<void>
  beforeEnable?(): void | Promise<void>
  afterEnable?(): void | Promise<void>
  beforeDisable?(): void | Promise<void>
  afterDisable?(): void | Promise<void>
}

// 插件配置
export interface PluginConfig {
  enabled?: boolean
  priority?: number
  dependencies?: string[]
  options?: Record<string, any>
}

// 插件上下文
export interface PluginContext {
  flowModel: FlowModel
  renderer: any
  container: HTMLElement
  config: any
  plugins: Map<string, BasePlugin>
}

// 基础插件类
export abstract class BasePlugin implements PluginLifecycle {
  abstract name: string
  version?: string
  description?: string
  author?: string

  protected context: PluginContext | null = null
  protected enabled: boolean = false
  protected config: PluginConfig = {}

  constructor(config?: PluginConfig) {
    if (config) {
      this.config = config
    }
  }

  init(context: PluginContext): void {
    this.context = context
    this.beforeInit?.()
    this.onInit()
    this.afterInit?.()
  }

  destroy(): void {
    this.beforeDestroy?.()
    this.onDestroy()
    this.afterDestroy?.()
    this.context = null
  }

  enable(): void {
    if (this.enabled) return
    this.beforeEnable?.()
    this.onEnable()
    this.enabled = true
    this.afterEnable?.()
  }

  disable(): void {
    if (!this.enabled) return
    this.beforeDisable?.()
    this.onDisable()
    this.enabled = false
    this.afterDisable?.()
  }

  protected abstract onInit(): void
  protected abstract onDestroy(): void
  protected abstract onEnable(): void
  protected abstract onDisable(): void
}

// 选择插件接口
export interface SelectionPlugin extends BasePlugin {
  name: 'selection'

  selectNode(nodeId: string, multi?: boolean): void
  selectEdge(edgeId: string, multi?: boolean): void
  selectAll(): void
  clearSelection(): void
  getSelectedNodes(): string[]
  getSelectedEdges(): string[]

  onSelectionChange?(nodes: string[], edges: string[]): void
}

// 小地图插件接口
export interface MinimapPlugin extends BasePlugin {
  name: 'minimap'

  show(): void
  hide(): void
  setPosition(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void
  setSize(width: number, height: number): void
  refresh(): void
}

// 快捷键插件接口
export interface KeyboardPlugin extends BasePlugin {
  name: 'keyboard'

  registerShortcut(key: string, handler: () => void): void
  unregisterShortcut(key: string): void
  enableShortcuts(): void
  disableShortcuts(): void
}

// 对齐插件接口
export interface AlignmentPlugin extends BasePlugin {
  name: 'alignment'

  alignLeft(): void
  alignCenter(): void
  alignRight(): void
  alignTop(): void
  alignMiddle(): void
  alignBottom(): void
  distributeHorizontal(): void
  distributeVertical(): void

  showGridlines(show: boolean): void
  snapToGrid(enabled: boolean): void
  setGridSize(size: number): void
}

// 导出插件接口
export interface ExportPlugin extends BasePlugin {
  name: 'export'

  exportJSON(): object
  exportSVG(): string
  exportPNG(scale?: number): Promise<Blob>
  exportPDF(): Promise<Blob>
  print(): void
}

// 历史插件接口
export interface HistoryPlugin extends BasePlugin {
  name: 'history'

  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
  clear(): void
  getHistoryStack(): any[]
}

// 工具栏插件接口
export interface ToolbarPlugin extends BasePlugin {
  name: 'toolbar'

  addTool(tool: ToolbarItem): void
  removeTool(toolId: string): void
  enableTool(toolId: string): void
  disableTool(toolId: string): void
  setActiveTool(toolId: string): void
}

// 工具栏项
export interface ToolbarItem {
  id: string
  name: string
  icon?: string
  tooltip?: string
  type?: 'button' | 'toggle' | 'dropdown' | 'separator'
  active?: boolean
  disabled?: boolean
  handler?: () => void
  items?: ToolbarItem[]
}

// 右键菜单插件接口
export interface ContextMenuPlugin extends BasePlugin {
  name: 'contextmenu'

  showMenu(position: Position, items: ContextMenuItem[]): void
  hideMenu(): void
  addMenuItem(item: ContextMenuItem): void
  removeMenuItem(itemId: string): void
}

// 右键菜单项
export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  handler?: () => void
  submenu?: ContextMenuItem[]
}

// 拖拽插件接口
export interface DragDropPlugin extends BasePlugin {
  name: 'dragdrop'

  enableNodeDrag(): void
  disableNodeDrag(): void
  enableEdgeDrag(): void
  disableEdgeDrag(): void

  onNodeDragStart?(node: NodeData, event: DragEvent): void
  onNodeDrag?(node: NodeData, event: DragEvent): void
  onNodeDragEnd?(node: NodeData, event: DragEvent): void

  onDrop?(data: any, position: Position): void
}

// 自动布局插件接口
export interface AutoLayoutPlugin extends BasePlugin {
  name: 'autolayout'

  layout(type: LayoutType, options?: LayoutOptions): void
  getLayoutTypes(): LayoutType[]
}

export type LayoutType =
  | 'dagre'
  | 'force'
  | 'circular'
  | 'grid'
  | 'tree'
  | 'radial'

export interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
  spacing?: number
  nodeSpacing?: number
  levelSpacing?: number
  animate?: boolean
  duration?: number
}