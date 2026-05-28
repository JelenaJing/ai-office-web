import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function SectionCard({ title, subtitle, children, action }: SectionCardProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
