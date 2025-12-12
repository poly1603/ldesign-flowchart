/**
 * 工具函数
 */

import type { Position, FlowNode, FlowEdge } from '../types'

/** 生成唯一ID */
export function generateId(prefix = 'node'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** 深拷贝 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T
  }
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/** 计算两点之间的距离 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/** 计算两点之间的中点 */
export function midpoint(p1: Position, p2: Position): Position {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/** 计算点是否在矩形内 */
export function isPointInRect(
  point: Position,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/** 计算两个矩形是否相交 */
export function isRectIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/** 限制数值在范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 节流函数 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/** 防抖函数 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  } as T
}

/** 获取节点的边界框 */
export function getNodeBounds(node: FlowNode): {
  x: number
  y: number
  width: number
  height: number
} {
  const width = node.size?.width ?? 180
  const height = node.size?.height ?? 60
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
  }
}

/** 获取节点中心点 */
export function getNodeCenter(node: FlowNode): Position {
  const bounds = getNodeBounds(node)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

/** 连接点位置类型 */
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right'

/** 获取节点各边中心点 */
export function getNodeHandlePosition(node: FlowNode, handle: HandlePosition): Position {
  const bounds = getNodeBounds(node)
  switch (handle) {
    case 'top':
      return { x: bounds.x + bounds.width / 2, y: bounds.y }
    case 'bottom':
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }
    case 'left':
      return { x: bounds.x, y: bounds.y + bounds.height / 2 }
    case 'right':
      return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }
  }
}

/** 计算最佳连接点 */
export function getBestHandles(
  sourceNode: FlowNode,
  targetNode: FlowNode
): { sourceHandle: HandlePosition; targetHandle: HandlePosition } {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const sourceBounds = getNodeBounds(sourceNode)
  const targetBounds = getNodeBounds(targetNode)

  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y

  // 判断目标在源的哪个方向
  const isBelow = targetBounds.y > sourceBounds.y + sourceBounds.height - 20
  const isAbove = targetBounds.y + targetBounds.height < sourceBounds.y + 20
  const isRight = targetBounds.x > sourceBounds.x + sourceBounds.width - 20
  const isLeft = targetBounds.x + targetBounds.width < sourceBounds.x + 20

  // 优先垂直连接（流程图通常是上下流向）
  if (isBelow && Math.abs(dx) < Math.abs(dy)) {
    return { sourceHandle: 'bottom', targetHandle: 'top' }
  }
  if (isAbove && Math.abs(dx) < Math.abs(dy)) {
    return { sourceHandle: 'top', targetHandle: 'bottom' }
  }
  if (isRight) {
    return { sourceHandle: 'right', targetHandle: 'left' }
  }
  if (isLeft) {
    return { sourceHandle: 'left', targetHandle: 'right' }
  }

  // 默认从下到上
  return dy >= 0
    ? { sourceHandle: 'bottom', targetHandle: 'top' }
    : { sourceHandle: 'top', targetHandle: 'bottom' }
}

/** 计算连线的路径控制点 - 智能选择连接点 */
export function getEdgeControlPoints(
  sourceNode: FlowNode,
  targetNode: FlowNode
): { start: Position; end: Position; control1: Position; control2: Position } {
  const { sourceHandle, targetHandle } = getBestHandles(sourceNode, targetNode)

  const start = getNodeHandlePosition(sourceNode, sourceHandle)
  const end = getNodeHandlePosition(targetNode, targetHandle)

  // 根据连接点方向计算控制点
  const offset = Math.min(Math.max(Math.abs(end.y - start.y) * 0.5, 30), 80)

  let control1: Position
  let control2: Position

  if (sourceHandle === 'bottom') {
    control1 = { x: start.x, y: start.y + offset }
  } else if (sourceHandle === 'top') {
    control1 = { x: start.x, y: start.y - offset }
  } else if (sourceHandle === 'right') {
    control1 = { x: start.x + offset, y: start.y }
  } else {
    control1 = { x: start.x - offset, y: start.y }
  }

  if (targetHandle === 'top') {
    control2 = { x: end.x, y: end.y - offset }
  } else if (targetHandle === 'bottom') {
    control2 = { x: end.x, y: end.y + offset }
  } else if (targetHandle === 'left') {
    control2 = { x: end.x - offset, y: end.y }
  } else {
    control2 = { x: end.x + offset, y: end.y }
  }

  return { start, end, control1, control2 }
}

