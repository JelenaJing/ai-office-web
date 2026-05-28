import clsx from "clsx";

const statusMap: Record<string, string> = {
  draft: "草稿",
  running: "进行中",
  completed: "已完成",
  review: "待审核",
  returned: "已退回",
  approved: "已确认",
  archived: "已归档",
};

const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-success",
  review: "bg-orange-100 text-warning",
  returned: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  archived: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor[status] || "bg-slate-100")}>
      {statusMap[status] || status}
    </span>
  );
}
