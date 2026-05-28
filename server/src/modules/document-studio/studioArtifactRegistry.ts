import fs from 'fs'
import path from 'path'
import {
  createArtifactDir,
  getArtifact,
  saveArtifactMetadata,
  type Artifact,
  type ArtifactExport,
} from '../../artifacts/ArtifactStore'
import { bootstrapWorkspaceForUser } from '../../lib/workspaceAccess'
import { DOCUMENT_STUDIO_ROOT, type StudioDocumentRecord } from './documentArtifact.service'

export function registerStudioDocumentInArtifactIndex(
  record: StudioDocumentRecord,
  userId: string,
): void {
  const ctx = bootstrapWorkspaceForUser(userId)
  const exports = [
    {
      format: 'html',
      filename: `${sanitizeFilename(record.title)}.html`,
      url: `/api/document-studio/artifacts/${record.artifactId}/exports/${encodeURIComponent(`${sanitizeFilename(record.title)}.html`)}`,
    },
    {
      format: 'markdown',
      filename: `${sanitizeFilename(record.title)}.md`,
      url: `/api/document-studio/artifacts/${record.artifactId}/exports/${encodeURIComponent(`${sanitizeFilename(record.title)}.md`)}`,
    },
  ]
  const artifact: Artifact = {
    id: record.artifactId,
    userId,
    workspaceId: ctx.currentWorkspaceId,
    workspacePath: ctx.currentWorkspacePath,
    type: 'document',
    title: record.title,
    editable: true,
    createdBySkillId: 'document-studio',
    createdAt: record.createdAt,
    exports,
    documentId: record.documentId,
    metadata: {
      documentStudio: true,
      studioDocumentId: record.documentId,
      studioArtifactId: record.artifactId,
      documentType: record.documentType,
    },
  }
  saveArtifactMetadata(artifact)
  try {
    const dir = createArtifactDir(userId, ctx.currentWorkspaceId, record.artifactId)
    const studioHtml = path.join(DOCUMENT_STUDIO_ROOT, 'artifacts', record.artifactId, 'index.html')
    if (fs.existsSync(studioHtml)) {
      fs.copyFileSync(studioHtml, path.join(dir, 'output.html'))
    }
  } catch {
    // non-fatal
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 80) || 'document'
}

export function upsertStudioArtifactExport(artifactId: string, entry: ArtifactExport): void {
  const current = getArtifact(artifactId)
  if (!current) return
  const exports = [...(current.exports || [])]
  const pos = exports.findIndex(e => e.format === entry.format)
  if (pos >= 0) exports[pos] = entry
  else exports.push(entry)
  saveArtifactMetadata({ ...current, exports })
}
