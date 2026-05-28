import { useEffect, useState, useMemo } from "react";
import { api, Monomer } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { ConfidenceBadge } from "../components/common/ConfidenceBadge";
import { useAppStore } from "../store/appStore";
import clsx from "clsx";
import { X } from "lucide-react";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { useDatabaseMode } from "../contexts/DatabaseModeContext";

export function MonomerLibraryPage() {
  const { readonly } = useDatabaseMode();
  const { generateRoutes, addToCandidates, showEvidenceFor } = usePlatformActions();
  const [monomers, setMonomers] = useState<Monomer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { selectedMonomerId, setSelectedMonomerId } = useAppStore();
  const selected = monomers.find((m) => m.id === selectedMonomerId);

  useEffect(() => {
    api.polymer.monomers().then(setMonomers);
  }, []);

  const filtered = useMemo(() => {
    return monomers.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.alias.some((a) => a.toLowerCase().includes(q)) ||
        m.smiles.toLowerCase().includes(q);
      const matchType = !typeFilter || m.monomerType === typeFilter;
      return matchSearch && matchType;
    });
  }, [monomers, search, typeFilter]);

  return (
    <div className="flex gap-6">
      <div className={clsx("flex-1 space-y-4", selected && "lg:mr-96")}>
        <PageHeader
          title="高分子单体知识库"
          description="统一管理呋喃基单体结构、官能团、聚合路线、性能记录与文献证据。"
        />
        <SectionCard>
          <input
            type="search"
            placeholder="搜索单体名称、SMILES、官能团、聚合类型、性能目标……"
            className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">全部单体类型</option>
            <option value="二酸">二酸</option>
            <option value="二醇">二醇</option>
            <option value="二胺">二胺</option>
            <option value="环氧">环氧</option>
            <option value="呋喃醛衍生物">呋喃醛衍生物</option>
          </select>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-muted">
                <tr>
                  <th className="p-3">单体名称</th>
                  <th className="p-3">SMILES</th>
                  <th className="p-3">官能团</th>
                  <th className="p-3">聚合方式</th>
                  <th className="p-3">证据</th>
                  <th className="p-3">AI 置信度</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-b hover:bg-slate-50"
                    onClick={() => setSelectedMonomerId(m.id)}
                  >
                    <td className="p-3 font-medium">{m.name}<br /><span className="text-xs text-muted">{m.alias[0]}</span></td>
                    <td className="max-w-[120px] truncate p-3 font-mono text-xs">{m.smiles}</td>
                    <td className="p-3">{m.functionalGroups.join(", ")}</td>
                    <td className="p-3">{m.polymerizationMethods.join(", ")}</td>
                    <td className="p-3">{m.evidenceCount} 文献 / {m.internalExperimentCount} 实验</td>
                    <td className="p-3"><ConfidenceBadge score={m.confidence} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {selected && (
        <aside className="fixed right-0 top-16 z-20 h-[calc(100vh-4rem)] w-96 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-lg font-semibold text-primary">{selected.name}</h2>
            <button type="button" onClick={() => setSelectedMonomerId(null)}><X className="h-5 w-5" /></button>
          </div>
          <p className="text-sm text-muted">{selected.alias.join(" · ")}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-muted">分子式</dt><dd>{selected.formula} · MW {selected.molecularWeight}</dd></div>
            <div><dt className="text-muted">典型用途</dt><dd>{selected.typicalUses.join("、")}</dd></div>
          </dl>
          {selected.routes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium">关联聚合路线</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {selected.routes.map((r) => <li key={r}>• {r}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-4 rounded-lg bg-accent/10 p-4 text-sm">
            <p className="font-medium text-accent">AI 研发判断</p>
            <p className="mt-2 text-slate-700">{selected.aiAnalysis}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => showEvidenceFor("monomer", selected.id)} className="rounded-lg border px-3 py-1.5 text-xs">查看证据</button>
            {!readonly && (
              <>
                <button type="button" onClick={() => generateRoutes(selected.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white">生成聚合路线</button>
                <button type="button" onClick={() => addToCandidates(selected.id)} className="rounded-lg border px-3 py-1.5 text-xs">加入候选配方</button>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
