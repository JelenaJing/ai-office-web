import type { ResearchIdeaCard as ResearchIdeaCardData } from '../types'

interface ResearchIdeaCardProps {
  idea: ResearchIdeaCardData
  selected: boolean
  onSelect: () => void
  onConvert: () => void
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

export default function ResearchIdeaCard({
  idea,
  selected,
  onSelect,
  onConvert,
}: ResearchIdeaCardProps) {
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
          <div className="research-idea-card__field">{idea.field}</div>
          <h3 className="research-idea-card__title">{idea.title}</h3>
        </div>
        <span className={`research-risk-tag research-risk-tag--${idea.riskLevel}`}>{riskLabelMap[idea.riskLevel]}</span>
      </div>

      <div className="research-meta-row">
        <span>来源论文 {idea.sourcePapers.length}</span>
        <span>下一步 {nextActionLabelMap[idea.nextAction]}</span>
      </div>

      <div className="research-idea-grid">
        <div>
          <span className="research-detail-label">核心观察</span>
          <p>{idea.coreObservation}</p>
        </div>
        <div>
          <span className="research-detail-label">研究空白</span>
          <p>{idea.researchGap}</p>
        </div>
        <div>
          <span className="research-detail-label">研究假设</span>
          <p>{idea.hypothesis}</p>
        </div>
        <div>
          <span className="research-detail-label">可行方法</span>
          <p>{idea.possibleMethod}</p>
        </div>
      </div>

      <div className="research-inline-blocks">
        <div className="research-inline-block">
          <span className="research-detail-label">所需数据</span>
          <div className="research-chip-row">
            {idea.requiredData.map(item => <span key={item} className="research-chip">{item}</span>)}
          </div>
        </div>
        <div className="research-inline-block">
          <span className="research-detail-label">所需实验</span>
          <div className="research-chip-row">
            {idea.requiredExperiment.map(item => <span key={item} className="research-chip">{item}</span>)}
          </div>
        </div>
      </div>

      <div className="research-score-row">
        <div className="research-score-card">
          <span>可行性分数</span>
          <strong>{idea.feasibilityScore}</strong>
          <div className="research-progress">
            <div className="research-progress__bar" style={{ width: `${idea.feasibilityScore}%` }} />
          </div>
        </div>
        <div className="research-score-card">
          <span>新颖性分数</span>
          <strong>{idea.noveltyScore}</strong>
          <div className="research-progress">
            <div className="research-progress__bar research-progress__bar--purple" style={{ width: `${idea.noveltyScore}%` }} />
          </div>
        </div>
      </div>

      <div className="research-idea-card__footer">
        <div className="research-paper-list">
          {idea.sourcePapers.map(paper => (
            <span key={paper.id} className="research-paper-chip">{paper.title}</span>
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
