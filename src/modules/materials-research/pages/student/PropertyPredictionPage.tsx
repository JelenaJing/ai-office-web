import { useEffect, useState } from "react";
import { useToolBridgeStore } from "../../store/toolBridgeStore";
import { calcPropertyPredict } from "../../services/calcApi";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { ConfidenceBadge } from "../../components/common/ConfidenceBadge";
import { useUiStore } from "../../store/uiStore";

const EXAMPLES = [
  "PEF 或 呋喃聚酯",
  "Poly(isophthalic acid-co-5-hydroxymethylfurfural)",
  "FDCA 和 BDO 共聚",
  "PBF",
];

async function resolvePolymerHint(query: string, monomers: string[]): Promise<string | null> {
  if (!query.trim() && monomers.length === 0) return null;
  try {
    const res = await fetch("/api/polymer/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim(), monomers }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.hint as string) || null;
  } catch {
    return null;
  }
}

export function PropertyPredictionPage() {
  const showToast = useUiStore((s) => s.showToast);
  const consumeProperty = useToolBridgeStore((s) => s.consumeProperty);
  const [description, setDescription] = useState("");
  const [monomers, setMonomers] = useState("");
  const [resolveHint, setResolveHint] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof calcPropertyPredict>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromChat, setFromChat] = useState(false);

  useEffect(() => {
    const bridged = consumeProperty();
    if (bridged) {
      setDescription(bridged.polymerName);
      setMonomers(bridged.monomers);
      if (bridged.result) {
        setResult(bridged.result);
        setFromChat(true);
      }
    }
  }, [consumeProperty]);

  useEffect(() => {
    const monoList = monomers.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    const t = setTimeout(() => {
      resolvePolymerHint(description, monoList).then(setResolveHint);
    }, 400);
    return () => clearTimeout(t);
  }, [description, monomers]);

  const predict = async () => {
    const q = description.trim();
    const monoList = monomers.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (!q && monoList.length === 0) {
      showToast("请输入聚合物描述或单体名称", "info");
      return;
    }
    setLoading(true);
    try {
      const res = await calcPropertyPredict({
        polymerName: q || monoList.join(" / "),
        monomers: monoList,
      });
      setResult(res);
      setFromChat(false);
      showToast(res.engine === "catalog_match" ? "已匹配库内相近聚合物" : "已基于描述与单体启发式估算");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "预测失败", "info");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const labelMap: Record<string, string> = {
    tg: "Tg (°C)",
    tm: "Tm (°C)",
    td: "Td (°C)",
    tensileStrength: "拉伸强度 (MPa)",
    elongation: "断裂伸长率 (%)",
    carbonYield: "碳化收率 (%)",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="聚合物性能预测"
        description={
          fromChat
            ? "以下为 AI 已完成的性能预测结果，可调整输入后重新计算。"
            : "支持常用名、英文名片段、Poly(...) 全称或单体组合；无需记忆内部编号。"
        }
      />
      <SectionCard title="输入">
        <label className="block text-sm">
          聚合物描述
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            placeholder="如：呋喃聚酯、PEF、Poly(isophthalic acid-co-5-hydroxymethylfurfural)…"
          />
        </label>
        <label className="mt-4 block text-sm">
          单体（可选，逗号分隔）
          <input
            value={monomers}
            onChange={(e) => setMonomers(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="如：FDCA, BDO 或 间苯二甲酸, 糠醇"
          />
        </label>
        {resolveHint && <p className="mt-2 text-xs text-primary">{resolveHint}</p>}
        <p className="mt-2 text-xs text-muted">
          示例：{EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="mr-2 underline hover:text-primary"
              onClick={() => setDescription(ex)}
            >
              {ex}
            </button>
          ))}
        </p>
        <button
          type="button"
          onClick={predict}
          disabled={loading}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "预测中…" : "开始预测"}
        </button>
      </SectionCard>
      {result && (
        <SectionCard title={`预测结果 · ${result.polymerName}`}>
          <div className="flex flex-wrap items-center gap-3">
            <ConfidenceBadge score={result.confidence} />
            <span className="text-xs text-muted">
              引擎：{result.engine === "catalog_match" ? "库内模糊匹配" : "单体启发式"}
              {result.matchedRecordId ? ` · 参考记录 ${result.matchedRecordId}` : ""}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            {Object.entries(result.predictions).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-muted">{labelMap[k] || k}</span>：{v[0]} – {v[1]}
              </div>
            ))}
          </div>
          <ul className="mt-4 list-disc pl-5 text-sm text-muted">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
