import { normalizeDocumentDraft } from './documentDraft'
import { persistWorkbenchDocument } from './documentWorkbenchBridge'
import type {
  DocumentCitation,
  DocumentKnowledgeRef,
  DocumentLanguage,
  DocumentReference,
  DocumentTaskResult,
} from '../types'

export type AcademicWritingPaperType =
  | 'course_paper'
  | 'research_report'
  | 'literature_review'
  | 'policy_research_report'
  | 'business_research_report'

export type AcademicWritingStyle = 'academic' | 'formal' | 'report'

export interface AcademicWritingInput {
  userId: string
  workspacePath: string
  topic: string
  paperType: AcademicWritingPaperType
  researchGoal?: string
  lengthHint?: string
  language?: DocumentLanguage
  style?: AcademicWritingStyle
  outline?: string[]
  knowledgeRefs: DocumentKnowledgeRef[]
}

export interface AcademicWritingResult {
  success: true
  result: DocumentTaskResult
  outline: string[]
  paperType: AcademicWritingPaperType
  references: DocumentReference[]
  citations: DocumentCitation[]
}

const PAPER_TYPE_LABELS: Record<AcademicWritingPaperType, string> = {
  course_paper: '课程论文',
  research_report: '研究报告',
  literature_review: '文献综述',
  policy_research_report: '政策研究报告',
  business_research_report: '商业研究报告',
}

const DEFAULT_OUTLINES: Record<AcademicWritingPaperType, string[]> = {
  course_paper: ['摘要', '引言', '理论基础与研究问题', '分析与讨论', '结论', '参考文献'],
  research_report: ['摘要', '研究背景与目标', '研究方法', '分析发现', '结论与建议', '参考文献'],
  literature_review: ['摘要', '引言', '文献检索与筛选', '研究脉络', '主要观点与争议', '未来研究方向', '参考文献'],
  policy_research_report: ['摘要', '问题背景', '政策依据', '现状分析', '政策建议', '风险与保障', '参考文献'],
  business_research_report: ['摘要', '研究目标', '市场与行业背景', '数据与方法', '核心发现', '商业建议', '参考文献'],
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeOutlineItems(items: unknown, paperType: AcademicWritingPaperType): string[] {
  const input = Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  const base = input.length > 0 ? input : DEFAULT_OUTLINES[paperType]
  return base
    .map((item) => item.replace(/^\d+[.)、]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 10)
}

export function buildAcademicWritingOutline(input: {
  topic: string
  paperType: AcademicWritingPaperType
  researchGoal?: string
  lengthHint?: string
  language?: DocumentLanguage
  style?: AcademicWritingStyle
}): { title: string; outline: string[]; paperType: AcademicWritingPaperType } {
  const topic = input.topic.trim()
  const label = PAPER_TYPE_LABELS[input.paperType]
  const title = topic.endsWith(label) ? topic : `${topic}${label}`
  const outline = normalizeOutlineItems(undefined, input.paperType)
  return { title, outline, paperType: input.paperType }
}

function refId(ref: DocumentKnowledgeRef): string {
  return `ref-${ref.provider || 'unknown'}-${ref.kind}-${ref.sourceId || ref.id}`
}

function sourceTypeForRef(ref: DocumentKnowledgeRef): 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note' {
  if (ref.sourceType) return ref.sourceType
  return ref.kind
}

function trustForRef(ref: DocumentKnowledgeRef): 'verified' | 'partial' | 'unverified' | 'unknown' {
  return ref.trustLevel || ref.citationStatus || 'unknown'
}

function buildReference(ref: DocumentKnowledgeRef, citedBlockId: string): DocumentReference {
  return {
    id: refId(ref),
    label: ref.label,
    kind: ref.kind,
    sourceId: ref.sourceId || ref.id,
    sourceLabel: ref.label,
    excerpt: ref.excerpt,
    provider: ref.provider,
    sourceType: sourceTypeForRef(ref),
    chunkId: ref.chunkId || `${ref.id}-chunk-1`,
    trustLevel: trustForRef(ref),
    metadata: ref.metadata,
    citedBlockIds: [citedBlockId],
    citationStatus: ref.citationStatus,
  }
}

