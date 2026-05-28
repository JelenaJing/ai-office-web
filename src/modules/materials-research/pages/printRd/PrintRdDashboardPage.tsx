import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { print3dApi, type Print3dDashboard } from "../../services/print3dApi";
import { SectionCard } from "../../components/common/SectionCard";

export function PrintRdDashboardPage() {
  const [data, setData] = useState<Print3dDashboard | null>(null);

  useEffect(() => {
    print3dApi.dashboard().then(setData).catch(() => undefined);
  }, []);

  if (!data) return <p className="text-muted">加载中…</p>;

  const stats = data.stats || data.quickStats || {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-primary to-cyan-700 p-6 text-white">
        <h1 className="text-xl font-bold">{data.greeting}</h1>
        <p className="mt-2 text-sm text-white/90">{data.roleLabel} · {data.projectTitle}</p>
        <p className="mt-2 text-xs text-white/75">
          知识库：{stats.totalDocuments ?? stats.knowledgeDocs ?? 0} 份资料（文献 {stats.literature ?? 0} · 实验表{" "}
          {stats.experimentSheets ?? 0} · 原料目录 {stats.materialCatalogs ?? 0}）
        </p>
      </div>

      {(data.analysisInsights?.length ?? 0) > 0 && (
        <SectionCard title="数据洞察（知识库分析）">
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
            {data.analysisInsights!.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          {data.bestTensileRecordId && (
            <p className="mt-2 text-xs text-muted">
              当前最高拉伸强度批次：<strong>{data.bestTensileRecordId}</strong>
            </p>
          )}
        </SectionCard>
      )}

      <SectionCard title="今日研发建议">
        <ul className="list-inside list-decimal space-y-2 text-sm text-slate-700">
          {(data.suggestions || []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">知识库资料</p>
          <p className="text-2xl font-bold">{stats.totalDocuments ?? stats.knowledgeDocs ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">学术文献</p>
          <p className="text-2xl font-bold">{stats.literature ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">有效实验记录</p>
          <p className="text-2xl font-bold">{stats.experimentRecords ?? stats.experimentSheets ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-muted">原料编码</p>
          <p className="text-2xl font-bold">{stats.materials ?? stats.materialCodes ?? 0}</p>
        </div>
      </div>

      <SectionCard title="快捷入口">
        <div className="flex flex-wrap gap-2">
          <Link to="/research/print-rd/knowledge" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            知识库检索
          </Link>
          <Link to="/research/print-rd/materials" className="rounded-lg border px-3 py-2 text-sm">
            原料库
          </Link>
          <Link to="/research/print-rd/experiments" className="rounded-lg border px-3 py-2 text-sm">
            实验记录
          </Link>
          <Link to="/research/print-rd/formulation" className="rounded-lg border px-3 py-2 text-sm">
            配方推荐
          </Link>
          <Link to="/research/print-rd/performance" className="rounded-lg border px-3 py-2 text-sm">
            性能关联指南
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="资料分类">
          <ul className="space-y-2 text-sm">
            {(data.categoryBreakdown || []).map((c) => (
              <li key={c.category} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span>{c.label}</span>
                <span className="font-medium text-primary">{c.count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="近期文献">
          <ul className="space-y-2 text-sm">
            {(data.recentLiterature || []).map((d) => (
              <li key={d.id} className="rounded-lg border border-slate-100 p-2">
                <p className="line-clamp-2 font-medium">{d.title}</p>
                <p className="text-xs text-muted">{d.fileName}</p>
              </li>
            ))}
          </ul>
          <Link to="/research/print-rd/knowledge?category=literature" className="mt-3 inline-block text-sm text-primary hover:underline">
            浏览全部文献 →
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}
