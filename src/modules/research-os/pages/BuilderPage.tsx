import { useEffect, useMemo, useState } from 'react'
import { OsChrome } from '../components/OsChrome'
import { LayerInspector } from '../components/LayerInspector'
import { LayerStackPanel } from '../components/LayerStackPanel'
import { CompositePartsDock } from '../components/CompositePartsDock'
import { MaterialsAssemblyScene } from '../components/MaterialsAssemblyScene'
import { useProjectStore } from '../store/projectStore'
import '../theme/builder-workspace.css'

const VIEW_MODES = [
  { key: '3d', label: '三维总览' },
  { key: 'exploded', label: '爆炸图' },
  { key: 'cross-section', label: '横截面' },
  { key: 'stack', label: '层厚视图' },
] as const

const VIEW_HINT: Record<(typeof VIEW_MODES)[number]['key'], string> = {
  '3d': '完整封装堆叠',
  exploded: '各层拉开便于查看',
  'cross-section': '外壳半透明切面',
  stack: '正面观察层厚比例',
}

export default function BuilderPage() {
  const setMode = useProjectStore(s => s.setMode)
  const layers = useProjectStore(s => s.layers)
  const selectedLayerId = useProjectStore(s => s.selectedLayerId)
  const [viewMode, setViewMode] = useState<(typeof VIEW_MODES)[number]['key']>('exploded')

  const selected = layers.find(l => l.id === selectedLayerId)
  const hint = useMemo(() => {
    const base = VIEW_HINT[viewMode]
    if (selected) return `${base} · 已选 ${selected.label}`
    if (layers.length > 0) return `${base} · 共 ${layers.length} 层`
    return `${base} · 从下方材料库添加`
  }, [viewMode, selected, layers.length])

  useEffect(() => {
    setMode('builder')
  }, [setMode])

  return (
    <OsChrome>
      <div className="builder-layout">
        <LayerStackPanel />

        <div className="builder-main">
          <div className="builder-main__viewbar">
            <div className="builder-viewbar__chips">
              {VIEW_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  className={viewMode === key ? 'builder-viewbar__chip is-active' : 'builder-viewbar__chip'}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="builder-viewbar__hint">{hint}</p>
          </div>

          <div className="builder-main__canvas">
            <MaterialsAssemblyScene viewMode={viewMode} />
          </div>

          <CompositePartsDock />
        </div>

        <LayerInspector />
      </div>
    </OsChrome>
  )
}
