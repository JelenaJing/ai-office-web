import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

/** 模块内子入口：按钮形态，避免全局 a 标签蓝字下划线 */
export function SubModuleTile({
  to,
  title,
  primary,
  secondary,
  variant = 'default',
  className,
}: {
  to: string
  title: string
  primary: string
  secondary?: string
  variant?: 'default' | 'accent'
  className?: string
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      data-module-interactive
      onClick={e => {
        e.stopPropagation()
        navigate(to)
      }}
      className={clsx(
        'research-subtile group/tile flex w-full flex-col text-left transition',
        variant === 'accent' && 'research-subtile--accent',
        className,
      )}
    >
      <span className="research-subtile__title">{title}</span>
      <span className="research-subtile__primary">{primary}</span>
      {secondary ? <span className="research-subtile__secondary">{secondary}</span> : null}
      <ChevronRight
        className="research-subtile__arrow h-5 w-5 -translate-y-1/2 text-slate-300 transition group-hover/tile:translate-x-0.5 group-hover/tile:text-slate-500"
        aria-hidden
      />
    </button>
  )
}
