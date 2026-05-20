/**
 * ArtifactStore.ts — Simple file-based artifact store
 *
 * Artifacts are stored under server/data/artifacts/{artifactId}/
 *   artifact.json — metadata
 *   output.<ext>  — generated file
 */

import fs from 'fs'
import path from 'path'

export const ARTIFACTS_ROOT = path.resolve(__dirname, '../../../data/artifacts')

export interface ArtifactExport {
  format: string
  filename: string
  url: string
}

export interface Artifact {
  id: string
  type: string
  title: string
  editable: boolean
  createdBySkillId: string
  createdAt: string
  exports: ArtifactExport[]
}

export function createArtifactDir(artifactId: string): string {
  const dir = path.join(ARTIFACTS_ROOT, artifactId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function saveArtifactMetadata(artifact: Artifact): void {
  const dir = path.join(ARTIFACTS_ROOT, artifact.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'artifact.json'),
    JSON.stringify(artifact, null, 2),
    'utf-8',
  )
}

export function getArtifact(artifactId: string): Artifact | null {
  const metaPath = path.join(ARTIFACTS_ROOT, artifactId, 'artifact.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Artifact
  } catch {
    return null
  }
}

export function getArtifactFilePath(artifactId: string, filename: string): string {
  return path.join(ARTIFACTS_ROOT, artifactId, filename)
}
