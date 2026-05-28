import { useCallback, useEffect, useState } from "react";
import type { PaperRec } from "../../services/mockApi";
import { fetchPaperRecommendations, formatNextRefresh } from "../../services/literature";
import { PageHeader } from "../../components/common/PageHeader";
import { paperDoiLink } from "../../lib/paperLinks";

export function LiteratureRecommendationsPage() {
  const [papers, setPapers] = useState<PaperRec[]>([]);
  const [nextRefreshAt, setNextRefreshAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaperRecommendations();
      setPapers(data.papers);
      setNextRefreshAt(data.nextRefreshAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="每日论文推荐"
        description={`根据您的研究方向每日更新，下次刷新：${formatNextRefresh(nextRefreshAt)}`}
      />
      {loading && <p className="text-sm text-muted">正在加载今日推荐…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-4">
        {papers.map((p) => {
          const doiHref = paperDoiLink(p.doi);
          const doiText = p.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") ?? "";
          const pub = p.publishedAt;
          return (
            <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-medium leading-snug text-slate-800">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {p.authors && <span>{p.authors} · </span>}
                {p.journal}
                {p.year ? ` · ${p.year}` : ""}
                {pub ? ` · ${pub}` : ""}
              </p>
              {doiText && doiHref ? (
                <p className="mt-2 font-mono text-xs">
                  <a href={doiHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    https://doi.org/{doiText}
                  </a>
                </p>
              ) : null}
              {p.abstract ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-6">{p.abstract}</p>
              ) : (
                <p className="mt-3 text-sm text-muted">暂无摘要</p>
              )}
            </li>
          );
        })}
      </ul>
      {!loading && !error && papers.length === 0 && (
        <p className="text-sm text-muted">今日暂无推荐，请明日再查看。</p>
      )}
    </div>
  );
}
