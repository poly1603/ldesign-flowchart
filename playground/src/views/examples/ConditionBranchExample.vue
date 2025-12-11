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
      data: { label: '提交报销' },
    },
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 300, y: 120 },
      data: {
        label: '金额判断',
        conditions: [
          {
            id: 'cond-1',
            name: '小于1000元',
            expression: { field: 'amount', operator: 'lt', value: 1000 },
          },
          {
            id: 'cond-2',
            name: '大于等于1000元',
            expression: { field: 'amount', operator: 'gte', value: 1000 },
          },
        ],
      },
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 120, y: 240 },
      data: {
        label: '组长审批',
        approvers: [{ id: '1', name: '组长', type: 'role' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 480, y: 240 },
      data: {
        label: '经理审批',
        approvers: [{ id: '2', name: '经理', type: 'role' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 360 },
      data: { label: '结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'condition-1' },
    {
      id: 'edge-2',
      source: 'condition-1',
      target: 'approval-1',
      data: { label: '< 1000', conditionId: 'cond-1' },
    },
    {
      id: 'edge-3',
      source: 'condition-1',
      target: 'approval-2',
      data: { label: '>= 1000', conditionId: 'cond-2' },
    },
    { id: 'edge-4', source: 'approval-1', target: 'end-1' },
    { id: 'edge-5', source: 'approval-2', target: 'end-1' },
  ],
})

const exampleCode = `// 条件分支示例 - 根据报销金额走不同审批流程
const flowData = {
  nodes: [
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 300, y: 120 },
      data: {
        label: '金额判断',
        conditions: [
          {
            id: 'cond-1',
            name: '小于1000元',
            expression: { field: 'amount', operator: 'lt', value: 1000 },
          },
          {
            id: 'cond-2',
            name: '大于等于1000元',
            expression: { field: 'amount', operator: 'gte', value: 1000 },
          },
        ],
      },
    },
    // ... 其他节点
  ],
  edges: [
    // 条件分支连线需要指定 conditionId
    {
      id: 'edge-2',
      source: 'condition-1',
      target: 'approval-1',
      data: { label: '< 1000', conditionId: 'cond-1' },
    },
    {
      id: 'edge-3',
      source: 'condition-1',
      target: 'approval-2',
      data: { label: '>= 1000', conditionId: 'cond-2' },
    },
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
      <h1 class="example-title">条件分支</h1>
      <p class="example-desc">
        展示条件分支节点的使用，根据不同条件走不同的审批流程。
        支持配置多个条件表达式。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div ref="nativeContainerRef" class="flowchart-container"></div>
        </template>
        <template #vue>
          <div style="padding: 16px">
            <FlowchartApproval v-model="flowData" height="450px" />
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
