import clsx from 'clsx'
import type { ResearchIdeaCard as ResearchIdeaCardData } from '../types'
import { ResearchButton } from './ResearchUi'

interface ResearchIdeaCardProps {
  idea: ResearchIdeaCardData
  selected: boolean
  onSelect: () => void
  onConvert: () => void
}

const riskStyles: Record<ResearchIdeaCardData['riskLevel'], string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger',
}

const riskLabelMap: Record<ResearchIdeaCardData['riskLevel'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const nextActionLabelMap: Record<ResearchIdeaCardData['nextAction'], string> = {
  read_more: '继续读文献',
  make_plan: '转成实验计划',
  run_experiment: '准备实验验证',
  write_proposal: '整理项目申请',
}

export default function ResearchIdeaCard({
  idea,
  selected,
  onSelect,
  onConvert,
}: ResearchIdeaCardProps) {
  return (
    <article
      className={clsx(
        'cursor-pointer rounded-2xl border p-5 shadow-sm transition',
        selected
          ? 'border-primary bg-primary/[0.03] ring-2 ring-primary/25'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md',
      )}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{idea.field}</span>
          <h3 className="mt-1 text-base font-semibold leading-snug text-slate-800">{idea.title}</h3>
        </div>
        <span className={clsx('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', riskStyles[idea.riskLevel])}>
          {riskLabelMap[idea.riskLevel]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        <span>来源论文 {idea.sourcePapers.length}</span>
        <span>·</span>
        <span>{nextActionLabelMap[idea.nextAction]}</span>
        {'rankScore' in idea && typeof (idea as { rankScore?: number }).rankScore === 'number' && (
          <>
            <span>·</span>
            <span>排序分 {(idea as { rankScore: number }).rankScore.toFixed(2)}</span>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ['核心观察', idea.coreObservation],
          ['研究空白', idea.researchGap],
          ['研究假设', idea.hypothesis],
          ['可行方法', idea.possibleMethod],
        ].map(([label, text]) => (
          <div key={label as string}>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted">所需数据</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {idea.requiredData.map(item => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">所需实验</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {idea.requiredExperiment.map(item => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>可行性</span>
            <strong className="text-slate-800">{idea.feasibilityScore}</strong>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-accent" style={{ width: `${idea.feasibilityScore}%` }} />
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>新颖性</span>
            <strong className="text-slate-800">{idea.noveltyScore}</strong>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary" style={{ width: `${idea.noveltyScore}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {idea.sourcePapers.slice(0, 3).map(paper => (
            <span
              key={paper.id}
              className="max-w-[200px] truncate rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600"
              title={paper.title}
            >
              {paper.title}
            </span>
          ))}
        </div>
        <ResearchButton
          size="sm"
          className="shrink-0"
          onClick={event => {
            event.stopPropagation()
            onConvert()
          }}
        >
          转为科研事项
        </ResearchButton>
      </div>
    </article>
  )
}
