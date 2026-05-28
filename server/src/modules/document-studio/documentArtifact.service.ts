import fs from 'fs'
import path from 'path'
import type { StudioDocumentJson } from './editorJsonUtils'
import {
  documentJsonFromEditor,
  editorJsonFromBlocks,
  htmlFromDocument,
  markdownFromDocument,
  newStudioArtifactId,
  newStudioDocumentId,
  parseLlmDocumentOutput,
  plainTextFromEditorJson,
} from './editorJsonUtils'
import { registerStudioDocumentInArtifactIndex, upsertStudioArtifactExport } from './studioArtifactRegistry'
import { buildStudioDocxBuffer } from './studioDocxExport'
import { workbenchHtmlToStudioBlocks } from './workbenchHtmlToStudio'

export const DOCUMENT_STUDIO_ROOT = path.resolve(__dirname, '../../../data/document-studio')

export interface StudioArtifactMetadata {
  artifactId: string
  documentId: string
  documentType: string
  title: string
  userId: string
  capabilityId?: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface StudioDocumentRecord {
  documentId: string
  artifactId: string
  documentType: string
  title: string
  userId: string
  editorJson: Record<string, unknown>
  contentModel: StudioDocumentJson
  createdAt: string
  updatedAt: string
}

function artifactDir(artifactId: string): string {
  return path.join(DOCUMENT_STUDIO_ROOT, 'artifacts', artifactId)
}

function ensureArtifactDir(artifactId: string): string {
  const dir = artifactDir(artifactId)
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, 'versions'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'exports'), { recursive: true })
  return dir
}

export function loadStudioDocument(documentId: string, userId?: string): StudioDocumentRecord | null {
  const indexPath = path.join(DOCUMENT_STUDIO_ROOT, 'documents', `${documentId}.json`)
  if (!fs.existsSync(indexPath)) return null
  const record = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as StudioDocumentRecord
  if (userId && record.userId !== userId) return null
  const editorPath = path.join(artifactDir(record.artifactId), 'editor.json')
  if (fs.existsSync(editorPath)) {
    record.editorJson = JSON.parse(fs.readFileSync(editorPath, 'utf-8')) as Record<string, unknown>
  }
  return record
}

export function saveStudioDocumentIndex(record: StudioDocumentRecord): void {
  const indexDir = path.join(DOCUMENT_STUDIO_ROOT, 'documents')
  fs.mkdirSync(indexDir, { recursive: true })
  fs.writeFileSync(path.join(indexDir, `${record.documentId}.json`), JSON.stringify(record, null, 2), 'utf-8')
}

export function createStudioArtifactFromGeneration(input: {
  userId: string
  documentType: string
  capabilityId: string
  title: string
  blocks: StudioDocumentJson['blocks']
  source?: string
  warnings?: string[]
}): StudioDocumentRecord {
  const artifactId = newStudioArtifactId()
  const documentId = newStudioDocumentId()
  const dir = ensureArtifactDir(artifactId)
  const editorJson = editorJsonFromBlocks(input.blocks)
  const contentModel: StudioDocumentJson = {
    id: documentId,
    type: input.documentType,
    title: input.title,
    blocks: input.blocks,
  }
  const now = new Date().toISOString()
  const metadata: StudioArtifactMetadata = {
    artifactId,
    documentId,
    documentType: input.documentType,
    title: input.title,
    userId: input.userId,
    capabilityId: input.capabilityId,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.json'), JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  const md = markdownFromDocument(contentModel)
  const html = htmlFromDocument(contentModel)
  fs.writeFileSync(path.join(dir, 'document.md'), md, 'utf-8')
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8')
  fs.writeFileSync(path.join(dir, 'versions', 'v1.editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  fs.writeFileSync(
    path.join(dir, 'result.json'),
    JSON.stringify(
      {
        artifactTitle: input.title,
        documentType: input.documentType,
        warnings: input.warnings ?? [],
        source: input.source ?? 'generation',
      },
      null,
      2,
    ),
    'utf-8',
  )
  const record: StudioDocumentRecord = {
    documentId,
    artifactId,
    documentType: input.documentType,
    title: input.title,
    userId: input.userId,
    editorJson,
    contentModel,
    createdAt: now,
    updatedAt: now,
  }
  saveStudioDocumentIndex(record)
  try {
    registerStudioDocumentInArtifactIndex(record, input.userId)
  } catch {
    // 资源中心索引失败不影响文稿编辑
  }
  return record
}

export function updateStudioEditorJson(
  documentId: string,
  userId: string,
  editorJson: Record<string, unknown>,
): StudioDocumentRecord {
  const record = loadStudioDocument(documentId, userId)
  if (!record) throw new Error('文稿不存在或无权限访问')
  const contentModel = documentJsonFromEditor(documentId, record.documentType, record.title, editorJson)
  const dir = artifactDir(record.artifactId)
  const metadataPath = path.join(dir, 'metadata.json')
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as StudioArtifactMetadata
  metadata.updatedAt = new Date().toISOString()
  metadata.version = (metadata.version || 1) + 1
  metadata.title = contentModel.title
  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.json'), JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.md'), markdownFromDocument(contentModel), 'utf-8')
  fs.writeFileSync(path.join(dir, 'index.html'), htmlFromDocument(contentModel), 'utf-8')
  fs.writeFileSync(
    path.join(dir, 'versions', `v${metadata.version}.editor.json`),
    JSON.stringify(editorJson, null, 2),
    'utf-8',
  )
  const next: StudioDocumentRecord = {
    ...record,
    title: contentModel.title,
    editorJson,
    contentModel,
    updatedAt: metadata.updatedAt,
  }
  saveStudioDocumentIndex(next)
  return next
}

