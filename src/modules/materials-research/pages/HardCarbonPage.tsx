import { useEffect, useState } from "react";
import { api, HardCarbonMaterial } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { ConfidenceBadge } from "../components/common/ConfidenceBadge";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { runAction } from "../hooks/usePlatformActions";

const FLOW = [
  { from: "竹子", steps: ["酸洗", "1300°C 碳化", "层间距增加"], result: "首效提升" },
  { from: "椰壳", steps: ["活化", "高比表面积"], result: "首效下降风险" },
  { from: "呋喃基聚合物", steps: ["结构可控", "碳化残留"], result: "可设计硬碳" },
];

export function HardCarbonPage() {
  const { viewHardCarbonDetail, hardCarbonExperimentPlan, showEvidenceFor } = usePlatformActions();
  const [materials, setMaterials] = useState<HardCarbonMaterial[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");

  useEffect(() => {
    runAction(() => api.battery.hardCarbon()).then((m) => m && setMaterials(m));
  }, []);

  const filtered = sourceFilter ? materials.filter((m) => m.sourceType === sourceFilter) : materials;
  const highRec = materials.filter((m) => m.recommendationLevel === "high");

  return (
    <div className="space-y-6">
      <PageHeader
        title="硬碳选材库"
        description="整合竹基、椰壳、生物质和聚合物前驱体数据，建立原料—工艺—结构—性能关系。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {highRec.map((m) => (
          <SectionCard key={m.id} title={m.name}>
            <p className="text-sm font-medium text-accent">{m.suggestedProcess}</p>
            <p className="mt-2 text-sm text-slate-700">
              <b>优势：</b>
              {m.advantages}
            </p>
            <p className="mt-1 text-sm text-warning">
              <b>风险：</b>
              {m.risks}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => showEvidenceFor("hard-carbon", m.id)} className="text-xs text-primary hover:underline">
                查看证据
              </button>
              <button type="button" onClick={() => hardCarbonExperimentPlan(m.id)} className="rounded-lg bg-primary px-3 py-1 text-xs text-white">
                生成实验方案
              </button>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="原料筛选">
        <select
          className="mb-4 rounded-lg border px-3 py-2 text-sm"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="">全部原料类型</option>
          {Array.from(new Set(materials.map((m) => m.sourceType))).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-muted">
            <tr>
              <th className="p-2">原料</th>
              <th className="p-2">碳化温度</th>
              <th className="p-2">首效%</th>
              <th className="p-2">可逆容量</th>
              <th className="p-2">循环保持</th>
              <th className="p-2">可信度</th>
              <th className="p-2">推荐</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2 font-medium">{m.name}</td>
                <td className="p-2">{m.carbonizationTemperature}°C</td>
                <td className="p-2">{m.initialCoulombicEfficiency}</td>
                <td className="p-2">{m.reversibleCapacity} mAh/g</td>
                <td className="p-2">{m.retention}%</td>
                <td className="p-2">
                  <ConfidenceBadge score={m.reliability} />
                </td>
                <td className="p-2">{m.recommendationLevel === "high" ? "高" : m.recommendationLevel === "medium" ? "中" : "低"}</td>
                <td className="p-2">
                  <button type="button" onClick={() => viewHardCarbonDetail(m.id)} className="mr-2 text-xs text-primary hover:underline">
                    详情
                  </button>
                  <button type="button" onClick={() => showEvidenceFor("hard-carbon", m.id)} className="text-xs text-accent hover:underline">
                    证据
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="原料 → 工艺 → 结构 → 性能">
        <div className="space-y-4">
          {FLOW.map((f) => (
            <div key={f.from} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-4 text-sm">
              <span className="rounded-lg bg-primary px-3 py-1 text-white">{f.from}</span>
              {f.steps.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span>→</span>
                  <span className="rounded-lg bg-accent/10 px-3 py-1 text-accent">{s}</span>
                </div>
              ))}
              <span>→</span>
              <span className="rounded-lg bg-success/10 px-3 py-1 text-success">{f.result}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
