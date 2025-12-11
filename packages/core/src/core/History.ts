/**
 * 历史记录管理器（撤销/重做）
 */

import type { FlowDefinition } from '../types'
import { deepClone } from '../utils'

export interface HistoryState {
  nodes: FlowDefinition['nodes']
  edges: FlowDefinition['edges']
}

export interface HistoryOptions {
  /** 最大历史记录数 */
  maxLength?: number
}

export class History {
  private undoStack: HistoryState[] = []
  private redoStack: HistoryState[] = []
  private maxLength: number
  private isRecording = true

  constructor(options: HistoryOptions = {}) {
    this.maxLength = options.maxLength ?? 50
  }

  /**
   * 记录当前状态
   */
  push(state: HistoryState): void {
    if (!this.isRecording) return

    // 深拷贝状态
    const clonedState = deepClone(state)

    // 添加到撤销栈
    this.undoStack.push(clonedState)

    // 限制栈大小
    if (this.undoStack.length > this.maxLength) {
      this.undoStack.shift()
    }

    // 清空重做栈
    this.redoStack = []
  }

  /**
   * 撤销
   */
  undo(currentState: HistoryState): HistoryState | null {
    if (!this.canUndo()) return null

    // 将当前状态推入重做栈
    this.redoStack.push(deepClone(currentState))

    // 从撤销栈弹出并返回
    return this.undoStack.pop()!
  }

  /**
   * 重做
   */
  redo(currentState: HistoryState): HistoryState | null {
    if (!this.canRedo()) return null

    // 将当前状态推入撤销栈
    this.undoStack.push(deepClone(currentState))

    // 从重做栈弹出并返回
    return this.redoStack.pop()!
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * 暂停记录
   */
  pause(): void {
    this.isRecording = false
  }

  /**
   * 恢复记录
   */
  resume(): void {
    this.isRecording = true
  }

  /**
   * 批量操作（不记录中间状态）
   */
  batch<T>(fn: () => T): T {
    this.pause()
    const result = fn()
    this.resume()
    return result
  }

  /**
   * 获取撤销栈长度
   */
  get undoLength(): number {
    return this.undoStack.length
  }

  /**
   * 获取重做栈长度
   */
  get redoLength(): number {
    return this.redoStack.length
  }
}
