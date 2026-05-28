import { useEffect, useMemo, useState } from 'react'
import {
  appendServedArticleIds,
  explainScienceRelayReco,
  invalidateScienceRelayCache,
  listScienceRelayArticles,
  listScienceRelayTopics,
  loadServedArticleIds,
  rankScienceRelayArticles,
  type ArticleCandidate,
  type ExplainItem,
  type RankedArticle,
  type ScienceRelayTopicCount,
} from '../../../api/sciencerelayApi'
import type { ResearchSubscription } from '../types'

interface ScienceRelayJournalRecoPanelProps {
  subscriptions: ResearchSubscription[]
  selectedTopic: string
  onSelectedTopicChange: (value: string) => void
}

const BREAKDOWN_LABELS: Record<string, string> = {
  topicMatch: '学科匹配',
  subjectOverlap: '订阅/标签重叠',
  freshness: '时效',
  qualitySignals: '元数据完整度',
  subscriptionBoost: '订阅加成',
  servedPenalty: '已看过降权',
  total: '推荐分合计',
}

function fmtDate(date?: string): string {
  if (!date) return ''
  const d = new Date(date)
  if (!Number.isFinite(d.getTime())) return date
  return d.toISOString().slice(0, 10)
}

export default function ScienceRelayJournalRecoPanel({
  subscriptions,
  selectedTopic,
  onSelectedTopicChange,
}: ScienceRelayJournalRecoPanelProps) {
  const [topics, setTopics] = useState<ScienceRelayTopicCount[]>([])
  const [latest, setLatest] = useState<ArticleCandidate[]>([])
  const [ranked, setRanked] = useState<RankedArticle[] | null>(null)
  const [explainsById, setExplainsById] = useState<Record<string, ExplainItem>>({})
  const [loadingLatest, setLoadingLatest] = useState(false)
  const [ranking, setRanking] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enableLlmExplain, setEnableLlmExplain] = useState(() => {
    const raw = localStorage.getItem('aios_sr_enable_llm_explain')
    return raw === null ? true : raw === '1'
  })
  const [enableReco, setEnableReco] = useState(() => {
    const raw = localStorage.getItem('aios_sr_enable_reco')
    return raw === null ? true : raw === '1'
  })
  const [dedupeMode, setDedupeMode] = useState<'none' | 'id' | 'doi'>(() => {
    const raw = localStorage.getItem('aios_sr_dedupe_mode')
    return raw === 'id' || raw === 'doi' ? raw : 'none'
  })
  const [servedPenaltyStrength, setServedPenaltyStrength] = useState(() => {
    const raw = Number(localStorage.getItem('aios_sr_served_penalty_strength') ?? '0.08')
    return Number.isFinite(raw) ? Math.max(0, Math.min(0.2, raw)) : 0.08
  })

  const subQueries = useMemo(
    () => subscriptions.filter((s) => s.enabled).map((s) => s.query),
    [subscriptions],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const t = await listScienceRelayTopics()
        if (!cancelled) setTopics(t)
      } catch (e) {
        if (!cancelled) setTopics([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('aios_sr_enable_reco', enableReco ? '1' : '0')
  }, [enableReco])

  useEffect(() => {
    localStorage.setItem('aios_sr_enable_llm_explain', enableLlmExplain ? '1' : '0')
  }, [enableLlmExplain])

  useEffect(() => {
    localStorage.setItem('aios_sr_dedupe_mode', dedupeMode)
  }, [dedupeMode])

  useEffect(() => {
    localStorage.setItem('aios_sr_served_penalty_strength', String(servedPenaltyStrength))
  }, [servedPenaltyStrength])

  const refreshLatest = async () => {
    setLoadingLatest(true)
    setError(null)
    setRanked(null)
    setExplainsById({})
    try {
      await invalidateScienceRelayCache()
      const rows = await listScienceRelayArticles({
        topic: selectedTopic || 'all',
        limit: 80,
        includeDetails: true,
      })
      setLatest(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingLatest(false)
    }
  }

  useEffect(() => {
    void refreshLatest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic])

  const applyReco = async () => {
    if (latest.length === 0) return
    setRanking(true)
    setExplaining(false)
    setError(null)
    setExplainsById({})
    try {
      const out = await rankScienceRelayArticles({
        topic: selectedTopic,
        candidates: latest,
        subscriptionQueries: subQueries,
        servedArticleIds: loadServedArticleIds(),
        topK: 12,
        dedupeMode,
        servedPenaltyStrength,
      })
      setRanked(out)

      if (enableLlmExplain) {
        setExplaining(true)
        const explainItems = await explainScienceRelayReco({
          topic: selectedTopic,
          articles: out.slice(0, 8),
        })
        const map: Record<string, ExplainItem> = {}
        for (const item of explainItems) map[item.id] = item
        setExplainsById(map)
      }
      appendServedArticleIds(out.slice(0, 8).map((a) => a.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRanking(false)
      setExplaining(false)
    }
  }

  const list = ranked ?? latest
  const status =
    ranked !== null ? '已应用推荐（rule-based-v1 + LLM 理由）' : '默认最新推送（未推荐）'

  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">Science Relay · 期刊文章推荐（测试版）</h2>
          <p className="research-panel__subtitle">
            AI for Science 测试版 · 数据源为远端 Science Relay 期刊 JSON（只读）；与远端 sciencerelay 静态主页无关
          </p>
        </div>
      </div>

      <div className="research-flow-step research-flow-step--generate">
        <div className="research-flow-step__head">
          <span className="research-flow-step__badge">学科</span>
          <h3 className="research-flow-step__title">选择要看的学科</h3>
        </div>
        <div className="research-plot-controls">
          <label>
            学科 topic
            <select
              value={selectedTopic}
              onChange={(e) => onSelectedTopicChange(e.target.value)}
              className="topic-filter-select"
            >
              <option value="all">全部学科</option>
              {topics.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.topic}（{t.count}）
                </option>
              ))}
            </select>
          </label>
          <div className="research-plot-actions">
            <button
              type="button"
              className="research-button"
              disabled={loadingLatest}
              onClick={() => void refreshLatest()}
              title="重新拉取列表（远端有更新时建议先点）"
            >
              {loadingLatest ? '加载中…' : '刷新最新'}
            </button>
            <button
              type="button"
              className="research-button research-button--x"
              disabled={!enableReco || ranking || latest.length === 0}
              onClick={() => void applyReco()}
              title={enableReco ? undefined : '已关闭 X 风格推荐，仅展示最新列表'}
            >
              {ranking ? '推荐中…' : '应用推荐'}
            </button>
          </div>
          <div className="research-inline-blocks">
            <div className="research-inline-block">
              <span className="research-detail-label">推荐开关</span>
              <label className="research-inline-check">
                <input
                  type="checkbox"
                  checked={enableReco}
                  onChange={(e) => setEnableReco(e.target.checked)}
                />
                启用 X 风格推荐
              </label>
              <label className="research-inline-check">
                <input
                  type="checkbox"
                  checked={enableLlmExplain}
                  disabled={!enableReco}
                  onChange={(e) => setEnableLlmExplain(e.target.checked)}
                />
                生成 LLM 推荐理由
              </label>
              <label className="research-inline-check">
                去重模式
                <select value={dedupeMode} onChange={(e) => setDedupeMode(e.target.value as any)} className="topic-filter-select">
                  <option value="none">不去重</option>
                  <option value="id">按 id 去重</option>
                  <option value="doi">按 DOI 去重</option>
                </select>
              </label>
            </div>
            <div className="research-inline-block">
              <span className="research-detail-label">已看过降权强度（温和）</span>
              <div className="research-chip-row">
                <span className="research-chip">{servedPenaltyStrength.toFixed(2)}</span>
                <span className="research-chip research-chip--warning">建议 0.05–0.12</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={servedPenaltyStrength}
                onChange={(e) => setServedPenaltyStrength(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="research-plot-hint">
            状态：<strong>{status}</strong>
            {explaining ? '（生成推荐理由中…）' : ''}
          </p>
          {error && <p className="research-error">{error}</p>}
        </div>
      </div>

      <div className="research-list">
        {list.length === 0 && <p className="research-panel__subtitle">暂无文章</p>}
        {list.map((a) => {
          const ex = explainsById[a.id]
          const rankedArticle = 'rankBreakdown' in a ? (a as RankedArticle) : null
          const score = rankedArticle?.rankScore
          const rankBreakdown = rankedArticle?.rankBreakdown
          return (
            <article key={a.id} className="research-idea-card">
              <div className="research-idea-card__header">
                <div>
                  <div className="research-idea-card__field">{a.topic}</div>
                  <h3 className="research-idea-card__title">{a.title}</h3>
                </div>
                <span className={`research-rank-badge${score === undefined ? ' research-rank-badge--pending' : ''}`}>
                  {score === undefined ? '未推荐' : `推荐分 ${score.toFixed(2)}`}
                </span>
              </div>
              <div className="research-meta-row">
                <span>{fmtDate(a.publishedDate)}</span>
                <span>{(a.subjects ?? []).slice(0, 3).join(' · ') || '—'}</span>
              </div>
              {rankBreakdown && (
                <details className="research-rank-breakdown">
                  <summary>X 推荐得分拆解</summary>
                  <ul>
                    {Object.entries(rankBreakdown).map(([key, val]) => (
                      <li key={key}>
                        <span>{BREAKDOWN_LABELS[key] ?? key}</span>
                        <strong>{typeof val === 'number' ? val.toFixed(3) : String(val)}</strong>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="research-idea-body">
                {a.oneLineSummary && (
                  <div className="research-idea-detail">
                    <span className="research-detail-label">摘要</span>
                    <p>{a.oneLineSummary}</p>
                  </div>
                )}
                {ex && (
                  <div className="research-idea-grid__row-2">
                    <div className="research-idea-detail">
                      <span className="research-detail-label">推荐理由（LLM）</span>
                      <p>{ex.whyRecommended}</p>
                    </div>
                    <div className="research-idea-detail">
                      <span className="research-detail-label">下一步怎么读（LLM）</span>
                      <p>{ex.nextRead}</p>
                    </div>
                  </div>
                )}
                {a.citation && (
                  <div className="research-idea-detail">
                    <span className="research-detail-label">引用</span>
                    <p>{a.citation}</p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

