import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { mockApi, type TeacherDashboard } from '../../materials-research/services/mockApi'
import { getHomeQuickActions } from '../researchHomeActions'
import { QuickActionBar, NotificationStrip, SectionTitle } from '../components/ResearchUi'

export default function ResearchTeacherHomePage() {
  const [data, setData] = useState<TeacherDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const actions = getHomeQuickActions('teacher')

  useEffect(() => {
    mockApi
      .teacherDashboard()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const pending = data?.stats.pendingReviews ?? 0
  const approved = data?.stats.weeklyExperimentRecords ?? 0

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <NotificationStrip
          pendingReview={pending}
          approved={approved}
          onPendingClick="/research/tools/teacher/eln-review"
        />
      </div>

      <QuickActionBar actions={actions} />

      {loading ? (
        <p className="text-[14px] text-slate-500">加载中…</p>
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <SectionTitle title="待处理" />
            <ul className="space-y-2 text-[14px]">
              {data.alerts.slice(0, 5).map(a => (
                <li key={a.id} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950">
                  {a.message}
                </li>
              ))}
            </ul>
            <Link
              to="/research/tools/teacher/eln-review"
              className="mt-3 inline-block text-[13px] font-medium text-primary hover:underline"
            >
              进入实验审核 →
            </Link>
          </section>
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <SectionTitle title="课题组动态" />
            <ul className="space-y-2 text-[14px] text-slate-700">
              {data.activities.slice(0, 6).map(a => (
                <li key={a.id} className="border-b border-slate-50 pb-2 last:border-0">
                  <span className="font-medium">{a.studentName}</span>
                  <span className="text-slate-500"> · {a.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}
