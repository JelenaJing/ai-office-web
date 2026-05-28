import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import './research-back-home.css'

type Props = {
  to?: string
  className?: string
}

/** 科研四宫格子页 / 工作台统一的「返回首页」按钮 */
export function ResearchBackHomeLink({ to = '/research', className }: Props) {
  return (
    <Link to={to} className={clsx('research-back-home', className)}>
      <ArrowLeft className="research-back-home__icon" aria-hidden />
      <span>返回首页</span>
    </Link>
  )
}
