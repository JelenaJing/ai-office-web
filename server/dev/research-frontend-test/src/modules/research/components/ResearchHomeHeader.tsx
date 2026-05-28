import type { ResearchField } from '../types'

interface ResearchHomeHeaderProps {
  field: ResearchField
  paperCount: number
  ideaCount: number
  matterCount: number
}

const difficultyLabelMap: Record<ResearchField['difficulty'], string> = {
  beginner: '适合入门',
  intermediate: '进阶方向',
  advanced: '高阶方向',
}

export default function ResearchHomeHeader({
  field,
  paperCount,
  ideaCount,
  matterCount,
}: ResearchHomeHeaderProps) {
  return (
    <section className="research-header">
      <div className="research-header__text">
        <div className="research-eyebrow">AIOS Research</div>
        <h1 className="research-header__title">AIOS Research 科研工作台</h1>
        <p className="research-header__subtitle">
          从学科选择、论文订阅到科研 Idea、实验规划和报告写作的个人科研助手。
        </p>
        <div className="research-chip-row">
          <span className="research-chip research-chip--primary">当前研究方向：{field.name}</span>
          <span className="research-chip">{difficultyLabelMap[field.difficulty]}</span>
          {field.tags.slice(0, 3).map(tag => (
            <span key={tag} className="research-chip">{tag}</span>
          ))}
        </div>
      </div>
      <div className="research-stats-grid">
        <div className="research-stat-card">
          <span className="research-stat-card__label">当前研究方向</span>
          <strong className="research-stat-card__value">{field.name}</strong>
        </div>
        <div className="research-stat-card">
          <span className="research-stat-card__label">今日更新论文</span>
          <strong className="research-stat-card__value">{paperCount}</strong>
        </div>
        <div className="research-stat-card">
          <span className="research-stat-card__label">今日生成 Idea</span>
          <strong className="research-stat-card__value">{ideaCount}</strong>
        </div>
        <div className="research-stat-card">
          <span className="research-stat-card__label">当前科研事项</span>
          <strong className="research-stat-card__value">{matterCount}</strong>
        </div>
      </div>
    </section>
  )
}
