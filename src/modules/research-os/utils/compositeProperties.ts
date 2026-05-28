/** 层状复合材料物性库（用于叠层推算） */
export interface MaterialSpec {
  id: string
  label: string
  color: string
  defaultThicknessUm: number
  /** 离子电导率 mS/cm */
  ionicConductivity: number
  /** 弹性模量 GPa */
  elasticModulusGpa: number
  /** 界面粘接强度 0–1 */
  interfacialAdhesion: number
}

export const LAYER_MATERIALS: MaterialSpec[] = [
  { id: 'cathode_ncm811', label: 'NCM811 正极', color: '#8b3a3a', defaultThicknessUm: 68, ionicConductivity: 0.35, elasticModulusGpa: 4.2, interfacialAdhesion: 0.88 },
  { id: 'cathode_lfp', label: 'LFP 正极', color: '#2f6b3f', defaultThicknessUm: 74, ionicConductivity: 0.22, elasticModulusGpa: 5.1, interfacialAdhesion: 0.91 },
  { id: 'anode_graphite', label: '石墨负极', color: '#222222', defaultThicknessUm: 58, ionicConductivity: 0.18, elasticModulusGpa: 7.2, interfacialAdhesion: 0.86 },
  { id: 'anode_si_c', label: '硅碳负极', color: '#111111', defaultThicknessUm: 46, ionicConductivity: 0.2, elasticModulusGpa: 5.8, interfacialAdhesion: 0.8 },
  { id: 'electrolyte_llzo', label: 'LLZO 固态电解质', color: '#f2f2e8', defaultThicknessUm: 36, ionicConductivity: 1.0, elasticModulusGpa: 140, interfacialAdhesion: 0.74 },
  { id: 'electrolyte_liquid', label: '液态电解液', color: '#38bdf8', defaultThicknessUm: 26, ionicConductivity: 8.5, elasticModulusGpa: 0.01, interfacialAdhesion: 0.82 },
  { id: 'separator', label: '隔膜', color: '#f8fafc', defaultThicknessUm: 16, ionicConductivity: 0.08, elasticModulusGpa: 1.2, interfacialAdhesion: 0.9 },
  { id: 'al_foil', label: '铝箔集流体', color: '#94a3b8', defaultThicknessUm: 10, ionicConductivity: 0, elasticModulusGpa: 69, interfacialAdhesion: 0.9 },
  { id: 'cu_foil', label: '铜箔集流体', color: '#ea580c', defaultThicknessUm: 12, ionicConductivity: 0, elasticModulusGpa: 110, interfacialAdhesion: 0.92 },
  { id: 'pouch_case', label: '软包壳体', color: '#cbd5e1', defaultThicknessUm: 22, ionicConductivity: 0, elasticModulusGpa: 12, interfacialAdhesion: 0.88 },
]

export interface CompositeLayer {
  id: string
  materialId: string
  label: string
  thicknessUm: number
  color: string
}

export interface StackProperties {
  totalThicknessUm: number
  effectiveConductivityMsCm: number
  equivalentModulusGpa: number
  meanAdhesion: number
  estimatedEnergyDensityWhKg: number
}

export function getMaterialSpec(id: string): MaterialSpec | undefined {
  return LAYER_MATERIALS.find(m => m.id === id)
}

export function computeStackProperties(layers: CompositeLayer[]): StackProperties {
  if (layers.length === 0) {
    return {
      totalThicknessUm: 0,
      effectiveConductivityMsCm: 0,
      equivalentModulusGpa: 0,
      meanAdhesion: 0,
      estimatedEnergyDensityWhKg: 0,
    }
  }
  const totalThicknessUm = layers.reduce((s, l) => s + l.thicknessUm, 0)
  let condDenom = 0
  let condNum = 0
  let modSum = 0
  let adhesionSum = 0
  for (const layer of layers) {
    const spec = getMaterialSpec(layer.materialId)
    const k = spec?.ionicConductivity ?? 0.1
    const e = spec?.elasticModulusGpa ?? 1
    const a = spec?.interfacialAdhesion ?? 0.8
    if (k > 0) {
      condNum += k * layer.thicknessUm
      condDenom += layer.thicknessUm
    }
    modSum += e * layer.thicknessUm
    adhesionSum += a
  }
  const effectiveConductivityMsCm = condDenom > 0 ? condNum / condDenom : 0
  const equivalentModulusGpa = totalThicknessUm > 0 ? modSum / totalThicknessUm : 0
  const meanAdhesion = adhesionSum / layers.length
  const estimatedEnergyDensityWhKg = Math.round(
    180 * (effectiveConductivityMsCm / 2) * (totalThicknessUm / 120) * meanAdhesion,
  )
  return {
    totalThicknessUm: Math.round(totalThicknessUm * 10) / 10,
    effectiveConductivityMsCm: Math.round(effectiveConductivityMsCm * 100) / 100,
    equivalentModulusGpa: Math.round(equivalentModulusGpa * 100) / 100,
    meanAdhesion: Math.round(meanAdhesion * 100) / 100,
    estimatedEnergyDensityWhKg,
  }
}

export const DEFAULT_COMPOSITE_LAYERS: CompositeLayer[] = [
  { id: 'init-1', materialId: 'al_foil', label: '铝箔集流体', thicknessUm: 10, color: '#94a3b8' },
  { id: 'init-2', materialId: 'cathode_ncm811', label: 'NCM811 正极', thicknessUm: 68, color: '#8b3a3a' },
  { id: 'init-3', materialId: 'separator', label: '隔膜', thicknessUm: 16, color: '#f8fafc' },
  { id: 'init-4', materialId: 'electrolyte_llzo', label: 'LLZO 固态电解质', thicknessUm: 36, color: '#f2f2e8' },
  { id: 'init-5', materialId: 'anode_si_c', label: '硅碳负极', thicknessUm: 46, color: '#111111' },
  { id: 'init-6', materialId: 'cu_foil', label: '铜箔集流体', thicknessUm: 12, color: '#ea580c' },
]
