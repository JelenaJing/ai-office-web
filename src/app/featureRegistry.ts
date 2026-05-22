/**
 * app/featureRegistry.ts
 *
 * Central feature registry — the app shell uses this to discover features
 * without importing their internal components directly.
 *
 * Features register themselves via manifest.ts.
 * App.tsx should import from featureRegistry, not from feature internals.
 *
 * Usage:
 *   import { getFeatureManifests, getFeatureManifest } from '@/app/featureRegistry'
 */

import type { FeatureManifest } from '../core/contracts/feature'

// ── Import feature manifests ──────────────────────────────────────────────────
// Each manifest.ts is a thin file with no side effects.

import { documentManifest } from '../features/document/manifest'
import { pptManifest } from '../features/ppt/manifest'
import { emailManifest } from '../features/email/manifest'
import { aiosManifest } from '../features/aios/manifest'

// ── Registry ──────────────────────────────────────────────────────────────────

const REGISTRY: FeatureManifest[] = [
  documentManifest,
  pptManifest,
  emailManifest,
  aiosManifest,
]

/** Returns all registered feature manifests in registration order. */
export function getFeatureManifests(): FeatureManifest[] {
  return REGISTRY
}

/** Returns the manifest for a specific feature by id, or undefined. */
export function getFeatureManifest(id: string): FeatureManifest | undefined {
  return REGISTRY.find(m => m.id === id)
}

/** Returns all features whose nav entry should be visible in current mode. */
export function getVisibleNavEntries(mode: 'web' | 'electron'): FeatureManifest[] {
  return REGISTRY.filter(m => {
    if (mode === 'web') return m.nav.webVisible !== false
    return m.nav.electronVisible !== false
  })
}

export type { FeatureManifest }
