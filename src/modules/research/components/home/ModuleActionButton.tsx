import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

const stop = (e: React.MouseEvent) => e.stopPropagation()

/** 模块右上角操作按钮（非链接样式） */
export function ModuleActionButton({
  to,
  label,
  className,
}: {
  to: string
  label: string
  className?: string
}) {
  return (
    <Link
      to={to}
      data-module-interactive
      onClick={stop}
      className={clsx('research-action-btn', className)}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
    </Link>
  )
}
