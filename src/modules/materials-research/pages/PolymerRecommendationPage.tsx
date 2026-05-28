import { useEffect, useState } from "react";
import { useToolBridgeStore, type ExtendedRecommendation } from "../store/toolBridgeStore";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { FormulationRecommendationCard } from "../components/polymer/FormulationRecommendationCard";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { useUiStore } from "../store/uiStore";
import { calcFormulationRecommend } from "../services/calcApi";

const TARGETS = ["高 Tg", "高热稳定性", "高韧性", "可降解", "可回收", "高碳化收率", "电极粘结性能", "电化学稳定性", "低成本", "高生物基含量"];

export function PolymerRecommendationPage() {
  const { showEvidenceFor, createElnFromRecommendation } = usePlatformActions();
  const consumeFormulation = useToolBridgeStore((s) => s.consumeFormulation);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [extraGoal, setExtraGoal] = useState("");
  const [recs, setRecs] = useState<ExtendedRecommendation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromChat, setFromChat] = useState(false);

  useEffect(() => {
    const bridged = consumeFormulation();
    if (bridged?.recommendations?.length) {
      setRecs(bridged.recommendations);
      setSelectedTargets(bridged.selectedTargets);
      setExtraGoal(bridged.extraGoal);
      setFromChat(true);
      if (bridged.recommendations[0]?.id) setExpandedId(bridged.recommendations[0].id);
    }
  }, [consumeFormulation]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await calcFormulationRecommend({ targets: selectedTargets, extraGoal });
      setRecs(res.recommendations as unknown as ExtendedRecommendation[]);
      setFromChat(false);
      useUiStore.getState().showToast(res.message);
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "计算服务暂不可用，请确认 calc-service（8030）已启动（npm run dev:web:research 会一并拉起）";
      useUiStore.getState().showToast(msg, "info");
    } finally {
      setLoading(false);
    }
  };

  const toggleTarget = (t: string) => {
    setSelectedTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="配方推荐"
        description={
          fromChat
            ? "以下为 AI 已完成的计算结果，可直接查看证据或创建实验记录。"
            : "选择目标性能后，由计算服务生成候选聚合物与工艺方案。"
        }
      />

      <SectionCard title="目标性能">
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTarget(t)}
              className={`rounded-full px-3 py-1 text-sm ${selectedTargets.includes(t) ? "bg-primary text-white" : "border border-slate-200 hover:bg-slate-50"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm"
          rows={2}
          placeholder="补充描述（可选）"
          value={extraGoal}
          onChange={(e) => setExtraGoal(e.target.value)}
        />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "计算中…" : "生成推荐配方"}
        </button>
      </SectionCard>

      <div className="space-y-6">
        {recs.map((r) => (
          <FormulationRecommendationCard
            key={r.id}
            rec={r}
            expanded={expandedId === r.id}
            onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
            onEvidence={() => showEvidenceFor("recommendation", r.id)}
            onCreateEln={() => createElnFromRecommendation(r.id)}
          />
        ))}
      </div>
    </div>
  );
}
