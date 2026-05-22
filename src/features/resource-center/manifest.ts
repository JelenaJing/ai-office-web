/**
 * features/resource-center/manifest.ts
 *
 * Resource Center feature manifest.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const resourceCenterManifest: FeatureManifest = {
  id: 'resource-center',
  displayName: '资源中心',
  version: '1.0.0',
  nav: {
    section: 'resource',
    label: '资源中心',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'resource',
    component: () => import('../../pages/ResourceWorkspace').then(m => ({ default: m.default })),
  },
  bridges: [],
}
