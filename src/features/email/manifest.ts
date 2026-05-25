/**
 * features/email/manifest.ts
 *
 * Email feature manifest — registered with src/app/featureRegistry.ts.
 * This file must not import from email/components or email/services.
 */

import type { ComponentType } from 'react'
import type { FeatureManifest } from '../../core/contracts/feature'

export const emailManifest: FeatureManifest = {
  id: 'email',
  displayName: '邮件',
  version: '1.0.0',
  nav: {
    section: 'work',
    label: '邮件收发',
    webVisible: true,
    electronVisible: true,
  },
  route: {
    section: 'work',
    component: () => import('../../pages/WorkWorkspace').then((m) => ({ default: m.default as ComponentType })),
  },
  bridges: [],
}
