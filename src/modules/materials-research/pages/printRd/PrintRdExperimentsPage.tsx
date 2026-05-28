import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { print3dApi, type ExperimentComparisonRow, type ExperimentGroup } from "../../services/print3dApi";

export function PrintRdExperimentsPage() {
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<ExperimentGroup[]>([]);
  const [comparison, setComparison] = useState<ExperimentComparisonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [batchLabel, setBatchLabel] = useState("");

  useEffect(() => {
    print3dApi.experiments(q).then((r) => {
      setGroups(r.groups);
      setComparison(r.comparisonTable || []);
      setTotal(r.total);
      setBatchLabel(r.batchLabel || "");
    }).catch(() => undefined);
  }, [q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="实验记录"
        description={`仅展示权威实验记录表（20241118 配方筛选批次，共 ${total} 条）。已排除重复上传的 202507 模板表与其它来源。`}
      />

      <SectionCard title="检索">
        <input
          className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          placeholder="实验编号、原料代号（如 PEG600DMA、S4）…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted">
          {batchLabel || "20241118 批次"} · 共 {total} 条
        </p>
      </SectionCard>

      {comparison.length > 0 && (
        <SectionCard title="批次性能对比（分析汇总）">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs text-muted">
                <tr>
                  <th className="p-2">实验编号</th>
                  <th className="p-2">拉伸强度(MPa)</th>
                  <th className="p-2">断裂伸长率(%)</th>
                  <th className="p-2">撕裂强度</th>
                  <th className="p-2">硬度</th>
                  <th className="p-2">主稀释单体</th>
                </tr>
              </thead>
              <tbody>
                {comparison
                  .filter((row) => !q || row.recordId.toLowerCase().includes(q.toLowerCase()))
                  .map((row) => (
                    <tr key={row.recordId} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">{row.recordId}</td>
                      <td className="p-2">{row.tensileStrength ?? "—"}</td>
                      <td className="p-2">{row.elongation ?? "—"}</td>
                      <td className="p-2">{row.tearStrength ?? "—"}</td>
                      <td className="p-2">{row.hardness ?? "—"}</td>
                      <td className="p-2 text-muted">{row.mainDiluent || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <div className="space-y-4">
        {groups.length === 0 ? (
          <p className="text-sm text-muted">暂无匹配实验。</p>
        ) : (
          groups.map((g) => (
            <SectionCard key={g.recordId} title={`实验 ${g.recordId}`}>
              {g.sourceFileName && (
                <p className="mb-3 text-xs text-muted">来源：{g.sourceFileName}</p>
              )}
              {g.materials.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted">配料（g）</p>
                  <table className="w-full text-sm">
                    <thead className="border-b text-xs text-muted">
                      <tr>
                        <th className="p-1 text-left">原料代号</th>
                        <th className="p-1 text-left">用量</th>
                        <th className="p-1 text-left">阶段</th>
                        <th className="p-1 text-left">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.materials.map((m, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="p-1 font-medium">{m.code}</td>
                          <td className="p-1">{m.amount}</td>
                          <td className="p-1 text-muted">{m.stage || "—"}</td>
                          <td className="p-1 text-xs text-muted">{m.remark || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {g.stages.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted">工艺步骤</p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
                    {g.stages.map((s, i) => (
                      <li key={i}>
                        <strong>{s.stage}</strong>
                        {s.process ? `：${s.process}` : ""}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {g.postProcess && g.postProcess.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted">后处理</p>
                  <ul className="text-sm text-slate-600">
                    {g.postProcess.map((p, i) => (
                      <li key={i}>
                        {p.type} — {p.param}：{p.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {g.metrics.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">产物检测</p>
                  <div className="flex flex-wrap gap-2">
                    {g.metrics.map((m, i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-sm">
                        {m.metric}: <strong>{m.value}</strong>
                        {m.unit ? ` ${m.unit}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          ))
        )}
      </div>
    </div>
  );
}
