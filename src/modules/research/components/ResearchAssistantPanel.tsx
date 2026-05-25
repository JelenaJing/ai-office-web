import type { ResearchIdeaCard, ResearchMatter, ResearchMatterStatus } from '../types'

interface ResearchAssistantPanelProps {
  selectedIdea: ResearchIdeaCard | null
  matters: ResearchMatter[]
  selectedMatterId: string
  onSelectMatter: (matterId: string) => void
  onSetMatterStatus: (matterId: string, status: ResearchMatterStatus) => void
  onAdvanceMatterStatus: (matterId: string) => void
}

const matterStatusFlow: ResearchMatterStatus[] = [
  'idea',
  'reading',
  'planning',
  'experimenting',
  'analyzing',
  'writing',
  'completed',
]

const matterStatusLabelMap: Record<ResearchMatterStatus, string> = {
  idea: 'Idea',
  reading: 'Reading',
  planning: 'Planning',
  experimenting: 'Experimenting',
  analyzing: 'Analyzing',
  writing: 'Writing',
  completed: 'Completed',
}

export default function ResearchAssistantPanel({
  selectedIdea,
  matters,
  selectedMatterId,
  onSelectMatter,
  onSetMatterStatus,
  onAdvanceMatterStatus,
}: ResearchAssistantPanelProps) {
  const selectedMatter = matters.find(matter => matter.id === selectedMatterId) ?? matters[0] ?? null

  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">个人科研助手</h2>
          <p className="research-panel__subtitle">围绕当前 Idea 和科研事项，持续整理目标、假设、来源论文与下一步行动。</p>
        </div>
      </div>

      {selectedIdea ? (
        <div className="research-assistant-focus">
          <span className="research-detail-label">当前选中的科研 Idea</span>
          <strong>{selectedIdea.title}</strong>
          <p>{selectedIdea.coreObservation}</p>
          <div className="research-chip-row">
            <span className="research-chip research-chip--primary">{selectedIdea.field}</span>
            <span className="research-chip">下一步：{selectedIdea.nextAction}</span>
          </div>
        </div>
      ) : null}

      <div className="research-subsection">
        <div className="research-subsection__title">当前科研事项</div>
        <div className="research-list research-list--compact">
          {matters.map(matter => (
            <button
              key={matter.id}
              type="button"
              className={`research-matter-card${matter.id === selectedMatterId ? ' is-selected' : ''}`}
              onClick={() => onSelectMatter(matter.id)}
            >
              <strong>{matter.title}</strong>
              <div className="research-meta-row">
                <span>{matter.field}</span>
                <span>{matterStatusLabelMap[matter.status]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMatter && (
        <div className="research-subsection">
          <div className="research-subsection__title">事项详情</div>
          <div className="research-detail-stack">
            <div>
              <span className="research-detail-label">研究目标</span>
              <p>{selectedMatter.objective}</p>
            </div>
            <div>
              <span className="research-detail-label">研究假设</span>
              <p>{selectedMatter.hypothesis}</p>
            </div>
            <div>
              <span className="research-detail-label">来源论文</span>
              <div className="research-chip-row">
                {selectedMatter.sourcePaperIds.map(paperId => (
                  <span key={paperId} className="research-chip">{paperId}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="research-detail-label">下一步行动</span>
              <div className="research-status-flow">
                {matterStatusFlow.map(status => (
                  <button
                    key={status}
                    type="button"
                    className={`research-status-flow__step${selectedMatter.status === status ? ' is-active' : ''}`}
                    onClick={() => onSetMatterStatus(selectedMatter.id, status)}
                  >
                    {matterStatusLabelMap[status]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="research-button research-button--primary research-button--block"
                onClick={() => onAdvanceMatterStatus(selectedMatter.id)}
              >
                推进到下一阶段
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