function fallbackKnowledgeRef(): DocumentKnowledgeRef {
  return {
    kind: 'knowledge_base',
    id: 'manual-policy-source',
    label: '待补充知识库依据',
    excerpt: '未选择知识库时保留依据占位，后续可替换为真实文献、政策或材料来源。',
    provider: 'remote',
    sourceType: 'manual_note',
    sourceId: 'manual-policy-source',
    chunkId: 'manual-policy-source-chunk-1',
    trustLevel: 'unverified',
    citationStatus: 'unverified',
  }
}

function sectionParagraphs(input: {
  topic: string
  paperType: AcademicWritingPaperType
  sectionTitle: string
  researchGoal?: string
  lengthHint?: string
  style: AcademicWritingStyle
  refLabel: string
}): string[] {
  const label = PAPER_TYPE_LABELS[input.paperType]
  const goal = input.researchGoal?.trim()
    ? `研究目标是：${input.researchGoal.trim()}`
    : `研究目标是围绕“${input.topic}”形成结构化论证。`
  const style = input.style === 'academic' ? '学术' : input.style === 'formal' ? '正式' : '报告式'
  if (/参考文献/.test(input.sectionTitle)) {
    return [
      `${input.refLabel}。后续接入真实检索后，可在此处按学校或期刊要求输出 GB/T 7714、APA 或 Chicago 格式。`,
    ]
  }
  return [
    `${input.sectionTitle}围绕“${input.topic}”展开，写作类型为${label}，整体采用${style}风格。${goal}`,
    `本节依据已选知识库、文献或政策材料提炼关键事实和论证线索；若来源可信度不足，正文保留“需要人工确认依据”的提示，避免编造政策或文献。`,
  ]
}

function renderCitationSpan(input: {
  citationId: string
  reference: DocumentReference
  label: string
}): string {
  return [
    `<span class="doc-citation" data-citation-id="${escapeHtml(input.citationId)}"`,
    ` data-ref-id="${escapeHtml(input.reference.id)}"`,
    ` data-ref-label="${escapeHtml(input.reference.label)}"`,
    ` data-source-id="${escapeHtml(input.reference.sourceId)}"`,
    ` data-provider="${escapeHtml(input.reference.provider || '')}"`,
    ` data-source-type="${escapeHtml(input.reference.sourceType || input.reference.kind)}"`,
    ` data-chunk-id="${escapeHtml(input.reference.chunkId || '')}"`,
    ` data-trust-level="${escapeHtml(input.reference.trustLevel || input.reference.citationStatus || 'unknown')}"`,
    ' data-render-mode="inline"',
    `>[${escapeHtml(input.label)}]</span>`,
  ].join('')
}

function buildAcademicHtml(input: {
  documentId: string
  title: string
  outline: string[]
  topic: string
  paperType: AcademicWritingPaperType
  researchGoal?: string
  lengthHint?: string
  style: AcademicWritingStyle
  references: DocumentReference[]
  citations: DocumentCitation[]
}): string {
  const parts: string[] = [
    '<article data-document-root="true" data-document-mode="academic-writing">',
    `<h1 data-document-title="true" data-block-id="document-title" data-role="title">${escapeHtml(input.title)}</h1>`,
  ]

  input.outline.forEach((sectionTitle, sectionIndex) => {
    const sectionId = `academic-section-${sectionIndex + 1}`
    parts.push(`<section data-section-id="${sectionId}" data-section-title="${escapeHtml(sectionTitle)}" data-section-level="1"${sectionIndex === 0 ? ' data-document-body="true"' : ''}>`)
    parts.push(`<h2 data-section-heading="true" data-block-id="${sectionId}-heading" data-role="heading">${escapeHtml(sectionTitle)}</h2>`)
    const ref = input.references[sectionIndex % input.references.length]
    const refLabel = ref?.label || '需要人工确认依据'
    const paragraphs = sectionParagraphs({
      topic: input.topic,
      paperType: input.paperType,
      sectionTitle,
      researchGoal: input.researchGoal,
      lengthHint: input.lengthHint,
      style: input.style,
      refLabel,
    })
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const blockId = `${sectionId}-paragraph-${paragraphIndex + 1}`
      const citation = input.citations.find((item) => item.blockId === blockId)
      const citeHtml = citation && ref
        ? renderCitationSpan({ citationId: citation.id, reference: ref, label: String(sectionIndex + 1) })
        : ''
      parts.push(`<p data-block-id="${blockId}" data-role="paragraph">${escapeHtml(paragraph)}${citeHtml}</p>`)
    })
    parts.push('</section>')
  })

  parts.push('</article>')
  return parts.join('')
}

