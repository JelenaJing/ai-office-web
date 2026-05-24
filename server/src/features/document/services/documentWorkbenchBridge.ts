import { randomUUID } from 'crypto'
import { parseDocument } from 'htmlparser2'
import type { Element, Node } from 'domhandler'
import { getName, getText, isTag } from 'domutils'
import { saveDocumentRecord } from './documentTaskStore'
import { buildDocumentOutline, normalizeDocumentDraft } from './documentDraft'
import { parseMarkdownToDocxContent } from './markdownToHtml'
import { saveDocumentDraftDocxArtifact } from './documentArtifactService'
import type {
  DocumentDraft,
  DocumentEngine,
  DocumentKnowledgeRef,
  DocumentLanguage,
  DocumentRecord,
  DocumentTaskResult,
  DocumentType,
} from '../types'

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function directTagChildren(node: Element): Element[] {
  return (node.children || []).filter((child): child is Element => isTag(child))
}

function parseHtmlSections(html: string): { title: string; sections: Array<{ title: string; content: string }> } {
  const parsed = parseDocument(html || '')
  const sections: Array<{ title: string; paragraphs: string[] }> = []
  let title = ''
  let currentSection: { title: string; paragraphs: string[] } | null = null

  const ensureSection = (heading = '正文') => {
    if (!currentSection) {
      currentSection = { title: heading, paragraphs: [] }
      sections.push(currentSection)
    }
    return currentSection
  }

  const appendParagraph = (text: string) => {
    const normalized = normalizeText(text)
    if (!normalized) return
    ensureSection().paragraphs.push(normalized)
  }

  const visitNodes = (nodes: Node[] | undefined) => {
    if (!Array.isArray(nodes)) return
    nodes.forEach((node) => {
      if (!isTag(node)) return
      const name = getName(node)
      if (name === 'h1') {
        const nextTitle = normalizeText(getText(node))
        if (nextTitle && !title) title = nextTitle
        return
      }
      if (name === 'section') {
        const heading = directTagChildren(node)
          .find((child) => ['h2', 'h3', 'h4'].includes(getName(child)))
        currentSection = {
          title: normalizeText(getText(heading || node)) || `第 ${sections.length + 1} 节`,
          paragraphs: [],
        }
        sections.push(currentSection)
        directTagChildren(node).forEach((child) => {
          const childName = getName(child)
          if (['h2', 'h3', 'h4'].includes(childName)) return
          if (['p', 'li', 'blockquote'].includes(childName)) {
            appendParagraph(getText(child))
            return
          }
          if (childName === 'ul' || childName === 'ol') {
            directTagChildren(child)
              .filter((item) => getName(item) === 'li')
              .forEach((item) => appendParagraph(getText(item)))
            return
          }
          visitNodes(child.children)
        })
        currentSection = null
        return
      }
      if (name === 'h2' || name === 'h3' || name === 'h4') {
        currentSection = {
          title: normalizeText(getText(node)) || `第 ${sections.length + 1} 节`,
          paragraphs: [],
        }
        sections.push(currentSection)
        return
      }
      if (name === 'p' || name === 'blockquote' || name === 'li') {
        appendParagraph(getText(node))
        return
      }
      if (name === 'ul' || name === 'ol') {
        directTagChildren(node)
          .filter((child) => getName(child) === 'li')
          .forEach((child) => appendParagraph(getText(child)))
        return
      }
      visitNodes(node.children)
    })
  }

  visitNodes(parsed.children)

  return {
    title: title || '导入文稿',
    sections: sections
      .map((section) => ({
        title: normalizeText(section.title) || '正文',
        content: section.paragraphs.join('\n\n').trim() || '需要人工确认依据。',
      }))
      .filter((section) => section.title || section.content),
  }
}

export function buildWorkbenchDraftFromMarkdown(input: {
  markdown: string
  title?: string
  documentType: DocumentType
  language: DocumentLanguage
  engine: DocumentEngine
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): DocumentDraft {
  const parsed = parseMarkdownToDocxContent(input.markdown, input.title || '办公文稿')
  return normalizeDocumentDraft({
    raw: {
      title: input.title || parsed.title,
      sections: parsed.sections.map((section, index) => ({
        id: `section-${index + 1}`,
        title: section.heading,
        content: section.paragraphs.join('\n\n'),
      })),
    },
    title: input.title || parsed.title,
    type: input.documentType,
    language: input.language,
    engine: input.engine,
    templateId: input.templateId,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: parsed.sections.map((section) => section.heading),
  })
}

export function buildWorkbenchDraftFromHtml(input: {
  html: string
  title?: string
  documentType: DocumentType
  language: DocumentLanguage
  engine: DocumentEngine
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): DocumentDraft {
  const parsed = parseHtmlSections(input.html)
  return normalizeDocumentDraft({
    raw: {
      title: input.title || parsed.title,
      sections: parsed.sections.map((section, index) => ({
        id: `section-${index + 1}`,
        title: section.title,
        content: section.content,
      })),
    },
    title: input.title || parsed.title,
    type: input.documentType,
    language: input.language,
    engine: input.engine,
    templateId: input.templateId,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: parsed.sections.map((section) => section.title),
  })
}

export async function persistWorkbenchDocument(input: {
  userId: string
  workspacePath: string
  skillId: string
  engine: DocumentEngine
  title?: string
  documentType: DocumentType
  language: DocumentLanguage
  templateId?: string
  templateLabel?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  draft: DocumentDraft
  html?: string
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  const documentId = input.draft.id?.trim() || `document-${randomUUID()}`
  const draft: DocumentDraft = {
    ...input.draft,
    id: documentId,
    title: input.title?.trim() || input.draft.title,
    language: input.language,
    type: input.documentType,
    metadata: {
      ...input.draft.metadata,
      engine: input.engine,
      templateId: input.templateId,
      knowledgeRefs: input.knowledgeRefs,
    },
    outline: buildDocumentOutline({
      ...input.draft,
      id: documentId,
      title: input.title?.trim() || input.draft.title,
    }),
  }
  const exported = await saveDocumentDraftDocxArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: input.skillId,
    documentId,
    draft,
    knowledgeRefs: input.knowledgeRefs,
    html: input.html,
  })
  const now = new Date().toISOString()
  const record: DocumentRecord = {
    documentId,
    userId: input.userId,
    workspacePath: input.workspacePath,
    engine: input.engine,
    skillId: input.skillId,
    title: draft.title,
    language: input.language,
    documentType: input.documentType,
    templateId: input.templateId,
    templateLabel: input.templateLabel,
    knowledgeRefs: input.knowledgeRefs,
    draft,
    html: exported.html,
    documentArtifact: exported.documentArtifact,
    artifactId: exported.artifact.id,
    exportUrl: exported.exportUrl,
    filename: exported.filename,
    sourceRefs: exported.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
    artifact: exported.artifact,
    fallbackFrom: input.fallbackFrom,
    fallbackReason: input.fallbackReason,
    createdAt: now,
    updatedAt: now,
  }
  saveDocumentRecord(record)
  return {
    record,
    result: {
      engine: input.engine,
      skillId: input.skillId,
      documentId,
      artifactId: record.artifactId,
      exportUrl: record.exportUrl,
      filename: record.filename,
      document: draft,
      html: record.html,
      documentArtifact: record.documentArtifact,
      outline: draft.outline,
      templateId: record.templateId,
      templateLabel: record.templateLabel,
      knowledgeRefs: record.knowledgeRefs,
      fallbackFrom: record.fallbackFrom,
      fallbackReason: record.fallbackReason,
    },
  }
}
