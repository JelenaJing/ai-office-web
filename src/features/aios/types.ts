/**
 * AIOS Matter frontend types — mirrors server/src/features/aios/types.ts
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
  action: string
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

export const STATUS_LABELS: Record<MatterStatus, string> = {
  new: '新建',
  todo: '待处理',
  doing: '处理中',
  waiting: '等待中',
  done: '已完成',
  archived: '已归档',
}

export const PRIORITY_LABELS: Record<MatterPriority, string> = {
  urgent: '紧急',
  important: '重要',
  normal: '普通',
  low: '低优先',
}

export const PRIORITY_COLORS: Record<MatterPriority, string> = {
  urgent: '#e53e3e',
  important: '#dd6b20',
  normal: '#3182ce',
  low: '#718096',
}

export const STATUS_COLORS: Record<MatterStatus, string> = {
  new: '#805ad5',
  todo: '#3182ce',
  doing: '#d69e2e',
  waiting: '#718096',
  done: '#38a169',
  archived: '#a0aec0',
}
