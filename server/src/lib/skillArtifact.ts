import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  createArtifactDir,
  saveArtifactMetadata,
  type Artifact,
  type ArtifactKnowledgeRef,
  type ArtifactSourceRef,
} from '../artifacts/ArtifactStore'
import { assertWorkspaceAccess } from './workspaceAccess'
import { GENERATED_FILE_MIRROR_EXTS, registerUserFile } from './userFiles'

export interface SaveSkillArtifactInput {
  userId: string
  username?: string
  workspacePath: string
  skillId: string
  type: string
  title: string
  filename: string
  format: string
  content: Buffer | string
  sourceRefs?: ArtifactSourceRef[]
  knowledgeRefs?: ArtifactKnowledgeRef[]
  metadata?: Record<string, unknown>
  matterId?: string
  emailId?: string
  deckId?: string
  documentId?: string
}

export function saveSkillArtifact(input: SaveSkillArtifactInput): Artifact {
  const access = assertWorkspaceAccess(input.userId, input.workspacePath, 'editor')
  const isPptArtifact = Boolean(input.deckId) || /ppt/i.test(input.skillId)
  if (isPptArtifact) {
    console.info(`[ppt-workspace] userId=${input.userId}`)
    console.info(`[ppt-workspace] username=${input.username || ''}`)
    console.info(`[ppt-workspace] workspacePath=${access.workspacePath}`)
    console.info(`[ppt-workspace] resolvedWorkspaceOwner=${input.userId}`)
    console.info('[ppt-workspace] canWrite=true')
    console.info('[ppt-workspace] reason=assertWorkspaceAccess allowed write')
  }

  const artifactId = randomUUID()
  const dir = createArtifactDir(input.userId, access.workspaceId, artifactId)
  const filePath = path.join(dir, input.filename)
  if (typeof input.content === 'string') {
    fs.writeFileSync(filePath, input.content, 'utf-8')
  } else {
    fs.writeFileSync(filePath, input.content)
  }

  const artifact: Artifact = {
    id: artifactId,
    userId: input.userId,
    workspaceId: access.workspaceId,
    workspacePath: access.workspacePath,
    type: input.type,
    title: input.title,
    editable: false,
    createdBySkillId: input.skillId,
    createdAt: new Date().toISOString(),
    exports: [
      {
        format: input.format,
        filename: input.filename,
        url: `/api/artifacts/${artifactId}/download`,
      },
    ],
    sourceRefs: input.sourceRefs,
    knowledgeRefs: input.knowledgeRefs,
    metadata: input.metadata,
    matterId: input.matterId,
    emailId: input.emailId,
    deckId: input.deckId,
    documentId: input.documentId,
  }
  saveArtifactMetadata(artifact)

  const ext = path.extname(input.filename).slice(1).toLowerCase()
  if (GENERATED_FILE_MIRROR_EXTS.has(ext)) {
    try {
      const buffer = typeof input.content === 'string'
        ? Buffer.from(input.content, 'utf-8')
        : input.content
      registerUserFile({
        userId: input.userId,
        workspacePath: input.workspacePath,
        filename: input.filename,
        content: buffer,
        sourceArtifactId: artifactId,
        generated: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[artifact-mirror] failed to mirror ${artifactId} to user files: ${message}`)
    }
  }

  return artifact
}
