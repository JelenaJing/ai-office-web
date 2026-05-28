import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'

export function LayerStackPanel() {
  const layers = useProjectStore(s => s.layers)
  const selectedLayerId = useProjectStore(s => s.selectedLayerId)
  const selectLayer = useProjectStore(s => s.selectLayer)
  const moveLayer = useProjectStore(s => s.moveLayer)
  const removeLayer = useProjectStore(s => s.removeLayer)
  const stackProps = useProjectStore(s => s.stackProps)

  return (
    <aside className="builder-stack-panel">
      <div className="builder-stack-panel__header">
        <h2 className="text-base font-bold text-slate-900">叠层结构</h2>
        <p className="mt-0.5 text-xs text-slate-500">自下而上 · {layers.length} 层</p>
      </div>

      <ul className="builder-stack-panel__list">
        {layers.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            暂无叠层
            <br />
            请从下方材料库添加
          </li>
        ) : (
          [...layers].reverse().map((layer, revIdx) => {
            const index = layers.length - 1 - revIdx
            const selected = selectedLayerId === layer.id
            return (
              <li
                key={layer.id}
                className={selected ? 'builder-layer-item is-selected' : 'builder-layer-item'}
              >
                <span className="builder-layer-item__accent" style={{ background: layer.color }} />
                <div className="builder-layer-item__body">
                  <div className="builder-layer-item__row">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectLayer(layer.id)}
                    >
                      <p className="builder-layer-item__title">
                        L{index + 1} · {layer.label}
                      </p>
                      <p className="builder-layer-item__meta">{layer.thicknessUm} μm</p>
                    </button>
                    <div className="builder-layer-item__actions">
                      <button
                        type="button"
                        className="builder-layer-item__icon-btn"
                        title="上移"
                        onClick={() => moveLayer(layer.id, 'down')}
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="builder-layer-item__icon-btn"
                        title="下移"
                        onClick={() => moveLayer(layer.id, 'up')}
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        className="builder-layer-item__icon-btn builder-layer-item__icon-btn--danger"
                        title="删除"
                        onClick={() => removeLayer(layer.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>

      <div className="builder-stack-panel__footer">
        <div className="builder-stack-panel__stat">
          <span>总厚度</span>
          <strong>{stackProps.totalThicknessUm} μm</strong>
        </div>
        <div className="builder-stack-panel__stat">
          <span>等效电导</span>
          <strong className="text-blue-600">{stackProps.effectiveConductivityMsCm} mS/cm</strong>
        </div>
      </div>
    </aside>
  )
}