/** 生成平滑步进路径（正交路径带圆角）*/
export function generateSmoothStepPath(
  sourceNode: FlowNode,
  targetNode: FlowNode,
  borderRadius = 8
): string {
  const { sourceHandle, targetHandle } = getBestHandles(sourceNode, targetNode)
  const start = getNodeHandlePosition(sourceNode, sourceHandle)
  const end = getNodeHandlePosition(targetNode, targetHandle)

  const dx = end.x - start.x
  const dy = end.y - start.y

  // 简单情况：直线连接
  if (sourceHandle === 'bottom' && targetHandle === 'top' && Math.abs(dx) < 5) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  // 生成正交路径
  const midY = start.y + dy / 2
  const r = Math.min(borderRadius, Math.abs(dx) / 2, Math.abs(dy) / 4)

  if (sourceHandle === 'bottom' && targetHandle === 'top') {
    if (Math.abs(dx) < 1) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }
    // 从下到上，有水平偏移
    const dir = dx > 0 ? 1 : -1
    return `M ${start.x} ${start.y} 
            L ${start.x} ${midY - r}
            Q ${start.x} ${midY} ${start.x + r * dir} ${midY}
            L ${end.x - r * dir} ${midY}
            Q ${end.x} ${midY} ${end.x} ${midY + r}
            L ${end.x} ${end.y}`
  }

  if (sourceHandle === 'right' && targetHandle === 'left') {
    const midX = start.x + dx / 2
    const rr = Math.min(borderRadius, Math.abs(dx) / 4, Math.abs(dy) / 2)
    if (Math.abs(dy) < 1) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }
    const dir = dy > 0 ? 1 : -1
    return `M ${start.x} ${start.y}
            L ${midX - rr} ${start.y}
            Q ${midX} ${start.y} ${midX} ${start.y + rr * dir}
            L ${midX} ${end.y - rr * dir}
            Q ${midX} ${end.y} ${midX + rr} ${end.y}
            L ${end.x} ${end.y}`
  }

  if (sourceHandle === 'left' && targetHandle === 'right') {
    const midX = start.x + dx / 2
    const rr = Math.min(borderRadius, Math.abs(dx) / 4, Math.abs(dy) / 2)
    if (Math.abs(dy) < 1) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }
    const dir = dy > 0 ? 1 : -1
    return `M ${start.x} ${start.y}
            L ${midX + rr} ${start.y}
            Q ${midX} ${start.y} ${midX} ${start.y + rr * dir}
            L ${midX} ${end.y - rr * dir}
            Q ${midX} ${end.y} ${midX - rr} ${end.y}
            L ${end.x} ${end.y}`
  }

  // 其他情况使用贝塞尔曲线
  const { control1, control2 } = getEdgeControlPoints(sourceNode, targetNode)
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`
}

/** 生成SVG路径 */
export function generateEdgePath(
  sourceNode: FlowNode,
  targetNode: FlowNode
): string {
  return generateSmoothStepPath(sourceNode, targetNode)
}

/** 查找连接到节点的所有边 */
export function findConnectedEdges(
  nodeId: string,
  edges: FlowEdge[]
): FlowEdge[] {
  return edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId
  )
}

/** 查找从节点出发的边 */
export function findOutgoingEdges(
  nodeId: string,
  edges: FlowEdge[]
): FlowEdge[] {
  return edges.filter((edge) => edge.source === nodeId)
}

/** 查找到达节点的边 */
export function findIncomingEdges(
  nodeId: string,
  edges: FlowEdge[]
): FlowEdge[] {
  return edges.filter((edge) => edge.target === nodeId)
}

/** 检测流程图中是否有环 */
export function detectCycle(
  nodes: FlowNode[],
  edges: FlowEdge[]
): boolean {
  const nodeMap = new Map<string, FlowNode>()
  nodes.forEach((node) => nodeMap.set(node.id, node))

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const outgoingEdges = findOutgoingEdges(nodeId, edges)
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) return true
      } else if (recursionStack.has(edge.target)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}

/** 拓扑排序 */
export function topologicalSort(
  nodes: FlowNode[],
  edges: FlowEdge[]
): FlowNode[] | null {
  if (detectCycle(nodes, edges)) {
    return null // 有环无法排序
  }

  const nodeMap = new Map<string, FlowNode>()
  nodes.forEach((node) => nodeMap.set(node.id, node))

  const inDegree = new Map<string, number>()
  nodes.forEach((node) => inDegree.set(node.id, 0))

  edges.forEach((edge) => {
    const degree = inDegree.get(edge.target) ?? 0
    inDegree.set(edge.target, degree + 1)
  })

  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })

  const result: FlowNode[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = nodeMap.get(nodeId)
    if (node) result.push(node)

    const outgoingEdges = findOutgoingEdges(nodeId, edges)
    for (const edge of outgoingEdges) {
      const degree = (inDegree.get(edge.target) ?? 1) - 1
      inDegree.set(edge.target, degree)
      if (degree === 0) queue.push(edge.target)
    }
  }

  return result.length === nodes.length ? result : null
}

/** CSS样式对象转字符串 */
export function styleToString(style: Partial<CSSStyleDeclaration>): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // 转换驼峰命名为短横线命名
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}

/** 合并类名 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// 导出布局工具
export * from './layout'
