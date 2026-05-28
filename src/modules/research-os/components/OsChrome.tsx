import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ResearchBackHomeLink } from '../../research/components/ResearchBackHomeLink'
import clsx from 'clsx'
import { BarChart3, FileText, GitBranch, Layers, Play, Redo2, Undo2 } from 'lucide-react'
import { LEX } from '../config/materialsLexicon'
import { useProjectStore } from '../store/projectStore'

export function OsChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { projectId = 'default' } = useParams()
  const project = useProjectStore(s => s.project)
  const undo = useProjectStore(s => s.undo)
  const redo = useProjectStore(s => s.redo)

  const base = `/research/os/project/${project.id}`

  const isBlueprint = location.pathname.includes('/connections')
  const isVisualizer = location.pathname.includes('/visualizer')
  const isReport = location.pathname.includes('/report')
  const isSimulator = location.pathname.includes('/simulator')
  const isBuilder =
    location.pathname.includes('/builder') ||
    (!isSimulator && !isBlueprint && !isVisualizer && !isReport)

  const tabs = [
    { label: '蓝图', to: `${base}/connections`, active: isBlueprint, icon: GitBranch },
    { label: '组装', to: '/research/os/builder', active: isBuilder, icon: Layers },
    { label: '仿真', to: '/research/os/simulator', active: isSimulator, icon: Play },
    { label: '分析', to: `${base}/visualizer`, active: isVisualizer, icon: BarChart3 },
    { label: '输出', to: `${base}/report`, active: isReport, icon: FileText },
  ]

  return (
    <div className="os-frame os-light flex min-h-0 flex-1 flex-col">
      <header
        className={clsx(
          'os-chrome os-chrome--unified',
          !isBlueprint && 'os-chrome--unified-no-history',
        )}
      >
        {isBlueprint ? (
          <div className="flex items-center gap-2">
            <button type="button" className="os-btn os-btn-ghost !min-h-[42px] !px-3" onClick={() => undo()}>
              <Undo2 size={18} />
              {LEX.undo}
            </button>
            <button type="button" className="os-btn os-btn-ghost !min-h-[42px] !px-3" onClick={() => redo()}>
              <Redo2 size={18} />
              {LEX.redo}
            </button>
          </div>
        ) : (
          <ResearchBackHomeLink className="justify-self-start" />
        )}

        <div className="os-mode-toggle">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <Link key={tab.label} to={tab.to} className={tab.active ? 'os-mode-link is-active' : 'os-mode-link'}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>

        <button
          type="button"
          className="os-btn os-btn-primary !min-h-[42px]"
          onClick={() => navigate(`/research/os/project/${projectId}/simulator`)}
        >
          <Play size={18} />
          {LEX.simulate}
        </button>
      </header>

      <div className="os-body">{children}</div>
    </div>
  )
}
