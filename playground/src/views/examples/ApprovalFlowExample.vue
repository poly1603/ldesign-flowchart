<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Flowchart, type FlowDefinition } from '@flowchart/core'
import { FlowchartApproval } from '@flowchart/vue'
import ExampleTabs from '@/components/ExampleTabs.vue'
import CodeBlock from '@/components/CodeBlock.vue'

let nativeInstance: Flowchart | null = null
const nativeContainerRef = ref<HTMLElement | null>(null)

const flowData = ref<FlowDefinition>({
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 300, y: 30 },
      data: { label: '提交申请' },
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 300, y: 120 },
      data: {
        label: '部门经理审批',
        approvers: [{ id: '1', name: '部门经理', type: 'role' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 300, y: 220 },
      data: {
        label: '财务审批',
        approvers: [{ id: '2', name: '财务', type: 'department' }],
        approvalMode: 'all',
      },
    },
    {
      id: 'cc-1',
      type: 'cc',
      position: { x: 300, y: 320 },
      data: {
        label: '抄送行政部',
        ccUsers: [{ id: '3', name: '行政部', type: 'department' }],
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 420 },
      data: { label: '流程结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'approval-1' },
    { id: 'edge-2', source: 'approval-1', target: 'approval-2' },
    { id: 'edge-3', source: 'approval-2', target: 'cc-1' },
    { id: 'edge-4', source: 'cc-1', target: 'end-1' },
  ],
})

const exampleCode = `// 完整审批流程示例
const flowData = {
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 300, y: 30 },
      data: { label: '提交申请' },
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 300, y: 120 },
      data: {
        label: '部门经理审批',
        approvers: [{ id: '1', name: '部门经理', type: 'role' }],
        approvalMode: 'any', // 任一审批人通过即可
      },
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 300, y: 220 },
      data: {
        label: '财务审批',
        approvers: [{ id: '2', name: '财务', type: 'department' }],
        approvalMode: 'all', // 所有审批人都需要通过
      },
    },
    {
      id: 'cc-1',
      type: 'cc',
      position: { x: 300, y: 320 },
      data: {
        label: '抄送行政部',
        ccUsers: [{ id: '3', name: '行政部', type: 'department' }],
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 420 },
      data: { label: '流程结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'approval-1' },
    { id: 'edge-2', source: 'approval-1', target: 'approval-2' },
    { id: 'edge-3', source: 'approval-2', target: 'cc-1' },
    { id: 'edge-4', source: 'cc-1', target: 'end-1' },
  ],
}

const flowchart = new Flowchart('#container', { data: flowData })`

onMounted(() => {
  if (nativeContainerRef.value) {
    nativeInstance = new Flowchart(nativeContainerRef.value, {
      data: flowData.value,
    })
  }
})

onUnmounted(() => {
  nativeInstance?.destroy()
})
</script>

<template>
  <div class="example-page">
    <div class="example-header">
      <h1 class="example-title">审批流程</h1>
      <p class="example-desc">
        展示完整的多级审批流程，包括审批节点、抄送节点等。
        支持配置审批人、审批模式等。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div ref="nativeContainerRef" class="flowchart-container"></div>
        </template>
        <template #vue>
          <div style="padding: 16px">
            <FlowchartApproval v-model="flowData" height="500px" />
          </div>
        </template>
        <template #code>
          <div style="padding: 16px">
            <CodeBlock :code="exampleCode" language="typescript" />
          </div>
        </template>
      </ExampleTabs>
    </div>
  </div>
</template>
