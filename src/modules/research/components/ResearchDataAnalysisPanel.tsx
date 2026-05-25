import type { ResearchDataAnalysisSnapshot } from '../types'

interface ResearchDataAnalysisPanelProps {
  analysis: ResearchDataAnalysisSnapshot
}

export default function ResearchDataAnalysisPanel({ analysis }: ResearchDataAnalysisPanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">实验数据分析</h2>
          <p className="research-panel__subtitle">保留数据上传占位、分析计划、图表占位和结果摘要。</p>
        </div>
      </div>
      <div className="research-upload-placeholder">
        <strong>数据上传占位</strong>
        <p>{analysis.uploadHint}</p>
      </div>
      <div className="research-detail-stack">
        <div>
          <span className="research-detail-label">分析计划</span>
          <ol className="research-bullet-list research-bullet-list--ordered">
            {analysis.analysisPlan.map(item => <li key={item}>{item}</li>)}
          </ol>
        </div>
        <div>
          <span className="research-detail-label">图表占位</span>
          <div className="research-chart-grid">
            {analysis.chartPlaceholders.map(item => (
              <div key={item} className="research-chart-card">{item}</div>
            ))}
          </div>
        </div>
        <div>
          <span className="research-detail-label">结果摘要</span>
          <p>{analysis.resultSummary}</p>
        </div>
      </div>
    </section>
  )
}
