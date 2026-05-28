import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { markdownToHtml } from '../../../utils/markdownToHtml'
import {
  fetchSciencerelayArticleDetail,
  fetchSciencerelayArticles,
  markdownForEdition,
  pickCoverCaption,
  pickCoverUrl,
  pickListSummary,
  pickListTitle,
  pickTopicLabel,
  type SciencerelayDetailPayload,
  type SciencerelayListItem,
} from '../../feed/services/sciencerelayApi'
import './science-relay-recommend.css'

const PICK_COUNT = 4
const EDITION = 'university' as const
const LANG = 'zh'

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickRandomArticles(items: SciencerelayListItem[]): SciencerelayListItem[] {
  const zhUniversity = items.filter(item => {
    const title = pickListTitle(item)
    const summary = pickListSummary(item)
    return hasChinese(title) || hasChinese(summary)
  })
  const pool = zhUniversity.length >= PICK_COUNT ? zhUniversity : items
  return shuffle(pool).slice(0, PICK_COUNT)
}

function stripDuplicateLeadingTitle(html: string, title: string): string {
  if (!html || !title.trim()) return html
  const normalizedTitle = title.trim().replace(/\s+/g, ' ')
  if (typeof DOMParser === 'undefined') {
    const escaped = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return html.replace(new RegExp(`<h1[^>]*>\\s*${escaped}\\s*</h1>`, 'i'), '')
  }
  const doc = new DOMParser().parseFromString(`<div data-sr-title-root>${html}</div>`, 'text/html')
  const root = doc.querySelector('[data-sr-title-root]')
  if (!root) return html
  const firstH1 = root.querySelector('h1')
  if (firstH1) {
    const h1Text = (firstH1.textContent ?? '').trim().replace(/\s+/g, ' ')
    if (h1Text === normalizedTitle || h1Text.startsWith(normalizedTitle) || normalizedTitle.startsWith(h1Text)) {
      firstH1.remove()
    }
  }
  return root.innerHTML
}

function stripCommentaryBodyImages(html: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
      .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, '')
      .replace(/<img\b[^>]*\/?>/gi, '')
  }
  const doc = new DOMParser().parseFromString(`<div data-sr-strip-root>${html}</div>`, 'text/html')
  const root = doc.querySelector('[data-sr-strip-root]')
  if (!root) return html
  root.querySelectorAll('img, picture, figure').forEach(el => el.remove())
  return root.innerHTML
}

function detailTitle(meta: SciencerelayListItem | undefined, fallbackId: string): string {
  if (!meta) return fallbackId
  return pickListTitle(meta)
}

function detailSummary(commentary: SciencerelayDetailPayload['commentary']): string {
  return String(commentary?.oneLineSummary || '').trim()
}

function subjectsZhLine(meta: SciencerelayListItem | undefined): string {
  const zh = meta?.subjectsI18n?.zh
  if (Array.isArray(zh) && zh.length) return zh.join(' · ')
  const sub = meta?.subjects
  if (Array.isArray(sub) && sub.length) return sub.join(' · ')
  return ''
}

