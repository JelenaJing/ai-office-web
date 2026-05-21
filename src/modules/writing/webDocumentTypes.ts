export interface PageMarginsMm {
  top: number
  right: number
  bottom: number
  left: number
}

export interface PageSpec {
  paperSize: 'A4' | 'Letter'
  widthMm: number
  heightMm: number
  marginMm: PageMarginsMm
  lineHeight?: number
  fontFamily?: string
  fontSizePt?: number
}

export interface HeaderFooterSpec {
  showPageNumber?: boolean
  headerText?: string
  footerText?: string
  headerAlign?: 'left' | 'center' | 'right'
  footerAlign?: 'left' | 'center' | 'right'
}

/** 导出/服务端兼容的 legacy 嵌套结构 */
export interface WebDocumentContentLegacy {
  blocks: Array<{ id: string; type: 'heading' | 'paragraph'; text: string; level?: number }>
  html?: string
  markdown?: string
}

/** Web 文稿会话（Word-like 编辑器） */
export interface WebDocumentSession {
  id: string
  title: string
  templateSkillId: string
  knowledgeBaseIds: string[]
  fileIds: string[]
  html: string
  markdown?: string
  pageSpec: PageSpec
  headerFooter: HeaderFooterSpec
  artifacts: {
    docxArtifactId?: string
    pdfArtifactId?: string
    markdownArtifactId?: string
  }
  updatedAt: string
}

export const DEFAULT_PAGE_SPEC: PageSpec = {
  paperSize: 'A4',
  widthMm: 210,
  heightMm: 297,
  marginMm: { top: 25, right: 20, bottom: 25, left: 25 },
  lineHeight: 1.6,
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  fontSizePt: 12,
}

export const EMPTY_HEADER_FOOTER: HeaderFooterSpec = {
  showPageNumber: false,
  headerText: '',
  footerText: '',
  headerAlign: 'center',
  footerAlign: 'center',
}

export function createEmptyWebDocumentSession(): WebDocumentSession {
  const now = new Date().toISOString()
  return {
    id: `doc-${Date.now()}`,
    title: '未命名文稿',
    templateSkillId: 'document.template.general',
    knowledgeBaseIds: [],
    fileIds: [],
    html: '<p></p>',
    markdown: '',
    pageSpec: { ...DEFAULT_PAGE_SPEC },
    headerFooter: { ...EMPTY_HEADER_FOOTER },
    artifacts: {},
    updatedAt: now,
  }
}

/** 将服务端或旧版 session 规范化为新版 */
export function normalizeWebDocumentSession(raw: unknown): WebDocumentSession {
  if (!raw || typeof raw !== 'object') {
    return createEmptyWebDocumentSession()
  }
  const r = raw as Record<string, unknown>
  const now = new Date().toISOString()

  if (typeof r.html === 'string' && r.pageSpec) {
    return {
      id: String(r.id ?? `doc-${Date.now()}`),
      title: String(r.title ?? '未命名文稿'),
      templateSkillId: String(r.templateSkillId ?? r.selectedTemplateSkillId ?? 'document.template.general'),
      knowledgeBaseIds: Array.isArray(r.knowledgeBaseIds)
        ? (r.knowledgeBaseIds as string[])
        : ((r.sourceRefs as { knowledgeBaseIds?: string[] })?.knowledgeBaseIds ?? []),
      fileIds: Array.isArray(r.fileIds)
        ? (r.fileIds as string[])
        : ((r.sourceRefs as { fileIds?: string[] })?.fileIds ?? []),
      html: r.html,
      markdown: typeof r.markdown === 'string' ? r.markdown : undefined,
      pageSpec: { ...DEFAULT_PAGE_SPEC, ...(r.pageSpec as PageSpec) },
      headerFooter: { ...EMPTY_HEADER_FOOTER, ...(r.headerFooter as HeaderFooterSpec) },
      artifacts: normalizeArtifacts(r.artifacts),
      updatedAt: String(r.updatedAt ?? now),
    }
  }

  const content = r.content as WebDocumentContentLegacy | undefined
  const html = content?.html ?? '<p></p>'
  const legacyArtifacts = Array.isArray(r.artifacts) ? (r.artifacts as string[]) : []
  const lastId = typeof r.lastArtifactId === 'string' ? r.lastArtifactId : legacyArtifacts[legacyArtifacts.length - 1]

  return {
    id: String(r.id ?? `doc-${Date.now()}`),
    title: String(r.title ?? '未命名文稿'),
    templateSkillId: String(r.selectedTemplateSkillId ?? r.templateSkillId ?? 'document.template.general'),
    knowledgeBaseIds: (r.sourceRefs as { knowledgeBaseIds?: string[] })?.knowledgeBaseIds ?? [],
    fileIds: (r.sourceRefs as { fileIds?: string[] })?.fileIds ?? [],
    html,
    markdown: content?.markdown,
    pageSpec: { ...DEFAULT_PAGE_SPEC, ...(r.pageSpec as PageSpec) },
    headerFooter: { ...EMPTY_HEADER_FOOTER, ...(r.headerFooter as HeaderFooterSpec) },
    artifacts: lastId ? { docxArtifactId: lastId } : {},
    updatedAt: String(r.updatedAt ?? now),
  }
}

