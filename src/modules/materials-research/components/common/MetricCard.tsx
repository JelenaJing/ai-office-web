interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
}

export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
      {change && <p className="mt-2 text-xs text-accent">{change}</p>}
    </div>
  );
}
