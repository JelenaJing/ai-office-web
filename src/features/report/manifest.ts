/**
 * features/report/manifest.ts
 *
 * Daily Report feature manifest.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const reportManifest: FeatureManifest = {
  id: 'report',
  displayName: '日报',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: '日报生成',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then(m => ({ default: m.default })),
  },
  bridges: [],
}
