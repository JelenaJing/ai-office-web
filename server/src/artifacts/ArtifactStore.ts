/**
 * ArtifactStore.ts — Workspace-scoped artifact store
 *
 * Artifacts are stored inside the owning workspace:
 *   server/data/workspaces/{userId}/{workspaceId}/artifacts/{artifactId}/
 *     artifact.json — metadata (includes userId, workspaceId, workspacePath)
 *     output.<ext>  — generated file
 *
 * A global index is maintained for O(1) lookup by artifactId:
 *   server/data/artifacts/index.json
 *
 * workspacePath format: "web-workspace:{userId}:{workspaceId}"
 */

import fs from 'fs'
import path from 'path'

const WORKSPACES_ROOT = path.resolve(__dirname, '../../data/workspaces')
const ARTIFACT_INDEX_PATH = path.resolve(__dirname, '../../data/artifacts/index.json')

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArtifactExport {
  format: string
  filename: string
  url: string
}

export interface ArtifactSourceRef {
  type: 'email' | 'matter' | 'deck' | 'document' | 'knowledge' | 'manual' | string
  id: string
  label?: string
}

export interface ArtifactKnowledgeRef {
  documentId: string
  departmentId?: string
  title?: string
  citationStatus?: 'verified' | 'partial' | 'unverified'
}

export interface Artifact {
  id: string
  userId: string
  workspaceId: string
  workspacePath: string
  type: string
  title: string
  editable: boolean
  createdBySkillId: string
  createdAt: string
  exports: ArtifactExport[]
  sourceRefs?: ArtifactSourceRef[]
  knowledgeRefs?: ArtifactKnowledgeRef[]
  matterId?: string
  emailId?: string
  deckId?: string
  documentId?: string
}

interface ArtifactIndexEntry {
  artifactId: string
  userId: string
  workspaceId: string
}

interface ArtifactIndex {
  artifacts: ArtifactIndexEntry[]
}

// ── Workspace path parsing ────────────────────────────────────────────────────

/** Parse "web-workspace:{userId}:{wsId}" → { userId, wsId } */
export function parseWorkspacePath(p: string): { userId: string; wsId: string } | null {
  const m = p.match(/^web-workspace:([^:]+):(.+)$/)
  if (!m) return null
  return { userId: m[1], wsId: m[2] }
}

// ── Path helpers ──────────────────────────────────────────────────────────────

function safeSegment(s: string, maxLen = 64): string {
  return s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, maxLen)
}

function artifactDir(userId: string, wsId: string, artifactId: string): string {
  return path.join(
    WORKSPACES_ROOT,
    safeSegment(userId),
    safeSegment(wsId),
    'artifacts',
    safeSegment(artifactId),
  )
}

// ── Artifact index ────────────────────────────────────────────────────────────

function readArtifactIndex(): ArtifactIndex {
  const dir = path.dirname(ARTIFACT_INDEX_PATH)
  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(ARTIFACT_INDEX_PATH)) return { artifacts: [] }
  try {
    return JSON.parse(fs.readFileSync(ARTIFACT_INDEX_PATH, 'utf-8')) as ArtifactIndex
  } catch {
    return { artifacts: [] }
  }
}

function writeArtifactIndex(index: ArtifactIndex): void {
  const dir = path.dirname(ARTIFACT_INDEX_PATH)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(ARTIFACT_INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8')
}

function upsertIndex(entry: ArtifactIndexEntry): void {
  const index = readArtifactIndex()
  const pos = index.artifacts.findIndex((e) => e.artifactId === entry.artifactId)
  if (pos >= 0) {
    index.artifacts[pos] = entry
  } else {
    index.artifacts.push(entry)
  }
  writeArtifactIndex(index)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function createArtifactDir(userId: string, wsId: string, artifactId: string): string {
  const dir = artifactDir(userId, wsId, artifactId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function saveArtifactMetadata(artifact: Artifact): void {
  const dir = artifactDir(artifact.userId, artifact.workspaceId, artifact.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'artifact.json'),
    JSON.stringify(artifact, null, 2),
    'utf-8',
  )
  upsertIndex({ artifactId: artifact.id, userId: artifact.userId, workspaceId: artifact.workspaceId })
}

export function getArtifact(artifactId: string): Artifact | null {
  const index = readArtifactIndex()
  const entry = index.artifacts.find((e) => e.artifactId === artifactId)
  if (!entry) return null
  const metaPath = path.join(artifactDir(entry.userId, entry.workspaceId, artifactId), 'artifact.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Artifact
  } catch {
    return null
  }
}

export function updateArtifact(artifactId: string, patch: Partial<Pick<Artifact, 'title' | 'type' | 'editable' | 'sourceRefs' | 'knowledgeRefs' | 'matterId' | 'emailId' | 'deckId' | 'documentId'>>): Artifact | null {
  const current = getArtifact(artifactId)
  if (!current) return null
  const updated: Artifact = {
    ...current,
    ...patch,
  }
  saveArtifactMetadata(updated)
  return updated
}

export function deleteArtifact(artifactId: string): boolean {
  const index = readArtifactIndex()
  const entry = index.artifacts.find((e) => e.artifactId === artifactId)
  if (!entry) return false
  const dir = artifactDir(entry.userId, entry.workspaceId, artifactId)
  fs.rmSync(dir, { recursive: true, force: true })
  writeArtifactIndex({
    artifacts: index.artifacts.filter((e) => e.artifactId !== artifactId),
  })
  return true
}

export function getArtifactFilePath(artifactId: string, filename: string): string {
  const index = readArtifactIndex()
  const entry = index.artifacts.find((e) => e.artifactId === artifactId)
  if (!entry) return ''
  return path.join(artifactDir(entry.userId, entry.workspaceId, artifactId), filename)
}

/** Return all artifacts belonging to a user, sorted newest-first. */
export function listArtifactsByUser(userId: string): Artifact[] {
  const index = readArtifactIndex()
  const entries = index.artifacts.filter((e) => e.userId === userId)
  const artifacts: Artifact[] = []
  for (const entry of entries) {
    const metaPath = path.join(
      artifactDir(entry.userId, entry.workspaceId, entry.artifactId),
      'artifact.json',
    )
    if (!fs.existsSync(metaPath)) continue
    try {
      artifacts.push(JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Artifact)
    } catch {
      // skip corrupt entries
    }
  }
  return artifacts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
