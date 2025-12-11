<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Flowchart, type FlowDefinition, type FlowchartEventData } from '@flowchart/core'
import { FlowchartApproval } from '@flowchart/vue'
import ExampleTabs from '@/components/ExampleTabs.vue'
import CodeBlock from '@/components/CodeBlock.vue'

let nativeInstance: Flowchart | null = null
const nativeContainerRef = ref<HTMLElement | null>(null)
const eventLogs = ref<string[]>([])

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
        label: '审批节点',
        approvers: [{ id: '1', name: '审批人', type: 'user' }],
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

const addLog = (message: string) => {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift(`[${time}] ${message}`)
  if (eventLogs.value.length > 20) {
    eventLogs.value.pop()
  }
}

const clearLogs = () => {
  eventLogs.value = []
}

const handleNodeClick = (data: FlowchartEventData) => {
  addLog(`node:click - 节点ID: ${data.node?.id}`)
}

const handleEdgeClick = (data: FlowchartEventData) => {
  addLog(`edge:click - 连线ID: ${data.edge?.id}`)
}

const handleCanvasClick = () => {
  addLog('canvas:click - 点击画布')
}

const handleSelectionChange = (data: FlowchartEventData) => {
  const nodeCount = data.nodes?.length || 0
  const edgeCount = data.edges?.length || 0
  addLog(`selection:change - 选中节点: ${nodeCount}, 连线: ${edgeCount}`)
}

const exampleCode = `// 事件监听示例
const flowchart = new Flowchart('#container', { data })

// 节点点击事件
flowchart.on('node:click', (data) => {
  console.log('点击节点:', data.node?.id)
})

// 节点双击事件
flowchart.on('node:dblclick', (data) => {
  console.log('双击节点:', data.node?.id)
})

// 节点拖拽事件
flowchart.on('node:drag', (data) => {
  console.log('拖拽节点:', data.node?.id, data.position)
})

// 连线点击事件
flowchart.on('edge:click', (data) => {
  console.log('点击连线:', data.edge?.id)
})

// 选择变化事件
flowchart.on('selection:change', (data) => {
  console.log('选中节点:', data.nodes?.length)
  console.log('选中连线:', data.edges?.length)
})

// 流程变化事件
flowchart.on('flow:change', (data) => {
  console.log('流程数据已更新')
})

// 画布缩放事件
flowchart.on('canvas:zoom', (data) => {
  console.log('缩放比例:', data.zoom)
})

// 撤销/重做事件
flowchart.on('history:undo', () => console.log('撤销操作'))
flowchart.on('history:redo', () => console.log('重做操作'))`

onMounted(() => {
  if (nativeContainerRef.value) {
    nativeInstance = new Flowchart(nativeContainerRef.value, {
      data: flowData.value,
    })

    nativeInstance.on('node:click', handleNodeClick)
    nativeInstance.on('edge:click', handleEdgeClick)
    nativeInstance.on('canvas:click', handleCanvasClick)
    nativeInstance.on('selection:change', handleSelectionChange)
  }
})

onUnmounted(() => {
  nativeInstance?.destroy()
})
</script>

<template>
  <div class="example-page">
    <div class="example-header">
      <h1 class="example-title">事件交互</h1>
      <p class="example-desc">
        展示流程图的各种事件监听，包括节点点击、连线点击、选择变化等。
        点击图中的元素查看事件日志。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div style="display: flex; height: 500px">
            <div ref="nativeContainerRef" style="flex: 1; border-right: 1px solid #d9d9d9"></div>
            <div style="width: 300px; display: flex; flex-direction: column">
              <div style="padding: 12px; border-bottom: 1px solid #d9d9d9; display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 500">事件日志</span>
                <button class="btn btn-sm btn-default" @click="clearLogs">清空</button>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 12px; font-size: 12px; font-family: monospace">
                <div v-for="(log, index) in eventLogs" :key="index" style="padding: 4px 0; border-bottom: 1px solid #f0f0f0">
                  {{ log }}
                </div>
                <div v-if="eventLogs.length === 0" style="color: #8c8c8c; text-align: center; padding: 20px">
                  点击图中元素查看事件
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #vue>
          <div style="display: flex; height: 500px">
            <div style="flex: 1; padding: 16px">
              <FlowchartApproval
                v-model="flowData"
                height="468px"
                @node:click="handleNodeClick"
                @edge:click="handleEdgeClick"
                @canvas:click="handleCanvasClick"
                @selection:change="handleSelectionChange"
              />
            </div>
            <div style="width: 300px; display: flex; flex-direction: column; border-left: 1px solid #d9d9d9">
              <div style="padding: 12px; border-bottom: 1px solid #d9d9d9; display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 500">事件日志</span>
                <button class="btn btn-sm btn-default" @click="clearLogs">清空</button>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 12px; font-size: 12px; font-family: monospace">
                <div v-for="(log, index) in eventLogs" :key="index" style="padding: 4px 0; border-bottom: 1px solid #f0f0f0">
                  {{ log }}
                </div>
                <div v-if="eventLogs.length === 0" style="color: #8c8c8c; text-align: center; padding: 20px">
                  点击图中元素查看事件
                </div>
              </div>
            </div>
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
