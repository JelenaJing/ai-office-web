/**
 * features/image/manifest.ts
 *
 * Image Generation feature manifest.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const imageManifest: FeatureManifest = {
  id: 'image',
  displayName: '图片生成',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: '图片生成',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then(m => ({ default: m.default })),
  },
  bridges: [],
}
