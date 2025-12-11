import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/index.css'

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue'),
    },
    {
      path: '/basic',
      name: 'Basic',
      component: () => import('./views/examples/BasicExample.vue'),
    },
    {
      path: '/approval-flow',
      name: 'ApprovalFlow',
      component: () => import('./views/examples/ApprovalFlowExample.vue'),
    },
    {
      path: '/condition-branch',
      name: 'ConditionBranch',
      component: () => import('./views/examples/ConditionBranchExample.vue'),
    },
    {
      path: '/parallel-branch',
      name: 'ParallelBranch',
      component: () => import('./views/examples/ParallelBranchExample.vue'),
    },
    {
      path: '/events',
      name: 'Events',
      component: () => import('./views/examples/EventsExample.vue'),
    },
    {
      path: '/validation',
      name: 'Validation',
      component: () => import('./views/examples/ValidationExample.vue'),
    },
    {
      path: '/complex-flow',
      name: 'ComplexFlow',
      component: () => import('./views/examples/ComplexFlowExample.vue'),
    },
    {
      path: '/editor',
      name: 'Editor',
      component: () => import('./views/examples/EditorExample.vue'),
    },
    {
      path: '/themes',
      name: 'Themes',
      component: () => import('./views/examples/ThemesExample.vue'),
    },
  ],
})

const app = createApp(App)
app.use(router)
app.mount('#app')
