import fs from 'fs'
import path from 'path'
import { parseClientPath, WORKSPACES_ROOT, workspaceDir } from '../../../lib/workspaceStore'
import type { DocumentRecord } from '../types'

function documentsDir(userId: string, workspaceId: string): string {
  return path.join(workspaceDir(userId, workspaceId), 'documents')
}

function recordPath(userId: string, workspaceId: string, documentId: string): string {
  return path.join(documentsDir(userId, workspaceId), `${documentId}.json`)
}

function resolveWorkspaceId(record: DocumentRecord): string | null {
  const parsed = parseClientPath(record.workspacePath)
  if (!parsed || parsed.userId !== record.userId) return null
  return parsed.wsId
}

export function persistDocumentRecordToDisk(record: DocumentRecord): void {
  const workspaceId = resolveWorkspaceId(record)
  if (!workspaceId) return
  const dir = documentsDir(record.userId, workspaceId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(recordPath(record.userId, workspaceId, record.documentId), JSON.stringify(record, null, 2), 'utf-8')
}

export function loadDocumentRecordFromDisk(userId: string, documentId: string): DocumentRecord | null {
  const trimmed = String(documentId || '').trim()
  if (!trimmed) return null

  const workspacesRoot = path.join(WORKSPACES_ROOT, userId)
  if (!fs.existsSync(workspacesRoot)) return null

  for (const workspaceId of fs.readdirSync(workspacesRoot)) {
    const filePath = recordPath(userId, workspaceId, trimmed)
    if (!fs.existsSync(filePath)) continue
    try {
      const record = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DocumentRecord
      if (record.documentId === trimmed && record.userId === userId) {
        return record
      }
    } catch {
      continue
    }
  }
  return null
}
