import type { LocalScienceCapability } from '../types'

interface LocalScienceWorkbenchPanelProps {
  capabilities: LocalScienceCapability[]
  selectedFieldName: string
}

const capabilityStatusLabelMap: Record<LocalScienceCapability['status'], string> = {
  ready: 'Ready',
  warming: 'Warming',
  offline: 'Offline',
}

export default function LocalScienceWorkbenchPanel({
  capabilities,
  selectedFieldName,
}: LocalScienceWorkbenchPanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">本地 AI for Science</h2>
          <p className="research-panel__subtitle">不接真实模型，仅展示本地 AI for Science 工作流与能力分层。</p>
        </div>
      </div>
      <div className="research-local-banner">
        <strong>当前离线编排焦点：{selectedFieldName}</strong>
        <p>适合在本地知识库、实验日志和历史项目资料上做结构化整理、计划编排和报告草拟。</p>
      </div>
      <div className="research-list research-list--compact">
        {capabilities.map(capability => (
          <div key={capability.id} className="research-local-card">
            <div className="research-subscription-card__title-row">
              <strong>{capability.title}</strong>
              <span className={`research-risk-tag research-risk-tag--${capability.status === 'warming' ? 'medium' : capability.status === 'offline' ? 'high' : 'low'}`}>
                {capabilityStatusLabelMap[capability.status]}
              </span>
            </div>
            <p>{capability.description}</p>
            <div className="research-chip-row">
              {capability.focus.map(item => <span key={item} className="research-chip">{item}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
