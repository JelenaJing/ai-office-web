import type { PolymerRecommendation } from "../../services/api";
import { ConfidenceBadge } from "../common/ConfidenceBadge";
import { MoleculeViewer } from "./MoleculeViewer";

interface ExtendedRec extends PolymerRecommendation {
  targetPolymer?: string;
  formula?: string;
  smiles?: string;
  pubchemName?: string;
}

interface FormulationRecommendationCardProps {
  rec: ExtendedRec;
  expanded: boolean;
  onToggleExpand: () => void;
  onEvidence: () => void;
  onCreateEln: () => void;
}

export function FormulationRecommendationCard({
  rec,
  expanded,
  onToggleExpand,
  onEvidence,
  onCreateEln,
}: FormulationRecommendationCardProps) {
  const priorityLabel = rec.priority === "high" ? "高优先级" : rec.priority === "medium" ? "中" : "低";
  const displaySmiles = rec.smiles || "";
  const pubchemName = rec.pubchemName || rec.monomers?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 pr-28">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">目标聚合物</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{rec.targetPolymer || rec.title}</h3>
        {rec.formula && <p className="mt-1 font-mono text-sm text-slate-600">{rec.formula}</p>}
        <span className="absolute right-5 top-5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {priorityLabel}
        </span>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="min-h-[280px] border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
          {displaySmiles || pubchemName ? (
            <MoleculeViewer
              key={`${rec.id}-${displaySmiles}`}
              smiles={displaySmiles}
              compoundName={pubchemName}
              label="关键单体三维结构"
              height={260}
            />
          ) : (
            <div className="flex h-[260px] items-center justify-center rounded-xl bg-slate-50 text-sm text-muted">
              暂无结构式
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs text-muted">推荐路线</p>
            <p className="mt-1 font-medium text-slate-800">{rec.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">单体</p>
              <p className="mt-0.5">{rec.monomers?.join(" · ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">聚合方式</p>
              <p className="mt-0.5">{rec.method}</p>
            </div>
            <div>
              <p className="text-xs text-muted">温度</p>
              <p className="mt-0.5">{rec.temperatureRange}</p>
            </div>
            <div>
              <p className="text-xs text-muted">时间</p>
              <p className="mt-0.5">{rec.timeRange}</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">
            <span className="text-muted">预期：</span>
            {rec.expectedProperties?.join("；") || "—"}
          </p>
          {rec.risks?.length > 0 && (
            <p className="text-sm text-amber-800">
              <span className="font-medium">注意：</span>
              {rec.risks.join("；")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <ConfidenceBadge score={rec.confidence > 1 ? rec.confidence / 100 : rec.confidence} />
            <button type="button" onClick={onEvidence} className="text-xs text-primary hover:underline">
              证据 {rec.evidenceCount} 条
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
        {rec.experimentMatrix?.length > 0 && (
          <button type="button" onClick={onToggleExpand} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
            {expanded ? "收起实验矩阵" : "实验矩阵"}
          </button>
        )}
        <button type="button" onClick={onCreateEln} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white">
          创建实验记录
        </button>
      </div>

      {expanded && rec.experimentMatrix?.length > 0 && (
        <div className="overflow-x-auto border-t border-slate-100 p-4">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="p-2">编号</th>
                <th className="p-2">单体 A</th>
                <th className="p-2">单体 B</th>
                <th className="p-2">配比</th>
                <th className="p-2">温度</th>
                <th className="p-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {rec.experimentMatrix.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2">{e.id}</td>
                  <td className="p-2">{e.monomerA}</td>
                  <td className="p-2">{e.monomerB}</td>
                  <td className="p-2">{e.ratio}</td>
                  <td className="p-2">{e.temperature}</td>
                  <td className="p-2">{e.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
