<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Workflow,
  GitBranch,
  History,
  CheckCircle,
  Zap,
  Code,
} from 'lucide-vue-next'

const router = useRouter()

const features = [
  {
    icon: Workflow,
    title: '可视化流程设计',
    desc: '拖拽式流程节点编辑，支持多种节点类型：开始、结束、审批、抄送、条件、并行等',
    color: 'blue',
  },
  {
    icon: GitBranch,
    title: '灵活的分支控制',
    desc: '支持条件分支和并行分支，满足复杂业务流程需求',
    color: 'green',
  },
  {
    icon: History,
    title: '历史记录管理',
    desc: '内置撤销/重做功能，支持操作历史回溯',
    color: 'orange',
  },
  {
    icon: CheckCircle,
    title: '流程校验',
    desc: '自动检测流程逻辑错误，确保流程定义的正确性',
    color: 'purple',
  },
]

const goToExample = () => {
  router.push('/basic')
}
</script>

<template>
  <div class="home-page">
    <div class="home-hero">
      <h1>Flowchart Approval</h1>
      <p>
        一个轻量级、可扩展的OA流程审批插件，支持原生JS和Vue3，
        提供丰富的节点类型和交互功能
      </p>
      <div class="home-actions">
        <button class="btn btn-primary" @click="goToExample">
          <Zap :size="18" />
          快速开始
        </button>
        <a
          class="btn btn-default"
          href="https://github.com"
          target="_blank"
        >
          <Code :size="18" />
          查看源码
        </a>
      </div>
    </div>

    <div class="home-features">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="feature-card"
      >
        <div class="feature-icon" :class="feature.color">
          <component :is="feature.icon" :size="24" />
        </div>
        <h3 class="feature-title">{{ feature.title }}</h3>
        <p class="feature-desc">{{ feature.desc }}</p>
      </div>
    </div>
  </div>
</template>
