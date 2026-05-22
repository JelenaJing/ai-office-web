/**
 * matterService.ts — CRUD for Matters and Evidence with audit logging
 */

import { randomUUID } from 'crypto'
import { readMatters, writeMatters, readEvidence, writeEvidence } from './matterStore'
import { logAudit } from './auditTrailService'
import type {
  Matter,
  MatterEvidence,
  MatterSourceType,
  MatterStatus,
  MatterPriority,
  EvidenceType,
  MatterRouteType,
} from '../types'

// ── Matters ───────────────────────────────────────────────────────────────────

export interface CreateMatterInput {
  title: string
  goal?: string
  sourceType?: MatterSourceType
  status?: MatterStatus
  priority?: MatterPriority
  workspacePath?: string
  tenantId?: string
  routeType?: MatterRouteType
}

export function listMatters(userId: string, status?: MatterStatus): Matter[] {
  const { matters } = readMatters(userId)
  if (status) return matters.filter(m => m.status === status)
  return matters.filter(m => m.status !== 'archived')
}

export function getMatter(userId: string, matterId: string): Matter | null {
  const { matters } = readMatters(userId)
  return matters.find(m => m.id === matterId && m.userId === userId) ?? null
}

export function createMatter(userId: string, input: CreateMatterInput): Matter {
  const now = new Date().toISOString()
  const matter: Matter = {
    id: randomUUID(),
    tenantId: input.tenantId ?? userId,
    userId,
    workspacePath: input.workspacePath ?? `web-workspace:${userId}`,
    title: input.title.trim(),
    goal: input.goal?.trim() ?? '',
    sourceType: input.sourceType ?? 'manual',
    status: input.status ?? 'draft',
    routeType: input.routeType ?? 'point_to_point',
    priority: input.priority ?? 'normal',
    evidenceIds: [],
    artifactIds: [],
    createdAt: now,
    updatedAt: now,
  }
  const index = readMatters(userId)
  index.matters.push(matter)
  writeMatters(userId, index)
  logAudit(userId, matter.id, 'create_matter', { title: matter.title, priority: matter.priority, routeType: matter.routeType })
  return matter
}

export interface UpdateMatterInput {
  title?: string
  goal?: string
  status?: MatterStatus
  priority?: MatterPriority
  workspacePath?: string
  routeType?: MatterRouteType
}

export function updateMatter(
  userId: string,
  matterId: string,
  input: UpdateMatterInput,
): Matter | null {
  const index = readMatters(userId)
  const idx = index.matters.findIndex(m => m.id === matterId && m.userId === userId)
  if (idx === -1) return null

  const prev = index.matters[idx]
  const statusChanged = input.status !== undefined && input.status !== prev.status

  const updated: Matter = {
    ...prev,
    ...(input.title !== undefined && { title: input.title.trim() }),
    ...(input.goal !== undefined && { goal: input.goal.trim() }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.workspacePath !== undefined && { workspacePath: input.workspacePath }),
    ...(input.routeType !== undefined && { routeType: input.routeType }),
    updatedAt: new Date().toISOString(),
  }
  index.matters[idx] = updated
  writeMatters(userId, index)

  if (statusChanged) {
    logAudit(userId, matterId, 'change_status', {
      from: prev.status,
      to: input.status,
    })
  } else {
    logAudit(userId, matterId, 'update_matter', { fields: Object.keys(input) })
  }

  return updated
}

