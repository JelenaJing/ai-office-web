import { useParams } from 'react-router-dom'
import { SIDEBAR_CONTROL_TEMPLATES, SIDEBAR_DEVICE_TEMPLATES } from '../config/materialsLexicon'
import { useProjectStore } from '../store/projectStore'

export function ProjectSidebar() {
  const project = useProjectStore(s => s.project)
  const addFlowNode = useProjectStore(s => s.addFlowNode)

  return (
    <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-[#d8dee9] bg-white">
      <div className="border-b border-[#d8dee9] px-4 py-3">
        <p className="text-lg font-bold text-slate-900">{project.name}</p>
        <p className="mt-0.5 text-base text-slate-500">蓝图设计 · 拖拽节点连线</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="text-base font-bold text-slate-800">处理单元</p>
        {SIDEBAR_CONTROL_TEMPLATES.map(t => (
          <button
            key={t.modelId}
            type="button"
            className="mt-2 w-full rounded-lg bg-slate-50 px-3 py-2.5 text-left text-base text-slate-800 hover:bg-slate-100"
            onClick={() => addFlowNode(t)}
          >
            + {t.title}
          </button>
        ))}
        <p className="mt-4 text-base font-bold text-slate-800">数据源</p>
        {SIDEBAR_DEVICE_TEMPLATES.map(t => (
          <button
            key={t.modelId}
            type="button"
            className="mt-2 w-full rounded-lg bg-slate-50 px-3 py-2.5 text-left text-base text-slate-800 hover:bg-slate-100"
            onClick={() => addFlowNode(t)}
          >
            + {t.title}
          </button>
        ))}
      </div>
    </aside>
  )
}
