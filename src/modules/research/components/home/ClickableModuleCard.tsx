import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ModuleActionButton } from './ModuleActionButton'

/** 整块可点进模块；内部表单/按钮标 data-module-interactive 不触发导航 */
export function ClickableModuleCard({
  to,
  title,
  hint,
  children,
  footer,
  className,
  enterLabel = '进入',
}: {
  to: string
  title: string
  hint?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  enterLabel?: string
}) {
  const navigate = useNavigate()

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={e => {
        if ((e.target as HTMLElement).closest('[data-module-interactive]')) return
        navigate(to)
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          if ((e.target as HTMLElement).closest('[data-module-interactive]')) return
          e.preventDefault()
          navigate(to)
        }
      }}
      className={clsx(
        'research-module-card group flex min-h-[220px] cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white',
        'shadow-sm transition hover:border-slate-300 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="research-module-title">{title}</h2>
          {hint ? <p className="research-module-hint">{hint}</p> : null}
        </div>
        <ModuleActionButton to={to} label={enterLabel} />
      </header>
      <div className="flex-1 px-6 py-5" data-module-interactive onClick={e => e.stopPropagation()}>
        {children}
      </div>
      {footer ? (
        <footer className="research-module-footer" data-module-interactive onClick={e => e.stopPropagation()}>
          {footer}
        </footer>
      ) : null}
    </section>
  )
}

export function ModuleDataBanner({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="research-module-banner">{message}</p>
}
