import { useEffect, useState } from "react";
import { api, InnovationOpportunity, InnovationGraph } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { runAction } from "../hooks/usePlatformActions";

const maturityLabel: Record<string, string> = {
  medium: "中",
  exploratory: "探索",
  "near-term": "近期可落地",
};

export function InnovationMapPage() {
  const { showEvidenceFor, generateProjectSummary } = usePlatformActions();
  const [opportunities, setOpportunities] = useState<InnovationOpportunity[]>([]);
  const [graph, setGraph] = useState<InnovationGraph | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    runAction(() => api.innovation.opportunities()).then((o) => o && setOpportunities(o));
    runAction(() => api.innovation.graph()).then((g) => g && setGraph(g));
  }, []);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    await generateProjectSummary((text) => {
      setSummary(text);
      setShowModal(true);
    });
    setSummaryLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="跨方向创新图谱"
        description="发现呋喃基高分子与电池材料之间的交叉机会，形成新的项目方向和实验建议。"
      />

      {graph && (
        <SectionCard
          title="创新关系图谱"
          action={
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white disabled:opacity-60"
            >
              {summaryLoading ? "生成中…" : "生成项目申报摘要"}
            </button>
          }
        >
          <div className="flex flex-wrap gap-3 justify-center py-6">
            {graph.nodes.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border-2 border-accent/30 bg-white px-4 py-3 text-center text-sm shadow-sm"
              >
                <p className="font-medium">{n.label}</p>
                <p className="text-xs text-muted">{n.type}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-center text-xs text-muted">
            {graph.edges.map((e, i) => {
              const src = graph.nodes.find((n) => n.id === e.source)?.label;
              const tgt = graph.nodes.find((n) => n.id === e.target)?.label;
              return (
                <p key={i}>
                  {src} —{e.relation}→ {tgt}
                </p>
              );
            })}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {opportunities.map((o) => (
          <SectionCard key={o.id} title={o.title}>
            <p className="text-sm text-slate-700">{o.description}</p>
            <p className="mt-2 text-sm">
              <span className="text-muted">价值：</span>
              {o.value}
            </p>
            <p className="mt-2 text-xs text-muted">
              成熟度：{maturityLabel[o.maturity] || o.maturity} · 证据 {o.evidenceCount} 条 · 专利风险 {o.patentRisk}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {o.suggestedExperiments.map((ex) => (
                <li key={ex}>• {ex}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => showEvidenceFor("opportunity", o.id)}
              className="mt-3 text-xs text-primary hover:underline"
            >
              查看证据链
            </button>
          </SectionCard>
        ))}
      </div>

      {showModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div
            className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-primary">项目申报摘要</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{summary}</p>
            <button type="button" onClick={() => setShowModal(false)} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm text-white">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
