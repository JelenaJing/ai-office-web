import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { print3dApi, type Print3dMaterial } from "../../services/print3dApi";

export function PrintRdMaterialsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Print3dMaterial[]>([]);

  useEffect(() => {
    print3dApi.materials(q).then((r) => setItems(r.items)).catch(() => undefined);
  }, [q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="原料库"
        description="从知识库原料目录表中提取的原料代号、分类、结构与供应商信息，便于配方设计与合规核对。"
      />
      <SectionCard title="检索原料">
        <input
          className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          placeholder="原料代号、名称、分类、供应商…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </SectionCard>
      <SectionCard title={`原料条目（${items.length}）`}>
        {items.length === 0 ? (
          <p className="text-sm text-muted">暂无原料数据，请检查知识库索引。</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-2">代号</th>
                <th className="p-2">名称</th>
                <th className="p-2">大分类</th>
                <th className="p-2">细分类</th>
                <th className="p-2">结构</th>
                <th className="p-2">供应商</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.code} className="border-b">
                  <td className="p-2 font-medium">{m.code}</td>
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.category}</td>
                  <td className="p-2">{m.subCategory}</td>
                  <td className="p-2 text-xs">{m.structure}</td>
                  <td className="p-2 text-xs">{m.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