export function loadArtifactEditorJson(artifactId: string): Record<string, unknown> | null {
  const editorPath = path.join(artifactDir(artifactId), 'editor.json')
  if (!fs.existsSync(editorPath)) return null
  return JSON.parse(fs.readFileSync(editorPath, 'utf-8')) as Record<string, unknown>
}

export function createStudioArtifactFromOpenCodeOutputs(input: {
  userId: string
  documentType: string
  capabilityId: string
  jobDir: string
  documentJson: {
    title?: string
    blocks?: Array<{ type?: string; level?: number; role?: string; text?: string; items?: string[] }>
  }
  editorJson: Record<string, unknown>
  warnings?: string[]
}): StudioDocumentRecord {
  const parsed = parseLlmDocumentOutput({
    title: input.documentJson.title,
    blocks: input.documentJson.blocks as Array<{
      type?: string
      level?: number
      role?: string
      text?: string
      items?: string[]
    }>,
  })
  const artifactId = newStudioArtifactId()
  const documentId = newStudioDocumentId()
  const dir = ensureArtifactDir(artifactId)
  const editorJson = input.editorJson
  const contentModel: StudioDocumentJson = {
    id: documentId,
    type: input.documentType,
    title: parsed.title,
    blocks: parsed.blocks,
  }
  const now = new Date().toISOString()

  const copyIfExists = (rel: string, destName: string) => {
    const src = path.join(input.jobDir, rel)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, destName))
  }
  copyIfExists('output/document.md', 'document.md')
  copyIfExists('output/index.html', 'index.html')
  copyIfExists('output/result.json', 'result.json')

  const metadata: StudioArtifactMetadata = {
    artifactId,
    documentId,
    documentType: input.documentType,
    title: parsed.title,
    userId: input.userId,
    capabilityId: input.capabilityId,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.json'), JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  if (!fs.existsSync(path.join(dir, 'document.md'))) {
    fs.writeFileSync(path.join(dir, 'document.md'), markdownFromDocument(contentModel), 'utf-8')
  }
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    fs.writeFileSync(path.join(dir, 'index.html'), htmlFromDocument(contentModel), 'utf-8')
  }
  fs.writeFileSync(path.join(dir, 'versions', 'v1.editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  if (!fs.existsSync(path.join(dir, 'result.json'))) {
    fs.writeFileSync(
      path.join(dir, 'result.json'),
      JSON.stringify(
        {
          artifactTitle: parsed.title,
          documentType: input.documentType,
          warnings: input.warnings ?? [],
          source: 'opencode',
        },
        null,
        2,
      ),
      'utf-8',
    )
  }

  const record: StudioDocumentRecord = {
    documentId,
    artifactId,
    documentType: input.documentType,
    title: parsed.title,
    userId: input.userId,
    editorJson,
    contentModel,
    createdAt: now,
    updatedAt: now,
  }
  saveStudioDocumentIndex(record)
  try {
    registerStudioDocumentInArtifactIndex(record, input.userId)
  } catch {
    // 资源中心索引失败不影响文稿编辑
  }
  return record
}

export function createFromLlmJson(input: {
  userId: string
  documentType: string
  capabilityId: string
  raw: { title?: string; blocks?: Array<{ type?: string; level?: number; role?: string; text?: string; items?: string[] }> }
  source?: string
  warnings?: string[]
}): StudioDocumentRecord {
  const parsed = parseLlmDocumentOutput(input.raw)
  return createStudioArtifactFromGeneration({
    userId: input.userId,
    documentType: input.documentType,
    capabilityId: input.capabilityId,
    title: parsed.title,
    blocks: parsed.blocks,
    source: input.source,
    warnings: input.warnings,
  })
}

export function getDocumentPlainText(record: StudioDocumentRecord): string {
  return plainTextFromEditorJson(record.editorJson)
}

export interface StudioWorkbenchSaveMetadata {
  taskType?: string
  tone?: string
  source?: string
}

