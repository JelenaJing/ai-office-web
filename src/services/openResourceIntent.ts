import type { Artifact, FileEntry } from '../platform/types'
import { artifactHasExport } from '../features/resource-center/services/artifactDisplay'

const DOCUMENT_FILE_EXTS = new Set(['docx', 'html', 'md', 'txt'])
const HTML_PPT_ARTIFACT_TYPES = new Set(['html', 'html_presentation'])
const PPT_ARTIFACT_TYPES = new Set(['deck', 'presentation', 'ppt'])

export function canOpenFileEntry(file: FileEntry): boolean {
  if (DOCUMENT_FILE_EXTS.has(file.ext)) return true
  if (file.ext === 'pptx' && file.sourceArtifactId) return true
  return false
}

export function openFileEntryLabel(file: FileEntry): string {
  if (file.ext === 'pptx') return '打开汇报'
  return '打开文稿'
}

export function canOpenArtifact(artifact: Artifact): boolean {
  if (HTML_PPT_ARTIFACT_TYPES.has(artifact.type)) return true
  if (artifact.type === 'document') return true
  if (PPT_ARTIFACT_TYPES.has(artifact.type)) return true
  const meta = artifact.metadata as Record<string, unknown> | undefined
  if (meta?.documentArtifact) return true
  if (meta?.deckId) return true
  const firstFormat = artifact.exports?.[0]?.format
  if (firstFormat === 'docx' || firstFormat === 'html') return true
  return artifactHasExport(artifact)
}

export function openArtifactLabel(artifact: Artifact): string {
  if (HTML_PPT_ARTIFACT_TYPES.has(artifact.type)) return '打开汇报'
  if (PPT_ARTIFACT_TYPES.has(artifact.type)) return '打开汇报'
  const meta = artifact.metadata as Record<string, unknown> | undefined
  if (meta?.deckId) return '打开汇报'
  return '打开文稿'
}

export function resolveArtifactOpenKind(artifact: Artifact): 'html-ppt' | 'ppt' | 'document' | null {
  if (HTML_PPT_ARTIFACT_TYPES.has(artifact.type)) return 'html-ppt'
  const meta = artifact.metadata as Record<string, unknown> | undefined
  if (meta?.deckId || PPT_ARTIFACT_TYPES.has(artifact.type)) return 'ppt'
  if (artifact.type === 'document' || meta?.documentArtifact) return 'document'
  const format = artifact.exports?.[0]?.format
  if (format === 'html') return 'html-ppt'
  if (format === 'docx' || format === 'pptx') {
    return format === 'pptx' ? 'ppt' : 'document'
  }
  return null
}
