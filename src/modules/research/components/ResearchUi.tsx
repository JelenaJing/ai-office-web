import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { HomeQuickAction } from '../researchHomeActions'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-0 bg-primary text-white shadow-sm hover:bg-[#1a3278] active:scale-[0.98]',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.98]',
  outline:
    'bg-transparent text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

const buttonSizes = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-4 py-2.5 text-[14px]',
  lg: 'px-5 py-3 text-[15px]',
}

export function ResearchButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: keyof typeof buttonSizes
}) {
  return (
    <button
      type="button"
      className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function ResearchLinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  className,
  children,
}: {
  to: string
  variant?: ButtonVariant
  size?: keyof typeof buttonSizes
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    >
      {children}
    </Link>
  )
}

/** 首屏快捷入口：主操作为实心大按钮，次要操作为描边 */
export function QuickActionBar({ actions }: { actions: HomeQuickAction[] }) {
  const primary = actions.filter(a => a.primary)
  const secondary = actions.filter(a => !a.primary)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {primary.map(action => (
          <QuickActionChip key={action.id} action={action} variant="primary" />
        ))}
      </div>
      {secondary.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {secondary.map(action => (
            <QuickActionChip key={action.id} action={action} variant="secondary" />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function QuickActionChip({
  action,
  variant,
}: {
  action: HomeQuickAction
  variant: 'primary' | 'secondary'
}) {
  const Icon = action.icon
  return (
    <Link
      to={action.path}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium transition active:scale-[0.98]',
        variant === 'primary'
          ? 'bg-primary text-white shadow-sm hover:bg-[#1a3278]'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {action.label}
    </Link>
  )
}

export function NotificationStrip({
  pendingReview,
  approved,
  onPendingClick,
  onApprovedClick,
}: {
  pendingReview: number
  approved: number
  onPendingClick?: string
  onApprovedClick?: string
}) {
  const items = [
    { label: '待审核', value: pendingReview, to: onPendingClick, tone: 'amber' as const },
    { label: '已通过', value: approved, to: onApprovedClick, tone: 'emerald' as const },
  ]

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {items.map(item => {
        const inner = (
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium ring-1',
              item.tone === 'amber' && 'bg-amber-50 text-amber-900 ring-amber-100',
              item.tone === 'emerald' && 'bg-emerald-50 text-emerald-800 ring-emerald-100',
            )}
          >
            <span className="text-slate-500">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </span>
        )
        return item.to ? (
          <Link key={item.label} to={item.to} className="transition hover:opacity-80">
            {inner}
          </Link>
        ) : (
          <span key={item.label}>{inner}</span>
        )
      })}
    </div>
  )
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-[16px] font-semibold text-slate-800">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
