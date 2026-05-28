import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Lightbulb,
  LineChart,
  BookOpen,
  Beaker,
  Database,
  FlaskConical,
  Battery,
  Newspaper,
} from 'lucide-react'

export interface ResearchNavItem {
  id: string
  path: string
  label: string
  icon: LucideIcon
  group?: string
}

/** 科研二级导航：横向 Tab，不重复主站左侧栏 */
export const RESEARCH_NAV_ITEMS: ResearchNavItem[] = [
  { id: 'dashboard', path: '/research/dashboard', label: '研发总览', icon: LayoutDashboard },
  { id: 'ideas', path: '/research/ideas', label: '创意 Feed', icon: Lightbulb, group: '智能分析' },
  { id: 'plot', path: '/research/plot', label: '模板画图', icon: LineChart, group: '智能分析' },
  { id: 'literature', path: '/research/literature', label: '文献推荐', icon: Newspaper, group: '知识与数据' },
  { id: 'formulation', path: '/research/formulation', label: '配方推荐', icon: Beaker, group: '材料研发' },
  { id: 'property', path: '/research/property', label: '性能预测', icon: FlaskConical, group: '材料研发' },
  { id: 'battery', path: '/research/battery', label: '电池分析', icon: Battery, group: '材料研发' },
  { id: 'eln', path: '/research/eln', label: '实验记录', icon: BookOpen, group: '实验数字化' },
  { id: 'databases', path: '/research/databases', label: '数据库', icon: Database, group: '知识与数据' },
]

export function matchResearchNav(pathname: string): ResearchNavItem {
  const hit = RESEARCH_NAV_ITEMS.find(
    item => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
  return hit ?? RESEARCH_NAV_ITEMS[0]
}
