import { useState } from 'react'
import type { ResearchSubscription } from '../types'

interface ResearchSubscriptionPanelProps {
  subscriptions: ResearchSubscription[]
  onToggleSubscription: (subscriptionId: string) => void
  onAddSubscription: (payload: {
    title: string
    type: ResearchSubscription['type']
    query: string
  }) => void
}

const subscriptionTypeLabelMap: Record<ResearchSubscription['type'], string> = {
  keyword: '关键词订阅',
  field: '学科方向订阅',
  author: '作者订阅',
  conference: '会议订阅',
  journal: '期刊订阅',
}

export default function ResearchSubscriptionPanel({
  subscriptions,
  onToggleSubscription,
  onAddSubscription,
}: ResearchSubscriptionPanelProps) {
  const [title, setTitle] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ResearchSubscription['type']>('keyword')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !query.trim()) return

    onAddSubscription({
      title: title.trim(),
      type,
      query: query.trim(),
    })

    setTitle('')
    setQuery('')
    setType('keyword')
  }

  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">科研订阅</h2>
          <p className="research-panel__subtitle">管理关键词、方向、作者与期刊订阅，本地 mock 即可完整演示。</p>
        </div>
      </div>

      <div className="research-list research-list--compact">
        {subscriptions.map(subscription => (
          <div key={subscription.id} className="research-subscription-card">
            <div>
              <div className="research-subscription-card__title-row">
                <strong>{subscription.title}</strong>
                <span className="research-badge">{subscriptionTypeLabelMap[subscription.type]}</span>
              </div>
              <p className="research-subscription-card__query">{subscription.query}</p>
              <div className="research-meta-row">
                <span>今日候选论文 {subscription.paperCount}</span>
                <span>最近更新 {new Date(subscription.lastUpdatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <button
              type="button"
              className={`research-toggle${subscription.enabled ? ' is-enabled' : ''}`}
              onClick={() => onToggleSubscription(subscription.id)}
            >
              {subscription.enabled ? '已开启' : '已暂停'}
            </button>
          </div>
        ))}
      </div>

      <form className="research-form" onSubmit={handleSubmit}>
        <div className="research-form__row">
          <input
            className="research-input"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="添加订阅名称，例如：Medical agent benchmarks"
          />
          <select
            className="research-select"
            value={type}
            onChange={event => setType(event.target.value as ResearchSubscription['type'])}
          >
            {Object.entries(subscriptionTypeLabelMap).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="research-form__row">
          <input
            className="research-input"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="输入关键词、作者或期刊检索式"
          />
          <button type="submit" className="research-button research-button--primary">添加订阅</button>
        </div>
      </form>
    </section>
  )
}
