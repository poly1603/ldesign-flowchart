<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Flowchart, type FlowDefinition } from '@flowchart/core'

let nativeInstance: Flowchart | null = null
const nativeContainerRef = ref<HTMLElement | null>(null)
const nodeCount = ref(0)
const edgeCount = ref(0)
const renderTime = ref(0)

// 复杂流程图数据 - 模拟大型企业采购审批流程
const complexFlowData: FlowDefinition = {
  nodes: [
    // 开始
    { id: 'start', type: 'start', position: { x: 400, y: 30 }, data: { label: '采购申请' } },
    
    // 第一级：部门审批
    { id: 'dept-check', type: 'approval', position: { x: 400, y: 120 }, data: { label: '部门主管审核', approvers: [{ id: '1', name: '部门主管', type: 'role' }], approvalMode: 'any' } },
    
    // 条件分支：根据金额
    { id: 'amount-condition', type: 'condition', position: { x: 400, y: 220 }, data: { label: '金额判断' } },
    
    // 小额流程 (< 1万)
    { id: 'small-approval', type: 'approval', position: { x: 150, y: 320 }, data: { label: '财务专员审批', approvers: [{ id: '2', name: '财务专员', type: 'role' }], approvalMode: 'any' } },
    
    // 中额流程 (1-10万)
    { id: 'medium-manager', type: 'approval', position: { x: 400, y: 320 }, data: { label: '财务经理审批', approvers: [{ id: '3', name: '财务经理', type: 'role' }], approvalMode: 'any' } },
    { id: 'medium-director', type: 'approval', position: { x: 400, y: 420 }, data: { label: '采购总监审批', approvers: [{ id: '4', name: '采购总监', type: 'role' }], approvalMode: 'any' } },
    
    // 大额流程 (> 10万) - 间距50px
    { id: 'large-parallel', type: 'parallel', position: { x: 700, y: 320 }, data: { label: '并行审批' } },
    { id: 'large-finance', type: 'approval', position: { x: 630, y: 420 }, data: { label: '财务总监审批', approvers: [{ id: '5', name: '财务总监', type: 'role' }], approvalMode: 'any' } },
    { id: 'large-legal', type: 'approval', position: { x: 860, y: 420 }, data: { label: '法务审核', approvers: [{ id: '6', name: '法务专员', type: 'role' }], approvalMode: 'any' } },
    { id: 'large-merge', type: 'parallel', position: { x: 745, y: 520 }, data: { label: '汇合' } },
    { id: 'large-ceo', type: 'approval', position: { x: 745, y: 620 }, data: { label: 'CEO审批', approvers: [{ id: '7', name: 'CEO', type: 'role' }], approvalMode: 'any' } },
    
    // 合同条件
    { id: 'contract-condition', type: 'condition', position: { x: 400, y: 520 }, data: { label: '需要合同?' } },
    { id: 'contract-review', type: 'approval', position: { x: 250, y: 620 }, data: { label: '合同审核', approvers: [{ id: '8', name: '合同专员', type: 'role' }], approvalMode: 'any' } },
    
    // 汇合节点
    { id: 'final-merge', type: 'parallel', position: { x: 400, y: 720 }, data: { label: '流程汇合' } },
    
    // 抄送
    { id: 'cc-node', type: 'cc', position: { x: 400, y: 820 }, data: { label: '抄送通知', ccUsers: [{ id: '9', name: '采购部门', type: 'department' }] } },
    
    // 结束
    { id: 'end', type: 'end', position: { x: 400, y: 920 }, data: { label: '采购完成' } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'dept-check' },
    { id: 'e2', source: 'dept-check', target: 'amount-condition' },
    
    // 小额分支
    { id: 'e3', source: 'amount-condition', target: 'small-approval', data: { label: '< 1万' } },
    { id: 'e4', source: 'small-approval', target: 'final-merge' },
    
    // 中额分支
    { id: 'e5', source: 'amount-condition', target: 'medium-manager', data: { label: '1-10万' } },
    { id: 'e6', source: 'medium-manager', target: 'medium-director' },
    { id: 'e7', source: 'medium-director', target: 'contract-condition' },
    
    // 大额分支
    { id: 'e8', source: 'amount-condition', target: 'large-parallel', data: { label: '> 10万' } },
    { id: 'e9', source: 'large-parallel', target: 'large-finance' },
    { id: 'e10', source: 'large-parallel', target: 'large-legal' },
    { id: 'e11', source: 'large-finance', target: 'large-merge' },
    { id: 'e12', source: 'large-legal', target: 'large-merge' },
    { id: 'e13', source: 'large-merge', target: 'large-ceo' },
    { id: 'e14', source: 'large-ceo', target: 'final-merge' },
    
    // 合同流程
    { id: 'e15', source: 'contract-condition', target: 'contract-review', data: { label: '是' } },
    { id: 'e16', source: 'contract-condition', target: 'final-merge', data: { label: '否' } },
    { id: 'e17', source: 'contract-review', target: 'final-merge' },
    
    // 结束
    { id: 'e18', source: 'final-merge', target: 'cc-node' },
    { id: 'e19', source: 'cc-node', target: 'end' },
  ],
}

onMounted(() => {
  if (nativeContainerRef.value) {
    const startTime = performance.now()
    
    nativeInstance = new Flowchart(nativeContainerRef.value, {
      data: complexFlowData,
      canvas: {
        height: 1000,
        grid: { enabled: true, size: 20, color: 'var(--fc-grid)' },
      },
    })
    
    renderTime.value = Math.round(performance.now() - startTime)
    nodeCount.value = complexFlowData.nodes.length
    edgeCount.value = complexFlowData.edges.length
  }
})

onUnmounted(() => {
  nativeInstance?.destroy()
})
</script>

<template>
  <div class="example-page">
    <div class="example-header">
      <h1 class="example-title">复杂流程图</h1>
      <p class="example-desc">
        展示一个复杂的企业采购审批流程，包含条件分支、并行审批、多级审批等场景，
        用于测试渲染性能和复杂流程的展示效果。
      </p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">节点数量</span>
        <span class="stat-value">{{ nodeCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">连线数量</span>
        <span class="stat-value">{{ edgeCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">渲染耗时</span>
        <span class="stat-value">{{ renderTime }}ms</span>
      </div>
    </div>

    <div class="example-section">
      <div ref="nativeContainerRef" class="flowchart-container" style="height: 1000px;"></div>
    </div>
  </div>
</template>

<style scoped>
.stats-bar {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  border: 1px solid var(--border-light);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}
</style>
