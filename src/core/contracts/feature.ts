/**
 * core/contracts/feature.ts
 *
 * FeatureManifest — the interface every feature module must implement
 * to register itself with the application shell.
 *
 * The app shell (featureRegistry, App.tsx) should only depend on manifests,
 * never on internal feature components or services directly.
 */

import type { ComponentType } from 'react'

/** Navigation metadata for a feature's primary nav entry. */
export interface FeatureNavEntry {
  /** Unique key matching PrimarySection in PrimaryNav */
  section: string
  label: string
  icon?: string
  /** Whether this entry is visible in Web mode */
  webVisible?: boolean
  /** Whether this entry is visible in Electron mode */
  electronVisible?: boolean
}

/** Lazy-loaded page component for routing. */
export type FeaturePageFactory = () => Promise<{ default: ComponentType }>

/** Route produced by a feature manifest. */
export interface FeatureRoute {
  section: string
  /** The workspace/page component for this section. */
  component: FeaturePageFactory | ComponentType
}

/**
 * FeatureManifest — must be exported from each feature's manifest.ts.
 * The app registry reads manifests without importing internal feature code.
 */
export interface FeatureManifest {
  /** Unique feature identifier, e.g. 'document', 'ppt', 'email' */
  id: string
  /** Human-readable display name */
  displayName: string
  /** Version for traceability */
  version: string
  /** Nav entry for primary navigation */
  nav: FeatureNavEntry
  /** Route registration */
  route: FeatureRoute
  /** Optional dependencies on other features (by id). Documented only — not enforced at runtime. */
  dependencies?: string[]
  /** List of bridges this feature participates in as producer or consumer. */
  bridges?: string[]
}
