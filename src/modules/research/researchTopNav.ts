import type { LucideIcon } from 'lucide-react'
import { Home, Database } from 'lucide-react'

export interface ResearchTopNavItem {
  id: string
  path: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** 科研顶部栏目：仅保留「个人首页」与「课题组数据库」（与主站「资源」区分） */
export const RESEARCH_TOP_NAV: ResearchTopNavItem[] = [
  { id: 'home', path: '/research', label: '我的首页', icon: Home, end: true },
  { id: 'database', path: '/research/database', label: '课题组数据库', icon: Database },
]
