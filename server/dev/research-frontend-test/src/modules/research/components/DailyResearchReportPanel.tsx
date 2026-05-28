import type { DailyResearchReport, ResearchPaperRef } from '../types'

interface DailyResearchReportPanelProps {
  report: DailyResearchReport
  newPapers: ResearchPaperRef[]
  relatedPapers: ResearchPaperRef[]
}

export default function DailyResearchReportPanel({
  report,
  newPapers,
  relatedPapers,
}: DailyResearchReportPanelProps) {
  return (
    <section className="research-panel research-panel--gradient">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">当日最新科研思路分析报告</h2>
          <p className="research-panel__subtitle">{report.summary}</p>
        </div>
        <span className="research-badge research-badge--soft">{report.date}</span>
      </div>

      <div className="research-report-grid">
        <div className="research-report-card">
          <div className="research-subsection__title">今日新增论文</div>
          <div className="research-list research-list--compact">
            {newPapers.map(paper => (
              <div key={paper.id} className="research-paper-row">
                <strong>{paper.title}</strong>
                <div className="research-meta-row">
                  <span>{paper.venue} {paper.year}</span>
                  <span>相关度 {paper.relevanceScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="research-report-card">
          <div className="research-subsection__title">值得关注趋势</div>
          <ul className="research-bullet-list">
            {report.highlightedTrends.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="research-report-card">
          <div className="research-subsection__title">与个人知识库相关的论文</div>
          <div className="research-list research-list--compact">
            {relatedPapers.map(paper => (
              <div key={paper.id} className="research-paper-row">
                <strong>{paper.title}</strong>
                <p>{paper.abstract}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="research-report-card">
          <div className="research-subsection__title">研究空白</div>
          <ul className="research-bullet-list">
            {report.researchGaps.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="research-subsection">
        <div className="research-subsection__title">推荐下一步</div>
        <div className="research-chip-row">
          {report.recommendedNextSteps.map(item => (
            <span key={item} className="research-chip research-chip--primary">{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
