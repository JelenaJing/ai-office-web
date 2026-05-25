import { randomUUID } from 'crypto'
import { buildDocumentOutline, normalizeDocumentDraft } from '../../document/services/documentDraft'
import { saveDocumentDraftDocxArtifact } from '../../document/services/documentArtifactService'
import { saveDocumentRecord } from '../../document/services/documentTaskStore'
import type {
  DocumentLanguage,
  DocumentRecord,
  DocumentTaskResult,
  DocumentType,
} from '../../document/types'

const EXTERNAL_SKILL_ID = 'external.content-handoff'

export function parseExternalContentToSections(input: {
  content: string
  contentFormat: 'text' | 'markdown'
  defaultTitle: string
}): { title: string; sections: Array<{ id: string; title: string; content: string }> } {
  const trimmed = input.content.trim()
  if (!trimmed) {
    return {
      title: input.defaultTitle,
      sections: [{ id: 'section-1', title: '正文', content: '' }],
    }
  }

  if (input.contentFormat === 'text') {
    const blocks = trimmed.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
    if (blocks.length <= 1) {
      return {
        title: input.defaultTitle,
        sections: [{ id: 'section-1', title: '正文', content: trimmed }],
      }
    }
    return {
      title: input.defaultTitle,
      sections: blocks.map((block, index) => ({
        id: `section-${index + 1}`,
        title: `第 ${index + 1} 节`,
        content: block,
      })),
    }
  }

  let title = input.defaultTitle
  const sections: Array<{ id: string; title: string; content: string }> = []
  let current: { title: string; lines: string[] } | null = null
  const preamble: string[] = []

  for (const line of trimmed.split('\n')) {
    const h1 = line.match(/^#\s+(.+?)\s*$/)
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h1 && sections.length === 0 && !current) {
      title = h1[1].trim() || input.defaultTitle
      continue
    }
    if (h2) {
      if (current) {
        sections.push({
          id: `section-${sections.length + 1}`,
          title: current.title,
          content: current.lines.join('\n').trim(),
        })
      } else if (preamble.length > 0) {
        sections.push({
          id: 'section-1',
          title: '概述',
          content: preamble.join('\n').trim(),
        })
        preamble.length = 0
      }
      current = {
        title: h2[1].trim() || `第 ${sections.length + 1} 节`,
        lines: [],
      }
      continue
    }
    if (current) current.lines.push(line)
    else preamble.push(line)
  }

  if (current) {
    sections.push({
      id: `section-${sections.length + 1}`,
      title: current.title,
      content: current.lines.join('\n').trim(),
    })
  } else if (preamble.length > 0) {
    sections.push({
      id: 'section-1',
      title: '正文',
      content: preamble.join('\n').trim(),
    })
  }

  if (sections.length === 0) {
    sections.push({
      id: 'section-1',
      title: '正文',
      content: trimmed,
    })
  }

  return { title, sections }
}

function normalizeDocumentType(value: unknown): DocumentType {
  switch (value) {
    case 'notice':
    case 'memo':
    case 'proposal':
    case 'summary':
    case 'official_letter':
      return value
    case 'report':
    default:
      return 'report'
  }
}

export async function importExternalContentToDocument(input: {
  userId: string
  workspacePath: string
  title: string
  content: string
  contentFormat: 'text' | 'markdown'
  language?: DocumentLanguage
  documentType?: DocumentType
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  const defaultTitle = input.title.trim() || '外部导入文稿'
  const parsed = parseExternalContentToSections({
    content: input.content,
    contentFormat: input.contentFormat,
    defaultTitle,
  })
  const language = input.language === 'en-US' ? 'en-US' : 'zh-CN'
  const documentType = normalizeDocumentType(input.documentType)
  const documentId = `document-${randomUUID()}`

  const draft = normalizeDocumentDraft({
    raw: {
      id: documentId,
      title: parsed.title,
      sections: parsed.sections.map((section, index) => ({
        id: section.id || `section-${index + 1}`,
        title: section.title,
        content: section.content || ' ',
      })),
    },
    title: parsed.title,
    type: documentType,
    language,
    engine: 'builtin',
    knowledgeRefs: [],
  })
  draft.id = documentId

  const artifactResult = await saveDocumentDraftDocxArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: EXTERNAL_SKILL_ID,
    documentId,
    draft,
    knowledgeRefs: [],
  })

  const now = new Date().toISOString()
  const record: DocumentRecord = {
    documentId,
    userId: input.userId,
    workspacePath: input.workspacePath,
    engine: 'builtin',
    skillId: EXTERNAL_SKILL_ID,
    title: draft.title,
    language,
    documentType,
    knowledgeRefs: [],
    draft,
    html: artifactResult.html,
    documentArtifact: artifactResult.documentArtifact,
    artifactId: artifactResult.artifact.id,
    exportUrl: artifactResult.exportUrl,
    filename: artifactResult.filename,
    sourceRefs: artifactResult.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: artifactResult.artifact.knowledgeRefs ?? [],
    artifact: artifactResult.artifact,
    createdAt: now,
    updatedAt: now,
  }
  saveDocumentRecord(record)

  return {
    record,
    result: {
      engine: 'builtin',
      skillId: EXTERNAL_SKILL_ID,
      documentId: record.documentId,
      artifactId: record.artifactId,
      exportUrl: record.exportUrl,
      filename: record.filename,
      document: record.draft,
      html: record.html,
      documentArtifact: record.documentArtifact,
      outline: buildDocumentOutline(record.draft),
      knowledgeRefs: [],
    },
  }
}

export function buildHandoffOpenUrl(
  handoffId: string,
  input?: { webOrigin?: string; reqOrigin?: string },
): string {
  const fromBody = input?.webOrigin?.trim().replace(/\/$/, '')
  const envOrigin = process.env.WEB_ORIGIN?.trim().replace(/\/$/, '')
    || process.env.AI_OFFICE_PUBLIC_URL?.trim().replace(/\/$/, '')
  const fromReq = input?.reqOrigin?.trim().replace(/\/$/, '')
  const origin = fromBody || envOrigin || fromReq || 'http://localhost:5173'
  return `${origin}/?handoff=${encodeURIComponent(handoffId)}`
}
