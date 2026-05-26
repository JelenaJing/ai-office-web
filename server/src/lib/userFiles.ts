/**
 * userFiles.ts — Resolve uploaded files for the authenticated user.
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  clientPath,
  parseClientPath,
  readIndex,
  workspaceDir,
} from './workspaceStore'
import { assertWorkspaceAccess, bootstrapWorkspaceForUser } from './workspaceAccess'

export const USER_FILE_MIME_BY_EXT: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

/** Extensions mirrored from AI generation into「我的文件」. */
export const GENERATED_FILE_MIRROR_EXTS = new Set(Object.keys(USER_FILE_MIME_BY_EXT))

export interface UserFileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
  sourceArtifactId?: string
  generated?: boolean
  documentId?: string
  artifactId?: string
}

interface FilesIndex {
  files: UserFileEntry[]
}

function filesDir(userId: string, wsId: string): string {
  return path.join(workspaceDir(userId, wsId), 'files')
}

function writeFilesIndex(userId: string, wsId: string, index: FilesIndex): void {
  const dir = filesDir(userId, wsId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(index, null, 2), 'utf-8')
}

function sanitizeDisplayFilename(name: string): string {
  const base = String(name || '未命名')
    .replace(/[\\/]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
  return base || '未命名'
}

/** Register a generated or uploaded binary into the user's「我的文件」index. */
export function registerUserFile(input: {
  userId: string
  workspacePath?: string
  filename: string
  content: Buffer
  sourceArtifactId?: string
  generated?: boolean
  documentId?: string
  artifactId?: string
}): UserFileEntry | null {
  const access = assertWorkspaceAccess(input.userId, input.workspacePath, 'editor')
  const displayName = sanitizeDisplayFilename(input.filename)
  const ext = path.extname(displayName).slice(1).toLowerCase()
  if (!GENERATED_FILE_MIRROR_EXTS.has(ext)) return null

  const fileId = randomUUID()
  const fileDir = path.join(filesDir(input.userId, access.workspaceId), fileId)
  fs.mkdirSync(fileDir, { recursive: true })
  fs.writeFileSync(path.join(fileDir, 'original'), input.content)

  const entry: UserFileEntry = {
    id: fileId,
    name: displayName,
    ext,
    mimeType: USER_FILE_MIME_BY_EXT[ext] || 'application/octet-stream',
    size: input.content.length,
    uploadedAt: new Date().toISOString(),
    sourceArtifactId: input.sourceArtifactId,
    generated: input.generated ?? true,
    documentId: input.documentId,
    artifactId: input.artifactId,
  }

  const index = readFilesIndex(input.userId, access.workspaceId)
  index.files.unshift(entry)
  writeFilesIndex(input.userId, access.workspaceId, index)
  return entry
}

export function readFilesIndex(userId: string, wsId: string): FilesIndex {
  const dir = filesDir(userId, wsId)
  fs.mkdirSync(dir, { recursive: true })
  const p = path.join(dir, 'files.json')
  if (!fs.existsSync(p)) return { files: [] }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as FilesIndex
  } catch {
    return { files: [] }
  }
}

export interface ResolvedUserFile {
  entry: UserFileEntry
  workspaceId: string
  workspacePath: string
  absolutePath: string
}

function resolveWorkspaceCandidates(
  userId: string,
  requestedWorkspacePath?: string | null,
): Array<{ workspaceId: string; workspacePath: string }> {
  const requested = String(requestedWorkspacePath || '').trim()
  if (requested) {
    const access = assertWorkspaceAccess(userId, requested, 'member')
    return [{
      workspaceId: access.workspaceId,
      workspacePath: access.workspacePath,
    }]
  }

  const candidates: Array<{ workspaceId: string; workspacePath: string }> = []

  const bootstrapped = bootstrapWorkspaceForUser(userId)
  const index = readIndex(userId)
  for (const workspace of index.workspaces) {
    const parsed = parseClientPath(workspace.path)
    if (!parsed || parsed.userId !== userId || !fs.existsSync(workspaceDir(userId, workspace.id))) continue
    candidates.push({
      workspaceId: workspace.id,
      workspacePath: clientPath(userId, workspace.id),
    })
  }
  if (!candidates.some((candidate) => candidate.workspaceId === bootstrapped.currentWorkspaceId)) {
    candidates.push({
      workspaceId: bootstrapped.currentWorkspaceId,
      workspacePath: bootstrapped.currentWorkspacePath,
    })
  }
  return candidates
}

