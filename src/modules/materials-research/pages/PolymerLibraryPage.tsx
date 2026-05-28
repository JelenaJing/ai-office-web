import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { useDatabaseMode } from "../contexts/DatabaseModeContext";

export interface PolymerRecord {
  id: string;
  name: string;
  abbreviation?: string;
  structureClass?: string;
  monomers?: string[];
  polymerizationType?: string;
  tg?: number;
  tm?: number;
  td?: number;
  tensileStrength?: number;
  source?: string;
  confidence?: number;
}

export function PolymerLibraryPage() {
  const { readonly } = useDatabaseMode();
  const [items, setItems] = useState<PolymerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    api.polymer.polymers().then((d) => setItems(d as unknown as PolymerRecord[])).catch(() => undefined);
  }, []);

  const classes = useMemo(
    () => [...new Set(items.map((p) => p.structureClass).filter(Boolean))] as string[],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.abbreviation || "").toLowerCase().includes(q) ||
        (p.monomers || []).some((m) => m.toLowerCase().includes(q));
      const matchC = !classFilter || p.structureClass === classFilter;
      return matchQ && matchC;
    });
  }, [items, search, classFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="聚合物库"
        description={
          readonly
            ? "浏览 PI1M/文献整理的聚合物结构与热力学、力学性能候选数据。"
            : "管理聚合物结构、单体关联与性能证据。"
        }
      />
      <SectionCard>
        <p className="mb-3 text-sm text-muted">共 {items.length} 条记录</p>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="搜索名称、缩写、单体…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-3">名称</th>
                <th className="p-3">类型</th>
                <th className="p-3">单体</th>
                <th className="p-3">Tg / Tm / Td (°C)</th>
                <th className="p-3">来源</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium">
                    {p.name}
                    {p.abbreviation && <span className="ml-2 text-xs text-muted">({p.abbreviation})</span>}
                  </td>
                  <td className="p-3">{p.structureClass || "—"}</td>
                  <td className="max-w-xs truncate p-3">{(p.monomers || []).join(", ") || "—"}</td>
                  <td className="p-3">
                    {p.tg ?? "—"} / {p.tm ?? "—"} / {p.td ?? "—"}
                  </td>
                  <td className="p-3 text-xs text-muted">{p.source || "—"}</td>
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
