/**
 * AIOS Matter / WorkItem types
 */

export type MatterSourceType = 'manual' | 'email' | 'document' | 'upload'
export type MatterStatus = 'new' | 'todo' | 'doing' | 'waiting' | 'done' | 'archived'
export type MatterPriority = 'urgent' | 'important' | 'normal' | 'low'
export type EvidenceType = 'email' | 'attachment' | 'file' | 'note' | 'knowledge'

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

export interface MatterEvidence {
  id: string
  matterId: string
  type: EvidenceType
  title: string
  content: string
  sourceRef: string
  createdAt: string
}

export interface AuditEvent {
  id: string
  matterId: string
  actorId: string
  action:
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
  detail: Record<string, unknown>
  createdAt: string
}

export interface DecisionPackage {
  matterId: string
  generatedAt: string
  summary: string
  knownFacts: string[]
  missingMaterials: string[]
  riskPoints: string[]
  suggestedActions: string[]
}

// ── Persist layer types ────────────────────────────────────────────────────────

export interface MatterIndex {
  matters: Matter[]
}

export interface EvidenceIndex {
  evidence: MatterEvidence[]
}