export function updateStudioFromWorkbenchHtml(input: {
  documentId: string
  userId: string
  html: string
  title?: string
  documentDraft?: Record<string, unknown>
  metadata?: StudioWorkbenchSaveMetadata
}): StudioDocumentRecord {
  const record = loadStudioDocument(input.documentId, input.userId)
  if (!record) throw new Error('文稿不存在或无权限访问')

  const parsed = workbenchHtmlToStudioBlocks(input.html, input.title || record.title)
  const contentModel: StudioDocumentJson = {
    id: record.documentId,
    type: record.documentType,
    title: parsed.title,
    blocks: parsed.blocks,
  }
  const editorJson = editorJsonFromBlocks(parsed.blocks)
  const dir = artifactDir(record.artifactId)
  const metadataPath = path.join(dir, 'metadata.json')
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as StudioArtifactMetadata & {
    workbench?: StudioWorkbenchSaveMetadata
  }
  const now = new Date().toISOString()
  metadata.updatedAt = now
  metadata.version = (metadata.version || 1) + 1
  metadata.title = contentModel.title
  metadata.workbench = {
    ...metadata.workbench,
    ...input.metadata,
    source: input.metadata?.source || 'document-studio-workbench',
  }

  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.json'), JSON.stringify(contentModel, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'editor.json'), JSON.stringify(editorJson, null, 2), 'utf-8')
  fs.writeFileSync(path.join(dir, 'document.md'), markdownFromDocument(contentModel), 'utf-8')
  fs.writeFileSync(path.join(dir, 'index.html'), htmlFromDocument(contentModel), 'utf-8')
  if (input.documentDraft) {
    fs.writeFileSync(
      path.join(dir, 'workbench-draft.json'),
      JSON.stringify({ draft: input.documentDraft, savedAt: now }, null, 2),
      'utf-8',
    )
  }
  fs.writeFileSync(
    path.join(dir, 'versions', `v${metadata.version}.editor.json`),
    JSON.stringify(editorJson, null, 2),
    'utf-8',
  )

  const next: StudioDocumentRecord = {
    ...record,
    title: contentModel.title,
    editorJson,
    contentModel,
    updatedAt: now,
  }
  saveStudioDocumentIndex(next)
  return next
}

export async function exportStudioDocument(
  documentId: string,
  userId: string,
  format: string,
): Promise<{ exportUrl: string; filename: string; mimeType: string }> {
  const record = loadStudioDocument(documentId, userId)
  if (!record) throw new Error('文稿不存在或无权限访问')
  const dir = artifactDir(record.artifactId)
  const exportsDir = path.join(dir, 'exports')
  fs.mkdirSync(exportsDir, { recursive: true })
  const normalized = format.toLowerCase()
  if (normalized === 'markdown' || normalized === 'md') {
    const filename = `${sanitizeFilename(record.title)}.md`
    const target = path.join(exportsDir, filename)
    fs.copyFileSync(path.join(dir, 'document.md'), target)
    return {
      exportUrl: `/api/document-studio/artifacts/${record.artifactId}/exports/${encodeURIComponent(filename)}`,
      filename,
      mimeType: 'text/markdown; charset=utf-8',
    }
  }
  if (normalized === 'html') {
    const filename = `${sanitizeFilename(record.title)}.html`
    const target = path.join(exportsDir, filename)
    fs.copyFileSync(path.join(dir, 'index.html'), target)
    return {
      exportUrl: `/api/document-studio/artifacts/${record.artifactId}/exports/${encodeURIComponent(filename)}`,
      filename,
      mimeType: 'text/html; charset=utf-8',
    }
  }
  if (normalized === 'docx') {
    const filename = `${sanitizeFilename(record.title)}.docx`
    const target = path.join(exportsDir, filename)
    const buffer = await buildStudioDocxBuffer({
      title: record.title,
      documentType: record.documentType,
      documentId: record.documentId,
      editorJson: record.editorJson,
      contentModel: record.contentModel,
      markdownPath: path.join(dir, 'document.md'),
    })
    fs.writeFileSync(target, buffer)
    const exportUrl = `/api/document-studio/artifacts/${record.artifactId}/exports/${encodeURIComponent(filename)}`
    try {
      upsertStudioArtifactExport(record.artifactId, {
        format: 'docx',
        filename,
        url: exportUrl,
      })
    } catch {
      // 资源中心索引更新失败不影响下载
    }
    return {
      exportUrl,
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
  }
  if (normalized === 'pdf') {
    throw new Error('PDF 导出待接入，当前请使用 Markdown、HTML 或 Word。')
  }
  throw new Error(`不支持的导出格式：${format}`)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 80) || 'document'
}

export function resolveExportFilePath(artifactId: string, filename: string): string | null {
  const target = path.join(artifactDir(artifactId), 'exports', path.basename(filename))
  if (!fs.existsSync(target)) return null
  return target
}
