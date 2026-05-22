/**
 * matterRuntime.ts — API client for AIOS matter endpoints
 */

import type {
  Matter,
  MatterEvidence,
  AuditEvent,
  DecisionPackage,
  MatterStatus,
  MatterPriority,
  MatterSourceType,
  EvidenceType,
} from '../types'

const BASE = '/api/aios'

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Matters ───────────────────────────────────────────────────────────────────

export async function listMatters(status?: MatterStatus): Promise<Matter[]> {
  const qs = status ? `?status=${status}` : ''
  const data = await request<{ matters: Matter[] }>('GET', `/matters${qs}`)
  return data.matters
}

export async function getMatter(
  id: string,
): Promise<{ matter: Matter; evidence: MatterEvidence[] }> {
  return request('GET', `/matters/${id}`)
}

export async function createMatter(input: {
  title: string
  goal?: string
  sourceType?: MatterSourceType
  status?: MatterStatus
  priority?: MatterPriority
  workspacePath?: string
}): Promise<Matter> {
  const data = await request<{ matter: Matter }>('POST', '/matters', input)
  return data.matter
}

// ── Email → Matter ────────────────────────────────────────────────────────────

export interface EmailAttachmentInput {
  id?: string
  filename: string
  contentType?: string
  size?: number
}

export interface CreateMatterFromEmailInput {
  workspacePath?: string
  email: {
    id: string
    subject: string
    from: string
    to?: string
    body: string
    timestamp?: string
    attachments?: EmailAttachmentInput[]
  }
  priority?: MatterPriority
}

export async function createMatterFromEmail(
  input: CreateMatterFromEmailInput,
): Promise<{ matter: Matter; evidence: MatterEvidence[] }> {
  return request('POST', '/matters/from-email', input)
}

export async function updateMatter(
  id: string,
  input: {
    title?: string
    goal?: string
    status?: MatterStatus
    priority?: MatterPriority
  },
): Promise<Matter> {
  const data = await request<{ matter: Matter }>('PATCH', `/matters/${id}`, input)
  return data.matter
}

export async function deleteMatter(id: string): Promise<void> {
  await request('DELETE', `/matters/${id}`)
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function listEvidence(matterId: string): Promise<MatterEvidence[]> {
  const data = await request<{ evidence: MatterEvidence[] }>('GET', `/matters/${matterId}/evidence`)
  return data.evidence
}

export async function addEvidence(
  matterId: string,
  input: { type: EvidenceType; title: string; content?: string; sourceRef?: string },
): Promise<MatterEvidence> {
  const data = await request<{ evidence: MatterEvidence }>(
    'POST',
    `/matters/${matterId}/evidence`,
    input,
  )
  return data.evidence
}

export async function deleteEvidence(matterId: string, evidenceId: string): Promise<void> {
  await request('DELETE', `/matters/${matterId}/evidence/${evidenceId}`)
}

// ── Decision Package ──────────────────────────────────────────────────────────

export async function generateDecisionPackage(matterId: string): Promise<DecisionPackage> {
  const data = await request<{ decisionPackage: DecisionPackage }>(
    'POST',
    `/matters/${matterId}/decision-package`,
  )
  return data.decisionPackage
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export async function getAuditTrail(matterId: string): Promise<AuditEvent[]> {
  const data = await request<{ events: AuditEvent[] }>('GET', `/matters/${matterId}/audit`)
  return data.events
}

// ── Artifact Generation ───────────────────────────────────────────────────────

export interface GeneratedArtifact {
  id: string
  type: string
  title: string
  createdAt: string
  exports?: Array<{ format: string; filename: string }>
}

export async function generateReplyDraft(matterId: string): Promise<GeneratedArtifact> {
  const data = await request<{ artifact: GeneratedArtifact }>(
    'POST',
    `/matters/${matterId}/generate-reply`,
  )
  return data.artifact
}

export async function generateDocumentArtifact(matterId: string): Promise<GeneratedArtifact> {
  const data = await request<{ artifact: GeneratedArtifact }>(
    'POST',
    `/matters/${matterId}/generate-document`,
  )
  return data.artifact
}

export async function generatePptArtifact(matterId: string): Promise<GeneratedArtifact> {
  const data = await request<{ artifact: GeneratedArtifact }>(
    'POST',
    `/matters/${matterId}/generate-ppt`,
  )
  return data.artifact
}
