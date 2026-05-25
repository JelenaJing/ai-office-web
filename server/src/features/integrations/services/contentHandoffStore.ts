import { randomUUID } from 'crypto'
import type { DocumentTaskResult } from '../../document/types'

export type ContentHandoffStatus = 'ready' | 'expired' | 'failed'

export interface ContentHandoffUserSnapshot {
  id: string
  username: string
  displayName?: string
  email?: string
}

export interface ContentHandoffRecord {
  handoffId: string
  userId: string
  user: ContentHandoffUserSnapshot
  accessToken: string
  targetPage: 'word'
  workspacePath: string
  documentId: string
  artifactId: string
  exportUrl: string
  filename: string
  title: string
  sourceApp?: string
  externalId?: string
  metadata?: Record<string, unknown>
  status: ContentHandoffStatus
  result: DocumentTaskResult
  createdAt: string
  expiresAt: number
}

const HANDOFF_TTL_MS = 24 * 60 * 60 * 1000
const handoffs = new Map<string, ContentHandoffRecord>()
const externalIndex = new Map<string, string>()

function externalKey(sourceApp: string, externalId: string, userId: string): string {
  return `${userId}::${sourceApp}::${externalId}`
}

setInterval(() => {
  const now = Date.now()
  for (const [id, record] of handoffs.entries()) {
    if (record.expiresAt <= now) {
      handoffs.delete(id)
      if (record.sourceApp && record.externalId) {
        externalIndex.delete(externalKey(record.sourceApp, record.externalId, record.userId))
      }
    }
  }
}, 10 * 60 * 1000).unref()

export function saveContentHandoff(
  input: Omit<ContentHandoffRecord, 'handoffId' | 'createdAt' | 'expiresAt' | 'status'> & {
    handoffId?: string
    status?: ContentHandoffStatus
  },
): ContentHandoffRecord {
  const now = Date.now()
  const record: ContentHandoffRecord = {
    handoffId: input.handoffId || randomUUID(),
    userId: input.userId,
    user: input.user,
    accessToken: input.accessToken,
    targetPage: input.targetPage,
    workspacePath: input.workspacePath,
    documentId: input.documentId,
    artifactId: input.artifactId,
    exportUrl: input.exportUrl,
    filename: input.filename,
    title: input.title,
    sourceApp: input.sourceApp,
    externalId: input.externalId,
    metadata: input.metadata,
    status: input.status || 'ready',
    result: input.result,
    createdAt: new Date(now).toISOString(),
    expiresAt: now + HANDOFF_TTL_MS,
  }
  handoffs.set(record.handoffId, record)
  if (record.sourceApp && record.externalId) {
    externalIndex.set(externalKey(record.sourceApp, record.externalId, record.userId), record.handoffId)
  }
  return record
}

export function getContentHandoff(handoffId: string): ContentHandoffRecord | undefined {
  const record = handoffs.get(handoffId)
  if (!record) return undefined
  if (record.expiresAt <= Date.now()) {
    record.status = 'expired'
    return record
  }
  return record
}

export function findContentHandoffByExternalId(input: {
  userId: string
  sourceApp: string
  externalId: string
}): ContentHandoffRecord | undefined {
  const handoffId = externalIndex.get(externalKey(input.sourceApp, input.externalId, input.userId))
  if (!handoffId) return undefined
  const record = getContentHandoff(handoffId)
  if (!record || record.status === 'expired') {
    externalIndex.delete(externalKey(input.sourceApp, input.externalId, input.userId))
    return undefined
  }
  return record
}

export function toPublicHandoffPayload(record: ContentHandoffRecord) {
  return {
    handoffId: record.handoffId,
    targetPage: record.targetPage,
    documentId: record.documentId,
    workspacePath: record.workspacePath,
    title: record.title,
    status: record.status,
    artifactId: record.artifactId,
    exportUrl: record.exportUrl,
    filename: record.filename,
    result: record.result,
    metadata: record.metadata,
    sourceApp: record.sourceApp,
    externalId: record.externalId,
    createdAt: record.createdAt,
    user: record.user,
  }
}
