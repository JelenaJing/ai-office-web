import { useState } from "react";
import { calcBatteryPredict } from "../../services/calcApi";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { useUiStore } from "../../store/uiStore";

export function BatteryPerformancePage() {
  const showToast = useUiStore((s) => s.showToast);
  const [temp, setTemp] = useState("1300");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [rawMaterial, setRawMaterial] = useState("竹粉");
  const [result, setResult] = useState<Awaited<ReturnType<typeof calcBatteryPredict>> | null>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await calcBatteryPredict({
        materialType: "hard_carbon",
        rawMaterial,
        carbonizationTemperature: Number(temp) || undefined,
        surfaceArea: surfaceArea ? Number(surfaceArea) : undefined,
        cellType: "coin",
      });
      if (!res.success) {
        showToast(res.message || "预测失败", "info");
        setResult(null);
        return;
      }
      setResult(res);
      showToast(`电池性能预测完成（${res.engine === "catalog_knn" ? "材料库近邻" : "引擎"}）`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "计算服务未启动", "info");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="电池性能预测"
        description="由 calc-service 读取平台硬碳/电池材料库，按工艺参数做近邻匹配预测。"
      />
      <SectionCard title="材料与工艺参数">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            前驱体
            <input value={rawMaterial} onChange={(e) => setRawMaterial(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            碳化温度 (°C)
            <input value={temp} onChange={(e) => setTemp(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            比表面积 (m²/g，可选)
            <input value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <button type="button" onClick={predict} disabled={loading} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">
          {loading ? "预测中…" : "开始预测"}
        </button>
      </SectionCard>
      {result?.success && result.reversibleCapacityRange && (
        <SectionCard title="预测结果">
          <p className="mb-2 text-xs text-muted">引擎：材料库近邻匹配（catalog_knn）</p>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p>可逆容量：{result.reversibleCapacityRange[0]}–{result.reversibleCapacityRange[1]} mAh/g</p>
            <p>
              首效：{result.initialCoulombicEfficiencyRange?.[0]}–{result.initialCoulombicEfficiencyRange?.[1]}%
            </p>
            <p>100 圈保持率：{result.cycleRetentionAfter100Cycles}%</p>
            <p>置信度：{((result.confidenceScore ?? 0) * 100).toFixed(0)}%</p>
          </div>
          <ul className="mt-4 list-disc pl-5 text-sm text-muted">
            {(result.recommendations || []).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