export function deleteMatter(userId: string, matterId: string): boolean {
  const index = readMatters(userId)
  const before = index.matters.length
  index.matters = index.matters.filter(m => !(m.id === matterId && m.userId === userId))
  if (index.matters.length === before) return false
  writeMatters(userId, index)

  // Also remove evidence for this matter
  const evIndex = readEvidence(userId)
  evIndex.evidence = evIndex.evidence.filter(e => e.matterId !== matterId)
  writeEvidence(userId, evIndex)

  logAudit(userId, matterId, 'delete_matter', {})
  return true
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export interface AddEvidenceInput {
  type: EvidenceType
  title: string
  content?: string
  sourceRef?: string
  artifactId?: string
  knowledgeVerificationStatus?: 'verified' | 'partial' | 'unverified'
}

export function getEvidence(userId: string, matterId: string): MatterEvidence[] {
  const { evidence } = readEvidence(userId)
  return evidence.filter(e => e.matterId === matterId)
}

export function addEvidence(
  userId: string,
  matterId: string,
  input: AddEvidenceInput,
): MatterEvidence | null {
  // verify matter belongs to user
  if (!getMatter(userId, matterId)) return null

  const ev: MatterEvidence = {
    id: randomUUID(),
    matterId,
    type: input.type,
    title: input.title.trim(),
    content: input.content?.trim() ?? '',
    sourceRef: input.sourceRef?.trim() ?? '',
    artifactId: input.artifactId?.trim(),
    knowledgeVerificationStatus: input.knowledgeVerificationStatus ?? (input.type === 'knowledge' ? 'partial' : undefined),
    createdAt: new Date().toISOString(),
  }

  const evIndex = readEvidence(userId)
  evIndex.evidence.push(ev)
  writeEvidence(userId, evIndex)

  // Add evidenceId to matter
  const matterIndex = readMatters(userId)
  const mIdx = matterIndex.matters.findIndex(m => m.id === matterId)
  if (mIdx !== -1) {
    matterIndex.matters[mIdx].evidenceIds.push(ev.id)
    if (matterIndex.matters[mIdx].status === 'draft' || matterIndex.matters[mIdx].status === 'new' || matterIndex.matters[mIdx].status === 'todo') {
      const from = matterIndex.matters[mIdx].status
      matterIndex.matters[mIdx].status = 'collecting_evidence'
      logAudit(userId, matterId, 'change_status', { from, to: 'collecting_evidence' })
    }
    matterIndex.matters[mIdx].updatedAt = new Date().toISOString()
    writeMatters(userId, matterIndex)
  }

  logAudit(userId, matterId, 'add_evidence', { evidenceId: ev.id, type: ev.type, title: ev.title })
  return ev
}

// ── Email → Matter ────────────────────────────────────────────────────────────

export interface EmailAttachmentInput {
  id?: string
  filename: string
  contentType?: string
  size?: number
}

export interface EmailInput {
  id: string
  subject: string
  from: string
  to?: string
  body: string
  timestamp?: string
  attachments?: EmailAttachmentInput[]
}

export interface CreateMatterFromEmailInput {
  workspacePath?: string
  email: EmailInput
  priority?: MatterPriority
}

export function createMatterFromEmail(
  userId: string,
  input: CreateMatterFromEmailInput,
): { matter: Matter; evidence: MatterEvidence[] } {
  const { email, workspacePath, priority } = input

  const title = email.subject.trim() || '(无主题邮件)'
  const goal = `处理来自"${email.from}"的邮件事项：${title}`

  const matter = createMatter(userId, {
    title,
    goal,
    sourceType: 'email',
    status: 'new',
    priority: priority ?? 'normal',
    workspacePath,
    routeType: 'point_to_point',
  })

  logAudit(userId, matter.id, 'create_matter_from_email', {
    emailId: email.id,
    subject: email.subject,
    from: email.from,
  })

  const evidenceList: MatterEvidence[] = []

  // Add email body as email-type evidence
  const emailEv = addEvidence(userId, matter.id, {
    type: 'email',
    title: title,
    content: email.body.slice(0, 2000),
    sourceRef: email.id,
  })
  if (emailEv) {
    evidenceList.push(emailEv)
    logAudit(userId, matter.id, 'add_email_evidence', {
      evidenceId: emailEv.id,
      emailId: email.id,
    })
  }

  // Add attachment placeholders
  for (const att of email.attachments ?? []) {
    const attEv = addEvidence(userId, matter.id, {
      type: 'attachment',
      title: att.filename,
      content: '附件已关联，后续接入文件抽取',
      sourceRef: att.id ?? att.filename,
    })
    if (attEv) {
      evidenceList.push(attEv)
      logAudit(userId, matter.id, 'add_attachment_evidence', {
        evidenceId: attEv.id,
        filename: att.filename,
      })
    }
  }

  return { matter, evidence: evidenceList }
}

export function deleteEvidence(
  userId: string,
  matterId: string,
  evidenceId: string,
): boolean {
  if (!getMatter(userId, matterId)) return false

  const evIndex = readEvidence(userId)
  const before = evIndex.evidence.length
  evIndex.evidence = evIndex.evidence.filter(
    e => !(e.id === evidenceId && e.matterId === matterId),
  )
  if (evIndex.evidence.length === before) return false
  writeEvidence(userId, evIndex)

  // Remove from matter.evidenceIds
  const matterIndex = readMatters(userId)
  const mIdx = matterIndex.matters.findIndex(m => m.id === matterId)
  if (mIdx !== -1) {
    matterIndex.matters[mIdx].evidenceIds = matterIndex.matters[mIdx].evidenceIds.filter(
      id => id !== evidenceId,
    )
    matterIndex.matters[mIdx].updatedAt = new Date().toISOString()
    writeMatters(userId, matterIndex)
  }

  logAudit(userId, matterId, 'delete_evidence', { evidenceId })
  return true
}
