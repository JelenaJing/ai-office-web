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
    status: input.status ?? 'new',
    priority: input.priority ?? 'normal',
    evidenceIds: [],
    artifactIds: [],
    createdAt: now,
    updatedAt: now,
  }
  const index = readMatters(userId)
  index.matters.push(matter)
  writeMatters(userId, index)
  logAudit(userId, matter.id, 'create_matter', { title: matter.title, priority: matter.priority })
  return matter
}

export interface UpdateMatterInput {
  title?: string
  goal?: string
  status?: MatterStatus
  priority?: MatterPriority
  workspacePath?: string
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
    matterIndex.matters[mIdx].updatedAt = new Date().toISOString()
    writeMatters(userId, matterIndex)
  }

  logAudit(userId, matterId, 'add_evidence', { evidenceId: ev.id, type: ev.type, title: ev.title })
  return ev
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
