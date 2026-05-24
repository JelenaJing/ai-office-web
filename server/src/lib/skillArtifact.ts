import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  createArtifactDir,
  parseWorkspacePath,
  saveArtifactMetadata,
  type Artifact,
  type ArtifactKnowledgeRef,
  type ArtifactSourceRef,
} from '../artifacts/ArtifactStore'

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
  const parsed = parseWorkspacePath(input.workspacePath)
  const isPptArtifact = Boolean(input.deckId) || /ppt/i.test(input.skillId)
  const resolvedWorkspaceOwner = parsed?.userId ?? ''
  const canWrite = Boolean(parsed && parsed.userId === input.userId)
  const reason = !parsed
    ? 'workspacePath 格式无效'
    : canWrite
      ? 'workspace owner 与当前用户一致'
      : `workspace owner=${parsed.userId}，当前用户无写入权限`
  if (isPptArtifact) {
    console.info(`[ppt-workspace] userId=${input.userId}`)
    console.info(`[ppt-workspace] username=${input.username || ''}`)
    console.info(`[ppt-workspace] workspacePath=${input.workspacePath}`)
    console.info(`[ppt-workspace] resolvedWorkspaceOwner=${resolvedWorkspaceOwner}`)
    console.info(`[ppt-workspace] canWrite=${canWrite}`)
    console.info(`[ppt-workspace] reason=${reason}`)
  }
  if (!parsed) {
    throw new Error(`workspacePath 格式无效：${input.workspacePath}`)
  }
  if (!canWrite) {
    throw new Error('无权写入该工作区')
  }

  const artifactId = randomUUID()
  const dir = createArtifactDir(input.userId, parsed.wsId, artifactId)
  const filePath = path.join(dir, input.filename)
  if (typeof input.content === 'string') {
    fs.writeFileSync(filePath, input.content, 'utf-8')
  } else {
    fs.writeFileSync(filePath, input.content)
  }

  const artifact: Artifact = {
    id: artifactId,
    userId: input.userId,
    workspaceId: parsed.wsId,
    workspacePath: input.workspacePath,
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
  return artifact
}
