/**
 * 服务端 documentSession / HTML / Markdown 构造（与前端 webDocumentTypes 对齐）
 */
import type { GeneratedDocxContent } from '../../modules/ai-gateway/documentGenerator'

export interface PageSpecJson {
  paperSize: 'A4' | 'Letter'
  widthMm: number
  heightMm: number
  marginMm: { top: number; right: number; bottom: number; left: number }
  lineHeight?: number
  fontFamily?: string
  fontSizePt?: number
}

export interface HeaderFooterSpecJson {
  showPageNumber?: boolean
  headerText?: string
  footerText?: string
  headerAlign?: 'left' | 'center' | 'right'
  footerAlign?: 'left' | 'center' | 'right'
}

export interface DocumentBlockJson {
  id: string
  type: 'heading' | 'paragraph'
  text: string
  level?: number
}

export interface WebDocumentSessionJson {
  id: string
  title: string
  selectedGeneratorSkillId: string
  selectedTemplateSkillId: string
  selectedExporterSkillIds: string[]
  sourceRefs: { knowledgeBaseIds: string[]; fileIds: string[] }
  content: {
    blocks: DocumentBlockJson[]
    html?: string
    markdown?: string
  }
  pageSpec: PageSpecJson
  headerFooter: HeaderFooterSpecJson
  artifacts: string[]
  lastArtifactId?: string
  updatedAt: string
}

const DEFAULT_PAGE_SPEC: PageSpecJson = {
  paperSize: 'A4',
  widthMm: 210,
  heightMm: 297,
  marginMm: { top: 25, right: 20, bottom: 25, left: 25 },
  lineHeight: 1.6,
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  fontSizePt: 12,
}

export function resolvePageSpecFromTemplate(templateManifest?: {
  pageSpec?: PageSpecJson
}): PageSpecJson {
  return templateManifest?.pageSpec
    ? { ...DEFAULT_PAGE_SPEC, ...templateManifest.pageSpec }
    : { ...DEFAULT_PAGE_SPEC }
}

export function resolveHeaderFooterFromTemplate(templateManifest?: {
  headerFooter?: HeaderFooterSpecJson
}): HeaderFooterSpecJson {
  return templateManifest?.headerFooter ?? {
    showPageNumber: true,
    footerText: '第 {page} 页',
    footerAlign: 'center',
  }
}

export function contentToBlocks(content: GeneratedDocxContent): DocumentBlockJson[] {
  const blocks: DocumentBlockJson[] = []
  let idx = 0
  blocks.push({
    id: `b-${idx++}`,
    type: 'heading',
    text: content.title,
    level: 1,
  })
  if (content.subtitle?.trim()) {
    blocks.push({ id: `b-${idx++}`, type: 'paragraph', text: content.subtitle.trim() })
  }
  for (const section of content.sections) {
    blocks.push({
      id: `b-${idx++}`,
      type: 'heading',
      text: section.heading,
      level: 2,
    })
    for (const para of section.paragraphs) {
      blocks.push({ id: `b-${idx++}`, type: 'paragraph', text: para })
    }
  }
  return blocks
}

export function contentToMarkdown(content: GeneratedDocxContent): string {
  const lines: string[] = [`# ${content.title}`]
  if (content.subtitle?.trim()) lines.push('', content.subtitle.trim())
  for (const section of content.sections) {
    lines.push('', `## ${section.heading}`)
    for (const para of section.paragraphs) {
      lines.push('', para)
    }
  }
  return lines.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function contentToHtml(
  content: GeneratedDocxContent,
  headerFooter: HeaderFooterSpecJson,
): string {
  const parts: string[] = []
  if (headerFooter.headerText?.trim()) {
    parts.push(`<div class="doc-header" style="text-align:${headerFooter.headerAlign || 'center'};color:#64748b;font-size:12px;margin-bottom:12px;">${escapeHtml(headerFooter.headerText)}</div>`)
  }
  parts.push(`<h1>${escapeHtml(content.title)}</h1>`)
  if (content.subtitle?.trim()) {
    parts.push(`<p class="subtitle" style="text-align:center;color:#64748b;">${escapeHtml(content.subtitle)}</p>`)
  }
  for (const section of content.sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`)
    for (const para of section.paragraphs) {
      parts.push(`<p>${escapeHtml(para)}</p>`)
    }
  }
  if (headerFooter.footerText?.trim()) {
    const footer = headerFooter.footerText.replace('{page}', '1')
    parts.push(`<div class="doc-footer" style="text-align:${headerFooter.footerAlign || 'center'};color:#94a3b8;font-size:11px;margin-top:24px;">${escapeHtml(footer)}</div>`)
  }
  return parts.join('\n')
}

export function buildDocumentSessionFromContent(
  content: GeneratedDocxContent,
  opts: {
    generatorSkillId?: string
    templateSkillId?: string
    knowledgeBaseIds?: string[]
    fileIds?: string[]
    artifactId?: string
    pageSpec?: PageSpecJson
    headerFooter?: HeaderFooterSpecJson
  },
): WebDocumentSessionJson {
  const pageSpec = opts.pageSpec ?? { ...DEFAULT_PAGE_SPEC }
  const headerFooter = opts.headerFooter ?? resolveHeaderFooterFromTemplate()
  const html = contentToHtml(content, headerFooter)
  const markdown = contentToMarkdown(content)
  const now = new Date().toISOString()
  return {
    id: `doc-${Date.now()}`,
    title: content.title,
    selectedGeneratorSkillId: opts.generatorSkillId ?? 'document.generator.office_draft',
    selectedTemplateSkillId: opts.templateSkillId ?? 'document.template.general',
    selectedExporterSkillIds: [
      'document.export.docx',
      'document.export.pdf',
      'document.export.markdown',
    ],
    sourceRefs: {
      knowledgeBaseIds: opts.knowledgeBaseIds ?? [],
      fileIds: opts.fileIds ?? [],
    },
    content: {
      blocks: contentToBlocks(content),
      html,
      markdown,
    },
    pageSpec,
    headerFooter,
    artifacts: opts.artifactId ? [opts.artifactId] : [],
    lastArtifactId: opts.artifactId,
    updatedAt: now,
  }
}

export function sanitizeFilename(title: string, ext: string): string {
  const base = String(title || '文稿')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80) || '文稿'
  return `${base}.${ext.replace(/^\./, '')}`
}
