/**
 * AIOS Matter / WorkItem types
 */

export type MatterSourceType = 'manual' | 'email' | 'document' | 'upload'
export type MatterStatus = 'draft' | 'collecting_evidence' | 'decision_package_ready' | 'completed' | 'new' | 'todo' | 'doing' | 'waiting' | 'done' | 'archived'
export type MatterPriority = 'urgent' | 'important' | 'normal' | 'low'
export type EvidenceType = 'email' | 'attachment' | 'file' | 'note' | 'knowledge'
export type MatterRouteType = 'point_to_point' | 'point_to_many'

export interface Matter {
  id: string
  tenantId: string
  userId: string
  workspacePath: string
  title: string
  goal: string
  sourceType: MatterSourceType
  status: MatterStatus
  routeType: MatterRouteType
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
  artifactId?: string
  knowledgeVerificationStatus?: 'verified' | 'partial' | 'unverified'
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
    | 'generate_reply_draft'
    | 'generate_document_artifact'
    | 'generate_ppt_artifact'
    | 'complete_matter'
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
  sourceReferences: Array<{ type: EvidenceType; evidenceId: string; sourceRef: string; title: string; artifactId?: string }>
  knowledgeVerificationStatus: 'verified' | 'partial' | 'unverified'
}

// ── Persist layer types ────────────────────────────────────────────────────────

export interface MatterIndex {
  matters: Matter[]
}

export interface EvidenceIndex {
  evidence: MatterEvidence[]
}
