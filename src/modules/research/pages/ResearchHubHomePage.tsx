import { Link } from 'react-router-dom'
import clsx from 'clsx'

const BLOCKS = [
  {
    title: '推荐',
    to: '/research/recommend',
    border: 'border-rose-200',
    bg: 'bg-gradient-to-br from-rose-50 to-white',
    hover: 'hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-rose-500" fill="none" aria-hidden>
        <rect x="8" y="12" width="48" height="40" rx="10" stroke="currentColor" strokeWidth="3" />
        <path d="M20 24h24M20 32h16M20 40h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="20" r="8" fill="currentColor" opacity="0.2" />
        <path d="M44 20l3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '实验记录本',
    to: '/research/eln',
    border: 'border-emerald-200',
    bg: 'bg-gradient-to-br from-emerald-50 to-white',
    hover: 'hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-emerald-600" fill="none" aria-hidden>
        <path d="M18 10h28a6 6 0 016 6v38a6 6 0 01-6 6H18a6 6 0 01-6-6V16a6 6 0 016-6z" stroke="currentColor" strokeWidth="3" />
        <path d="M22 22h20M22 32h20M22 42h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 18h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '模型',
    to: '/research/models',
    border: 'border-violet-200',
    bg: 'bg-gradient-to-br from-violet-50 to-white',
    hover: 'hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-violet-600" fill="none" aria-hidden>
        <circle cx="32" cy="20" r="10" stroke="currentColor" strokeWidth="3" />
        <circle cx="16" cy="48" r="8" stroke="currentColor" strokeWidth="3" />
        <circle cx="48" cy="48" r="8" stroke="currentColor" strokeWidth="3" />
        <path d="M26 28L18 42M38 28l10 14M32 30v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '工作台',
    to: '/research/os/builder',
    border: 'border-sky-200',
    bg: 'bg-gradient-to-br from-sky-50 to-white',
    hover: 'hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-sky-600" fill="none" aria-hidden>
        <rect x="10" y="14" width="44" height="10" rx="3" stroke="currentColor" strokeWidth="3" />
        <rect x="10" y="28" width="44" height="10" rx="3" stroke="currentColor" strokeWidth="3" />
        <rect x="10" y="42" width="44" height="10" rx="3" stroke="currentColor" strokeWidth="3" />
        <path d="M48 19v4M48 33v4M48 47v4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

export default function ResearchHubHomePage() {
  return (
    <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-3 p-3">
      {BLOCKS.map(block => (
        <Link
          key={block.title}
          to={block.to}
          className={clsx(
            'flex flex-col items-center justify-center gap-5 rounded-[2rem] border-2 no-underline transition-all',
            'text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-wide text-slate-900',
            block.border,
            block.bg,
            block.hover,
          )}
        >
          {block.icon}
          <span>{block.title}</span>
        </Link>
      ))}
    </div>
  )
}