export async function runAcademicWritingWorkflow(input: AcademicWritingInput): Promise<AcademicWritingResult> {
  const topic = input.topic.trim()
  if (!topic) {
    throw new Error('topic 不能为空')
  }
  const language = input.language || 'zh-CN'
  const style = input.style || (input.paperType === 'course_paper' ? 'academic' : 'report')
  const outlinePlan = buildAcademicWritingOutline(input)
  const outline = normalizeOutlineItems(input.outline, input.paperType)
  const refs = input.knowledgeRefs.length > 0 ? input.knowledgeRefs : [fallbackKnowledgeRef()]
  const title = outlinePlan.title
  const draftSections = outline.map((sectionTitle, sectionIndex) => {
    const ref = refs[sectionIndex % refs.length]
    const blockId = `academic-section-${sectionIndex + 1}-paragraph-1`
    return {
      id: `academic-section-${sectionIndex + 1}`,
      title: sectionTitle,
      content: sectionParagraphs({
        topic,
        paperType: input.paperType,
        sectionTitle,
        researchGoal: input.researchGoal,
        lengthHint: input.lengthHint,
        style,
        refLabel: ref.label,
      }).join('\n\n'),
      citations: [{
        id: `academic-citation-${sectionIndex + 1}`,
        label: ref.label,
        kind: ref.kind,
        citationStatus: ref.citationStatus,
        note: ref.trustLevel === 'unverified' || ref.citationStatus === 'unverified' ? '需要人工确认依据' : undefined,
      }],
      citedBlockId: blockId,
    }
  })

  const references = draftSections.map((section, index) => buildReference(refs[index % refs.length], section.citedBlockId))
  const citations: DocumentCitation[] = draftSections.map((section, index) => {
    const ref = references[index]
    return {
      id: `academic-citation-${index + 1}`,
      refId: ref.id,
      blockId: section.citedBlockId,
      sectionId: section.id,
      text: `[${index + 1}]`,
      renderMode: 'inline',
      sourceId: ref.sourceId,
      provider: ref.provider,
      sourceType: ref.sourceType,
      chunkId: ref.chunkId,
      trustLevel: ref.trustLevel,
      metadata: ref.metadata,
    }
  })

  const draft = normalizeDocumentDraft({
    raw: {
      title,
      sections: draftSections.map(({ citedBlockId: _citedBlockId, ...section }) => section),
    },
    title,
    type: 'report',
    language,
    engine: 'builtin',
    templateId: `academic.${input.paperType}`,
    knowledgeRefs: refs.map((ref) => ({
      ...ref,
      provider: ref.provider,
      sourceType: sourceTypeForRef(ref),
      sourceId: ref.sourceId || ref.id,
      chunkId: ref.chunkId || `${ref.id}-chunk-1`,
      trustLevel: trustForRef(ref),
      metadata: ref.metadata,
    })),
    preferredOutline: outline,
  })

  const html = buildAcademicHtml({
    documentId: draft.id,
    title,
    outline,
    topic,
    paperType: input.paperType,
    researchGoal: input.researchGoal,
    lengthHint: input.lengthHint,
    style,
    references,
    citations,
  })

  const persisted = await persistWorkbenchDocument({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.document.academic-writing',
    engine: 'builtin',
    title,
    documentType: 'report',
    language,
    templateId: `academic.${input.paperType}`,
    templateLabel: PAPER_TYPE_LABELS[input.paperType],
    knowledgeRefs: draft.metadata.knowledgeRefs || [],
    draft,
    html,
  })

  return {
    success: true,
    result: persisted.result,
    outline,
    paperType: input.paperType,
    references: persisted.result.documentArtifact.references,
    citations: persisted.result.documentArtifact.citations,
  }
}
