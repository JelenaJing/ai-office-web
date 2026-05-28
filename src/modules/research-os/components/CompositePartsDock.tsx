import { LAYER_MATERIALS } from '../utils/compositeProperties'
import { useProjectStore } from '../store/projectStore'

export function CompositePartsDock() {
  const addLayer = useProjectStore(s => s.addLayer)

  return (
    <section className="builder-parts-dock" aria-label="材料选择">
      <div className="builder-parts-dock__grid">
        {LAYER_MATERIALS.map(mat => (
          <button
            key={mat.id}
            type="button"
            onClick={() => addLayer(mat.id)}
            className="builder-part-card"
            title={mat.label}
          >
            <span className="builder-part-card__swatch" style={{ background: mat.color }} />
            <span className="builder-part-card__label">{mat.label}</span>
            <span className="builder-part-card__thick">{mat.defaultThicknessUm} μm</span>
          </button>
        ))}
      </div>
    </section>
  )
}