function resolveUserFileFromWorkspace(
  userId: string,
  fileId: string,
  workspaceId: string,
  workspacePath: string,
): ResolvedUserFile | null {
  const index = readFilesIndex(userId, workspaceId)
  const entry = index.files.find((item) => item.id === fileId)
  if (!entry) return null
  const absolutePath = path.join(filesDir(userId, workspaceId), entry.id, 'original')
  if (!fs.existsSync(absolutePath)) return null

  return {
    entry,
    workspaceId,
    workspacePath,
    absolutePath,
  }
}

export function resolveUserFileInWorkspace(
  userId: string,
  fileId: string,
  requestedWorkspacePath?: string | null,
): ResolvedUserFile | null {
  const trimmed = String(fileId || '').trim()
  if (!trimmed) return null
  for (const candidate of resolveWorkspaceCandidates(userId, requestedWorkspacePath)) {
    const resolved = resolveUserFileFromWorkspace(
      userId,
      trimmed,
      candidate.workspaceId,
      candidate.workspacePath,
    )
    if (resolved) return resolved
  }
  return null
}

export function listUserFilesInWorkspace(
  userId: string,
  requestedWorkspacePath?: string | null,
): ResolvedUserFile[] {
  const files: ResolvedUserFile[] = []
  const seen = new Set<string>()
  for (const candidate of resolveWorkspaceCandidates(userId, requestedWorkspacePath)) {
    const index = readFilesIndex(userId, candidate.workspaceId)
    for (const entry of index.files) {
      if (seen.has(entry.id)) continue
      const absolutePath = path.join(filesDir(userId, candidate.workspaceId), entry.id, 'original')
      if (!fs.existsSync(absolutePath)) continue
      files.push({
        entry,
        workspaceId: candidate.workspaceId,
        workspacePath: candidate.workspacePath,
        absolutePath,
      })
      seen.add(entry.id)
    }
  }
  return files
}

/** Returns file metadata + disk path if owned by userId in the user's accessible workspaces. */
export function resolveUserFile(
  userId: string,
  fileId: string,
  requestedWorkspacePath?: string | null,
): ResolvedUserFile | null {
  return resolveUserFileInWorkspace(userId, fileId, requestedWorkspacePath)
}

export function findUserFileBySourceArtifactId(
  userId: string,
  sourceArtifactId: string,
  requestedWorkspacePath?: string | null,
): ResolvedUserFile | null {
  const trimmed = String(sourceArtifactId || '').trim()
  if (!trimmed) return null
  for (const candidate of resolveWorkspaceCandidates(userId, requestedWorkspacePath)) {
    const index = readFilesIndex(userId, candidate.workspaceId)
    const entry = index.files.find((item) => item.sourceArtifactId === trimmed)
    if (!entry) continue
    const resolved = resolveUserFileFromWorkspace(
      userId,
      entry.id,
      candidate.workspaceId,
      candidate.workspacePath,
    )
    if (resolved) return resolved
  }
  return null
}

/** 覆盖「我的文件」中已有条目的二进制内容（打开后再次保存走此路径）。 */
export function updateUserFileContent(input: {
  userId: string
  fileId: string
  workspacePath?: string
  filename?: string
  content: Buffer
  sourceArtifactId?: string
  documentId?: string
  artifactId?: string
}): UserFileEntry | null {
  const resolved = resolveUserFileInWorkspace(input.userId, input.fileId, input.workspacePath)
  if (!resolved) return null

  fs.writeFileSync(resolved.absolutePath, input.content)

  const index = readFilesIndex(input.userId, resolved.workspaceId)
  const entry = index.files.find((item) => item.id === input.fileId)
  if (!entry) return null

  if (input.filename) {
    const displayName = sanitizeDisplayFilename(input.filename)
    entry.name = displayName
    const ext = path.extname(displayName).slice(1).toLowerCase()
    if (GENERATED_FILE_MIRROR_EXTS.has(ext)) {
      entry.ext = ext
      entry.mimeType = USER_FILE_MIME_BY_EXT[ext] || entry.mimeType
    }
  }
  entry.size = input.content.length
  entry.uploadedAt = new Date().toISOString()
  if (input.sourceArtifactId) entry.sourceArtifactId = input.sourceArtifactId
  if (input.documentId) entry.documentId = input.documentId
  if (input.artifactId) entry.artifactId = input.artifactId
  writeFilesIndex(input.userId, resolved.workspaceId, index)
  return entry
}
