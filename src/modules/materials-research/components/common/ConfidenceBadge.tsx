import clsx from "clsx";

export function confidenceLevel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "高", color: "bg-green-100 text-success" };
  if (score >= 70) return { label: "中", color: "bg-cyan-100 text-accent" };
  if (score >= 50) return { label: "低", color: "bg-orange-100 text-warning" };
  return { label: "不足", color: "bg-red-100 text-danger" };
}

export function ConfidenceBadge({ score }: { score: number }) {
  const { label, color } = confidenceLevel(score);
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
      {score} · {label}
    </span>
  );
}
