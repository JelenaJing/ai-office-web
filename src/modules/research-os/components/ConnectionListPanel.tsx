import { useProjectStore } from '../store/projectStore'

export function ConnectionListPanel() {
  const connections = useProjectStore(s => s.connections)

  return (
    <div className="flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-[#d8dee9] bg-[#f4f6f8]">
      <div className="border-b border-[#d8dee9] bg-white px-3 py-3">
        <p className="text-lg font-bold text-slate-900">流程连线</p>
        <p className="text-base text-slate-500">{connections.length} 条</p>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {connections.map(c => (
          <li key={c.id} className="rounded-lg border border-[#d8dee9] bg-white p-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-bold leading-snug text-slate-900">{c.title}</p>
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{c.tag}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{c.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
