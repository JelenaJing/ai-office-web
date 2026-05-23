import type { WebDocumentSessionJson } from '../skills/documentSessionBuilder'
import type {
  DocumentDraft,
  DocumentDraftCitation,
  DocumentDraftTable,
  DocumentKnowledgeRef,
  DocumentType,
} from '../types'

function slug(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function normalizeTable(raw: Partial<DocumentDraftTable>, fallbackId: string): DocumentDraftTable | undefined {
  const headers = Array.isArray(raw.headers)
    ? raw.headers.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((row) => Array.isArray(row)
          ? row.map((cell) => String(cell || '').trim())
          : [])
        .filter((row) => row.some(Boolean))
    : []
  if (headers.length === 0 && rows.length === 0) return undefined
  return {
    id: String(raw.id || fallbackId),
    title: typeof raw.title === 'string' ? raw.title.trim() || undefined : undefined,
    headers,
    rows,
  }
}

function normalizeCitations(
  raw: unknown,
  knowledgeRefs: DocumentKnowledgeRef[],
): DocumentDraftCitation[] | undefined {
  if (!Array.isArray(raw)) {
    if (knowledgeRefs.length === 0) {
      return [{
        id: 'manual-confirmation',
        label: '需要人工确认依据',
        kind: 'manual_note',
        citationStatus: 'unverified',
      }]
    }
    return knowledgeRefs.slice(0, 3).map((ref, index) => ({
      id: `${ref.kind}-${ref.id}-${index}`,
      label: ref.label,
      kind: ref.kind,
      citationStatus: ref.citationStatus,
      note: ref.citationStatus === 'unverified' ? '需要人工确认依据' : undefined,
    }))
  }

  const items = raw
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const record = entry as Record<string, unknown>
      const label = String(record.label || '').trim()
      if (!label) return null
      const kind = record.kind === 'knowledge_base' || record.kind === 'file' || record.kind === 'manual_note'
        ? record.kind
        : 'manual_note'
      const citationStatus = record.citationStatus === 'verified' || record.citationStatus === 'partial' || record.citationStatus === 'unverified'
        ? record.citationStatus
        : 'partial'
      return {
        id: String(record.id || `citation-${index}`),
        label,
        kind,
        citationStatus,
        note: typeof record.note === 'string' ? record.note.trim() || undefined : undefined,
      } satisfies DocumentDraftCitation
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return items.length > 0 ? items : undefined
}

export function buildDocumentOutline(draft: DocumentDraft): DocumentDraft['outline'] {
  const explicit = Array.isArray(draft.outline) && draft.outline.length > 0
    ? draft.outline
    : draft.sections.map((section) => ({
        id: section.id,
        level: 1,
        title: section.title,
      }))
  return explicit.map((item, index) => ({
    id: item.id || `outline-${index + 1}`,
    level: Number.isFinite(item.level) ? item.level : 1,
    title: item.title || `第 ${index + 1} 节`,
  }))
}

export function normalizeDocumentDraft(input: {
  raw: unknown
  title: string
  type: DocumentType
  language: string
  engine: string
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  preferredOutline?: string[]
}): DocumentDraft {
  const record = input.raw && typeof input.raw === 'object'
    ? input.raw as Record<string, unknown>
    : {}
  const rawSections = Array.isArray(record.sections) ? record.sections : []
  const fallbackTitles = input.preferredOutline && input.preferredOutline.length > 0
    ? input.preferredOutline
    : ['概况说明', '主要内容', '问题分析', '下一步计划']

  const sections = (rawSections.length > 0 ? rawSections : fallbackTitles.map((title) => ({ title, content: '需要人工确认依据。' })))
    .map((entry, index) => {
      const section = entry && typeof entry === 'object'
        ? entry as Record<string, unknown>
        : {}
      const title = String(section.title || fallbackTitles[index] || `第 ${index + 1} 节`).trim() || `第 ${index + 1} 节`
      const rawContent = typeof section.content === 'string'
        ? section.content
        : Array.isArray(section.paragraphs)
          ? section.paragraphs.map((item) => String(item || '').trim()).filter(Boolean).join('\n\n')
          : ''
      const content = rawContent.trim() || '需要人工确认依据。'
      const tables = Array.isArray(section.tables)
        ? section.tables
            .map((table, tableIndex) => normalizeTable(
              table as Partial<DocumentDraftTable>,
              `${slug(title, `section-${index + 1}`)}-table-${tableIndex + 1}`,
            ))
            .filter((item): item is DocumentDraftTable => Boolean(item))
        : undefined

      return {
        id: String(section.id || `section-${index + 1}`),
        title,
        content,
        citations: normalizeCitations(section.citations, input.knowledgeRefs),
        tables: tables && tables.length > 0 ? tables : undefined,
      }
    })

  const title = String(record.title || input.title).trim() || input.title
  const draft: DocumentDraft = {
    id: String(record.id || `document-${Date.now()}`),
    title,
    type: input.type,
    language: input.language,
    outline: buildDocumentOutline({
      id: String(record.id || `document-${Date.now()}`),
      title,
      type: input.type,
      language: input.language,
      outline: sections.map((section, index) => ({
        id: section.id,
        level: 1,
        title: section.title || fallbackTitles[index] || `第 ${index + 1} 节`,
      })),
      sections,
      metadata: {
        engine: input.engine,
        templateId: input.templateId,
        knowledgeRefs: input.knowledgeRefs,
      },
    }),
    sections,
    metadata: {
      engine: input.engine,
      templateId: input.templateId,
      knowledgeRefs: input.knowledgeRefs,
    },
  }
  return draft
}

export function renderDocumentDraftHtml(draft: DocumentDraft): string {
  const parts: string[] = [`<h1>${escapeHtml(draft.title)}</h1>`]
  draft.sections.forEach((section) => {
    parts.push(`<section data-section-id="${escapeHtml(section.id)}">`)
    parts.push(`<h2>${escapeHtml(section.title)}</h2>`)
    splitParagraphs(section.content).forEach((paragraph) => {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`)
    })
    section.tables?.forEach((table) => {
      const headerRow = table.headers.length > 0
        ? `<tr>${table.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr>`
        : ''
      const bodyRows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
      parts.push(`<div class="document-table-block">${table.title ? `<div class="document-table-title">${escapeHtml(table.title)}</div>` : ''}<table>${headerRow}${bodyRows}</table></div>`)
    })
    if (section.citations && section.citations.length > 0) {
      parts.push('<div class="document-citations">')
      section.citations.forEach((citation) => {
        parts.push(`<p>依据：${escapeHtml(citation.label)}${citation.note ? `（${escapeHtml(citation.note)}）` : ''}</p>`)
      })
      parts.push('</div>')
    }
    parts.push('</section>')
  })
  return parts.join('\n')
}

export function renderDocumentDraftMarkdown(draft: DocumentDraft): string {
  const lines: string[] = [`# ${draft.title}`]
  draft.sections.forEach((section) => {
    lines.push('', `## ${section.title}`)
    splitParagraphs(section.content).forEach((paragraph) => {
      lines.push('', paragraph)
    })
    section.tables?.forEach((table) => {
      if (table.title) lines.push('', `> ${table.title}`)
      if (table.headers.length > 0) {
        lines.push('', `| ${table.headers.join(' | ')} |`)
        lines.push(`| ${table.headers.map(() => '---').join(' | ')} |`)
      }
      table.rows.forEach((row) => {
        lines.push(`| ${row.join(' | ')} |`)
      })
    })
    section.citations?.forEach((citation) => {
      lines.push('', `- 依据：${citation.label}${citation.note ? `（${citation.note}）` : ''}`)
    })
  })
  return lines.join('\n')
}

export function renderDocumentDraftText(draft: DocumentDraft): string {
  const lines: string[] = [draft.title]
  draft.sections.forEach((section) => {
    lines.push('', section.title)
    splitParagraphs(section.content).forEach((paragraph) => {
      lines.push(paragraph)
    })
  })
  return lines.join('\n')
}

export function buildDocumentSessionFromDraft(input: {
  draft: DocumentDraft
  artifactId?: string
}): WebDocumentSessionJson {
  const blocks: WebDocumentSessionJson['content']['blocks'] = [
    { id: 'heading-title', type: 'heading', level: 1, text: input.draft.title },
  ]
  input.draft.sections.forEach((section, index) => {
    blocks.push({
      id: `${section.id}-heading`,
      type: 'heading',
      level: 2,
      text: section.title,
    })
    splitParagraphs(section.content).forEach((paragraph, paragraphIndex) => {
      blocks.push({
        id: `${section.id}-p-${paragraphIndex + 1}`,
        type: 'paragraph',
        text: paragraph,
      })
    })
  })

  return {
    id: input.draft.id,
    title: input.draft.title,
    selectedGeneratorSkillId: input.draft.metadata.engine,
    selectedTemplateSkillId: input.draft.metadata.templateId || 'document.template.general',
    selectedExporterSkillIds: ['document.export.docx', 'document.export.pdf', 'document.export.markdown'],
    sourceRefs: {
      knowledgeBaseIds: (input.draft.metadata.knowledgeRefs || [])
        .filter((item) => item.kind === 'knowledge_base')
        .map((item) => item.id),
      fileIds: (input.draft.metadata.knowledgeRefs || [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.id),
    },
    content: {
      blocks,
      html: renderDocumentDraftHtml(input.draft),
      markdown: renderDocumentDraftMarkdown(input.draft),
    },
    pageSpec: {
      paperSize: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: { top: 25, right: 20, bottom: 25, left: 25 },
      lineHeight: 1.8,
      fontFamily: '"FangSong", "STSong", "SimSun", serif',
      fontSizePt: 12,
    },
    headerFooter: {
      showPageNumber: true,
      footerText: '第 {page} 页',
      footerAlign: 'center',
    },
    artifacts: input.artifactId ? [input.artifactId] : [],
    lastArtifactId: input.artifactId,
    updatedAt: new Date().toISOString(),
  }
}

export function findSectionIndex(draft: DocumentDraft, sectionId: string): number {
  return draft.sections.findIndex((section) => section.id === sectionId)
}

export function getNearbySections(draft: DocumentDraft, sectionId: string): Array<{ id: string; title: string; content: string }> {
  const sectionIndex = findSectionIndex(draft, sectionId)
  if (sectionIndex < 0) return []
  return draft.sections
    .slice(Math.max(0, sectionIndex - 1), Math.min(draft.sections.length, sectionIndex + 2))
    .map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
    }))
}
