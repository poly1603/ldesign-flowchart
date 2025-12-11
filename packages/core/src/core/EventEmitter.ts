/**
 * 事件发射器
 */

import type { FlowchartEventType, FlowchartEventCallback, FlowchartEventData } from '../types'

export class EventEmitter {
  private listeners: Map<FlowchartEventType, Set<FlowchartEventCallback>> = new Map()

  /**
   * 监听事件
   */
  on(event: FlowchartEventType, callback: FlowchartEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // 返回取消监听的函数
    return () => this.off(event, callback)
  }

  /**
   * 监听一次事件
   */
  once(event: FlowchartEventType, callback: FlowchartEventCallback): () => void {
    const wrapper: FlowchartEventCallback = (data) => {
      callback(data)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  /**
   * 取消监听事件
   */
  off(event: FlowchartEventType, callback: FlowchartEventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * 触发事件
   */
  emit(event: FlowchartEventType, data: FlowchartEventData = {}): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error)
        }
      })
    }
  }

  /**
   * 移除所有事件监听
   */
  removeAllListeners(event?: FlowchartEventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: FlowchartEventType): number {
    return this.listeners.get(event)?.size ?? 0
  }
}
