/**
 * features/aios/manifest.ts
 *
 * AIOS Matter feature manifest — registered with src/app/featureRegistry.ts.
 * This file must not import from aios/components or aios/services.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const aiosManifest: FeatureManifest = {
  id: 'aios',
  displayName: 'AIOS 事项',
  version: '1.0.0',
  nav: {
    section: 'aios',
    label: 'AIOS 事项中心',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'aios',
    component: () => import('./components/AIOSHome').then(m => ({ default: m.default })),
  },
  bridges: [],
}
