import { updateArtifact } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { sanitizeFilename } from '../skills/documentSessionBuilder'
import { buildDocumentDraftDocxBuffer } from './documentDraftDocx'
import { buildDocumentSessionFromDraft } from './documentDraft'
import { buildWorkbenchDocumentArtifact } from './documentWorkbenchArtifact'
import type { DocumentDraft, DocumentKnowledgeRef, DocumentWorkbenchArtifact } from '../types'
import { toArtifactKnowledgeRefs, toArtifactSourceRefs } from './documentKnowledgeRefs'

export async function saveDocumentDraftDocxArtifact(input: {
  userId: string
  workspacePath: string
  skillId: string
  documentId: string
  draft: DocumentDraft
  knowledgeRefs: DocumentKnowledgeRef[]
  html?: string
  documentArtifact?: DocumentWorkbenchArtifact
  userFileId?: string
}): Promise<{
  artifact: ReturnType<typeof saveSkillArtifact>
  exportUrl: string
  filename: string
  documentSession: ReturnType<typeof buildDocumentSessionFromDraft>
  html: string
  documentArtifact: DocumentWorkbenchArtifact
  userFileId?: string
}> {
  const filename = sanitizeFilename(input.draft.title, 'docx')
  const buffer = await buildDocumentDraftDocxBuffer(input.draft)
  const baseArtifact = input.documentArtifact || buildWorkbenchDocumentArtifact({
    documentId: input.documentId,
    draft: input.draft,
    html: input.html,
    knowledgeRefs: input.knowledgeRefs,
  })
  const sourceRefs = toArtifactSourceRefs(input.knowledgeRefs)
  const knowledgeRefs = toArtifactKnowledgeRefs(input.knowledgeRefs)
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: input.skillId,
    type: 'document',
    title: input.draft.title,
    filename,
    format: 'docx',
    content: buffer,
    sourceRefs,
    knowledgeRefs,
    documentId: input.documentId,
    userFileId: input.userFileId,
  })
  const exportUrl = artifact.exports[0]?.url || `/api/artifacts/${artifact.id}/download`
  const timestamp = new Date().toISOString()
  const documentArtifact = {
    ...baseArtifact,
    id: artifact.id,
    type: 'document' as const,
    title: input.draft.title,
    sourceRefs,
    knowledgeRefs: input.knowledgeRefs,
    exportPaths: {
      pdf: `/api/documents/${encodeURIComponent(input.documentId)}/export?format=pdf`,
      docx: `/api/documents/${encodeURIComponent(input.documentId)}/export?format=docx`,
    },
    createdAt: artifact.createdAt,
    updatedAt: timestamp,
  }
  updateArtifact(artifact.id, {
    metadata: {
      documentArtifact,
    },
  })

  return {
    artifact,
    exportUrl,
    filename,
    documentSession: buildDocumentSessionFromDraft({
      draft: input.draft,
      artifactId: artifact.id,
    }),
    html: documentArtifact.html,
    documentArtifact,
    userFileId: input.userFileId,
  }
}
