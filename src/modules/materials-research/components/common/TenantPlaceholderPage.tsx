import { PageHeader } from "./PageHeader";

interface TenantPlaceholderPageProps {
  title: string;
  description: string;
  bullets: string[];
}

export function TenantPlaceholderPage({ title, description, bullets }: TenantPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8">
        <p className="text-sm text-muted">演示数据与交互能力持续完善中，当前为功能预览。</p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-700">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
