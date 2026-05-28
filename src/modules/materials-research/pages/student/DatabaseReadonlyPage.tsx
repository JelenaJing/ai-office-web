import { useEffect, useState } from "react";
import { mockApi } from "../../services/mockApi";
import { PageHeader } from "../../components/common/PageHeader";

const TABS = [
  { id: "monomers", label: "单体库" },
  { id: "polymers", label: "聚合物库" },
  { id: "reactions", label: "反应库" },
  { id: "papers", label: "论文库" },
  { id: "battery-materials", label: "电池材料库" },
] as const;

export function DatabaseReadonlyPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("monomers");
  const [rows, setRows] = useState<unknown[]>([]);
  const [q, setQ] = useState("");

  const load = async (id: string) => {
    const data = await mockApi.readonly(id);
    setRows(Array.isArray(data) ? data : []);
  };

  const switchTab = (id: (typeof TABS)[number]["id"]) => {
    setTab(id);
    load(id).catch(() => setRows([]));
  };

  useEffect(() => {
    load("monomers").catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="数据库查询（只读）" description="可搜索、查看与收藏，不可修改公共数据库条目。" />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === t.id ? "bg-primary text-white" : "border"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索…"
        className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
      />
      <pre className="max-h-96 overflow-auto rounded-xl border bg-slate-50 p-4 text-xs">
        {JSON.stringify(
          rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).slice(0, 20),
          null,
          2
        )}
      </pre>
      <p className="text-xs text-muted">只读模式：如需修改请联系导师在老师端数据库管理中操作。</p>
    </div>
  );
}
