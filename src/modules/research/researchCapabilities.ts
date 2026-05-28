import type { LucideIcon } from 'lucide-react'
import {
  Lightbulb,
  LineChart,
  Beaker,
  FlaskConical,
  Battery,
  BookOpen,
  Newspaper,
  Atom,
} from 'lucide-react'

export interface ResearchCapability {
  id: string
  title: string
  description: string
  path: string
  icon: LucideIcon
  accent: 'blue' | 'cyan' | 'violet' | 'amber' | 'emerald'
  /** 对外展示能力（首页能力墙） */
  showcase: boolean
}

/** 首页能力入口：实际使用时每人常用其中几项，首页统一展示能力墙便于对外演示 */
export const RESEARCH_CAPABILITIES: ResearchCapability[] = [
  {
    id: 'ideas',
    title: '创意 Feed',
    description: '从论文或摘要生成研究创意，并智能排序',
    path: '/research/tools/ideas',
    icon: Lightbulb,
    accent: 'amber',
    showcase: true,
  },
  {
    id: 'plot',
    title: '模板画图',
    description: '上传实验数据，生成 matplotlib 科研图表',
    path: '/research/tools/plot',
    icon: LineChart,
    accent: 'cyan',
    showcase: true,
  },
  {
    id: 'formulation',
    title: '配方推荐',
    description: '基于目标性能与单体库给出配方方案',
    path: '/research/tools/formulation',
    icon: Beaker,
    accent: 'blue',
    showcase: true,
  },
  {
    id: 'property',
    title: '性能预测',
    description: '预测聚合物关键力学与理化指标',
    path: '/research/tools/property',
    icon: FlaskConical,
    accent: 'violet',
    showcase: true,
  },
  {
    id: 'battery',
    title: '电池性能预测',
    description: '循环、倍率等电化学性能建模分析',
    path: '/research/tools/battery',
    icon: Battery,
    accent: 'emerald',
    showcase: true,
  },
  {
    id: 'eln',
    title: '实验记录',
    description: 'ELN 记录实验过程、附件与审核状态',
    path: '/research/tools/eln',
    icon: BookOpen,
    accent: 'blue',
    showcase: true,
  },
  {
    id: 'literature',
    title: '论文推荐详情',
    description: '查看完整每日推荐列表与摘要',
    path: '/research/tools/literature',
    icon: Newspaper,
    accent: 'cyan',
    showcase: true,
  },
  {
    id: 'materials',
    title: '硬碳选材',
    description: '电池负极材料库检索与实验方案',
    path: '/research/tools/materials',
    icon: Atom,
    accent: 'violet',
    showcase: true,
  },
]

export const SHOWCASE_CAPABILITIES = RESEARCH_CAPABILITIES.filter(c => c.showcase)
