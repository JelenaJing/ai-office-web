import { useCallback, useEffect, useState } from 'react'
import type { PaperRec } from '../../materials-research/services/mockApi'
import { fetchPaperRecommendations, formatNextRefresh } from '../../materials-research/services/literature'
import { paperDoiLink } from '../../materials-research/lib/paperLinks'

export default function ResearchLiteratureToolPage() {
  const [papers, setPapers] = useState<PaperRec[]>([])
  const [nextRefreshAt, setNextRefreshAt] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPaperRecommendations()
      setPapers(data.papers)
      setNextRefreshAt(data.nextRefreshAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setPapers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-slate-500">
        根据研究方向每日更新 · 下次刷新：{formatNextRefresh(nextRefreshAt)}
      </p>
      {loading && <p className="text-[14px] text-slate-500">正在加载…</p>}
      {error && <p className="text-[14px] text-danger">{error}</p>}

      <ul className="space-y-4">
        {papers.map(p => {
          const doiHref = paperDoiLink(p.doi)
          const doiText = p.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') ?? ''
          return (
            <li key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold leading-snug text-slate-800">{p.title}</h3>
              <p className="mt-2 text-[13px] text-slate-500">
                {p.authors && <span>{p.authors} · </span>}
                {p.journal}
                {p.year ? ` · ${p.year}` : ''}
              </p>
              {doiText && doiHref ? (
                <a
                  href={doiHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[12px] text-primary hover:underline"
                >
                  https://doi.org/{doiText}
                </a>
              ) : null}
              {p.abstract ? (
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600 line-clamp-8">{p.abstract}</p>
              ) : (
                <p className="mt-3 text-[13px] text-slate-400">暂无摘要</p>
              )}
            </li>
          )
        })}
      </ul>
      {!loading && !error && papers.length === 0 && (
        <p className="text-[14px] text-slate-500">今日暂无推荐。</p>
      )}
    </div>
  )
}
