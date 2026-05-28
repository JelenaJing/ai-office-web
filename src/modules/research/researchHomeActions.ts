import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Beaker,
  Lightbulb,
  LineChart,
  Database,
  ClipboardCheck,
  Users,
} from 'lucide-react'
import type { ResearchPersona } from './researchPersona'

export interface HomeQuickAction {
  id: string
  label: string
  path: string
  icon: LucideIcon
  /** 首屏主操作（加大显示） */
  primary?: boolean
}

const STUDENT_ACTIONS: HomeQuickAction[] = [
  { id: 'eln', label: '实验记录', path: '/research/tools/eln', icon: BookOpen, primary: true },
  { id: 'formulation', label: '配方推荐', path: '/research/tools/formulation', icon: Beaker, primary: true },
  { id: 'ideas', label: '创意 Feed', path: '/research/tools/ideas', icon: Lightbulb, primary: true },
  { id: 'plot', label: '模板画图', path: '/research/tools/plot', icon: LineChart, primary: true },
  { id: 'database', label: '课题组数据库', path: '/research/database', icon: Database },
]

const TEACHER_ACTIONS: HomeQuickAction[] = [
  { id: 'review', label: '实验审核', path: '/research/tools/teacher/eln-review', icon: ClipboardCheck, primary: true },
  { id: 'students', label: '学生进展', path: '/research/tools/teacher/students', icon: Users, primary: true },
  { id: 'database', label: '课题组数据库', path: '/research/database', icon: Database, primary: true },
]

export function getHomeQuickActions(persona: ResearchPersona): HomeQuickAction[] {
  return persona === 'teacher' ? TEACHER_ACTIONS : STUDENT_ACTIONS
}
