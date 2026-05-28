import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mockApi, StudentDashboard } from "../../services/mockApi";
import { SectionCard } from "../../components/common/SectionCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { hasBatteryModules, hasPolymerModules } from "../../lib/permissions";
import { paperDoiLink } from "../../lib/paperLinks";
import { useSessionStore } from "../../store/sessionStore";

export function StudentDashboardPage() {
  const user = useSessionStore((s) => s.user);
  const [data, setData] = useState<StudentDashboard | null>(null);

  useEffect(() => {
    mockApi.studentDashboard().then(setData).catch(() => undefined);
  }, []);

  if (!data || !user) return <p className="text-muted">加载中…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-6 text-white">
        <h1 className="text-xl font-bold">{data.greeting}</h1>
        <p className="mt-2 text-sm text-white/90">方向：{data.directionLabel} · 导师：{data.advisorName}</p>
        <p className="mt-1 text-sm text-white/80">{data.projectTitle}</p>
      </div>

      <SectionCard title="今日建议">
        <ul className="list-inside list-decimal space-y-2 text-sm text-slate-700">
          {data.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">草稿</p>
          <p className="text-2xl font-bold">{data.quickStats.draftRecords}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">待审核</p>
          <p className="text-2xl font-bold">{data.quickStats.pendingReview}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">已通过</p>
          <p className="text-2xl font-bold">{data.quickStats.approvedRecords}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">今日论文推荐</p>
          <p className="text-2xl font-bold">{data.quickStats.todayPapers}</p>
        </div>
      </div>

      <SectionCard title="快捷入口">
        <div className="flex flex-wrap gap-2">
          {hasPolymerModules(user) && (
            <Link to="/research/tools/formulation" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              配方推荐
            </Link>
          )}
          {hasBatteryModules(user) && (
            <Link to="/research/tools/battery" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              电池性能预测
            </Link>
          )}
          <Link to="/research/tools/eln" className="rounded-lg border px-3 py-2 text-sm">
            实验记录
          </Link>
          <Link to="/research/database" className="rounded-lg border px-3 py-2 text-sm">
            数据库
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="最近实验记录">
        <ul className="divide-y text-sm">
          {data.recentRecords.map((r) => (
            <li key={r.id} className="flex justify-between py-3">
              <span>{r.title}</span>
              <span className="flex items-center gap-2 text-muted">
                <StatusBadge status={r.status} />
                <span>{Math.round((r.completeness ?? 0) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
        <Link to="/research/tools/eln" className="mt-3 inline-block text-sm text-primary hover:underline">
          查看全部 →
        </Link>
      </SectionCard>

      <SectionCard title="个性化论文推荐">
        <ul className="space-y-3 text-sm">
          {data.paperRecommendations.map((p) => {
            const doiHref = paperDoiLink(p.doi);
            return (
              <li key={p.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted">
                  {p.journal} · {p.year}
                </p>
                {p.doi && doiHref && (
                  <a
                    href={doiHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block truncate font-mono text-xs text-primary hover:underline"
                  >
                    https://doi.org/{p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <Link to="/research/tools/literature" className="mt-3 inline-block text-sm text-primary hover:underline">
          查看每日推荐 →
        </Link>
      </SectionCard>
    </div>
  );
}
