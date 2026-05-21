/**
 * userFiles.ts — Resolve uploaded files for the authenticated user (default workspace).
 */

import fs from 'fs'
import path from 'path'
import { getOrCreateDefaultWorkspace, workspaceDir } from './workspaceStore'

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

function readFilesIndex(userId: string, wsId: string): FilesIndex {
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

/** Returns file metadata + disk path if owned by userId in default workspace. */
export function resolveUserFile(
  userId: string,
  fileId: string,
): ResolvedUserFile | null {
  const trimmed = String(fileId || '').trim()
  if (!trimmed) return null

  const ws = getOrCreateDefaultWorkspace(userId)
  const index = readFilesIndex(userId, ws.id)
  const entry = index.files.find((f) => f.id === trimmed)
  if (!entry) return null

  const absolutePath = path.join(filesDir(userId, ws.id), entry.id, 'original')
  if (!fs.existsSync(absolutePath)) return null

  return {
    entry,
    workspaceId: ws.id,
    workspacePath: ws.path,
    absolutePath,
  }
}
