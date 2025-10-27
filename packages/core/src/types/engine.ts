/**
 * 渲染引擎类型定义
 */

import type { Position, Size, Bounds, NodeData, EdgeData } from './index'

// 渲染引擎类型
export type RenderEngineType = 'svg' | 'canvas' | 'webgl'

// 渲染器选项
export interface RenderOptions {
  engine?: RenderEngineType
  antialias?: boolean
  pixelRatio?: number
  preserveDrawingBuffer?: boolean
}

// 视口配置
export interface ViewportConfig {
  zoom?: number
  minZoom?: number
  maxZoom?: number
  position?: Position
  bounds?: Bounds
  padding?: number | { top: number; right: number; bottom: number; left: number }
}

// 渲染上下文
export interface RenderContext {
  canvas?: HTMLCanvasElement
  svg?: SVGElement
  gl?: WebGLRenderingContext
  width: number
  height: number
  pixelRatio: number
}

// 渲染层
export interface RenderLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
  order: number
  interactive: boolean
}

// 渲染元素
export interface RenderElement {
  id: string
  type: 'node' | 'edge' | 'port' | 'label' | 'decoration'
  data: NodeData | EdgeData
  layer?: string
  visible: boolean
  interactive: boolean
  bounds: Bounds
}

// 渲染性能指标
export interface RenderPerformance {
  fps: number
  frameTime: number
  renderTime: number
  nodeCount: number
  edgeCount: number
  visibleNodes: number
  visibleEdges: number
}

// 虚拟滚动配置
export interface VirtualScrollConfig {
  enabled: boolean
  buffer: number
  throttle: number
  overscan: number
}

// 渲染引擎接口
export interface RenderEngine {
  type: RenderEngineType
  context: RenderContext

  init(container: HTMLElement, options?: RenderOptions): void
  destroy(): void

  render(elements: RenderElement[]): void
  clear(): void

  setViewport(config: ViewportConfig): void
  getViewport(): ViewportConfig

  addLayer(layer: RenderLayer): void
  removeLayer(layerId: string): void
  setLayerVisibility(layerId: string, visible: boolean): void

  toDataURL(type?: string, quality?: number): string
  toBlob(callback: BlobCallback, type?: string, quality?: number): void

  getPerformance(): RenderPerformance
}

// Canvas渲染器特有接口
export interface CanvasRenderEngine extends RenderEngine {
  type: 'canvas'
  context: RenderContext & { canvas: HTMLCanvasElement }
  ctx: CanvasRenderingContext2D

  setLineDash(segments: number[]): void
  setGlobalAlpha(alpha: number): void
  setGlobalCompositeOperation(operation: GlobalCompositeOperation): void
}

// SVG渲染器特有接口
export interface SVGRenderEngine extends RenderEngine {
  type: 'svg'
  context: RenderContext & { svg: SVGElement }
  defs: SVGDefsElement

  createPattern(id: string, pattern: SVGPatternElement): void
  createGradient(id: string, gradient: SVGGradientElement): void
  createMarker(id: string, marker: SVGMarkerElement): void
  createFilter(id: string, filter: SVGFilterElement): void
}

// WebGL渲染器特有接口
export interface WebGLRenderEngine extends RenderEngine {
  type: 'webgl'
  context: RenderContext & { gl: WebGLRenderingContext }

  createShader(type: number, source: string): WebGLShader | null
  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null
  createTexture(image: HTMLImageElement | HTMLCanvasElement): WebGLTexture | null
}

