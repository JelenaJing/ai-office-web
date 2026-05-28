import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Edge, Node } from '@xyflow/react'
import { SIDEBAR_CONTROL_TEMPLATES, SIDEBAR_DEVICE_TEMPLATES } from '../config/materialsLexicon'
import {
  DEFAULT_COMPOSITE_LAYERS,
  computeStackProperties,
  getMaterialSpec,
  type CompositeLayer,
  type StackProperties,
} from '../utils/compositeProperties'

export type DonutOsMode = 'builder' | 'simulator'

export interface ResearchProject {
  id: string
  name: string
  sampleCount: number
  dataRows: number
  stage: string
  polymerMassG: number
  filmThicknessUm: number
  electrodeAreaCm2: number
}

export interface PartInstance {
  id: string
  partType: string
  label: string
  path: string
}

export interface FlowConnectionItem {
  id: string
  title: string
  tag: string
  detail: string
}

type PortSignal = 'ANALOG' | 'DIGITAL' | 'CONTROL'

function defaultPorts(kind: 'device' | 'control'): { id: string; label: string; signal: PortSignal }[] {
  if (kind === 'device') {
    return [{ id: 'dataOut', label: '数据输出', signal: 'ANALOG' }]
  }
  return [
    { id: 'dataIn', label: '数据输入', signal: 'ANALOG' },
    { id: 'dataOut', label: '数据输出', signal: 'ANALOG' },
  ]
}

function buildDefaultNodes(): Node[] {
  return [
    {
      id: 'requirements',
      type: 'researchNode',
      position: { x: 80, y: 170 },
      data: { kind: 'device', title: '目标需求', modelId: '能量密度 ≥ 320 Wh/kg · 快充 4C', ports: defaultPorts('device') },
    },
    {
      id: 'cathode',
      type: 'researchNode',
      position: { x: 380, y: 60 },
      data: { kind: 'control', title: '正极筛选', modelId: 'NCM811 / LFP / LMFP', ports: defaultPorts('control') },
    },
    {
      id: 'anode',
      type: 'researchNode',
      position: { x: 380, y: 260 },
      data: { kind: 'control', title: '负极筛选', modelId: '石墨 / 硅碳 / 硬碳', ports: defaultPorts('control') },
    },
    {
      id: 'electrolyte',
      type: 'researchNode',
      position: { x: 700, y: 160 },
      data: { kind: 'control', title: '电解质选择', modelId: 'LLZO / 凝胶聚合物 / 液态', ports: defaultPorts('control') },
    },
    {
      id: 'cell-stack',
      type: 'researchNode',
      position: { x: 1030, y: 160 },
      data: { kind: 'control', title: '电芯叠层', modelId: '软包 · N/P 比 · 面容量', ports: defaultPorts('control') },
    },
    {
      id: 'simulation',
      type: 'researchNode',
      position: { x: 1360, y: 160 },
      data: { kind: 'control', title: '仿真计算', modelId: '充放电 · 热场 · 循环老化', ports: defaultPorts('control') },
    },
    {
      id: 'scoring',
      type: 'researchNode',
      position: { x: 1690, y: 160 },
      data: { kind: 'control', title: '多目标评分', modelId: '能量 · 安全 · 成本 · 制造', ports: defaultPorts('control') },
    },
    {
      id: 'report',
      type: 'researchNode',
      position: { x: 2020, y: 160 },
      data: { kind: 'device', title: '生成报告', modelId: 'Word · PPT · 知识库', ports: [{ id: 'dataIn', label: '数据输入', signal: 'ANALOG' }] },
    },
  ]
}

const DEFAULT_EDGES: Edge[] = [
  { id: 'e1', source: 'requirements', sourceHandle: 'dataOut', target: 'cathode', targetHandle: 'dataIn', animated: true },
  { id: 'e2', source: 'requirements', sourceHandle: 'dataOut', target: 'anode', targetHandle: 'dataIn', animated: true },
  { id: 'e3', source: 'cathode', sourceHandle: 'dataOut', target: 'cell-stack', targetHandle: 'dataIn', animated: true },
  { id: 'e4', source: 'anode', sourceHandle: 'dataOut', target: 'cell-stack', targetHandle: 'dataIn', animated: true },
  { id: 'e5', source: 'electrolyte', sourceHandle: 'dataOut', target: 'cell-stack', targetHandle: 'dataIn', animated: true },
  { id: 'e6', source: 'cell-stack', sourceHandle: 'dataOut', target: 'simulation', targetHandle: 'dataIn', animated: true },
  { id: 'e7', source: 'simulation', sourceHandle: 'dataOut', target: 'scoring', targetHandle: 'dataIn', animated: true },
  { id: 'e8', source: 'scoring', sourceHandle: 'dataOut', target: 'report', targetHandle: 'dataIn', animated: true },
]

