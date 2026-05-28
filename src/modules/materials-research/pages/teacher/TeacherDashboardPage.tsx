import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mockApi, TeacherDashboard } from "../../services/mockApi";
import { MetricCard } from "../../components/common/MetricCard";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";

export function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);

  useEffect(() => {
    mockApi.teacherDashboard().then(setData).catch(() => undefined);
  }, []);

  if (!data) return <p className="text-muted">加载中…</p>;

  const s = data.stats;
  return (
    <div className="space-y-6">
      <PageHeader title="课题组总览" description="全局数据资产、学生动态与待办审核。" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="在组学生" value={String(s.studentCount)} change={`${s.activeProjects} 个在研课题`} />
        <MetricCard label="待审核实验" value={String(s.pendingReviews)} change="需尽快处理" />
        <MetricCard label="本周实验记录" value={String(s.weeklyExperimentRecords)} change="较上周 +3" />
        <MetricCard label="数据完整度" value={`${Math.round(s.averageCompleteness * 100)}%`} change="课题组均值" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="课题组动态">
          <ul className="space-y-3 text-sm">
            {data.activities.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <span className="font-medium">{a.studentName}</span>
                <span className="text-muted"> · {a.title}</span>
                <p className="text-xs text-muted">{a.time}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="异常与提醒">
          <ul className="space-y-2 text-sm">
            {data.alerts.map((a) => (
              <li key={a.id} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                {a.message}
              </li>
            ))}
          </ul>
          <Link to="/research/teacher/eln-review" className="mt-4 inline-block text-sm text-primary hover:underline">
            进入实验审核 →
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}
