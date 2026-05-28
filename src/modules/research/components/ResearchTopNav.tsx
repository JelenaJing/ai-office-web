import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { RESEARCH_TOP_NAV } from '../researchTopNav'

export default function ResearchTopNav() {
  return (
    <nav className="flex items-center gap-1">
      {RESEARCH_TOP_NAV.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-medium transition',
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
