/**
 * core/contracts/matter.ts
 *
 * Canonical type contracts for the AIOS Matter / WorkItem module.
 *
 * These types are shared between:
 *   - src/features/aios/  (frontend)
 *   - server/src/features/aios/  (server — has its own copy, keep in sync)
 *   - src/bridges/*       (bridge transformations)
 *
 * Rules:
 *   - Pure TypeScript types only — no runtime code.
 *   - Must not import from src/features/ or src/platform/.
 */

import type { ArtifactRef } from './artifact'

// ── Primitive enums ───────────────────────────────────────────────────────────

export type MatterSourceType = 'manual' | 'email' | 'document' | 'upload'
export type MatterStatus = 'new' | 'todo' | 'doing' | 'waiting' | 'done' | 'archived'
export type MatterPriority = 'urgent' | 'important' | 'normal' | 'low'
export type EvidenceType = 'email' | 'attachment' | 'file' | 'note' | 'knowledge'

export type AuditAction =
  | 'create_matter'
  | 'update_matter'
  | 'add_evidence'
  | 'delete_evidence'
  | 'generate_decision_package'
  | 'change_status'
  | 'delete_matter'
  | 'create_matter_from_email'
  | 'add_email_evidence'
  | 'add_attachment_evidence'
  | 'generate_reply_draft'
  | 'generate_document_artifact'
  | 'generate_ppt_artifact'

// ── Core entities ─────────────────────────────────────────────────────────────

/** A unit of work managed by AIOS. */
export interface Matter {
  id: string
  tenantId: string
  userId: string
  workspacePath: string
  title: string
  goal: string
  sourceType: MatterSourceType
  status: MatterStatus
  priority: MatterPriority
  evidenceIds: string[]
  artifactIds: string[]
  decisionPackage?: DecisionPackage
  createdAt: string
  updatedAt: string
}

/** Supporting evidence attached to a Matter. */
export interface MatterEvidence {
  id: string
  matterId: string
  type: EvidenceType
  title: string
  content: string
  sourceRef: string
  createdAt: string
}

/** An immutable audit trail entry. */
export interface AuditEvent {
  id: string
  matterId: string
  actorId: string
  action: AuditAction
  detail: Record<string, unknown>
  createdAt: string
}

// ── Decision package ──────────────────────────────────────────────────────────

/** AI-generated structured analysis for a Matter. */
export interface DecisionPackage {
  matterId: string
  generatedAt: string
  summary: string
  knownFacts: string[]
  missingMaterials: string[]
  riskPoints: string[]
  suggestedActions: string[]
}

// ── Cross-boundary references ─────────────────────────────────────────────────

/** Minimal reference to a Matter used across feature boundaries. */
export interface MatterRef {
  id: string
  title: string
  status: MatterStatus
  priority: MatterPriority
  artifactIds: string[]
}

/** Request to create a Matter from an email. Used by the email→matter bridge. */
export interface CreateMatterFromEmailRequest {
  workspacePath: string
  email: {
    id: string
    subject: string
    from: string
    to: string
    body: string
    timestamp: string
    attachments?: Array<{ id: string; filename: string }>
  }
}

/** Result returned when a Matter is created from an email. */
export interface CreateMatterFromEmailResult {
  matter: Matter
  evidence: MatterEvidence[]
  artifacts: ArtifactRef[]
}