function normalizeArtifacts(raw: unknown): WebDocumentSession['artifacts'] {
  if (!raw || typeof raw !== 'object') return {}
  if (Array.isArray(raw)) {
    const last = raw[raw.length - 1]
    return typeof last === 'string' ? { docxArtifactId: last } : {}
  }
  const a = raw as WebDocumentSession['artifacts']
  return {
    docxArtifactId: a.docxArtifactId,
    pdfArtifactId: a.pdfArtifactId,
    markdownArtifactId: a.markdownArtifactId,
  }
}

export function applyTemplateToSession(
  session: WebDocumentSession,
  templateSkillId: string,
  pageSpec?: PageSpec,
  headerFooter?: HeaderFooterSpec,
): WebDocumentSession {
  return {
    ...session,
    templateSkillId,
    pageSpec: pageSpec ? { ...DEFAULT_PAGE_SPEC, ...pageSpec } : session.pageSpec,
    headerFooter: headerFooter ? { ...EMPTY_HEADER_FOOTER, ...headerFooter } : session.headerFooter,
    updatedAt: new Date().toISOString(),
  }
}

/** 导出 skill 使用的服务端 documentSession 形状 */
export function toExportDocumentSessionPayload(
  session: WebDocumentSession,
  bodyHtml: string,
): Record<string, unknown> {
  const artifactIds = [
    session.artifacts.docxArtifactId,
    session.artifacts.pdfArtifactId,
    session.artifacts.markdownArtifactId,
  ].filter(Boolean) as string[]
  return {
    id: session.id,
    title: session.title,
    selectedGeneratorSkillId: 'document.generator.office_draft',
    selectedTemplateSkillId: session.templateSkillId,
    selectedExporterSkillIds: [
      'document.export.docx',
      'document.export.pdf',
      'document.export.markdown',
    ],
    sourceRefs: {
      knowledgeBaseIds: session.knowledgeBaseIds,
      fileIds: session.fileIds,
    },
    content: {
      blocks: [],
      html: bodyHtml,
      markdown: session.markdown ?? '',
    },
    pageSpec: session.pageSpec,
    headerFooter: session.headerFooter,
    artifacts: artifactIds,
    lastArtifactId: artifactIds[artifactIds.length - 1],
    updatedAt: session.updatedAt,
  }
}

export function recordExportArtifact(
  session: WebDocumentSession,
  format: 'docx' | 'pdf' | 'markdown',
  artifactId: string,
): WebDocumentSession {
  const artifacts = { ...session.artifacts }
  if (format === 'docx') artifacts.docxArtifactId = artifactId
  if (format === 'pdf') artifacts.pdfArtifactId = artifactId
  if (format === 'markdown') artifacts.markdownArtifactId = artifactId
  return { ...session, artifacts, updatedAt: new Date().toISOString() }
}

export function sanitizeDocumentFilename(title: string, ext: string): string {
  const base = String(title || '文稿')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80) || '文稿'
  return `${base}.${ext.replace(/^\./, '')}`
}
