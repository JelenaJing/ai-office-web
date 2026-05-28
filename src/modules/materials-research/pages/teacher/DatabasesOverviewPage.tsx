import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mockApi, DatabaseCard } from "../../services/mockApi";
import { PageHeader } from "../../components/common/PageHeader";
const routes: Record<string, string> = {
  experiments: "/research/teacher/databases/experiments",
  papers: "/research/teacher/databases/papers",
  monomers: "/research/teacher/databases/monomers",
  polymers: "/research/teacher/databases/polymers",
  reactions: "/research/teacher/databases/reactions",
  "battery-materials": "/research/teacher/databases/battery-materials",
};

export function DatabasesOverviewPage() {
  const [dbs, setDbs] = useState<DatabaseCard[]>([]);
  useEffect(() => {
    mockApi.databasesOverview().then((r) => setDbs(r.databases)).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="数据库管理" description="课题组级知识资产：实验、论文、单体、聚合物、反应与电池材料。" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dbs.map((db) => (
          <div key={db.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-medium text-slate-800">{db.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
              <span>条目 {db.count}</span>
              <span>本周 +{db.weeklyNew}</span>
              <span>待处理 {db.pending}</span>
              <span>完整度 {Math.round(db.completeness * 100)}%</span>
            </div>
            <Link to={routes[db.id] ?? "#"} className="mt-4 inline-block text-sm text-primary hover:underline">
              进入管理 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
