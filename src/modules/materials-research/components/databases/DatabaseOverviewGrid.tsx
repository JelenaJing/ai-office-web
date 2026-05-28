import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DatabaseCard } from "../../services/mockApi";

interface DatabaseOverviewGridProps {
  databases: DatabaseCard[];
  routes: Record<string, string>;
  actionLabel?: string;
  extraCards?: ReactNode;
}

export function DatabaseOverviewGrid({
  databases,
  routes,
  actionLabel = "进入",
  extraCards,
}: DatabaseOverviewGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {extraCards}
      {databases.map((db) => (
        <div
          key={db.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/30"
        >
          <h3 className="font-medium text-slate-800">{db.name}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
            <span>条目 {db.count}</span>
            <span>本周 +{db.weeklyNew}</span>
            <span>待处理 {db.pending}</span>
            <span>完整度 {Math.round(db.completeness * 100)}%</span>
          </div>
          <p className="mt-2 text-[10px] text-muted">更新 {db.updatedAt}</p>
          <Link to={routes[db.id] ?? "#"} className="mt-4 inline-block text-sm text-primary hover:underline">
            {actionLabel} →
          </Link>
        </div>
      ))}
    </div>
  );
}
