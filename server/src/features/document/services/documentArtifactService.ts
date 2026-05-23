import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { sanitizeFilename } from '../skills/documentSessionBuilder'
import { buildDocumentDraftDocxBuffer } from './documentDraftDocx'
import { buildDocumentSessionFromDraft } from './documentDraft'
import type { DocumentDraft, DocumentKnowledgeRef } from '../types'
import { toArtifactKnowledgeRefs, toArtifactSourceRefs } from './documentKnowledgeRefs'

export async function saveDocumentDraftDocxArtifact(input: {
  userId: string
  workspacePath: string
  skillId: string
  documentId: string
  draft: DocumentDraft
  knowledgeRefs: DocumentKnowledgeRef[]
}): Promise<{
  artifact: ReturnType<typeof saveSkillArtifact>
  exportUrl: string
  filename: string
  documentSession: ReturnType<typeof buildDocumentSessionFromDraft>
}> {
  const filename = sanitizeFilename(input.draft.title, 'docx')
  const buffer = await buildDocumentDraftDocxBuffer(input.draft)
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: input.skillId,
    type: 'document',
    title: input.draft.title,
    filename,
    format: 'docx',
    content: buffer,
    sourceRefs: toArtifactSourceRefs(input.knowledgeRefs),
    knowledgeRefs: toArtifactKnowledgeRefs(input.knowledgeRefs),
    documentId: input.documentId,
  })

  return {
    artifact,
    exportUrl: artifact.exports[0]?.url || `/api/artifacts/${artifact.id}/download`,
    filename,
    documentSession: buildDocumentSessionFromDraft({
      draft: input.draft,
      artifactId: artifact.id,
    }),
  }
}
