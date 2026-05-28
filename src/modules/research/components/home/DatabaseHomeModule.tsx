import { useEffect, useState } from 'react'
import type { DatabaseCard } from '../../../materials-research/services/mockApi'
import { loadDatabasesOverview, localDataHint } from '../../data/researchDataAccess'
import { ClickableModuleCard, ModuleDataBanner } from './ClickableModuleCard'
import { SubModuleTile } from './SubModuleTile'

const ROUTES: Record<string, string> = {
  monomers: '/research/database/monomers',
  polymers: '/research/database/polymers',
  reactions: '/research/database/reactions',
  'battery-materials': '/research/database/battery-materials',
}

export default function DatabaseHomeModule() {
  const [dbs, setDbs] = useState<DatabaseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    loadDatabasesOverview()
      .then(({ data, source }) => {
        setDbs(data)
        setHint(localDataHint(source))
      })
      .finally(() => setLoading(false))
  }, [])

  const total = dbs.reduce((s, d) => s + d.count, 0)
  const weekly = dbs.reduce((s, d) => s + d.weeklyNew, 0)

  return (
    <ClickableModuleCard
      to="/research/database"
      title="课题组数据库"
      hint="单体、聚合物、反应与电池材料 · 检索组内积累数据"
      enterLabel="浏览全部"
      footer={
        <span>
          共 <strong className="font-semibold text-slate-700">{total || '—'}</strong> 条记录 · 本周新增{' '}
          <strong className="font-semibold text-slate-700">{weekly}</strong> · 点击卡片进入
        </span>
      }
    >
      <ModuleDataBanner message={hint} />
      {loading ? (
        <p className="text-[15px] text-slate-500">加载中…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dbs.map(db => {
              const to = ROUTES[db.id] ?? '/research/database'
              return (
                <SubModuleTile
                  key={db.id}
                  to={to}
                  title={db.name}
                  primary={`${db.count} 条记录`}
                  secondary={`本周 +${db.weeklyNew} · 完整度 ${db.completeness}%`}
                />
              )
            })}
          </div>
          <SubModuleTile
            to="/research/database/my-library"
            title="我的文献库"
            primary="上传与管理个人文献"
            secondary="PDF、笔记与私有资料"
            variant="accent"
            className="sm:min-h-[88px]"
          />
        </div>
      )}
    </ClickableModuleCard>
  )
}