export default function ScienceRelayRecommendPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<SciencerelayListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailPayload, setDetailPayload] = useState<SciencerelayDetailPayload | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSciencerelayArticles({
        lang: LANG,
        edition: EDITION,
        offset: 0,
        limit: 80,
      })
      const items = Array.isArray(data.items) ? data.items : []
      setArticles(pickRandomArticles(items))
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法加载 Science Relay 文章')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (!selectedId) {
      setDetailPayload(null)
      setDetailError(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    void (async () => {
      try {
        const res = await fetchSciencerelayArticleDetail(selectedId, { lang: LANG, edition: EDITION })
        if (cancelled) return
        if (!res?.ok || !res.item) throw new Error('详情数据异常')
        setDetailPayload(res.item)
      } catch (e) {
        if (!cancelled) {
          setDetailPayload(null)
          setDetailError(e instanceof Error ? e.message : '加载详情失败')
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const meta = detailPayload?.meta as SciencerelayListItem | undefined
  const commentary = detailPayload?.commentary
  const pageTitle = meta ? detailTitle(meta, selectedId ?? '') : ''

  const mdHtml = useMemo(() => {
    const mdRaw = markdownForEdition(commentary, EDITION)
    if (!mdRaw) return ''
    try {
      const html = stripCommentaryBodyImages(markdownToHtml(mdRaw))
      return pageTitle ? stripDuplicateLeadingTitle(html, pageTitle) : html
    } catch {
      return ''
    }
  }, [commentary, pageTitle, selectedId])

  const closeDetail = () => {
    setSelectedId(null)
    setDetailPayload(null)
    setDetailError(null)
  }

  if (selectedId) {
    const heroUrl = meta ? pickCoverUrl(meta) : null
    const heroCaption = meta ? pickCoverCaption(meta) : ''
    const topicLabel = meta ? pickTopicLabel(meta) : ''

    return (
      <div className="sr-recommend sr-recommend--detail flex min-h-0 flex-1 flex-col">
        <header className="sr-recommend__header sr-recommend__header--detail">
          <button type="button" className="sr-recommend__back" onClick={closeDetail}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            返回推荐
          </button>
        </header>

        <div className="sr-recommend__detail-scroll os-scroll">
          <div className="sr-recommend__detail-inner">
          {detailLoading && <p className="sr-recommend__status">正在加载详情…</p>}
          {detailError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-lg text-red-800">{detailError}</div>
          )}
          {!detailLoading && !detailError && detailPayload && (
            <article className="sr-recommend__detail">
              <div className="sr-recommend__detail-hero-wrap">
                {heroUrl ? (
                  <img
                    src={heroUrl}
                    alt={heroCaption || detailTitle(meta, selectedId)}
                    className="sr-recommend__detail-hero"
                  />
                ) : (
                  <div className="sr-recommend__cover sr-recommend__cover--placeholder sr-recommend__detail-hero">
                    <span>{topicLabel || '推荐'}</span>
                  </div>
                )}
                {heroCaption ? <p className="sr-recommend__detail-caption">{heroCaption}</p> : null}
              </div>
              <p className="sr-recommend__detail-meta">
                {String(meta?.publishedDate || '').trim()}
                {topicLabel ? ` · ${topicLabel}` : ''}
                {' · 大学版'}
              </p>
              {detailSummary(commentary) ? (
                <p className="sr-recommend__detail-lead">{detailSummary(commentary)}</p>
              ) : null}
              {subjectsZhLine(meta) ? (
                <p className="sr-recommend__detail-subjects">{subjectsZhLine(meta)}</p>
              ) : null}
              {mdHtml ? (
                <div className="sr-recommend__markdown" dangerouslySetInnerHTML={{ __html: mdHtml }} />
              ) : (
                <p className="sr-recommend__status">该篇暂无大学版正文。</p>
              )}
            </article>
          )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sr-recommend flex min-h-0 flex-1 flex-col">
      <header className="sr-recommend__header sr-recommend__header--list">
        <h1 className="sr-recommend__page-title">推荐</h1>
        <button
          type="button"
          className="sr-recommend__refresh"
          onClick={() => void loadList()}
          disabled={loading}
          aria-label="刷新推荐"
          title="刷新"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'sr-recommend__refresh-spin' : ''}`} />
        </button>
      </header>

      {loading && <p className="sr-recommend__status">正在加载文章…</p>}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-lg text-red-800">
          {error}
          <p className="mt-2 text-base text-red-600">请确认 Science Relay API 可访问（见 VITE_SCIENCERELAY_API_BASE）。</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <>
          <div className="sr-recommend__grid">
            {articles.map(item => {
              const cover = pickCoverUrl(item)
              const title = pickListTitle(item)
              const body = pickListSummary(item) || '暂无摘要'
              const topic = pickTopicLabel(item)
              return (
                <article
                  key={item.id}
                  className="sr-recommend__card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(item.id)
                    }
                  }}
                >
                  <div className="sr-recommend__cover-wrap">
                    {cover ? (
                      <img src={cover} alt="" className="sr-recommend__cover" loading="lazy" />
                    ) : (
                      <div className="sr-recommend__cover sr-recommend__cover--placeholder">
                        <span>{topic}</span>
                      </div>
                    )}
                  </div>
                  <div className="sr-recommend__body">
                    <span className="sr-recommend__tag">{topic}</span>
                    <h2 className="sr-recommend__title">{title}</h2>
                    <p className="sr-recommend__excerpt">{body}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
