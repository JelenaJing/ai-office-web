import { useEffect, useState } from 'react'
import { loadElnRecords, localDataHint } from '../../data/researchDataAccess'
import { ResearchLinkButton } from '../ResearchUi'
import { ClickableModuleCard, ModuleDataBanner } from './ClickableModuleCard'

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '待审',
  approved: '已通过',
  returned: '退回',
}

export default function ElnHomeModule() {
  const [records, setRecords] = useState<
    { id: string; title?: string; status?: string; updatedAt?: string; completeness?: number }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    loadElnRecords()
      .then(({ data, source }) => {
        setRecords(data.slice(0, 5))
        setHint(localDataHint(source))
      })
      .finally(() => setLoading(false))
  }, [])

  const drafts = records.filter(r => r.status === 'draft').length

  return (
    <ClickableModuleCard
      to="/research/tools/eln"
      title="实验记录"
      hint="完成实验后登记步骤、原始数据与结果"
      enterLabel="打开 ELN"
      footer={
        <span>
          {drafts > 0 ? `${drafts} 条草稿待完善 · ` : ''}
          支持模板填写、附件上传与提交审核
        </span>
      }
    >
      <ModuleDataBanner message={hint} />
      {loading ? (
        <p className="text-[14px] text-slate-500">加载中…</p>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {records.map(r => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-[15px] even:bg-slate-50/50"
              >
                <span className="min-w-0 truncate font-semibold text-slate-900">{r.title || r.id}</span>
                <span className="shrink-0 text-[14px] text-slate-500">
                  {STATUS_LABEL[r.status ?? ''] ?? r.status ?? '—'}
                  {r.completeness != null ? ` · ${r.completeness}%` : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="research-btn-row">
            <ResearchLinkButton to="/research/tools/eln" variant="outline" size="md">
              新建实验记录
            </ResearchLinkButton>
          </div>
        </div>
      )}
    </ClickableModuleCard>
  )
}
