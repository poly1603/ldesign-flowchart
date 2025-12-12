/**
 * 自动布局工具
 * 确保节点之间有足够的间距，不会重叠
 */

import type { FlowNode, FlowEdge, LayoutConfig } from '../types'

/** 默认布局配置 */
const DEFAULT_LAYOUT: Required<LayoutConfig> = {
  horizontalSpacing: 50,
  verticalSpacing: 80,
  autoLayout: false,
  direction: 'TB'
}

/**
 * 检测两个节点是否重叠
 */
function isOverlapping(
  node1: FlowNode,
  node2: FlowNode,
  hSpacing: number,
  vSpacing: number
): boolean {
  const w1 = node1.size?.width ?? 180
  const h1 = node1.size?.height ?? 60
  const w2 = node2.size?.width ?? 180
  const h2 = node2.size?.height ?? 60

  const left1 = node1.position.x - hSpacing / 2
  const right1 = node1.position.x + w1 + hSpacing / 2
  const top1 = node1.position.y - vSpacing / 2
  const bottom1 = node1.position.y + h1 + vSpacing / 2

  const left2 = node2.position.x
  const right2 = node2.position.x + w2
  const top2 = node2.position.y
  const bottom2 = node2.position.y + h2

  return !(right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2)
}

/**
 * 调整节点位置以避免重叠 - 只修复真正重叠的节点
 * 保持原有布局结构，仅在节点边界真正重叠时进行最小调整
 */
export function adjustNodePositions(
  nodes: FlowNode[],
  config?: LayoutConfig
): FlowNode[] {
  const layoutConfig = { ...DEFAULT_LAYOUT, ...config }
  const { horizontalSpacing, verticalSpacing } = layoutConfig

  const adjustedNodes = nodes.map(node => ({ ...node, position: { ...node.position } }))

  // 多轮迭代确保所有节点不重叠
  let changed = true
  let iterations = 0
  const maxIterations = 10

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    // 检查每对节点之间的重叠
    for (let i = 0; i < adjustedNodes.length; i++) {
      for (let j = i + 1; j < adjustedNodes.length; j++) {
        const nodeA = adjustedNodes[i]
        const nodeB = adjustedNodes[j]

        const wA = nodeA.size?.width ?? 180
        const hA = nodeA.size?.height ?? 60
        const wB = nodeB.size?.width ?? 180
        const hB = nodeB.size?.height ?? 60

        // 计算节点边界
        const leftA = nodeA.position.x
        const rightA = nodeA.position.x + wA
        const topA = nodeA.position.y
        const bottomA = nodeA.position.y + hA

        const leftB = nodeB.position.x
        const rightB = nodeB.position.x + wB
        const topB = nodeB.position.y
        const bottomB = nodeB.position.y + hB

        // 只检查节点边界是否真正重叠（不加间距检测）
        const realOverlapX = !(rightA <= leftB || rightB <= leftA)
        const realOverlapY = !(bottomA <= topB || bottomB <= topA)

        // 只有当节点边界真正重叠时才调整
        if (realOverlapX && realOverlapY) {
          // 计算重叠量
          const overlapAmountX = Math.min(rightA, rightB) - Math.max(leftA, leftB)
          const overlapAmountY = Math.min(bottomA, bottomB) - Math.max(topA, topB)

          // 选择移动量较小的方向
          if (overlapAmountX < overlapAmountY) {
            // 水平方向调整
            if (leftB >= leftA) {
              // B在A右边，B向右移
              nodeB.position.x = rightA + horizontalSpacing
            } else {
              // B在A左边，A向右移
              nodeA.position.x = rightB + horizontalSpacing
            }
            changed = true
          } else {
            // 垂直方向调整
            if (topB >= topA) {
              // B在A下面，B向下移
              nodeB.position.y = bottomA + verticalSpacing
            } else {
              // B在A上面，A向下移
              nodeA.position.y = bottomB + verticalSpacing
            }
            changed = true
          }
        }
      }
    }
  }

  return adjustedNodes
}

/**
 * 自动布局 - 基于拓扑排序的层次布局
 */
export function autoLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  config?: LayoutConfig
): FlowNode[] {
  const layoutConfig = { ...DEFAULT_LAYOUT, ...config }
  const { horizontalSpacing, verticalSpacing, direction } = layoutConfig

  if (nodes.length === 0) return nodes

  // 构建邻接表
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  nodes.forEach(node => {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  edges.forEach(edge => {
    adjacency.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  })

  // 拓扑排序分层
  const layers: string[][] = []
  const visited = new Set<string>()
  let queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id)

  while (queue.length > 0) {
    layers.push([...queue])
    queue.forEach(id => visited.add(id))

    const nextQueue: string[] = []
    queue.forEach(nodeId => {
      adjacency.get(nodeId)?.forEach(targetId => {
        if (!visited.has(targetId)) {
          const newDegree = (inDegree.get(targetId) ?? 1) - 1
          inDegree.set(targetId, newDegree)
          if (newDegree === 0) {
            nextQueue.push(targetId)
          }
        }
      })
    })
    queue = nextQueue
  }

  // 添加未访问的节点（可能有环）
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      layers.push([node.id])
    }
  })

  // 计算每层的位置
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const adjustedNodes: FlowNode[] = []

  const isHorizontal = direction === 'LR' || direction === 'RL'
  const startX = 100
  const startY = 100

  layers.forEach((layer, layerIndex) => {
    const layerSize = layer.length

    layer.forEach((nodeId, nodeIndex) => {
      const node = nodeMap.get(nodeId)
      if (!node) return

      const nodeWidth = node.size?.width ?? 180
      const nodeHeight = node.size?.height ?? 60

      let x: number, y: number

      if (isHorizontal) {
        // 水平布局
        x = startX + layerIndex * (nodeWidth + horizontalSpacing)
        const totalHeight = layerSize * nodeHeight + (layerSize - 1) * verticalSpacing
        y = startY + nodeIndex * (nodeHeight + verticalSpacing) - totalHeight / 2 + 200
      } else {
        // 垂直布局（默认）
        const totalWidth = layerSize * nodeWidth + (layerSize - 1) * horizontalSpacing
        x = startX + nodeIndex * (nodeWidth + horizontalSpacing) - totalWidth / 2 + 400
        y = startY + layerIndex * (nodeHeight + verticalSpacing)
      }

      adjustedNodes.push({
        ...node,
        position: { x, y }
      })
    })
  })

  return adjustedNodes
}

/**
 * 验证并修复节点重叠
 */
export function validateAndFixOverlap(
  nodes: FlowNode[],
  config?: LayoutConfig
): { nodes: FlowNode[]; hasOverlap: boolean } {
  const layoutConfig = { ...DEFAULT_LAYOUT, ...config }
  const { horizontalSpacing, verticalSpacing } = layoutConfig

  let hasOverlap = false

  // 检测是否有重叠
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (isOverlapping(nodes[i], nodes[j], horizontalSpacing, verticalSpacing)) {
        hasOverlap = true
        break
      }
    }
    if (hasOverlap) break
  }

  if (hasOverlap) {
    return {
      nodes: adjustNodePositions(nodes, config),
      hasOverlap: true
    }
  }

  return { nodes, hasOverlap: false }
}
