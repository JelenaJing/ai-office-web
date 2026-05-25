import type { ResearchField } from '../types'

interface SubjectSelectionPanelProps {
  fields: ResearchField[]
  selectedFieldId: string
  onSelectField: (fieldId: string) => void
}

const difficultyLabelMap: Record<ResearchField['difficulty'], string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高阶',
}

export default function SubjectSelectionPanel({
  fields,
  selectedFieldId,
  onSelectField,
}: SubjectSelectionPanelProps) {
  const selectedField = fields.find(field => field.id === selectedFieldId) ?? fields[0]

  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">学科选择系统</h2>
          <p className="research-panel__subtitle">点击切换当前研究方向，联动更新头部信息和推荐内容。</p>
        </div>
      </div>
      <div className="research-list">
        {fields.map(field => {
          const selected = field.id === selectedFieldId
          return (
            <button
              key={field.id}
              type="button"
              className={`research-option-card${selected ? ' is-selected' : ''}`}
              onClick={() => onSelectField(field.id)}
            >
              <div className="research-option-card__header">
                <strong>{field.name}</strong>
                <span className="research-badge research-badge--soft">{difficultyLabelMap[field.difficulty]}</span>
              </div>
              <p>{field.description}</p>
              <div className="research-chip-row">
                {field.tags.map(tag => (
                  <span key={tag} className="research-chip">{tag}</span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      {selectedField && (
        <div className="research-inline-summary">
          <span className="research-inline-summary__label">推荐人群</span>
          <div className="research-chip-row">
            {selectedField.recommendedFor.map(item => (
              <span key={item} className="research-chip research-chip--primary">{item}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
