import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import {
  print3dApi,
  type FormulaBatch,
  type PerformanceRule,
  type Print3dAnalysis,
} from "../../services/print3dApi";

export function PrintRdPerformancePage() {
  const [rules, setRules] = useState<PerformanceRule[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [formulas, setFormulas] = useState<FormulaBatch[]>([]);
  const [analysis, setAnalysis] = useState<Print3dAnalysis | null>(null);

  useEffect(() => {
    print3dApi.performanceRules().then((r) => {
      setRules(r.rules);
      setSummary(r.summary);
    }).catch(() => undefined);
    print3dApi.formulas().then(setFormulas).catch(() => undefined);
    print3dApi.analysis().then(setAnalysis).catch(() => undefined);
  }, []);

  const expInsights = analysis?.experiments?.insights ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="性能关联与配方参考"
        description="基于知识库产物检测关联表、配方工艺表与历史实验数据的结构化分析与展示。"
      />

      {expInsights.length > 0 && (
        <SectionCard title="实验数据洞察（自动分析）">
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
            {expInsights.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="性能指标关联规则">
        {rules.length === 0 ? (
          <p className="text-sm text-muted">暂无关联规则。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rules.map((r) => (
              <div
                key={r.metric}
                className="rounded-lg border border-slate-100 p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-primary">{r.metric}</p>
                  {r.direction === "positive" && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">正相关</span>
                  )}
                  {r.direction === "negative" && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">负相关</span>
                  )}
                </div>
                <p className="mt-2 leading-relaxed text-slate-700">{r.correlation}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {summary.length > 0 && (
        <SectionCard title="关联要点速览">
          <ul className="space-y-1 text-sm text-slate-600">
            {summary.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title={`配方工艺批次（${formulas.length}）`}>
        {formulas.length === 0 ? (
          <p className="text-sm text-muted">暂无配方数据。</p>
        ) : (
          <div className="space-y-6">
            {formulas.map((f) => (
              <div key={f.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">批次 {f.batchIndex}</span>
                  {f.reactionDate && (
                    <span className="text-muted">反应记录：{f.reactionDate}</span>
                  )}
                  {f.totalMassG ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                      总质量约 {f.totalMassG.toFixed(1)} g
                    </span>
                  ) : null}
                </div>
                <table className="mb-3 w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs text-muted">
                    <tr>
                      <th className="p-2">序号</th>
                      <th className="p-2">原料代号</th>
                      <th className="p-2">配比</th>
                      <th className="p-2">实际克数(g)</th>
                      <th className="p-2">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.ingredients.map((ing) => (
                      <tr key={ing.seq} className="border-b">
                        <td className="p-2">{ing.seq}</td>
                        <td className="p-2 font-medium">{ing.code}</td>
                        <td className="p-2 text-muted">
                          {ing.ratio != null ? (ing.ratio * 100).toFixed(1) + "%" : "—"}
                        </td>
                        <td className="p-2">{ing.amountG}</td>
                        <td className="p-2 text-xs text-muted">{ing.remark || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {f.process.length > 0 && (
                  <div className="text-sm">
                    <p className="mb-1 text-xs font-medium text-muted">工艺参数</p>
                    <ul className="flex flex-wrap gap-2">
                      {f.process.map((p, i) => (
                        <li key={i} className="rounded border border-slate-100 px-2 py-1 text-xs">
                          {p.param}：{p.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
