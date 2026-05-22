/**
 * features/ppt/manifest.ts
 *
 * PPT feature manifest — registered with src/app/featureRegistry.ts.
 * This file must not import from ppt/components or ppt/services.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const pptManifest: FeatureManifest = {
  id: 'ppt',
  displayName: 'PPT',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: 'PPT 生成',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then(m => ({ default: m.default })),
  },
  bridges: ['document-to-ppt'],
}
