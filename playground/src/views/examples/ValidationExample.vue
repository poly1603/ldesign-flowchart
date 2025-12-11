<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Flowchart, type FlowDefinition, type ValidationResult } from '@flowchart/core'
import { FlowchartApproval } from '@flowchart/vue'
import ExampleTabs from '@/components/ExampleTabs.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'

let nativeInstance: Flowchart | null = null
const nativeContainerRef = ref<HTMLElement | null>(null)
const validationResult = ref<ValidationResult | null>(null)

// 故意设计一个有问题的流程用于演示验证
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
      position: { x: 150, y: 150 },
      data: {
        label: '审批节点A',
        approvers: [{ id: '1', name: '审批人', type: 'user' }],
        approvalMode: 'any',
      },
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 450, y: 150 },
      data: {
        label: '孤立节点',
        approvers: [],
        approvalMode: 'any',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 300, y: 280 },
      data: { label: '结束' },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'start-1', target: 'approval-1' },
    { id: 'edge-2', source: 'approval-1', target: 'end-1' },
  ],
})

const isValid = computed(() => validationResult.value?.valid ?? false)
const errors = computed(() => validationResult.value?.errors ?? [])

const runValidation = () => {
  if (nativeInstance) {
    validationResult.value = nativeInstance.validate()
  }
}

const fixFlow = () => {
  // 修复流程：连接孤立节点
  flowData.value = {
    ...flowData.value,
    edges: [
      ...flowData.value.edges,
      { id: 'edge-3', source: 'approval-1', target: 'approval-2' },
      { id: 'edge-4', source: 'approval-2', target: 'end-1' },
    ],
  }
  // 移除原来的edge-2
  flowData.value.edges = flowData.value.edges.filter(e => e.id !== 'edge-2')
  
  if (nativeInstance) {
    nativeInstance.loadData(flowData.value)
  }
  validationResult.value = null
}

const exampleCode = `// 流程验证示例
const flowchart = new Flowchart('#container', { data })

// 执行验证
const result = flowchart.validate()

console.log('验证结果:', result.valid)
console.log('错误列表:', result.errors)

// result.errors 结构示例:
// [
//   {
//     type: 'error',
//     code: 'ISOLATED_NODE',
//     message: '存在孤立节点',
//     nodeId: 'approval-2'
//   },
//   {
//     type: 'warning',
//     code: 'NO_APPROVER',
//     message: '审批节点未配置审批人',
//     nodeId: 'approval-2'
//   }
// ]

// 验证规则包括:
// - 必须有且仅有一个开始节点
// - 必须有且仅有一个结束节点
// - 不能存在孤立节点（未连接的节点）
// - 不能存在环路
// - 审批节点必须配置审批人
// - 条件节点必须有条件配置
// - 所有节点必须能到达结束节点`

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
      <h1 class="example-title">流程验证</h1>
      <p class="example-desc">
        展示流程图的验证功能，检测流程定义中的错误和警告。
        示例中包含一个孤立节点，点击"验证流程"查看结果。
      </p>
    </div>

    <div class="example-section">
      <ExampleTabs>
        <template #native>
          <div style="display: flex; height: 500px">
            <div ref="nativeContainerRef" style="flex: 1; border-right: 1px solid #d9d9d9"></div>
            <div style="width: 320px; display: flex; flex-direction: column">
              <div style="padding: 16px; border-bottom: 1px solid #d9d9d9">
                <div style="display: flex; gap: 8px">
                  <button class="btn btn-primary" @click="runValidation">验证流程</button>
                  <button class="btn btn-default" @click="fixFlow">修复流程</button>
                </div>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 16px">
                <div v-if="validationResult !== null">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px">
                    <CheckCircle v-if="isValid" :size="24" style="color: #52c41a" />
                    <XCircle v-else :size="24" style="color: #ff4d4f" />
                    <span style="font-weight: 500">
                      {{ isValid ? '验证通过' : '验证失败' }}
                    </span>
                  </div>
                  <div v-if="errors.length > 0">
                    <div style="font-size: 12px; color: #8c8c8c; margin-bottom: 8px">
                      发现 {{ errors.length }} 个问题
                    </div>
                    <div
                      v-for="(error, index) in errors"
                      :key="index"
                      style="padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; margin-bottom: 8px"
                    >
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px">
                        <AlertTriangle :size="14" style="color: #ff4d4f" />
                        <span style="font-weight: 500; font-size: 13px">{{ error.code }}</span>
                      </div>
                      <div style="font-size: 12px; color: #595959">{{ error.message }}</div>
                      <div v-if="error.nodeId" style="font-size: 11px; color: #8c8c8c; margin-top: 4px">
                        节点ID: {{ error.nodeId }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else style="color: #8c8c8c; text-align: center; padding: 40px 0">
                  点击"验证流程"检查流程定义
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #vue>
          <div style="padding: 16px">
            <FlowchartApproval v-model="flowData" height="468px" />
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