function edgesToConnections(edges: Edge[], nodes: Node[]): FlowConnectionItem[] {
  const titleOf = (id: string) => {
    const n = nodes.find(x => x.id === id)
    const d = n?.data as { title?: string } | undefined
    return d?.title ?? id
  }
  return edges.map(e => ({
    id: e.id,
    title: `${titleOf(e.source)} → ${titleOf(e.target)}`,
    tag: '已连接',
    detail: `${e.sourceHandle ?? '输出'} → ${e.targetHandle ?? '输入'}`,
  }))
}

function syncProjectFromStack(layers: CompositeLayer[], stack: StackProperties): Partial<ResearchProject> {
  return {
    filmThicknessUm: stack.totalThicknessUm,
    polymerMassG: Math.round(stack.totalThicknessUm * 0.15 * 10) / 10,
    electrodeAreaCm2: 2.4,
  }
}

interface HistorySnap {
  nodes: Node[]
  edges: Edge[]
}

interface ProjectState {
  mode: DonutOsMode
  project: ResearchProject
  layers: CompositeLayer[]
  stackProps: StackProperties
  parts: PartInstance[]
  selectedLayerId: string | null
  nodes: Node[]
  edges: Edge[]
  connections: FlowConnectionItem[]
  editMode: boolean
  toastMessage: string | null
  lastSavedAt: string | null
  historyPast: HistorySnap[]
  historyFuture: HistorySnap[]
  simulatorStep: number
  simulatorRun: number
  setMode: (mode: DonutOsMode) => void
  setProjectName: (name: string) => void
  setGraph: (nodes: Node[], edges: Edge[]) => void
  addLayer: (materialId: string) => string
  updateLayerThickness: (layerId: string, thicknessUm: number) => void
  removeLayer: (layerId: string) => void
  moveLayer: (layerId: string, direction: 'up' | 'down') => void
  selectLayer: (id: string | null) => void
  addPart: (part: Omit<PartInstance, 'id'>) => string
  setEditMode: (on: boolean) => void
  saveProject: () => void
  deployProject: () => void
  showToast: (message: string) => void
  clearToast: () => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  scatterLayout: () => void
  addFlowNode: (template: { title: string; modelId: string; kind: 'device' | 'control' }) => void
  addEmptyConnection: () => void
  setSimulatorProgress: (step: number, run: number) => void
}

function applyLayers(layers: CompositeLayer[]) {
  const stack = computeStackProperties(layers)
  return {
    layers,
    stackProps: stack,
    project: (prev: ResearchProject) => ({ ...prev, ...syncProjectFromStack(layers, stack) }),
  }
}

