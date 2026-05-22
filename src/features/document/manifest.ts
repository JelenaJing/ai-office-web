/**
 * features/document/manifest.ts
 *
 * Document feature manifest — registered with src/app/featureRegistry.ts.
 * This file must not import from document/components or document/services.
 * It only references lazy page factories and declares metadata.
 */

import type { FeatureManifest } from '../../core/contracts/feature'

export const documentManifest: FeatureManifest = {
  id: 'document',
  displayName: '文稿',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: '文稿编辑',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then(m => ({ default: m.default })),
  },
  bridges: ['document-to-ppt'],
}
