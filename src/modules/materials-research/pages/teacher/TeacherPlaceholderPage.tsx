import { PageHeader } from "../../components/common/PageHeader";

export function TeacherPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-muted">
        功能演示框架已就绪，可继续接入真实数据与编辑交互。
      </div>
    </div>
  );
}
