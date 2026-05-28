import { useEffect, useState } from "react";
import { mockApi, StudentWithProfile } from "../../services/mockApi";
import { PageHeader } from "../../components/common/PageHeader";
import { directionLabel } from "../../lib/auth";

export function StudentProgressPage() {
  const [students, setStudents] = useState<StudentWithProfile[]>([]);

  useEffect(() => {
    mockApi.students().then(setStudents).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="学生进展" description="查看各课题执行者的实验、文献与数据完整度。" />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">方向</th>
              <th className="px-4 py-3">课题</th>
              <th className="px-4 py-3">实验</th>
              <th className="px-4 py-3">文献</th>
              <th className="px-4 py-3">待审核</th>
              <th className="px-4 py-3">完整度</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{directionLabel(s.researchDirection)}</td>
                <td className="px-4 py-3">{s.profile?.projectTitle ?? "—"}</td>
                <td className="px-4 py-3">{s.profile?.experimentRecordCount ?? 0}</td>
                <td className="px-4 py-3">{s.profile?.uploadedPaperCount ?? 0}</td>
                <td className="px-4 py-3">{s.profile?.pendingReviewCount ?? 0}</td>
                <td className="px-4 py-3">
                  {s.profile ? `${Math.round(s.profile.dataCompletenessScore * 100)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
