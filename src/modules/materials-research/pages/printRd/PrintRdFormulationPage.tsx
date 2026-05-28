import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { AssistantMarkdown } from "../../components/assistant/AssistantMarkdown";
import { print3dApi, type FormulationRecommendResult } from "../../services/print3dApi";

export function PrintRdFormulationPage() {
  const [tensile, setTensile] = useState("");
  const [elongation, setElongation] = useState("");
  const [tear, setTear] = useState("");
  const [hardness, setHardness] = useState("");
  const [viscosity, setViscosity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormulationRecommendResult | null>(null);
  const [testRef, setTestRef] = useState("20241118-13");
  const [testResult, setTestResult] = useState<FormulationRecommendResult | null>(null);

  const runRecommend = async () => {
    setLoading(true);
    try {
      const r = await print3dApi.recommendFormulation({
        tensile: tensile ? Number(tensile) : undefined,
        elongation: elongation ? Number(elongation) : undefined,
        tear: tear ? Number(tear) : undefined,
        hardness: hardness ? Number(hardness) : undefined,
        viscosity: viscosity ? Number(viscosity) : undefined,
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const runRecallTest = async () => {
    setLoading(true);
    try {
      const r = await print3dApi.recallTest(testRef);
      setTestResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="配方推荐"
        description="基于本地配方库（权威实验 20241118 批次 + 配方工艺表）按性能相似度召回，数据只读、不调用高分子计算服务。"
      />

      <SectionCard title="目标性能（填写后召回）">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="text-muted">拉伸强度 (MPa)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={tensile}
              onChange={(e) => setTensile(e.target.value)}
              placeholder="如 25"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">断裂伸长率 (%)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={elongation}
              onChange={(e) => setElongation(e.target.value)}
              placeholder="如 120"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">撕裂强度 (kN/m)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={tear}
              onChange={(e) => setTear(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">邵氏硬度 (A)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={hardness}
              onChange={(e) => setHardness(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">粘度 (cP)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={viscosity}
              onChange={(e) => setViscosity(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runRecommend}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "召回中…" : "性能相似召回 Top3"}
          </button>
          {result && (
            <span className="self-center text-xs text-muted">
              配方库 {result.librarySize} 条 · 验证实验 {result.verifiedExperimentCount} 条
            </span>
          )}
        </div>
        {result?.answer && (
          <div className="mt-4 rounded-lg border bg-slate-50/80 p-4">
            <AssistantMarkdown content={result.answer} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="召回测试（以参考实验为靶）">
        <p className="mb-3 text-sm text-muted">
          以指定实验编号的实测性能为目标，检验库内相似配方排序是否与性能数据一致。
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="text-muted">参考实验编号</span>
            <input
              className="mt-1 block rounded-lg border px-3 py-2"
              value={testRef}
              onChange={(e) => setTestRef(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={runRecallTest}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            运行召回测试
          </button>
        </div>
        {testResult?.answer && (
          <div className="mt-4 rounded-lg border bg-slate-50/80 p-4">
            <AssistantMarkdown content={testResult.answer} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
