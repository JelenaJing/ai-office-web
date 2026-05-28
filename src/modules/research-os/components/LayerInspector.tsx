import { useProjectStore } from '../store/projectStore'
import { getMaterialSpec } from '../utils/compositeProperties'

export function LayerInspector() {
  const layers = useProjectStore(s => s.layers)
  const selectedLayerId = useProjectStore(s => s.selectedLayerId)
  const updateLayerThickness = useProjectStore(s => s.updateLayerThickness)
  const stackProps = useProjectStore(s => s.stackProps)

  const layer = layers.find(l => l.id === selectedLayerId)
  const spec = layer ? getMaterialSpec(layer.materialId) : null

  return (
    <aside className="builder-inspector">
      <div className="builder-inspector__header">
        <h2 className="text-lg font-bold text-slate-900">当前材料层</h2>
        <p className="mt-0.5 text-sm text-slate-500">选中层参数与叠层等效性能</p>
      </div>

      <div className="builder-inspector__scroll">
        {layer && spec ? (
          <section className="builder-inspector__section">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200"
                style={{ background: layer.color }}
              />
              <div>
                <p className="text-base font-bold text-slate-900">{layer.label}</p>
                <p className="text-sm text-slate-500">层厚 {layer.thicknessUm} μm</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-slate-600">
              层厚（μm）
              <input
                type="range"
                min={1}
                max={200}
                value={layer.thicknessUm}
                onChange={e => updateLayerThickness(layer.id, Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <input
                type="number"
                min={1}
                max={500}
                value={layer.thicknessUm}
                onChange={e => updateLayerThickness(layer.id, Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-base text-slate-900"
              />
            </label>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">单层物性</p>
              <p>离子电导率 {spec.ionicConductivity} mS/cm</p>
              <p>弹性模量 {spec.elasticModulusGpa} GPa</p>
              <p>界面粘接 {spec.interfacialAdhesion}</p>
            </div>
          </section>
        ) : (
          <section className="builder-inspector__section">
            <p className="text-base text-slate-500">在左侧列表或三维视图中选择一层以编辑参数。</p>
          </section>
        )}

        <section className="builder-inspector__section builder-inspector__section--accent">
          <p className="text-sm font-bold text-blue-900">叠层等效性能</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            <li className="flex justify-between">
              <span>总厚</span>
              <strong>{stackProps.totalThicknessUm} μm</strong>
            </li>
            <li className="flex justify-between">
              <span>等效电导</span>
              <strong>{stackProps.effectiveConductivityMsCm} mS/cm</strong>
            </li>
            <li className="flex justify-between">
              <span>等效模量</span>
              <strong>{stackProps.equivalentModulusGpa} GPa</strong>
            </li>
            <li className="flex justify-between">
              <span>能量密度</span>
              <strong>{stackProps.estimatedEnergyDensityWhKg} Wh/kg</strong>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  )
}
