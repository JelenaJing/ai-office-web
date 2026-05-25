import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export type HtmlArtifactType = 'html' | 'html_presentation'

export interface HtmlArtifactRecord {
  id: string
  userId: string
  jobId: string
  type: HtmlArtifactType
  title: string
  filename: 'index.html'
  createdAt: string
}

const ARTIFACTS_ROOT = '/data/darebug/aios-artifacts'

function safeSegment(value: string, maxLen = 96): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, maxLen)
}

function ensureWithinBaseDir(baseDir: string, targetDir: string): string {
  fs.mkdirSync(baseDir, { recursive: true })
  fs.mkdirSync(targetDir, { recursive: true })
  const realBaseDir = fs.realpathSync(baseDir)
  const realTargetDir = fs.realpathSync(targetDir)
  if (realTargetDir !== realBaseDir && !realTargetDir.startsWith(`${realBaseDir}${path.sep}`)) {
    throw new Error(`路径越界：${realTargetDir}`)
  }
  return realTargetDir
}

function artifactDir(artifactId: string): string {
  return path.join(ARTIFACTS_ROOT, safeSegment(artifactId))
}

export function createHtmlArtifact(input: {
  userId: string
  jobId: string
  sourceFilePath: string
  title?: string
  type?: HtmlArtifactType
}): HtmlArtifactRecord {
  const artifactId = randomUUID()
  const dir = ensureWithinBaseDir(ARTIFACTS_ROOT, artifactDir(artifactId))
  const targetFilePath = path.join(dir, 'index.html')
  const artifact: HtmlArtifactRecord = {
    id: artifactId,
    userId: input.userId,
    jobId: input.jobId,
    type: input.type ?? 'html',
    title: input.title?.trim() || 'HTML Artifact',
    filename: 'index.html',
    createdAt: new Date().toISOString(),
  }
  fs.copyFileSync(input.sourceFilePath, targetFilePath)
  fs.writeFileSync(path.join(dir, 'artifact.json'), JSON.stringify(artifact, null, 2), 'utf-8')
  return artifact
}

export function getHtmlArtifact(artifactId: string): HtmlArtifactRecord | null {
  const metaPath = path.join(artifactDir(artifactId), 'artifact.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as HtmlArtifactRecord
  } catch {
    return null
  }
}

export function getHtmlArtifactFilePath(artifactId: string): string {
  return path.join(artifactDir(artifactId), 'index.html')
}

const DEFAULT_HTML_ARTIFACT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

/** Remove HTML artifacts older than retentionMs. Returns count removed. */
export function purgeExpiredHtmlArtifacts(retentionMs = DEFAULT_HTML_ARTIFACT_RETENTION_MS): number {
  if (!fs.existsSync(ARTIFACTS_ROOT)) return 0
  const cutoff = Date.now() - retentionMs
  let purged = 0
  for (const name of fs.readdirSync(ARTIFACTS_ROOT)) {
    const dir = path.join(ARTIFACTS_ROOT, name)
    const metaPath = path.join(dir, 'artifact.json')
    if (!fs.existsSync(metaPath)) continue
    try {
      const record = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as HtmlArtifactRecord
      const createdAt = new Date(record.createdAt).getTime()
      if (!Number.isFinite(createdAt) || createdAt >= cutoff) continue
      fs.rmSync(dir, { recursive: true, force: true })
      purged += 1
    } catch {
      // skip corrupt entries
    }
  }
  return purged
}
