import { useEffect, useState } from 'react'
import { mockApi, type PaperRec, type StudentDashboard } from '../../materials-research/services/mockApi'
import { fetchPaperRecommendations, formatNextRefresh } from '../../materials-research/services/literature'
import { paperDoiLink } from '../../materials-research/lib/paperLinks'
import { NotificationStrip } from '../components/ResearchUi'
import { ModuleActionButton } from '../components/home/ModuleActionButton'
import DatabaseHomeModule from '../components/home/DatabaseHomeModule'
import IdeasHomeModule from '../components/home/IdeasHomeModule'
import FormulationHomeModule from '../components/home/FormulationHomeModule'
import ElnHomeModule from '../components/home/ElnHomeModule'
import PlotHomeModule from '../components/home/PlotHomeModule'

const FALLBACK_PAPERS: PaperRec[] = [
  {
    id: 'demo-1',
    title: 'Interface engineering for stable perovskite solar cells',
    authors: 'Zhang et al.',
    journal: 'Nature Energy',
    year: 2024,
    abstract: '界面钝化与缺陷调控可显著提升器件稳定性，本文综述近期策略与量化指标。',
  },
  {
    id: 'demo-2',
    title: 'High-Tg furan-based polyesters from bio-derived monomers',
    authors: 'Li et al.',
    journal: 'Macromolecules',
    year: 2025,
    abstract: '呋喃基聚酯在保持高 Tg 的同时可通过共聚二醇调节韧性，适合软包电极粘结体系探索。',
  },
]

export default function ResearchStudentHomePage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null)
  const [papers, setPapers] = useState<PaperRec[]>([])
  const [nextRefresh, setNextRefresh] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [dash, lit] = await Promise.all([
          mockApi.studentDashboard().catch(() => null),
          fetchPaperRecommendations().catch(() => ({ papers: [] as PaperRec[] })),
        ])
        if (cancelled) return
        setDashboard(dash)
        const paperList =
          lit.papers.length > 0 ? lit.papers : (dash?.paperRecommendations ?? FALLBACK_PAPERS)
        setPapers(paperList.length > 0 ? paperList : FALLBACK_PAPERS)
        setNextRefresh('nextRefreshAt' in lit ? lit.nextRefreshAt : undefined)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pending = dashboard?.quickStats?.pendingReview ?? 0
  const approved = dashboard?.quickStats?.approvedRecords ?? 0

  return (
    <div className="research-home w-full space-y-4 pb-8">
      <div className="flex justify-end">
        <NotificationStrip
          pendingReview={pending}
          approved={approved}
          onPendingClick="/research/tools/eln"
          onApprovedClick="/research/tools/eln"
        />
      </div>

      <section className="research-module-card rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="research-module-title">每日论文推荐</h2>
            <p className="research-module-hint">按研究方向每日推送，辅助选题与综述</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] text-slate-500">
              {loading ? '加载中…' : `05:00 更新 · 下次 ${formatNextRefresh(nextRefresh)}`}
            </span>
            <ModuleActionButton to="/research/tools/literature" label="更多" />
          </div>
        </header>
        <ul className="grid gap-4 p-6 lg:grid-cols-2">
          {papers.slice(0, 6).map(p => {
            const doiHref = paperDoiLink(p.doi)
            return (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
              >
                <p className="text-[17px] font-semibold leading-snug text-slate-900">{p.title}</p>
                <p className="mt-1.5 text-[15px] text-slate-500">
                  {p.authors ? `${p.authors} · ` : ''}
                  {p.journal}
                  {p.year ? ` · ${p.year}` : ''}
                </p>
                {p.abstract ? (
                  <p className="mt-2.5 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{p.abstract}</p>
                ) : null}
                {doiHref ? (
                  <a
                    href={doiHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="research-external-link"
                  >
                    打开 DOI
                  </a>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <DatabaseHomeModule />

      <div className="grid gap-4 xl:grid-cols-2">
        <IdeasHomeModule />
        <FormulationHomeModule />
        <ElnHomeModule />
        <PlotHomeModule />
      </div>
    </div>
  )
}
