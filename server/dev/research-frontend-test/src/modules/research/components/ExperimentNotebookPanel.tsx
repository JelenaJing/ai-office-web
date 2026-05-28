import type { ExperimentNotebookEntry } from '../types'

interface ExperimentNotebookPanelProps {
  entries: ExperimentNotebookEntry[]
}

export default function ExperimentNotebookPanel({ entries }: ExperimentNotebookPanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">实验记录本</h2>
          <p className="research-panel__subtitle">按日期记录实验过程、观察结果与下一步。</p>
        </div>
      </div>
      <div className="research-list research-list--compact">
        {entries.map(entry => (
          <div key={entry.id} className="research-notebook-card">
            <div className="research-subscription-card__title-row">
              <strong>{entry.date}</strong>
              <span className="research-badge">实验记录</span>
            </div>
            <div className="research-detail-stack">
              <div>
                <span className="research-detail-label">实验记录</span>
                <p>{entry.record}</p>
              </div>
              <div>
                <span className="research-detail-label">观察结果</span>
                <p>{entry.observation}</p>
              </div>
              <div>
                <span className="research-detail-label">下一步</span>
                <p>{entry.nextStep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
