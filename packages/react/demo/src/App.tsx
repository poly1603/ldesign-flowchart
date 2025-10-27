import React, { useState } from 'react'
import { FlowDesigner, useFlow } from '@ldesign/flowchart-react'
import type { FlowData } from '@ldesign/flowchart-react'
import './App.css'

// 请假审批流程示例
const leaveApprovalFlow: FlowData = {
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
}

// 报销审批流程示例
const reimbursementFlow: FlowData = {
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
}

// 采购审批流程示例
const purchaseFlow: FlowData = {
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

const flowTemplates = [
  { name: '请假审批', data: leaveApprovalFlow },
  { name: '报销审批', data: reimbursementFlow },
  { name: '采购审批', data: purchaseFlow }
]

function App() {
  const [currentFlow, setCurrentFlow] = useState<FlowData>(leaveApprovalFlow)
  const [selectedTemplate, setSelectedTemplate] = useState('请假审批')
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null)

  // 使用useFlow Hook管理流程
  const flow = useFlow({
    initialData: currentFlow,
    onChange: (data) => {
      console.log('Flow changed:', data)
    }
  })

  const handleTemplateChange = (templateName: string) => {
    const template = flowTemplates.find(t => t.name === templateName)
    if (template) {
      setCurrentFlow(template.data)
      setSelectedTemplate(templateName)
      setValidationResult(null)
    }
  }

  const handleValidate = () => {
    const result = flow.validateFlow()
    setValidationResult(result)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const json = event.target?.result as string
            flow.importJSON(json)
            setCurrentFlow(JSON.parse(json))
            alert('导入成功！')
          } catch (error) {
            alert('导入失败：无效的JSON格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 审批流程设计器 - React Demo</h1>
        <div className="template-selector">
          <label>选择模板：</label>
          <select value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
            {flowTemplates.map(template => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
          <button onClick={handleValidate}>验证流程</button>
          <button onClick={handleImport}>导入流程</button>
        </div>
      </header>

      <div className="app-content">
        <FlowDesigner
          data={currentFlow}
          onChange={setCurrentFlow}
          showToolbar={true}
          showSidebar={true}
          showPropertyPanel={true}
          showMinimap={true}
          onNodeSelect={(node) => console.log('Node selected:', node)}
          onEdgeSelect={(edge) => console.log('Edge selected:', edge)}
        />
      </div>

      {validationResult && (
        <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
          <h3>{validationResult.valid ? '✅ 流程验证通过' : '❌ 流程验证失败'}</h3>
          {!validationResult.valid && (
            <ul>
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default App

