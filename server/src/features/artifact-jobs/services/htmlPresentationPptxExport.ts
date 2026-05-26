import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getArtifact, type Artifact } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { resolveTaskTimeoutMs } from '../../../lib/taskTimeouts'
import { bootstrapWorkspaceForUser } from '../../../lib/workspaceAccess'
import { writePptxFile, type GeneratedSlidePlan, type SlidePlanItem } from '../../ppt/services/simplePptx'
import { type ContentModelRecord, type ContentModelSlide } from './htmlPresentationPostProcess'
import { getHtmlArtifact, getHtmlArtifactDir, updateHtmlArtifact } from './htmlArtifactStore'

const HTML_TO_PPTX_TIMEOUT_MS = resolveTaskTimeoutMs('html_to_pptx')

export class HtmlPresentationExportError extends Error {
  readonly code: 'HTML_EXPORT_NOT_FOUND' | 'HTML_TO_PPTX_SKILL_NOT_FOUND' | 'PPTX_EXPORT_FAILED' | 'PPTX_FILE_NOT_CREATED' | 'EXPORT_TIMEOUT'

  constructor(
    code: HtmlPresentationExportError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'HtmlPresentationExportError'
    this.code = code
  }
}

export interface HtmlPresentationPptxExportResult {
  success: true
  cached: boolean
  artifact: Artifact
  timeoutMs: number
  filename: string
  downloadUrl: string
}

function sanitizeFilenameSegment(value: string, fallback: string): string {
  const normalized = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  return (normalized || fallback).slice(0, 64)
}

function normalizeItems(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).slice(0, 6)
}

function slideItems(slide: ContentModelSlide): string[] {
  const blockItems = slide.blocks
    .filter((block) => block.type === 'text' && !['title', 'subtitle'].includes(block.role))
    .map((block) => block.text)
  return normalizeItems([
    ...slide.bullets,
    ...blockItems,
  ])
}

function mapSlide(slide: ContentModelSlide, deckTitle: string): SlidePlanItem {
  const type: SlidePlanItem['type'] = slide.role === 'cover'
    ? 'cover'
    : slide.role === 'agenda'
      ? 'toc'
      : slide.role === 'closing'
        ? 'summary'
        : 'content'
  return {
    type,
    title: slide.title || deckTitle,
    subtitle: slide.subtitle || undefined,
    items: slideItems(slide),
  }
}

function loadContentModel(artifactId: string): ContentModelRecord {
  const contentModelPath = path.join(getHtmlArtifactDir(artifactId), 'content-model.json')
  if (!fs.existsSync(contentModelPath)) {
    throw new HtmlPresentationExportError('HTML_EXPORT_NOT_FOUND', 'content-model.json not found for this HTML PPT artifact')
  }
  return JSON.parse(fs.readFileSync(contentModelPath, 'utf-8')) as ContentModelRecord
}

function buildPptxPlan(contentModel: ContentModelRecord): GeneratedSlidePlan {
  const slides = contentModel.slides.map((slide) => mapSlide(slide, contentModel.title || 'HTML 演示文稿'))
  if (slides.length === 0) {
    throw new HtmlPresentationExportError('HTML_EXPORT_NOT_FOUND', 'content-model.json does not contain any slides')
  }
  return {
    title: contentModel.title || 'HTML 演示文稿',
    slides,
  }
}

function resolveExistingPptxArtifact(htmlArtifactId: string): Artifact | null {
  const htmlArtifact = getHtmlArtifact(htmlArtifactId)
  const existingArtifactId = htmlArtifact?.metadata?.pptxExportArtifactId
  if (!existingArtifactId) return null
  return getArtifact(existingArtifactId)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new HtmlPresentationExportError('EXPORT_TIMEOUT', `HTML 转 PPTX 超时（${timeoutMs}ms）`)), timeoutMs).unref()
    }),
  ])
}

export async function exportHtmlPresentationToPptx(input: {
  htmlArtifactId: string
  userId: string
}): Promise<HtmlPresentationPptxExportResult> {
  const htmlArtifact = getHtmlArtifact(input.htmlArtifactId)
  if (!htmlArtifact) {
    throw new HtmlPresentationExportError('HTML_EXPORT_NOT_FOUND', 'HTML PPT artifact not found')
  }

  const existingArtifact = resolveExistingPptxArtifact(input.htmlArtifactId)
  if (existingArtifact) {
    const existingFilename = existingArtifact.exports?.find((entry) => entry.format === 'pptx')?.filename
      || existingArtifact.exports?.[0]?.filename
      || `${sanitizeFilenameSegment(existingArtifact.title || htmlArtifact.title, 'presentation')}.pptx`
    return {
      success: true,
      cached: true,
      artifact: existingArtifact,
      timeoutMs: HTML_TO_PPTX_TIMEOUT_MS,
      filename: existingFilename,
      downloadUrl: `/api/artifacts/${existingArtifact.id}/download?format=pptx`,
    }
  }

  if (typeof writePptxFile !== 'function') {
    throw new HtmlPresentationExportError('HTML_TO_PPTX_SKILL_NOT_FOUND', 'Existing PPTX export service is not available')
  }

  const startedAt = Date.now()
  const contentModel = loadContentModel(input.htmlArtifactId)
  const plan = buildPptxPlan(contentModel)
  const artifactDir = getHtmlArtifactDir(input.htmlArtifactId)
  const exportDir = path.join(artifactDir, 'exports')
  const filename = `${sanitizeFilenameSegment(contentModel.title || htmlArtifact.title, 'presentation')}.pptx`
  const outputPath = path.join(exportDir, `${randomUUID()}-${filename}`)
  fs.mkdirSync(exportDir, { recursive: true })

  try {
    await withTimeout(writePptxFile(plan, outputPath), HTML_TO_PPTX_TIMEOUT_MS)
  } catch (error) {
    if (error instanceof HtmlPresentationExportError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new HtmlPresentationExportError('PPTX_EXPORT_FAILED', message || 'HTML 转 PPTX 失败')
  }

  if (!fs.existsSync(outputPath)) {
    throw new HtmlPresentationExportError('PPTX_FILE_NOT_CREATED', 'PPTX 文件未生成')
  }

  const workspace = bootstrapWorkspaceForUser(input.userId)
  const artifact = saveSkillArtifact({
    userId: input.userId,
    workspacePath: workspace.currentWorkspacePath,
    skillId: 'html-ppt.export-pptx',
    type: 'presentation',
    title: contentModel.title || htmlArtifact.title || 'HTML 演示文稿',
    filename,
    format: 'pptx',
    content: fs.readFileSync(outputPath),
    sourceRefs: [
      {
        type: 'html_presentation',
        id: input.htmlArtifactId,
        label: htmlArtifact.title,
      },
    ],
    metadata: {
      sourceHtmlArtifactId: input.htmlArtifactId,
      exportElapsedMs: Date.now() - startedAt,
      sourceTemplateSlug: contentModel.templateSlug,
    },
  })

  updateHtmlArtifact(input.htmlArtifactId, {
    metadata: {
      pptxExportArtifactId: artifact.id,
      pptxFilename: filename,
      pptxGeneratedAt: new Date().toISOString(),
    },
  })

  try {
    fs.unlinkSync(outputPath)
  } catch {
    // ignore temp cleanup failures
  }

  return {
    success: true,
    cached: false,
    artifact,
    timeoutMs: HTML_TO_PPTX_TIMEOUT_MS,
    filename,
    downloadUrl: `/api/artifacts/${artifact.id}/download?format=pptx`,
  }
}
