import type { ExperimentPlan, ResearchMatter } from '../types'

interface ExperimentPlanPanelProps {
  plan: ExperimentPlan
  matter: ResearchMatter | null
}

export default function ExperimentPlanPanel({ plan, matter }: ExperimentPlanPanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">实验规划</h2>
          <p className="research-panel__subtitle">围绕当前事项整理实验目标、变量、数据、步骤与风险。</p>
        </div>
      </div>

      <div className="research-detail-stack">
        <div>
          <span className="research-detail-label">实验目标</span>
          <p>{matter?.objective ?? plan.objective}</p>
        </div>
        <div>
          <span className="research-detail-label">变量</span>
          <div className="research-chip-row">
            {plan.variables.map(item => <span key={item} className="research-chip">{item}</span>)}
          </div>
        </div>
        <div>
          <span className="research-detail-label">数据</span>
          <div className="research-chip-row">
            {plan.data.map(item => <span key={item} className="research-chip">{item}</span>)}
          </div>
        </div>
        <div>
          <span className="research-detail-label">步骤</span>
          <ol className="research-bullet-list research-bullet-list--ordered">
            {plan.steps.map(item => <li key={item}>{item}</li>)}
          </ol>
        </div>
        <div>
          <span className="research-detail-label">风险</span>
          <div className="research-chip-row">
            {plan.risks.map(item => <span key={item} className="research-chip research-chip--warning">{item}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
