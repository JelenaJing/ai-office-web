/**
 * userFiles.ts — Resolve uploaded files for the authenticated user.
 */

import fs from 'fs'
import path from 'path'
import {
  clientPath,
  parseClientPath,
  readIndex,
  workspaceDir,
} from './workspaceStore'
import { assertWorkspaceAccess, bootstrapWorkspaceForUser } from './workspaceAccess'

export interface UserFileEntry {
  id: string
  name: string
  ext: string
  mimeType: string
  size: number
  uploadedAt: string
}

interface FilesIndex {
  files: UserFileEntry[]
}

function filesDir(userId: string, wsId: string): string {
  return path.join(workspaceDir(userId, wsId), 'files')
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
