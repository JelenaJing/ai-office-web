import { platformApi } from '../../../platform'
import type { Artifact, SkillInput, SkillResult } from '../../../platform'
import TurndownService from 'turndown'
import { artifactDownloadFilename } from '../../../utils/artifactDisplay'
import { getBuiltinDocumentSkill } from '../webDocumentBuiltInSkills'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import {
  applyTemplateToSession,
  createEmptyWebDocumentSession,
  normalizeWebDocumentSession,
  recordExportArtifact,
  sanitizeDocumentFilename,
  toExportDocumentSessionPayload,
} from '../webDocumentTypes'

export async function runWebDocumentSkill(
  skillId: string,
  input: SkillInput,
): Promise<SkillResult & { data?: Record<string, unknown> }> {
  return platformApi.skills.run(skillId, input) as Promise<SkillResult & { data?: Record<string, unknown> }>
}

export async function runWebDocxCreate(
  prompt: string,
  workspacePath: string,
  params?: Record<string, unknown>,
): Promise<SkillResult & { data?: Record<string, unknown> }> {
  return runWebDocumentSkill('web.docx.create', {
    prompt: prompt.trim(),
    workspacePath,
    params,
  })
}

export function resolveMapsToSkillId(manifest: WebDocumentSkillManifest): string {
  return manifest.mapsToSkillId || manifest.id
}

export function applyTemplateManifestToSession(
  session: WebDocumentSession,
  template?: WebDocumentSkillManifest | null,
): WebDocumentSession {
  if (!template) return session

  return applyTemplateToSession(
    session,
    template.id,
    template.pageSpec,
    template.headerFooter,
  )
}

export function sessionFromSkillResult(
  result: SkillResult & { data?: Record<string, unknown> },
  template?: WebDocumentSkillManifest | null,
  knowledgeBaseIds: string[] = [],
  fileIds: string[] = [],
): WebDocumentSession | null {
  const raw = result.data?.documentSession
  let session = raw ? normalizeWebDocumentSession(raw) : null

  if (!session && result.data?.html && typeof result.data.html === 'string') {
    session = {
      ...createEmptyWebDocumentSession(),
      title: (result.artifact?.title as string) || '文稿',
      html: result.data.html as string,
      markdown: (result.data.markdown as string) || '',
    }
  }

  if (!session) return null

  session = applyTemplateManifestToSession(session, template)
  session.knowledgeBaseIds = knowledgeBaseIds.length ? knowledgeBaseIds : session.knowledgeBaseIds
  session.fileIds = fileIds.length ? fileIds : session.fileIds

  if (result.data?.html && typeof result.data.html === 'string') {
    session.html = result.data.html
  }
  if (result.data?.markdown && typeof result.data.markdown === 'string') {
    session.markdown = result.data.markdown
  }
  if (result.artifact?.id) {
    session = recordExportArtifact(session, 'docx', result.artifact.id)
  }
  return session
}

export async function runWebDocumentExport(
  exporter: WebDocumentSkillManifest,
  workspacePath: string,
  session: WebDocumentSession,
  bodyHtml: string,
): Promise<SkillResult> {
  const skillId = resolveMapsToSkillId(exporter)
  const format = exporter.outputFormats?.[0]
  return runWebDocumentSkill(skillId, {
    workspacePath,
    params: {
      title: session.title,
      documentSession: toExportDocumentSessionPayload(session, bodyHtml),
      html: bodyHtml,
      markdown: session.markdown,
      pageSpec: session.pageSpec,
      headerFooter: session.headerFooter,
      format,
    },
  })
}

export function exportFormatFromManifest(exporter: WebDocumentSkillManifest): 'docx' | 'pdf' | 'markdown' {
  const f = exporter.outputFormats?.[0]
  if (f === 'pdf') return 'pdf'
  if (f === 'md' || f === 'markdown') return 'markdown'
  return 'docx'
}

export type DocumentExportFormat = 'docx' | 'markdown' | 'html'

function htmlToMarkdown(html: string): string {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  })
  return service.turndown(html || '<p></p>')
}

function triggerBrowserDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function exportLabel(format: DocumentExportFormat): string {
  switch (format) {
    case 'docx':
      return 'Word'
    case 'markdown':
      return 'Markdown'
    case 'html':
      return 'HTML'
    default:
      return '文稿'
  }
}

function resolveExporterByFormat(
  format: Exclude<DocumentExportFormat, 'html'>,
  exporters: WebDocumentSkillManifest[],
): WebDocumentSkillManifest | undefined {
  const exporterId = format === 'docx' ? 'document.export.docx' : 'document.export.markdown'
  return exporters.find((item) => item.id === exporterId) ?? getBuiltinDocumentSkill(exporterId)
}

export async function exportAndDownloadCurrentDocument(input: {
  format: DocumentExportFormat
  workspacePath: string
  session: WebDocumentSession
  bodyHtml: string
  exporters: WebDocumentSkillManifest[]
}): Promise<{
  session: WebDocumentSession
  message: string
}> {
  const session = {
    ...input.session,
    html: input.bodyHtml,
    markdown: input.format === 'markdown' ? htmlToMarkdown(input.bodyHtml) : input.session.markdown,
    updatedAt: new Date().toISOString(),
  }

  if (input.format === 'html') {
    const filename = sanitizeDocumentFilename(session.title, 'html')
    triggerBrowserDownload(filename, input.bodyHtml, 'text/html;charset=utf-8')
    return {
      session,
      message: 'HTML 已下载',
    }
  }

  const exporter = resolveExporterByFormat(input.format, input.exporters)
  if (!exporter) {
    throw new Error(`未找到${exportLabel(input.format)}导出器`)
  }

  const result = await runWebDocumentExport(exporter, input.workspacePath, session, input.bodyHtml)
  if (!result.success) {
    throw new Error(result.error || `${exportLabel(input.format)} 导出失败`)
  }
  if (!result.artifact?.id) {
    throw new Error(`${exportLabel(input.format)} 已生成但缺少下载文件`)
  }

  const filename = artifactDownloadFilename(result.artifact)
    || sanitizeDocumentFilename(session.title, input.format === 'docx' ? 'docx' : 'md')
  await platformApi.artifacts.download(result.artifact.id, filename)

  return {
    session: recordExportArtifact(session, input.format, result.artifact.id),
    message: `${exportLabel(input.format)} 已下载`,
  }
}

export function webDocxSuccessMessage(artifact: Artifact): string {
  const name = artifact.exports?.[0]?.filename || artifact.title || '文稿'
  return `已保存到资源中心 › 生成记录（${name}）`
}

export function getDefaultGeneratorSkill(): WebDocumentSkillManifest {
  return getBuiltinDocumentSkill('document.generator.office_draft')!
}

export function getDefaultTemplateSkill(): WebDocumentSkillManifest {
  return getBuiltinDocumentSkill('document.template.general')!
}

// applyTemplateToSession is re-exported from webDocumentTypes — see that module directly.

// ── DOCX Import (Web) ─────────────────────────────────────────────────────────

export interface DocxImportResult {
  html: string
  text: string
  title?: string
  wordCount: number
}

/**
 * Upload a .docx file to the server, extract its text as HTML, and return it
 * so the caller can insert it into the editor.
 *
 * Throws if the server returns an error — callers must handle this.
 */
export async function importDocxAsContent(file: File): Promise<DocxImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  // Read auth token from localStorage (same as webPlatformApi)
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('aios_auth_token')
          ?? localStorage.getItem('aios_itoken')
          ?? localStorage.getItem('ai_office_internal_token'))
      : null
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const resp = await fetch('/api/document/import-docx', {
    method: 'POST',
    headers,
    body: formData,
  })

  const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` })) as
    | DocxImportResult
    | { error: string }

  if (!resp.ok || 'error' in body) {
    throw new Error((body as { error: string }).error || `导入失败 (${resp.status})`)
  }

  const result = body as DocxImportResult
  if (!result.html?.trim()) {
    throw new Error('文档内容为空，未能提取到任何段落')
  }

  return result
}
