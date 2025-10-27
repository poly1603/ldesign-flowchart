<template>
  <div class="app">
    <header class="app-header">
      <h1>🎯 审批流程设计器 - Vue Demo</h1>
      <div class="controls">
        <label>选择模板：</label>
        <select v-model="selectedTemplate" @change="loadTemplate">
          <option value="leave">请假审批</option>
          <option value="reimbursement">报销审批</option>
          <option value="purchase">采购审批</option>
        </select>
        <button @click="validateFlow">验证流程</button>
        <button @click="exportFlow">导出流程</button>
        <button @click="importFlow">导入流程</button>
      </div>
    </header>

    <main class="app-main">
      <FlowDesigner
        ref="designerRef"
        v-model:data="flowData"
        :show-toolbar="true"
        :show-sidebar="true"
        :show-property-panel="true"
        :show-minimap="true"
        @change="handleFlowChange"
        @node-select="handleNodeSelect"
        @edge-select="handleEdgeSelect"
      />
    </main>

    <div v-if="validationResult" :class="['validation-result', validationResult.valid ? 'valid' : 'invalid']">
      <h3>{{ validationResult.valid ? '✅ 流程验证通过' : '❌ 流程验证失败' }}</h3>
      <ul v-if="!validationResult.valid">
        <li v-for="(error, index) in validationResult.errors" :key="index">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FlowDesigner, useFlow } from '@ldesign/flowchart-vue'
import type { FlowData } from '@ldesign/flowchart-vue'

// 流程模板
const flowTemplates = {
  leave: {
    nodes: [
      { id: 'start', type: 'start', label: '开始', position: { x: 100, y: 100 } },
      { id: 'apply', type: 'process', label: '填写请假申请', position: { x: 100, y: 200 } },
      { id: 'manager', type: 'approval', label: '主管审批', position: { x: 100, y: 300 } },
      { id: 'hr', type: 'approval', label: 'HR审批', position: { x: 100, y: 400 } },
      { id: 'notify', type: 'process', label: '通知结果', position: { x: 100, y: 500 } },
      { id: 'end', type: 'end', label: '结束', position: { x: 100, y: 600 } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'apply', label: '' },
      { id: 'e2', source: 'apply', target: 'manager', label: '提交' },
      { id: 'e3', source: 'manager', target: 'hr', label: '同意' },
      { id: 'e4', source: 'hr', target: 'notify', label: '同意' },
      { id: 'e5', source: 'notify', target: 'end', label: '' }
    ]
  },
  reimbursement: {
    nodes: [
      { id: 'start', type: 'start', label: '开始', position: { x: 300, y: 50 } },
      { id: 'apply', type: 'process', label: '填写报销单', position: { x: 300, y: 150 } },
      { id: 'amount_check', type: 'decision', label: '金额判断', position: { x: 300, y: 250 } },
      { id: 'manager', type: 'approval', label: '部门经理审批', position: { x: 150, y: 350 } },
      { id: 'director', type: 'approval', label: '总监审批', position: { x: 450, y: 350 } },
      { id: 'finance', type: 'approval', label: '财务审核', position: { x: 300, y: 450 } },
      { id: 'payment', type: 'process', label: '财务打款', position: { x: 300, y: 550 } },
      { id: 'end', type: 'end', label: '结束', position: { x: 300, y: 650 } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'apply' },
      { id: 'e2', source: 'apply', target: 'amount_check', label: '提交' },
      { id: 'e3', source: 'amount_check', target: 'manager', label: '≤5000元' },
      { id: 'e4', source: 'amount_check', target: 'director', label: '>5000元' },
      { id: 'e5', source: 'manager', target: 'finance', label: '同意' },
      { id: 'e6', source: 'director', target: 'finance', label: '同意' },
      { id: 'e7', source: 'finance', target: 'payment', label: '审核通过' },
      { id: 'e8', source: 'payment', target: 'end' }
    ]
  },
  purchase: {
    nodes: [
      { id: 'start', type: 'start', label: '开始', position: { x: 400, y: 50 } },
      { id: 'request', type: 'process', label: '提交采购申请', position: { x: 400, y: 150 } },
      { id: 'budget_check', type: 'gateway', label: '预算检查', position: { x: 400, y: 250 } },
      { id: 'dept_manager', type: 'approval', label: '部门经理', position: { x: 200, y: 350 } },
      { id: 'finance_manager', type: 'approval', label: '财务经理', position: { x: 400, y: 350 } },
      { id: 'ceo', type: 'approval', label: 'CEO审批', position: { x: 600, y: 350 } },
      { id: 'purchase_dept', type: 'process', label: '采购执行', position: { x: 400, y: 450 } },
      { id: 'receive', type: 'process', label: '验收入库', position: { x: 400, y: 550 } },
      { id: 'end', type: 'end', label: '结束', position: { x: 400, y: 650 } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'request' },
      { id: 'e2', source: 'request', target: 'budget_check' },
      { id: 'e3', source: 'budget_check', target: 'dept_manager', label: '<10万' },
      { id: 'e4', source: 'budget_check', target: 'finance_manager', label: '10-50万' },
      { id: 'e5', source: 'budget_check', target: 'ceo', label: '>50万' },
      { id: 'e6', source: 'dept_manager', target: 'purchase_dept', label: '同意' },
      { id: 'e7', source: 'finance_manager', target: 'purchase_dept', label: '同意' },
      { id: 'e8', source: 'ceo', target: 'purchase_dept', label: '同意' },
      { id: 'e9', source: 'purchase_dept', target: 'receive' },
      { id: 'e10', source: 'receive', target: 'end' }
    ]
  }
}

// 响应式数据
const designerRef = ref()
const selectedTemplate = ref('leave')
const flowData = ref<FlowData>(flowTemplates.leave)
const validationResult = ref<{ valid: boolean; errors: string[] } | null>(null)

// 使用useFlow组合式函数
const flow = useFlow({
  initialData: flowData.value,
  onChange: (data) => {
    console.log('Flow changed:', data)
  }
})

// 方法
const loadTemplate = () => {
  flowData.value = flowTemplates[selectedTemplate.value as keyof typeof flowTemplates]
  validationResult.value = null
}

const validateFlow = () => {
  if (designerRef.value) {
    validationResult.value = designerRef.value.validateFlow()
    setTimeout(() => {
      validationResult.value = null
    }, 5000)
  }
}

const exportFlow = () => {
  const data = flow.exportJSON()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flow-${selectedTemplate.value}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importFlow = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string
          flow.importJSON(json)
          flowData.value = JSON.parse(json)
        } catch (error) {
          alert('导入失败：无效的JSON格式')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const handleFlowChange = (data: FlowData) => {
  console.log('Flow changed:', data)
}

const handleNodeSelect = (node: any) => {
  console.log('Node selected:', node)
}

const handleEdgeSelect = (edge: any) => {
  console.log('Edge selected:', edge)
}

// 生命周期
onMounted(() => {
  console.log('FlowDesigner Vue Demo mounted')
})
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1890ff;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controls label {
  font-weight: 500;
  color: #333;
}

.controls select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.controls button {
  padding: 6px 16px;
  border: 1px solid #1890ff;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.controls button:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.app-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.validation-result {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 500px;
  z-index: 1000;
}

.validation-result.valid {
  border: 2px solid #52c41a;
}

.validation-result.invalid {
  border: 2px solid #ff4d4f;
}

.validation-result h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.validation-result.valid h3 {
  color: #52c41a;
}

.validation-result.invalid h3 {
  color: #ff4d4f;
}

.validation-result ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.validation-result li {
  color: #666;
  margin-bottom: 4px;
}
</style>

