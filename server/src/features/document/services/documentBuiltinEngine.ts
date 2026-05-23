import { randomUUID } from 'crypto'
import { generateDocumentContentDetailed } from '../../../modules/ai-gateway'
import { invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { buildDocumentOutline, getNearbySections, normalizeDocumentDraft } from './documentDraft'
import { saveDocumentDraftDocxArtifact } from './documentArtifactService'
import { buildKnowledgeRefPromptBlock } from './documentKnowledgeRefs'
import { getDocumentTemplateDefinition } from './documentTemplateCatalog'
import type {
  DocumentKnowledgeRef,
  DocumentLanguage,
  DocumentRecord,
  DocumentTaskResult,
  DocumentType,
} from '../types'

function buildBuiltinPrompt(input: {
  prompt: string
  language: DocumentLanguage
  templateLabel?: string
  outline: string[]
  knowledgeRefs: DocumentKnowledgeRef[]
}): string {
  const languageBlock = input.language === 'en-US'
    ? 'language: en-US\nstyle: formal_office_english'
    : 'language: zh-CN\nstyle: formal_chinese_office'
  const outlineBlock = input.outline.length > 0
    ? `推荐结构：\n${input.outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
    : ''
  return [
    languageBlock,
    input.templateLabel ? `模板：${input.templateLabel}` : '',
    outlineBlock,
    buildKnowledgeRefPromptBlock(input.knowledgeRefs),
    '必须使用正式办公文稿风格；若没有充分依据，直接写“需要人工确认依据”。',
    input.prompt.trim(),
  ].filter(Boolean).join('\n\n')
}

export async function runBuiltinDocumentEngine(input: {
  userId: string
  workspacePath: string
  prompt: string
  title: string
  language: DocumentLanguage
  templateId?: string
  documentType: DocumentType
  knowledgeRefs: DocumentKnowledgeRef[]
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  const template = getDocumentTemplateDefinition(input.templateId)
  const draftTitle = input.title.trim() || template?.defaultTitle || '办公文稿'
  const doc = await generateDocumentContentDetailed({
    title: draftTitle,
    prompt: buildBuiltinPrompt({
      prompt: input.prompt,
      language: input.language,
      templateLabel: template?.label,
      outline: template?.outline || [],
      knowledgeRefs: input.knowledgeRefs,
    }),
  })

  const draft = normalizeDocumentDraft({
    raw: {
      title: doc.content.title || draftTitle,
      sections: doc.content.sections.map((section) => ({
        title: section.heading,
        content: section.paragraphs.join('\n\n'),
      })),
    },
    title: draftTitle,
    type: input.documentType,
    language: input.language,
    engine: 'builtin',
    templateId: template?.id,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: template?.outline,
  })
  draft.id = `document-${randomUUID()}`

  const artifactResult = await saveDocumentDraftDocxArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'web.document.generate',
    documentId: draft.id,
    draft,
    knowledgeRefs: input.knowledgeRefs,
  })

  const now = new Date().toISOString()
  const record: DocumentRecord = {
    documentId: draft.id,
    userId: input.userId,
    workspacePath: input.workspacePath,
    engine: 'builtin',
    skillId: 'web.document.generate',
    title: draft.title,
    language: input.language,
    documentType: input.documentType,
    templateId: template?.id,
    templateLabel: template?.label,
    knowledgeRefs: input.knowledgeRefs,
    draft,
    artifactId: artifactResult.artifact.id,
    exportUrl: artifactResult.exportUrl,
    filename: artifactResult.filename,
    sourceRefs: artifactResult.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: artifactResult.artifact.knowledgeRefs ?? [],
    artifact: artifactResult.artifact,
    createdAt: now,
    updatedAt: now,
  }

  return {
    record,
    result: {
      engine: 'builtin',
      skillId: 'web.document.generate',
      documentId: record.documentId,
      artifactId: record.artifactId,
      exportUrl: record.exportUrl,
      filename: record.filename,
      document: record.draft,
      outline: buildDocumentOutline(record.draft),
      templateId: record.templateId,
      templateLabel: record.templateLabel,
      knowledgeRefs: record.knowledgeRefs,
    },
  }
}

export async function editDocumentSectionWithBuiltin(input: {
  record: DocumentRecord
  sectionId: string
  instruction: string
}): Promise<DocumentRecord> {
  const sectionIndex = input.record.draft.sections.findIndex((section) => section.id === input.sectionId)
  if (sectionIndex < 0) {
    throw new Error('目标章节不存在')
  }
  const currentSection = input.record.draft.sections[sectionIndex]
  const nearbySections = getNearbySections(input.record.draft, input.sectionId)

  const nextContent = isLlmConfigured()
    ? await invokeLlmText(
        [
          {
            role: 'system',
            content: [
              '你是内置文稿引擎的章节级编辑器。',
              input.record.language === 'en-US'
                ? 'language: en-US\nstyle: formal_office_english'
                : 'language: zh-CN\nstyle: formal_chinese_office',
              '只修改当前章节，不得重写整篇文稿。',
              '输出只能是修改后的章节正文，不要输出标题和解释。',
              '如果依据不足，明确写“需要人工确认依据”。',
            ].join('\n\n'),
          },
          {
            role: 'user',
            content: [
              `文稿标题：${input.record.draft.title}`,
              `章节标题：${currentSection.title}`,
              `编辑指令：${input.instruction.trim()}`,
              buildKnowledgeRefPromptBlock(input.record.knowledgeRefs),
              `当前章节正文：\n${currentSection.content}`,
              nearbySections.length > 0
                ? `相邻章节参考：\n${nearbySections.map((section) => `- ${section.title}: ${section.content.slice(0, 280)}`).join('\n')}`
                : '',
            ].filter(Boolean).join('\n\n'),
          },
        ],
        { temperature: 0.4, maxTokens: 2200 },
      )
    : `${currentSection.content}\n\n（已根据指令调整：${input.instruction.trim()}。需要人工确认依据。）`

  const draft = {
    ...input.record.draft,
    sections: input.record.draft.sections.map((section, index) => index === sectionIndex
      ? { ...section, content: nextContent.trim() || section.content }
      : section),
  }
  draft.outline = buildDocumentOutline(draft)

  const exported = await saveDocumentDraftDocxArtifact({
    userId: input.record.userId,
    workspacePath: input.record.workspacePath,
    skillId: input.record.skillId,
    documentId: input.record.documentId,
    draft,
    knowledgeRefs: input.record.knowledgeRefs,
  })

  return {
    ...input.record,
    draft,
    artifactId: exported.artifact.id,
    exportUrl: exported.exportUrl,
    filename: exported.filename,
    sourceRefs: exported.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
    artifact: exported.artifact,
    updatedAt: new Date().toISOString(),
  }
}
