/**
 * 节点渲染器
 */

import type { FlowNode, NodeType, NodeStyleConfig } from '../types'
import { classNames, styleToString } from '../utils'

/** 节点图标SVG */
const NODE_ICONS: Record<NodeType, string> = {
  start: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>`,
  end: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none"/></svg>`,
  approval: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  cc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  condition: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/></svg>`,
  parallel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  exclusive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg>`,
  inclusive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/><circle cx="12" cy="12" r="4"/></svg>`,
  timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
  custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
}

/** 节点默认颜色 */
const NODE_COLORS: Record<NodeType, string> = {
  start: '#52c41a',
  end: '#ff4d4f',
  approval: '#1890ff',
  cc: '#722ed1',
  condition: '#faad14',
  parallel: '#13c2c2',
  exclusive: '#eb2f96',
  inclusive: '#2f54eb',
  timer: '#fa8c16',
  custom: '#8c8c8c',
}

export interface NodeRendererOptions {
  /** 自定义样式 */
  styles?: Partial<Record<NodeType, NodeStyleConfig>>
  /** 类名前缀 */
  classPrefix?: string
}

export class NodeRenderer {
  private options: NodeRendererOptions
  private classPrefix: string

  constructor(options: NodeRendererOptions = {}) {
    this.options = options
    this.classPrefix = options.classPrefix ?? 'fc'
  }

  /**
   * 渲染节点
   */
  render(node: FlowNode, container: HTMLElement): void {
    container.innerHTML = ''
    container.className = this.getNodeClassName(node)
    container.setAttribute('data-node-id', node.id)
    container.setAttribute('data-node-type', node.type)

    // 设置样式
    Object.assign(container.style, this.getNodeStyle(node))

    // 创建节点内容
    const content = this.createNodeContent(node)
    container.appendChild(content)

    // 添加连接点
    this.addHandles(node, container)
  }

  /**
   * 更新节点
   */
  update(node: FlowNode, container: HTMLElement): void {
    container.className = this.getNodeClassName(node)
    Object.assign(container.style, this.getNodeStyle(node))

    // 更新内容
    const content = container.querySelector(`.${this.classPrefix}-node-content`)
    if (content) {
      const nameEl = content.querySelector(`.${this.classPrefix}-node-name`)
      if (nameEl) {
        nameEl.textContent = node.data.label || node.data.name || ''
      }
    }
  }

  /**
   * 获取节点类名
   */
  private getNodeClassName(node: FlowNode): string {
    return classNames(
      `${this.classPrefix}-node`,
      `${this.classPrefix}-node-${node.type}`,
      node.selected && `${this.classPrefix}-node-selected`,
      node.disabled && `${this.classPrefix}-node-disabled`,
      node.status && `${this.classPrefix}-node-${node.status}`,
      node.className
    )
  }

  /**
   * 获取节点样式
   */
  private getNodeStyle(node: FlowNode): Partial<CSSStyleDeclaration> {
    const customStyle = this.options.styles?.[node.type]
    const defaultColor = NODE_COLORS[node.type]

    return {
      position: 'absolute',
      left: `${node.position.x}px`,
      top: `${node.position.y}px`,
      width: `${node.size?.width ?? 180}px`,
      height: `${node.size?.height ?? 60}px`,
      backgroundColor: customStyle?.backgroundColor ?? '#fff',
      borderColor: customStyle?.borderColor ?? defaultColor,
      borderWidth: `${customStyle?.borderWidth ?? 2}px`,
      borderStyle: 'solid',
      borderRadius: `${customStyle?.borderRadius ?? 8}px`,
      boxShadow: customStyle?.shadow ?? '0 2px 8px rgba(0,0,0,0.1)',
      cursor: node.disabled ? 'not-allowed' : 'move',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      boxSizing: 'border-box',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      ...(node.style ?? {}),
    }
  }

  /**
   * 创建节点内容
   */
  private createNodeContent(node: FlowNode): HTMLElement {
    const content = document.createElement('div')
    content.className = `${this.classPrefix}-node-content`
    content.style.cssText = 'display: flex; align-items: center; width: 100%; gap: 8px;'

    // 图标
    const icon = document.createElement('div')
    icon.className = `${this.classPrefix}-node-icon`
    icon.innerHTML = NODE_ICONS[node.type]
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      color: ${NODE_COLORS[node.type]};
    `
    content.appendChild(icon)

    // 文字区域
    const textArea = document.createElement('div')
    textArea.className = `${this.classPrefix}-node-text`
    textArea.style.cssText = 'flex: 1; overflow: hidden;'

    const name = document.createElement('div')
    name.className = `${this.classPrefix}-node-name`
    name.textContent = node.data.label || node.data.name || ''
    name.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #262626;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `
    textArea.appendChild(name)

    if (node.data.description) {
      const desc = document.createElement('div')
      desc.className = `${this.classPrefix}-node-desc`
      desc.textContent = node.data.description
      desc.style.cssText = `
        font-size: 12px;
        color: #8c8c8c;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      `
      textArea.appendChild(desc)
    }

    content.appendChild(textArea)

    // 状态指示器
    if (node.status && node.status !== 'pending') {
      const status = document.createElement('div')
      status.className = `${this.classPrefix}-node-status`
      status.style.cssText = this.getStatusStyle(node.status)
      content.appendChild(status)
    }

    return content
  }

  /**
   * 添加连接点
   */
  private addHandles(node: FlowNode, container: HTMLElement): void {
    const handleStyle = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: #fff;
      border: 2px solid ${NODE_COLORS[node.type]};
      border-radius: 50%;
      cursor: crosshair;
      opacity: 0;
      transition: opacity 0.2s;
    `

    // 上方连接点（入口）
    if (node.type !== 'start') {
      const topHandle = document.createElement('div')
      topHandle.className = `${this.classPrefix}-handle ${this.classPrefix}-handle-top`
      topHandle.setAttribute('data-handle', 'top')
      topHandle.style.cssText = `${handleStyle} top: -6px; left: 50%; transform: translateX(-50%);`
      container.appendChild(topHandle)
    }

    // 下方连接点（出口）
    if (node.type !== 'end') {
      const bottomHandle = document.createElement('div')
      bottomHandle.className = `${this.classPrefix}-handle ${this.classPrefix}-handle-bottom`
      bottomHandle.setAttribute('data-handle', 'bottom')
      bottomHandle.style.cssText = `${handleStyle} bottom: -6px; left: 50%; transform: translateX(-50%);`
      container.appendChild(bottomHandle)
    }

    // 条件和并行节点添加左右连接点
    if (node.type === 'condition' || node.type === 'parallel' || node.type === 'exclusive') {
      const leftHandle = document.createElement('div')
      leftHandle.className = `${this.classPrefix}-handle ${this.classPrefix}-handle-left`
      leftHandle.setAttribute('data-handle', 'left')
      leftHandle.style.cssText = `${handleStyle} left: -6px; top: 50%; transform: translateY(-50%);`
      container.appendChild(leftHandle)

      const rightHandle = document.createElement('div')
      rightHandle.className = `${this.classPrefix}-handle ${this.classPrefix}-handle-right`
      rightHandle.setAttribute('data-handle', 'right')
      rightHandle.style.cssText = `${handleStyle} right: -6px; top: 50%; transform: translateY(-50%);`
      container.appendChild(rightHandle)
    }
  }

  /**
   * 获取状态样式
   */
  private getStatusStyle(status: string): string {
    const colors: Record<string, string> = {
      processing: '#1890ff',
      approved: '#52c41a',
      rejected: '#ff4d4f',
      canceled: '#8c8c8c',
      skipped: '#d9d9d9',
    }

    return `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${colors[status] ?? '#d9d9d9'};
      flex-shrink: 0;
    `
  }

  /**
   * 获取节点图标
   */
  static getIcon(type: NodeType): string {
    return NODE_ICONS[type]
  }

  /**
   * 获取节点颜色
   */
  static getColor(type: NodeType): string {
    return NODE_COLORS[type]
  }
}
