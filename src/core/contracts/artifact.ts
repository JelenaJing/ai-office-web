/**
 * core/contracts/artifact.ts
 *
 * Canonical Artifact contract — shared by all feature modules.
 * Features must produce ArtifactRef or Artifact when generating output.
 * Features must not directly depend on each other's artifact implementations.
 */

export type ArtifactType =
  | 'document'
  | 'presentation'
  | 'image'
  | 'excel_analysis'
  | 'daily_report'
  | 'email_draft'
  | 'decision_package'
  | 'report'
  | (string & Record<never, never>) // extensible

export interface ArtifactExport {
  format: string
  filename: string
}

/** Minimal Artifact reference used for cross-module passing. */
export interface ArtifactRef {
  id: string
  type: ArtifactType
  title: string
  createdAt: string
  exports?: ArtifactExport[]
}

/** Full Artifact record (superset of ArtifactRef). */
export interface ArtifactRecord extends ArtifactRef {
  userId: string
  workspaceId?: string
  workspacePath?: string
  editable?: boolean
  createdBySkillId?: string
}
