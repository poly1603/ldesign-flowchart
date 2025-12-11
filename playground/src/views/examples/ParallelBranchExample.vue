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
      data: { label: '发起采购' },
    },
    {
      id: 'parallel-1',
      type: 'parallel',
      position: { x: 300, y: 120 },
      data: { label: '并行审批开始' },
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 100, y: 230 },
      data: {
        label: '技术评估',
        approvers: [{ id: '1', name: '技术部', type: 'department' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 300, y: 230 },
      data: {
        label: '财务审核',
        approvers: [{ id: '2', name: '财务部', type: 'department' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'approval-3',
      type: 'approval',
      position: { x: 500, y: 230 },
      data: {
        label: '法务审核',
        approvers: [{ id: '3', name: '法务部', type: 'department' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'parallel-2',
      type: 'parallel',
      position: { x: 300, y: 340 },
      data: { label: '并行审批结束' },
    },
    {
      id: 'approval-4',
      type: 'approval',
      position: { x: 300, y: 440 },
      data: {
        label: '总经理审批',
        approvers: [{ id: '4', name: '总经理', type: 'role' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 540 },
      data: { label: '流程结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'parallel-1' },
    { id: 'edge-2', source: 'parallel-1', target: 'approval-1' },
    { id: 'edge-3', source: 'parallel-1', target: 'approval-2' },
    { id: 'edge-4', source: 'parallel-1', target: 'approval-3' },
    { id: 'edge-5', source: 'approval-1', target: 'parallel-2' },
    { id: 'edge-6', source: 'approval-2', target: 'parallel-2' },
    { id: 'edge-7', source: 'approval-3', target: 'parallel-2' },
    { id: 'edge-8', source: 'parallel-2', target: 'approval-4' },
    { id: 'edge-9', source: 'approval-4', target: 'end-1' },
  ],
})

const exampleCode = `// 并行分支示例 - 多部门同时审批
const flowData = {
  nodes: [
    {
      id: 'parallel-1',
      type: 'parallel',
      position: { x: 300, y: 120 },
      data: { label: '并行审批开始' },
    },
    // 并行的三个审批节点
    { id: 'approval-1', type: 'approval', data: { label: '技术评估' } },
    { id: 'approval-2', type: 'approval', data: { label: '财务审核' } },
    { id: 'approval-3', type: 'approval', data: { label: '法务审核' } },
    // 并行结束节点 - 等待所有分支完成
    {
      id: 'parallel-2',
      type: 'parallel',
      position: { x: 300, y: 340 },
      data: { label: '并行审批结束' },
    },
  ],
  edges: [
    // 从并行开始节点分出三条分支
    { source: 'parallel-1', target: 'approval-1' },
    { source: 'parallel-1', target: 'approval-2' },
    { source: 'parallel-1', target: 'approval-3' },
    // 三条分支汇合到并行结束节点
    { source: 'approval-1', target: 'parallel-2' },
    { source: 'approval-2', target: 'parallel-2' },
    { source: 'approval-3', target: 'parallel-2' },
  ],
}`

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
      <h1 class="example-title">并行分支</h1>
      <p class="example-desc">
        展示并行审批节点的使用，多个审批任务可以同时进行。
        所有并行分支完成后才会继续流转。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div ref="nativeContainerRef" class="flowchart-container"></div>
        </template>
        <template #vue>
          <div style="padding: 16px">
            <FlowchartApproval v-model="flowData" height="620px" />
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
