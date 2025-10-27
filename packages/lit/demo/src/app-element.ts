/**
 * Lit Web Components Demo App
 */
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '@ldesign/flowchart-lit'
import type { FlowData } from '@ldesign/flowchart-lit'

// 流程模板定义
const flowTemplates = {
  leave: {
    name: '请假审批',
    data: {
      nodes: [
        { id: 'start', type: 'start' as const, label: '开始', position: { x: 100, y: 100 } },
        { id: 'apply', type: 'process' as const, label: '填写请假申请', position: { x: 100, y: 200 } },
        { id: 'manager', type: 'approval' as const, label: '主管审批', position: { x: 100, y: 300 } },
        { id: 'hr', type: 'approval' as const, label: 'HR审批', position: { x: 100, y: 400 } },
        { id: 'notify', type: 'process' as const, label: '通知结果', position: { x: 100, y: 500 } },
        { id: 'end', type: 'end' as const, label: '结束', position: { x: 100, y: 600 } }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'apply', label: '' },
        { id: 'e2', source: 'apply', target: 'manager', label: '提交' },
        { id: 'e3', source: 'manager', target: 'hr', label: '同意' },
        { id: 'e4', source: 'hr', target: 'notify', label: '同意' },
        { id: 'e5', source: 'notify', target: 'end', label: '' }
      ]
    }
  },
  reimbursement: {
    name: '报销审批',
    data: {
      nodes: [
        { id: 'start', type: 'start' as const, label: '开始', position: { x: 300, y: 50 } },
        { id: 'apply', type: 'process' as const, label: '填写报销单', position: { x: 300, y: 150 } },
        { id: 'amount_check', type: 'decision' as const, label: '金额判断', position: { x: 300, y: 250 } },
        { id: 'manager', type: 'approval' as const, label: '部门经理审批', position: { x: 150, y: 350 } },
        { id: 'director', type: 'approval' as const, label: '总监审批', position: { x: 450, y: 350 } },
        { id: 'finance', type: 'approval' as const, label: '财务审核', position: { x: 300, y: 450 } },
        { id: 'payment', type: 'process' as const, label: '财务打款', position: { x: 300, y: 550 } },
        { id: 'end', type: 'end' as const, label: '结束', position: { x: 300, y: 650 } }
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
  },
  purchase: {
    name: '采购审批',
    data: {
      nodes: [
        { id: 'start', type: 'start' as const, label: '开始', position: { x: 400, y: 50 } },
        { id: 'request', type: 'process' as const, label: '提交采购申请', position: { x: 400, y: 150 } },
        { id: 'budget_check', type: 'gateway' as const, label: '预算检查', position: { x: 400, y: 250 } },
        { id: 'dept_manager', type: 'approval' as const, label: '部门经理', position: { x: 200, y: 350 } },
        { id: 'finance_manager', type: 'approval' as const, label: '财务经理', position: { x: 400, y: 350 } },
        { id: 'ceo', type: 'approval' as const, label: 'CEO审批', position: { x: 600, y: 350 } },
        { id: 'purchase_dept', type: 'process' as const, label: '采购执行', position: { x: 400, y: 450 } },
        { id: 'receive', type: 'process' as const, label: '验收入库', position: { x: 400, y: 550 } },
        { id: 'end', type: 'end' as const, label: '结束', position: { x: 400, y: 650 } }
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
}

@customElement('app-element')
export class AppElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .app {
      width: 100%;
      height: 100%;
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
    
    flow-designer {
      width: 100%;
      height: 100%;
    }
    
    .demo-section {
      background: white;
      padding: 20px;
      margin: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .demo-section h2 {
      margin: 0 0 16px 0;
      color: #333;
    }
    
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    
    .demo-card {
      background: #fafafa;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
    }
    
    .demo-card h3 {
      margin: 0 0 12px 0;
      color: #1890ff;
    }
    
    flow-viewer {
      width: 100%;
      height: 400px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
    }
  `

  @state()
  private selectedTemplate = 'leave'

  @state()
  private flowData: FlowData = flowTemplates.leave.data

  @state()
  private currentView: 'designer' | 'viewer' = 'designer'

  private handleTemplateChange(e: Event): void {
    const select = e.target as HTMLSelectElement
    const templateKey = select.value as keyof typeof flowTemplates
    this.selectedTemplate = templateKey
    this.flowData = flowTemplates[templateKey].data
  }

  private handleExport(): void {
    const designer = this.shadowRoot?.querySelector('flow-designer') as any
    if (designer && designer.flowModel) {
      const data = designer.flowModel.toJSON()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flow-${this.selectedTemplate}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  private handleImport(): void {
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
            this.flowData = JSON.parse(json)
          } catch (error) {
            alert('导入失败：无效的JSON格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  private switchView(view: 'designer' | 'viewer'): void {
    this.currentView = view
  }

  render() {
    if (this.currentView === 'viewer') {
      return html`
        <div class="app">
          <header class="app-header">
            <h1>🎯 审批流程查看器 - Lit Demo</h1>
            <div class="controls">
              <button @click=${() => this.switchView('designer')}>
                返回设计器
              </button>
            </div>
          </header>
          
          <main class="app-main">
            <div class="demo-section">
              <h2>流程实例预览</h2>
              <div class="demo-grid">
                ${Object.entries(flowTemplates).map(([key, template]) => html`
                  <div class="demo-card">
                    <h3>${template.name}</h3>
                    <flow-viewer
                      .data=${template.data}
                      .nodeStatuses=${{
          'start': 'completed',
          'apply': 'completed',
          'manager': 'running'
        }}
                      showLegend
                      showInfo
                      title=${template.name}
                      description="这是一个流程实例的运行时视图"
                    ></flow-viewer>
                  </div>
                `)}
              </div>
            </div>
          </main>
        </div>
      `
    }

    return html`
      <div class="app">
        <header class="app-header">
          <h1>🎯 审批流程设计器 - Lit Demo</h1>
          <div class="controls">
            <label>选择模板：</label>
            <select @change=${this.handleTemplateChange} .value=${this.selectedTemplate}>
              ${Object.entries(flowTemplates).map(([key, template]) => html`
                <option value=${key}>${template.name}</option>
              `)}
            </select>
            <button @click=${this.handleExport}>导出流程</button>
            <button @click=${this.handleImport}>导入流程</button>
            <button @click=${() => this.switchView('viewer')}>
              查看器模式
            </button>
          </div>
        </header>
        
        <main class="app-main">
          <flow-designer
            .data=${this.flowData}
            showToolbar
            showSidebar
            showPropertyPanel
            showMinimap
            @change=${(e: CustomEvent) => {
        console.log('Flow changed:', e.detail)
      }}
          ></flow-designer>
        </main>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-element': AppElement
  }
}
