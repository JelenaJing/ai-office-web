/**
 * app/navigationRegistry.ts
 *
 * Navigation registry — maps PrimarySection values to their feature manifest.
 *
 * Separation of concerns:
 *   featureRegistry.ts  — knows about all features (manifests, capabilities)
 *   navigationRegistry.ts — knows how sections map to features for nav rendering
 *
 * App.tsx / PrimaryNav should import from navigationRegistry, not hardcode section arrays.
 *
 * Usage:
 *   import { getNavEntries, getSectionFeature } from '@/app/navigationRegistry'
 */

import { getFeatureManifests } from './featureRegistry'
import type { FeatureManifest, FeatureNavEntry } from '../core/contracts/feature'

/** A nav entry enriched with its parent manifest id. */
export interface NavEntry extends FeatureNavEntry {
  featureId: string
}

/**
 * Returns all navigation entries visible in the given mode, ordered by
 * registration order in featureRegistry.
 */
export function getNavEntries(mode: 'web' | 'electron'): NavEntry[] {
  return getFeatureManifests()
    .filter(m => {
      if (mode === 'web') return m.nav.webVisible !== false
      return m.nav.electronVisible !== false
    })
    .map(m => ({ ...m.nav, featureId: m.id }))
}

/**
 * Returns nav entries for a specific primary section.
 * Multiple features can share a section (e.g. document + ppt both in 'work').
 */
export function getNavEntriesForSection(section: string, mode: 'web' | 'electron'): NavEntry[] {
  return getNavEntries(mode).filter(e => e.section === section)
}

/**
 * Returns the first feature manifest registered for a given nav section.
 */
export function getSectionFeature(section: string): FeatureManifest | undefined {
  return getFeatureManifests().find(m => m.nav.section === section)
}

/**
 * Returns all unique section strings in registration order.
 * Useful for generating nav tabs without duplicates.
 */
export function getUniqueSections(mode: 'web' | 'electron'): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const entry of getNavEntries(mode)) {
    if (!seen.has(entry.section)) {
      seen.add(entry.section)
      result.push(entry.section)
    }
  }
  return result
}
