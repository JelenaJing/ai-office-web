import type { PersonalKnowledgeSnapshot } from '../types'

interface PersonalKnowledgePanelProps {
  knowledge: PersonalKnowledgeSnapshot
}

const updateTypeLabelMap: Record<PersonalKnowledgeSnapshot['recentUpdates'][number]['type'], string> = {
  paper: '我的论文',
  note: '我的笔记',
  experiment: '我的实验记录',
  subscription: '我订阅的论文',
}

export default function PersonalKnowledgePanel({ knowledge }: PersonalKnowledgePanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">个人知识库</h2>
          <p className="research-panel__subtitle">汇总我的论文、笔记、实验记录和最近更新内容。</p>
        </div>
      </div>
      <div className="research-kpi-grid">
        <div className="research-kpi-card">
          <span>我的论文</span>
          <strong>{knowledge.myPapers}</strong>
        </div>
        <div className="research-kpi-card">
          <span>我的笔记</span>
          <strong>{knowledge.myNotes}</strong>
        </div>
        <div className="research-kpi-card">
          <span>我的实验记录</span>
          <strong>{knowledge.myExperimentRecords}</strong>
        </div>
        <div className="research-kpi-card">
          <span>我订阅的论文</span>
          <strong>{knowledge.subscribedPapers}</strong>
        </div>
      </div>
      <div className="research-subsection">
        <div className="research-subsection__title">最近更新</div>
        <div className="research-list research-list--compact">
          {knowledge.recentUpdates.map(item => (
            <div key={item.id} className="research-timeline-item">
              <div className="research-timeline-item__dot" />
              <div>
                <strong>{item.title}</strong>
                <div className="research-meta-row">
                  <span>{updateTypeLabelMap[item.type]}</span>
                  <span>{item.updatedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
