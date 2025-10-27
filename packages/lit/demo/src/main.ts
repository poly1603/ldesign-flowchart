import './app-element'
import './styles.css'

// 挂载应用
document.addEventListener('DOMContentLoaded', () => {
  const app = document.createElement('app-element')
  document.body.appendChild(app)
})