const initialStack = computeStackProperties(DEFAULT_COMPOSITE_LAYERS)

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      mode: 'builder',
      project: {
        id: 'default',
        name: '聚合物固态电解质中试',
        sampleCount: 12,
        dataRows: 1840,
        stage: '方案编制',
        polymerMassG: 12.5,
        filmThicknessUm: initialStack.totalThicknessUm,
        electrodeAreaCm2: 2.4,
      },
      layers: DEFAULT_COMPOSITE_LAYERS,
      stackProps: initialStack,
      parts: [],
      selectedLayerId: DEFAULT_COMPOSITE_LAYERS[0]?.id ?? null,
      nodes: buildDefaultNodes(),
      edges: DEFAULT_EDGES,
      connections: edgesToConnections(DEFAULT_EDGES, buildDefaultNodes()),
      editMode: true,
      toastMessage: null,
      lastSavedAt: null,
      historyPast: [],
      historyFuture: [],
      simulatorStep: 1,
      simulatorRun: 1,

      setMode: mode => set({ mode }),
      setProjectName: name => set(state => ({ project: { ...state.project, name } })),

      setGraph: (nodes, edges) =>
        set({
          nodes,
          edges,
          connections: edgesToConnections(edges, nodes),
        }),

      addLayer: materialId => {
        const spec = getMaterialSpec(materialId)
        if (!spec) return ''
        const id = `layer-${Date.now()}`
        const layer: CompositeLayer = {
          id,
          materialId,
          label: spec.label,
          thicknessUm: spec.defaultThicknessUm,
          color: spec.color,
        }
        set(state => {
          const layers = [...state.layers, layer]
          const stack = computeStackProperties(layers)
          return {
            layers,
            stackProps: stack,
            selectedLayerId: id,
            project: { ...state.project, ...syncProjectFromStack(layers, stack), stage: '方案编制' },
            toastMessage: `已叠层：${spec.label}`,
          }
        })
        return id
      },

      updateLayerThickness: (layerId, thicknessUm) => {
        const t = Math.max(1, Math.min(500, thicknessUm))
        set(state => {
          const layers = state.layers.map(l => (l.id === layerId ? { ...l, thicknessUm: t } : l))
          const stack = computeStackProperties(layers)
          return {
            layers,
            stackProps: stack,
            project: { ...state.project, ...syncProjectFromStack(layers, stack) },
          }
        })
      },

      removeLayer: layerId => {
        set(state => {
          const layers = state.layers.filter(l => l.id !== layerId)
          const stack = computeStackProperties(layers)
          return {
            layers,
            stackProps: stack,
            selectedLayerId: state.selectedLayerId === layerId ? layers[layers.length - 1]?.id ?? null : state.selectedLayerId,
            project: { ...state.project, ...syncProjectFromStack(layers, stack) },
            toastMessage: '已移除该功能层',
          }
        })
      },

      moveLayer: (layerId, direction) => {
        set(state => {
          const idx = state.layers.findIndex(l => l.id === layerId)
          if (idx < 0) return state
          const swap = direction === 'up' ? idx - 1 : idx + 1
          if (swap < 0 || swap >= state.layers.length) return state
          const layers = [...state.layers]
          ;[layers[idx], layers[swap]] = [layers[swap], layers[idx]]
          const stack = computeStackProperties(layers)
          return { layers, stackProps: stack, project: { ...state.project, ...syncProjectFromStack(layers, stack) } }
        })
      },

      selectLayer: id => set({ selectedLayerId: id }),

      addPart: part => {
        const id = `part-${Date.now()}`
        set(state => ({
          parts: [...state.parts, { ...part, id }],
          toastMessage: `已关联模块：${part.label}`,
        }))
        return id
      },

      setEditMode: on => set({ editMode: on }),

      saveProject: () => {
        const now = new Date().toLocaleString('zh-CN')
        set({ lastSavedAt: now, toastMessage: `课题方案已保存 · ${now}` })
      },

      deployProject: () =>
        set(state => ({
          project: { ...state.project, stage: '已发布' },
          toastMessage: '方案已发布，可进入实验仿真查看过程数据',
        })),

      showToast: message => set({ toastMessage: message }),
      clearToast: () => set({ toastMessage: null }),

      pushHistory: () => {
        const { nodes, edges, historyPast } = get()
        set({
          historyPast: [...historyPast.slice(-19), { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
          historyFuture: [],
        })
      },

      undo: () => {
        const { historyPast, nodes, edges, historyFuture } = get()
        if (historyPast.length === 0) {
          set({ toastMessage: '没有可撤销的操作' })
          return
        }
        const prev = historyPast[historyPast.length - 1]
        set({
          historyPast: historyPast.slice(0, -1),
          historyFuture: [{ nodes, edges }, ...historyFuture],
          nodes: prev.nodes,
          edges: prev.edges,
          connections: edgesToConnections(prev.edges, prev.nodes),
          toastMessage: '已撤销',
        })
      },

      redo: () => {
        const { historyFuture, nodes, edges, historyPast } = get()
        if (historyFuture.length === 0) {
          set({ toastMessage: '没有可重做的操作' })
          return
        }
        const next = historyFuture[0]
        set({
          historyFuture: historyFuture.slice(1),
          historyPast: [...historyPast, { nodes, edges }],
          nodes: next.nodes,
          edges: next.edges,
          connections: edgesToConnections(next.edges, next.nodes),
          toastMessage: '已重做',
        })
      },

      scatterLayout: () => {
        get().pushHistory()
        const { nodes, edges } = get()
        const next = nodes.map((n, i) => ({
          ...n,
          position: { x: 80 + (i % 3) * 340, y: 60 + Math.floor(i / 3) * 220 },
        }))
        set({
          nodes: next,
          connections: edgesToConnections(edges, next),
          toastMessage: '画布已自动排布',
        })
      },

      addFlowNode: template => {
        get().pushHistory()
        const id = `node-${Date.now()}`
        const { nodes, edges } = get()
        const next: Node = {
          id,
          type: 'researchNode',
          position: { x: 100 + nodes.length * 50, y: 120 + nodes.length * 40 },
          data: {
            kind: template.kind,
            title: template.title,
            modelId: template.modelId,
            ports:
              template.kind === 'device' && template.title.includes('预测')
                ? [{ id: 'dataIn', label: '数据输入', signal: 'ANALOG' }]
                : defaultPorts(template.kind),
          },
        }
        const updated = [...nodes, next]
        set({
          nodes: updated,
          connections: edgesToConnections(edges, updated),
          toastMessage: `已添加节点：${template.title}`,
        })
      },

      addEmptyConnection: () => {
        set({ toastMessage: '请从输出端口拖拽连线至输入端口' })
      },

      setSimulatorProgress: (step, run) => set({ simulatorStep: step, simulatorRun: run }),
    }),
    {
      name: 'battery-lab-workspace-v2',
      partialize: state => ({
        mode: state.mode,
        project: state.project,
        layers: state.layers,
        nodes: state.nodes,
        edges: state.edges,
        editMode: state.editMode,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => state => {
        if (state && state.layers.length > 0) {
          const stack = computeStackProperties(state.layers)
          state.stackProps = stack
          state.project = { ...state.project, ...syncProjectFromStack(state.layers, stack) }
          state.connections = edgesToConnections(state.edges, state.nodes)
        }
      },
    },
  ),
)

export { SIDEBAR_DEVICE_TEMPLATES, SIDEBAR_CONTROL_TEMPLATES, edgesToConnections }
