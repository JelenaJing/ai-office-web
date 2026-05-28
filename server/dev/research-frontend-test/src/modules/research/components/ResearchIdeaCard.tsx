import type { ResearchIdeaCard as ResearchIdeaCardData } from '../types'
import type { RankedResearchIdea } from '../../../api/feedRank'

interface ResearchIdeaCardProps {
  idea: ResearchIdeaCardData | RankedResearchIdea
  selected: boolean
  feedRankApplied?: boolean
  listIndex?: number
  onSelect: () => void
  onConvert: () => void
}

const BREAKDOWN_LABELS: Record<string, string> = {
  fieldMatch: '领域匹配',
  novelty: '新颖性权重',
  feasibility: '可行性权重',
  evidence: '文献数量',
  paperRelevance: '文献相关度',
  riskAdjust: '风险调整',
  subscriptionBoost: '订阅加成',
  servedPenalty: '已看过降权',
  total: 'Feed 分合计',
}

const riskLabelMap: Record<ResearchIdeaCardData['riskLevel'], string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

const nextActionLabelMap: Record<ResearchIdeaCardData['nextAction'], string> = {
  read_more: '继续读文献',
  make_plan: '转成实验计划',
  run_experiment: '准备实验验证',
  write_proposal: '整理项目申请',
}

function scorePercent(value: number): number {
  if (value <= 1) {
    return Math.round(value * 100)
  }
  return Math.round(value)
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="research-idea-detail">
      <span className="research-detail-label">{label}</span>
      <p>{text}</p>
    </div>
  )
}

function ChipSection({ label, items, emptyHint }: { label: string; items: string[]; emptyHint: string }) {
  return (
    <div className="research-idea-detail research-idea-detail--compact">
      <span className="research-detail-label">{label}</span>
      {items.length > 0 ? (
        <div className="research-chip-row">
          {items.map(item => (
            <span key={item} className="research-chip">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="research-empty-hint">{emptyHint}</p>
      )}
    </div>
  )
}

export default function ResearchIdeaCard({
  idea,
  selected,
  feedRankApplied = false,
  listIndex,
  onSelect,
  onConvert,
}: ResearchIdeaCardProps) {
  const rankScore =
    feedRankApplied && 'rankScore' in idea && idea.rankScore !== undefined
      ? idea.rankScore
      : undefined
  const rankBreakdown =
    feedRankApplied && 'rankBreakdown' in idea ? idea.rankBreakdown : undefined
  const feasibilityPct = scorePercent(idea.feasibilityScore)
  const noveltyPct = scorePercent(idea.noveltyScore)

  return (
    <article
      className={`research-idea-card${selected ? ' is-selected' : ''}`}
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
      <div className="research-idea-card__header">
        <div>
          {listIndex !== undefined && (
            <span className="research-feed-rank-order">#{listIndex}</span>
          )}
          <div className="research-idea-card__field">{idea.field}</div>
          <h3 className="research-idea-card__title">{idea.title}</h3>
        </div>
        <span className={`research-risk-tag research-risk-tag--${idea.riskLevel}`}>
          {riskLabelMap[idea.riskLevel]}
        </span>
      </div>

      <div className="research-meta-row">
        <span>来源论文 {idea.sourcePapers.length}</span>
        <span>下一步 {nextActionLabelMap[idea.nextAction]}</span>
        {rankScore !== undefined ? (
          <span className="research-rank-badge">Feed 分 {rankScore.toFixed(2)}</span>
        ) : (
          <span className="research-rank-badge research-rank-badge--pending">待 X 排序</span>
        )}
      </div>

      {rankBreakdown && (
        <details className="research-rank-breakdown" onClick={(e) => e.stopPropagation()}>
          <summary>X 推荐得分拆解</summary>
          <ul>
            {Object.entries(rankBreakdown).map(([key, val]) => (
              <li key={key}>
                <span>{BREAKDOWN_LABELS[key] ?? key}</span>
                <strong>{typeof val === 'number' ? val.toFixed(3) : String(val)}</strong>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="research-idea-body">
        <DetailBlock label="核心观察" text={idea.coreObservation} />

        <div className="research-idea-grid__row-2">
          <DetailBlock label="研究空白" text={idea.researchGap} />
          <DetailBlock label="研究假设" text={idea.hypothesis} />
        </div>

        <DetailBlock label="可行方法" text={idea.possibleMethod} />

        <div className="research-idea-grid__row-2">
          <ChipSection
            label="所需数据"
            items={idea.requiredData}
            emptyHint="生成后可补充组学、文献或实验数据库需求"
          />
          <ChipSection
            label="所需实验"
            items={idea.requiredExperiment}
            emptyHint="生成后可补充验证实验或表征步骤"
          />
        </div>
      </div>

      <div className="research-score-row">
        <div className="research-score-card">
          <span>可行性（模型/规则估算）</span>
          <strong>{feasibilityPct}%</strong>
          <div className="research-progress">
            <div className="research-progress__bar" style={{ width: `${feasibilityPct}%` }} />
          </div>
        </div>
        <div className="research-score-card">
          <span>新颖性（模型/规则估算）</span>
          <strong>{noveltyPct}%</strong>
          <div className="research-progress">
            <div
              className="research-progress__bar research-progress__bar--purple"
              style={{ width: `${noveltyPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="research-idea-card__footer">
        <div className="research-paper-list research-paper-list--citations">
          {idea.sourcePapers.map(paper => (
            <p key={paper.id} className="research-citation-line" title={paper.title}>
              {paper.citation?.trim() ||
                [paper.authors?.slice(0, 3).join(', '), paper.year ? `(${paper.year})` : '', paper.title]
                  .filter(Boolean)
                  .join(' ')}
            </p>
          ))}
        </div>
        <button
          type="button"
          className="research-button research-button--primary"
          onClick={event => {
            event.stopPropagation()
            onConvert()
          }}
        >
          转为科研事项
        </button>
      </div>
    </article>
  )
}
