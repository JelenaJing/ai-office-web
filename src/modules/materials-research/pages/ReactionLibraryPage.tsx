import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { useDatabaseMode } from "../contexts/DatabaseModeContext";

export interface ReactionRecord {
  id: string;
  name: string;
  reactionType?: string;
  maturityLevel?: string;
  targetPolymer?: string;
  monomers?: string[];
  catalysts?: string;
  temperature?: string;
  time?: string;
  yield?: string;
  source?: string;
}

export function ReactionLibraryPage() {
  const { readonly } = useDatabaseMode();
  const [items, setItems] = useState<ReactionRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.polymer.reactions().then((d) => setItems(d as unknown as ReactionRecord[])).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.monomers || []).some((m) => m.toLowerCase().includes(q)) ||
        (r.targetPolymer || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="反应库"
        description={
          readonly
            ? "浏览 ORD/USPTO 筛选的聚合与合成路线。"
            : "管理单体—工艺—产物反应路线与证据。"
        }
      />
      <SectionCard>
        <p className="mb-3 text-sm text-muted">共 {items.length} 条记录</p>
        <input
          type="search"
          placeholder="搜索反应名、单体、目标聚合物…"
          className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-3">反应</th>
                <th className="p-3">类型</th>
                <th className="p-3">单体</th>
                <th className="p-3">条件</th>
                <th className="p-3">产率</th>
                <th className="p-3">来源</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.reactionType || "—"}</td>
                  <td className="max-w-[200px] truncate p-3">{(r.monomers || []).join(" + ") || "—"}</td>
                  <td className="p-3 text-xs">
                    {r.catalysts && <span>{r.catalysts} · </span>}
                    {r.temperature} {r.time}
                  </td>
                  <td className="p-3">{r.yield || "—"}</td>
                  <td className="p-3 text-xs text-muted">{r.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted">暂无数据</p>}
        </div>
      </SectionCard>
    </div>
  );
}
