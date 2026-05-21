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

export interface DocumentBlock {
  id: string
  type: 'heading' | 'paragraph'
  text: string
  level?: number
}

export interface WebDocumentSourceRefs {
  knowledgeBaseIds: string[]
  fileIds: string[]
}

export interface WebDocumentContent {
  blocks: DocumentBlock[]
  html?: string
  markdown?: string
}

export interface WebDocumentSession {
  id: string
  title: string
  selectedGeneratorSkillId: string
  selectedTemplateSkillId: string
  selectedExporterSkillIds: string[]
  sourceRefs: WebDocumentSourceRefs
  content: WebDocumentContent
  pageSpec: PageSpec
  headerFooter: HeaderFooterSpec
  artifacts: string[]
  lastArtifactId?: string
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
    selectedGeneratorSkillId: 'document.generator.office_draft',
    selectedTemplateSkillId: 'document.template.general',
    selectedExporterSkillIds: [
      'document.export.docx',
      'document.export.pdf',
      'document.export.markdown',
    ],
    sourceRefs: { knowledgeBaseIds: [], fileIds: [] },
    content: { blocks: [], html: '<p></p>', markdown: '' },
    pageSpec: { ...DEFAULT_PAGE_SPEC },
    headerFooter: { ...EMPTY_HEADER_FOOTER },
    artifacts: [],
    updatedAt: now,
  }
}

export function sanitizeDocumentFilename(title: string, ext: string): string {
  const base = String(title || '文稿')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80) || '文稿'
  return `${base}.${ext.replace(/^\./, '')}`
}
