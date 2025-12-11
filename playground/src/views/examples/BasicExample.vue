<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Flowchart, type FlowDefinition } from '@flowchart/core'
import { FlowchartApproval, useFlowchart } from '@flowchart/vue'
import ExampleTabs from '@/components/ExampleTabs.vue'
import CodeBlock from '@/components/CodeBlock.vue'

// 原生 JS 实例
let nativeInstance: Flowchart | null = null
const nativeContainerRef = ref<HTMLElement | null>(null)

// Vue 组件数据
const flowData = ref<FlowDefinition>({
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 300, y: 50 },
      data: { label: '开始' },
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 300, y: 150 },
      data: {
        label: '部门经理审批',
        approvers: [{ id: '1', name: '张三', type: 'user' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 250 },
      data: { label: '结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'approval-1' },
    { id: 'edge-2', source: 'approval-1', target: 'end-1' },
  ],
})

// 示例代码
const nativeCode = `import { Flowchart } from '@flowchart/core'

// 创建流程图实例
const flowchart = new Flowchart('#container', {
  data: {
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 300, y: 50 }, data: { label: '开始' } },
      { id: 'approval-1', type: 'approval', position: { x: 300, y: 150 }, data: { label: '审批' } },
      { id: 'end-1', type: 'end', position: { x: 300, y: 250 }, data: { label: '结束' } },
    ],
    edges: [
      { id: 'edge-1', source: 'start-1', target: 'approval-1' },
      { id: 'edge-2', source: 'approval-1', target: 'end-1' },
    ],
  },
})

// 监听事件
flowchart.on('node:click', (data) => {
  console.log('点击节点:', data.node)
})

// 获取数据
const data = flowchart.getData()
console.log('流程数据:', data)`

const vueCode = `<script setup lang="ts">
import { ref } from 'vue'
import { FlowchartApproval } from '@flowchart/vue'

const flowData = ref({
  nodes: [
    { id: 'start-1', type: 'start', position: { x: 300, y: 50 }, data: { label: '开始' } },
    { id: 'approval-1', type: 'approval', position: { x: 300, y: 150 }, data: { label: '审批' } },
    { id: 'end-1', type: 'end', position: { x: 300, y: 250 }, data: { label: '结束' } },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'approval-1' },
    { id: 'edge-2', source: 'approval-1', target: 'end-1' },
  ],
})

const handleNodeClick = (data) => {
  console.log('点击节点:', data.node)
}
<\/script>

<template>
  <FlowchartApproval
    v-model="flowData"
    height="500px"
    @node:click="handleNodeClick"
  />
</template>`

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
      <h1 class="example-title">基础示例</h1>
      <p class="example-desc">
        展示流程图的基础用法，包括创建简单的审批流程。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div ref="nativeContainerRef" class="flowchart-container"></div>
        </template>
        <template #vue>
          <div style="padding: 16px">
            <FlowchartApproval v-model="flowData" height="468px" />
          </div>
        </template>
        <template #code>
          <div style="padding: 16px">
            <h4 style="margin-bottom: 12px">原生 JavaScript</h4>
            <CodeBlock :code="nativeCode" language="typescript" />
            <h4 style="margin: 24px 0 12px">Vue 组件</h4>
            <CodeBlock :code="vueCode" language="vue" />
          </div>
        </template>
      </ExampleTabs>
    </div>
  </div>
</template>
