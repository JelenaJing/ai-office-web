import clsx from 'clsx'
import { SectionCard } from '../../materials-research/components/common/SectionCard'
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
    <SectionCard title="研究方向" subtitle="切换领域后，生成 Idea 与排序将使用该方向。">
      <div className="space-y-2">
        {fields.map(field => {
          const selected = field.id === selectedFieldId
          return (
            <button
              key={field.id}
              type="button"
              onClick={() => onSelectField(field.id)}
              className={clsx(
                'w-full rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-slate-800">{field.name}</strong>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-muted shadow-sm">
                  {difficultyLabelMap[field.difficulty]}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{field.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {field.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      {selectedField && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-muted">推荐人群</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedField.recommendedFor.map(item => (
              <span key={item} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
