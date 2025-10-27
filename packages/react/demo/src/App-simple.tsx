import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 审批流程设计器 - React Demo</h1>
        <p>正在加载组件...</p>
      </header>

      <div className="app-content" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2>✅ React Demo 启动成功！</h2>
          <p>FlowChart组件正在开发中...</p>
          <div style={{ marginTop: '20px', color: '#666' }}>
            <p>Core包构建状态: ✅ 成功</p>
            <p>React包构建状态: ✅ 成功</p>
            <p>Demo服务器: ✅ 运行中</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
