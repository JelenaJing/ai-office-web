export type FeatureRouteMeta = { title: string; subtitle?: string }

export const FEATURE_ROUTE_META: Record<string, FeatureRouteMeta> = {
  '/research/tools/ideas': {
    title: '创意 Feed',
    subtitle: '论文 / 摘要 → 研究创意',
  },
  '/research/tools/plot': {
    title: '模板画图',
    subtitle: '实验数据 → 科研图',
  },
  '/research/tools/literature': { title: '每日论文推荐' },
  '/research/tools/formulation': { title: '配方推荐' },
  '/research/tools/property': { title: '性能预测' },
  '/research/tools/battery': { title: '电池性能预测' },
  '/research/tools/materials': { title: '硬碳选材库' },
  '/research/tools/eln': { title: '实验记录 ELN' },
  '/research/tools/teacher/eln-review': { title: '实验记录审核' },
  '/research/tools/teacher/students': { title: '学生进展' },
}

export function resolveFeatureMeta(pathname: string): FeatureRouteMeta | undefined {
  return FEATURE_ROUTE_META[pathname]
}
