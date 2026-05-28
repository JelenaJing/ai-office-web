import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FlaskConical, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { MetricCard } from "../../components/common/MetricCard";
import { api, TeacherRecommendationInsights } from "../../services/api";
import { directionLabel } from "../../lib/auth";

const priorityClass: Record<string, string> = {
  high: "bg-red-50 text-red-800",
  medium: "bg-amber-50 text-amber-900",
  low: "bg-slate-50 text-slate-600",
};

export function TeacherRecommendationCenterPage() {
  const [data, setData] = useState<TeacherRecommendationInsights | null>(null);

  useEffect(() => {
    api.teacher.recommendationInsights().then(setData).catch(() => undefined);
  }, []);

  if (!data) return <p className="text-muted">加载中…</p>;

  const s = data.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="推荐与分析中心"
        description="基于课题组实验记录、文献池与材料库生成的整体洞察，辅助导师把握研究方向与学生产出。"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="在组学生" value={String(s.studentCount)} change={`${s.totalRecords} 条实验记录`} />
        <MetricCard label="待审核" value={String(s.pendingReviews)} change="实验记录" />
        <MetricCard label="平均完整度" value={`${s.avgCompleteness}%`} change="课题组 ELN 均值" />
        <MetricCard label="高优先级事项" value={String(s.highPriorityActions)} change="文献入库 / 数据复核" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="文献方向趋势">
          <ul className="space-y-4">
            {data.literatureTrends.map((t) => (
              <li key={t.direction} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 font-medium text-slate-800">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {t.label}
                  </span>
                  <span className="text-xs text-muted">{t.paperCount} 篇在池</span>
                </div>
                {t.topKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.topKeywords.map((kw) => (
                      <span key={kw} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-600">{t.insight}</p>
              </li>
            ))}
          </ul>
          <Link to="/research/teacher/databases/papers" className="mt-3 inline-block text-sm text-primary hover:underline">
            查看论文库 →
          </Link>
        </SectionCard>
        <SectionCard title="学生文献入库建议">
          <ul className="space-y-2 text-sm">
            {data.paperIngestSuggestions.map((p, i) => (
              <li
                key={p.studentId || `s-${i}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <div>
                  <span className="font-medium">{p.studentName}</span>
                  {p.studentId && (
                    <span className="ml-1 text-xs text-muted">· {directionLabel(p.direction)}</span>
                  )}
                  <p className="mt-0.5 text-xs text-slate-600">{p.reason}</p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${priorityClass[p.priority] || priorityClass.low}`}>
                  {p.priority === "high" ? "优先" : p.priority === "medium" ? "建议" : "关注"}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <SectionCard title="实验记录缺字段统计">
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 text-sm">
            {data.elnFieldGaps.map((g) => (
              <li key={g.field} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">{g.field}</span>
                {g.count > 0 && <span className="ml-2 text-xs text-muted">缺失 {g.count} 次</span>}
                <p className="mt-1 text-xs text-slate-600">{g.suggestion}</p>
              </li>
            ))}
          </ul>
          {data.lowCompletenessRecords.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted">完整度偏低记录</p>
              <ul className="space-y-1 text-xs">
                {data.lowCompletenessRecords.map((r) => (
                  <li key={r.recordId} className="rounded border border-amber-100 bg-amber-50/50 px-2 py-1.5">
                    {r.title} · {r.owner} · {r.completeness}%
                  </li>
                ))}
              </ul>
              <Link to="/research/teacher/databases/experiments" className="mt-2 inline-block text-sm text-primary hover:underline">
                实验记录库 →
              </Link>
            </div>
          )}
        </div>
      </SectionCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="聚合物路线推荐">
          <ul className="space-y-3 text-sm">
            {data.polymerRoutes.map((r) => (
              <li key={r.title} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {r.title}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${priorityClass[r.priority]}`}>
                    {r.priority === "high" ? "高优" : "中优"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{r.evidence}</p>
                <Link to={r.link} className="mt-2 inline-block text-xs text-primary hover:underline">
                  查看相关数据 →
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="硬碳实验路线推荐">
          <ul className="space-y-3 text-sm">
            {data.hardcarbonRoutes.map((r) => (
              <li key={r.title} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium">
                    <FlaskConical className="h-3.5 w-3.5 text-accent" />
                    {r.title}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${priorityClass[r.priority]}`}>
                    {r.priority === "high" ? "高优" : "中优"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{r.evidence}</p>
                <Link to={r.link} className="mt-2 inline-block text-xs text-primary hover:underline">
                  查看相关数据 →
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <SectionCard title="训练集数据质量提醒">
        <p className="mb-3 flex items-center gap-1 text-xs text-muted">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          以下记录因完整度不足或状态未审核，不建议直接纳入模型训练集。
        </p>
        <ul className="space-y-2 text-sm">
          {data.trainingDataWarnings.map((w, i) => (
            <li key={`${w.recordId}-${i}`} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
              <span className="font-medium">{w.title || "未命名记录"}</span>
              {w.owner && <span className="text-muted"> · {w.owner}</span>}
              <p className="mt-0.5 text-xs">{w.reason}</p>
            </li>
          ))}
        </ul>
        <Link to="/research/teacher/eln-review" className="mt-4 inline-block text-sm text-primary hover:underline">
          进入实验审核 →
        </Link>
      </SectionCard>
    </div>
  );
}
