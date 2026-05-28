import { useState } from 'react'
import clsx from 'clsx'
import { SectionCard } from '../../materials-research/components/common/SectionCard'
import { ResearchButton } from './ResearchUi'
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
  keyword: '关键词',
  field: '学科方向',
  author: '作者',
  conference: '会议',
  journal: '期刊',
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

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
    onAddSubscription({ title: title.trim(), type, query: query.trim() })
    setTitle('')
    setQuery('')
    setType('keyword')
  }

  return (
    <SectionCard title="科研订阅" subtitle="用于 Feed 排序时的订阅词加权。">
      <div className="space-y-2">
        {subscriptions.map(subscription => (
          <div
            key={subscription.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-slate-800">{subscription.title}</strong>
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-muted">
                  {subscriptionTypeLabelMap[subscription.type]}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted">{subscription.query}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleSubscription(subscription.id)}
              className={clsx(
                'shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium',
                subscription.enabled
                  ? 'bg-success/10 text-success'
                  : 'bg-slate-200 text-slate-600',
              )}
            >
              {subscription.enabled ? '已开启' : '已暂停'}
            </button>
          </div>
        ))}
      </div>

      <form className="mt-4 space-y-3 border-t border-slate-100 pt-4" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-700">
          标题
          <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          订阅词
          <input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          类型
          <select
            className={inputClass}
            value={type}
            onChange={e => setType(e.target.value as ResearchSubscription['type'])}
          >
            {Object.entries(subscriptionTypeLabelMap).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <ResearchButton type="submit" className="w-full">
          添加订阅
        </ResearchButton>
      </form>
    </SectionCard>
  )
}
