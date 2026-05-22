/**
 * features/data-analysis/manifest.ts
 *
 * Data Analysis (Excel) feature manifest.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const dataAnalysisManifest: FeatureManifest = {
  id: 'data-analysis',
  displayName: '数据分析',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: '数据分析',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then(m => ({ default: m.default })),
  },
  bridges: [],
}
