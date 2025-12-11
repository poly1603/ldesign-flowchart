/**
 * FlowchartApproval Vue3 组件
 */

import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  h,
  type PropType,
} from 'vue'
import {
  Flowchart,
  type FlowchartConfig,
  type FlowDefinition,
  type FlowNode,
  type FlowEdge,
  type FlowchartEventData,
} from '@flowchart/core'

export const FlowchartApproval = defineComponent({
  name: 'FlowchartApproval',

  props: {
    /** 流程数据 */
    modelValue: {
      type: Object as PropType<FlowDefinition>,
      default: undefined,
    },
    /** 画布配置 */
    canvas: {
      type: Object as PropType<FlowchartConfig['canvas']>,
      default: undefined,
    },
    /** 工具栏配置 */
    toolbar: {
      type: Object as PropType<FlowchartConfig['toolbar']>,
      default: undefined,
    },
    /** 节点样式 */
    nodeStyle: {
      type: Object as PropType<FlowchartConfig['nodeStyle']>,
      default: undefined,
    },
    /** 连线样式 */
    edgeStyle: {
      type: Object as PropType<FlowchartConfig['edgeStyle']>,
      default: undefined,
    },
    /** 是否只读 */
    readonly: {
      type: Boolean,
      default: false,
    },
    /** 主题 */
    theme: {
      type: String as PropType<'light' | 'dark'>,
      default: 'light',
    },
    /** 国际化 */
    locale: {
      type: String as PropType<'zh-CN' | 'en-US'>,
      default: 'zh-CN',
    },
    /** 容器高度 */
    height: {
      type: [String, Number] as PropType<string | number>,
      default: '600px',
    },
    /** 容器宽度 */
    width: {
      type: [String, Number] as PropType<string | number>,
      default: '100%',
    },
  },

  emits: [
    'update:modelValue',
    'node:click',
    'node:dblclick',
    'node:contextmenu',
    'node:drag',
    'node:dragstart',
    'node:dragend',
    'node:add',
    'node:remove',
    'node:change',
    'edge:click',
    'edge:dblclick',
    'edge:contextmenu',
    'edge:add',
    'edge:remove',
    'edge:change',
    'canvas:click',
    'canvas:dblclick',
    'canvas:contextmenu',
    'canvas:zoom',
    'canvas:pan',
    'selection:change',
    'history:undo',
    'history:redo',
    'flow:change',
    'flow:validate',
    'initialized',
  ],

  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null)
    const flowchartInstance = ref<Flowchart | null>(null)
    const isInitialized = ref(false)

    // 初始化 Flowchart
    const initFlowchart = () => {
      if (!containerRef.value || flowchartInstance.value) return

      flowchartInstance.value = new Flowchart(containerRef.value, {
        canvas: props.canvas,
        toolbar: props.toolbar,
        nodeStyle: props.nodeStyle,
        edgeStyle: props.edgeStyle,
        readonly: props.readonly,
        theme: props.theme,
        locale: props.locale,
        data: props.modelValue,
      })

      // 绑定事件
      bindEvents()

      isInitialized.value = true
      emit('initialized', flowchartInstance.value)
    }

    // 绑定事件
    const bindEvents = () => {
      if (!flowchartInstance.value) return

      const events: Array<{
        name: string
        handler: (data: FlowchartEventData) => void
      }> = [
          { name: 'node:click', handler: (data) => emit('node:click', data) },
          { name: 'node:dblclick', handler: (data) => emit('node:dblclick', data) },
          { name: 'node:contextmenu', handler: (data) => emit('node:contextmenu', data) },
          { name: 'node:drag', handler: (data) => emit('node:drag', data) },
          { name: 'node:dragstart', handler: (data) => emit('node:dragstart', data) },
          { name: 'node:dragend', handler: (data) => emit('node:dragend', data) },
          { name: 'node:add', handler: (data) => emit('node:add', data) },
          { name: 'node:remove', handler: (data) => emit('node:remove', data) },
          { name: 'node:change', handler: (data) => emit('node:change', data) },
          { name: 'edge:click', handler: (data) => emit('edge:click', data) },
          { name: 'edge:dblclick', handler: (data) => emit('edge:dblclick', data) },
          { name: 'edge:contextmenu', handler: (data) => emit('edge:contextmenu', data) },
          { name: 'edge:add', handler: (data) => emit('edge:add', data) },
          { name: 'edge:remove', handler: (data) => emit('edge:remove', data) },
          { name: 'edge:change', handler: (data) => emit('edge:change', data) },
          { name: 'canvas:click', handler: (data) => emit('canvas:click', data) },
          { name: 'canvas:dblclick', handler: (data) => emit('canvas:dblclick', data) },
          { name: 'canvas:contextmenu', handler: (data) => emit('canvas:contextmenu', data) },
          { name: 'canvas:zoom', handler: (data) => emit('canvas:zoom', data) },
          { name: 'canvas:pan', handler: (data) => emit('canvas:pan', data) },
          { name: 'selection:change', handler: (data) => emit('selection:change', data) },
          { name: 'history:undo', handler: (data) => emit('history:undo', data) },
          { name: 'history:redo', handler: (data) => emit('history:redo', data) },
          {
            name: 'flow:change',
            handler: (data) => {
              emit('flow:change', data)
              // 更新 v-model
              const flowData = flowchartInstance.value?.getData()
              if (flowData) {
                emit('update:modelValue', flowData)
              }
            },
          },
        ]

      events.forEach(({ name, handler }) => {
        flowchartInstance.value?.on(name as never, handler)
      })
    }

    // 监听数据变化
    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue && flowchartInstance.value) {
          flowchartInstance.value.loadData(newValue)
        }
      },
      { deep: true }
    )

    // 监听只读状态
    watch(
      () => props.readonly,
      () => {
        // 重新初始化以应用新的只读状态
        if (flowchartInstance.value && containerRef.value) {
          const data = flowchartInstance.value.getData()
          flowchartInstance.value.destroy()
          flowchartInstance.value = null
          isInitialized.value = false

          // 延迟重新初始化
          setTimeout(() => {
            initFlowchart()
            if (flowchartInstance.value && data) {
              flowchartInstance.value.loadData(data)
            }
          }, 0)
        }
      }
    )

    // 暴露实例和方法
    expose({
      /** 获取 Flowchart 实例 */
      getInstance: () => flowchartInstance.value,
      /** 获取数据 */
      getData: () => flowchartInstance.value?.getData(),
      /** 加载数据 */
      loadData: (data: FlowDefinition) => flowchartInstance.value?.loadData(data),
      /** 添加节点 */
      addNode: (...args: Parameters<Flowchart['addNode']>) =>
        flowchartInstance.value?.addNode(...args),
      /** 更新节点 */
      updateNode: (...args: Parameters<Flowchart['updateNode']>) =>
        flowchartInstance.value?.updateNode(...args),
      /** 删除节点 */
      removeNode: (id: string) => flowchartInstance.value?.removeNode(id),
      /** 添加连线 */
      addEdge: (...args: Parameters<Flowchart['addEdge']>) =>
        flowchartInstance.value?.addEdge(...args),
      /** 删除连线 */
      removeEdge: (id: string) => flowchartInstance.value?.removeEdge(id),
      /** 撤销 */
      undo: () => flowchartInstance.value?.undo(),
      /** 重做 */
      redo: () => flowchartInstance.value?.redo(),
      /** 缩放到适应视图 */
      fitView: (padding?: number) => flowchartInstance.value?.fitView(padding),
      /** 设置缩放 */
      setZoom: (scale: number) => flowchartInstance.value?.setZoom(scale),
      /** 获取缩放 */
      getZoom: () => flowchartInstance.value?.getZoom(),
      /** 验证 */
      validate: () => flowchartInstance.value?.validate(),
      /** 导出JSON */
      toJSON: () => flowchartInstance.value?.toJSON(),
      /** 从JSON导入 */
      fromJSON: (json: string) => flowchartInstance.value?.fromJSON(json),
      /** 选中节点 */
      selectNode: (id: string, multiple?: boolean) =>
        flowchartInstance.value?.selectNode(id, multiple),
      /** 取消所有选中 */
      deselectAll: () => flowchartInstance.value?.deselectAll(),
      /** 获取选中的节点 */
      getSelectedNodes: () => flowchartInstance.value?.getSelectedNodes(),
      /** 获取选中的连线 */
      getSelectedEdges: () => flowchartInstance.value?.getSelectedEdges(),
    })

    // 生命周期
    onMounted(() => {
      initFlowchart()
    })

    onUnmounted(() => {
      if (flowchartInstance.value) {
        flowchartInstance.value.destroy()
        flowchartInstance.value = null
      }
    })

    // 渲染
    return () => {
      const containerStyle: Record<string, string> = {
        width: typeof props.width === 'number' ? `${props.width}px` : props.width,
        height: typeof props.height === 'number' ? `${props.height}px` : props.height,
      }

      return h('div', {
        ref: containerRef,
        class: 'flowchart-approval-container',
        style: containerStyle,
      })
    }
  },
})

export type FlowchartApprovalInstance = InstanceType<typeof FlowchartApproval>
