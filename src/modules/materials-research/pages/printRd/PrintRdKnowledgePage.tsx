import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { print3dApi, type Print3dDocument } from "../../services/print3dApi";

const CATEGORY_OPTIONS = [
  { value: "", label: "全部分类" },
  { value: "literature", label: "学术文献" },
  { value: "experiment_record", label: "实验记录表" },
  { value: "material_catalog", label: "原料目录" },
  { value: "formula", label: "配方工艺" },
  { value: "performance_guide", label: "性能关联" },
  { value: "document", label: "技术文档" },
];

export function PrintRdKnowledgePage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [items, setItems] = useState<Print3dDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    print3dApi
      .documents({ q, category: category || undefined, limit: 80 })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    setParams(sp);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="3D 打印材料知识库"
        description="基于「3D打印全资料」文件夹构建的本地化知识库，涵盖文献、实验记录、原料目录、配方与性能关联资料。"
      />

      <SectionCard title="检索">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="标题、文件名、原料代号、工艺关键词…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-white">
            搜索
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">共找到 {total} 条资料{loading ? "（加载中…）" : ""}</p>
      </SectionCard>

      <SectionCard title={`资料列表（${items.length}）`}>
        {items.length === 0 ? (
          <p className="text-sm text-muted">暂无匹配资料。</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-2">标题 / 预览</th>
                <th className="p-2">分类</th>
                <th className="p-2">文件</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="p-2">
                    <p className="font-medium">{d.title}</p>
                    {d.preview && <p className="mt-1 line-clamp-2 text-xs text-muted">{d.preview}</p>}
                  </td>
                  <td className="p-2 whitespace-nowrap">{d.categoryLabel}</td>
                  <td className="p-2 text-xs text-muted">{d.fileName}</td>
                  <td className="p-2">
                    <a
                      href={print3dApi.downloadUrl(d.id)}
                      className="text-xs text-primary hover:underline"
                      download
                    >
                      下载
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
