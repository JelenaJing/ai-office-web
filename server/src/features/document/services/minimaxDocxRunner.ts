import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { invokeLlmJson, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { buildDocumentOutline, getNearbySections, normalizeDocumentDraft } from './documentDraft'
import { saveDocumentDraftDocxArtifact } from './documentArtifactService'
import { runBuiltinDocumentEngine } from './documentBuiltinEngine'
import { buildKnowledgeRefPromptBlock } from './documentKnowledgeRefs'
import { getDocumentTemplateDefinition } from './documentTemplateCatalog'
import type {
  DocumentDraft,
  DocumentKnowledgeRef,
  DocumentLanguage,
  DocumentRecord,
  DocumentTaskResult,
  DocumentType,
} from '../types'

type MinimaxDraftJson = {
  title?: string
  sections?: Array<{
    id?: string
    title?: string
    content?: string
    citations?: Array<{
      id?: string
      label?: string
      kind?: 'knowledge_base' | 'file' | 'manual_note'
      note?: string
      citationStatus?: 'verified' | 'partial' | 'unverified'
    }>
    tables?: Array<{
      id?: string
      title?: string
      headers?: string[]
      rows?: string[][]
    }>
  }>
}

function detectEnglishIntent(prompt: string): boolean {
  return /\benglish\b|英文|in english/i.test(prompt)
}

export function resolveDocumentLanguage(prompt: string, explicit?: DocumentLanguage): DocumentLanguage {
  if (explicit === 'zh-CN' || explicit === 'en-US') return explicit
  return detectEnglishIntent(prompt) ? 'en-US' : 'zh-CN'
}

function resolveSkillDir(): string {
  const candidates = [
    path.resolve(__dirname, '../skills/minimax-docx'),
    path.resolve(process.cwd(), 'src/features/document/skills/minimax-docx'),
    path.resolve(process.cwd(), 'server/src/features/document/skills/minimax-docx'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'SKILL.md')) && fs.existsSync(path.join(candidate, 'references'))) {
      return candidate
    }
  }
  throw new Error(`未找到 vendored MiniMax minimax-docx skill 目录：${candidates.join(' | ')}`)
}

function readSkillContext(operation: 'create' | 'edit'): string {
  const skillDir = resolveSkillDir()
  const skillDoc = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8')
  const referenceNames = operation === 'create'
    ? ['scenario_a_create.md', 'typography_guide.md', 'design_principles.md', 'cjk_typography.md']
    : ['scenario_b_edit_content.md', 'openxml_element_order.md', 'typography_guide.md']
  const references = referenceNames
    .map((name) => {
      const filePath = path.join(skillDir, 'references', name)
      return fs.existsSync(filePath)
        ? `\n\n## ${name}\n${fs.readFileSync(filePath, 'utf-8')}`
        : ''
    })
    .join('')
  return `# Vendored MiniMax DOCX Skill\n\n${skillDoc}${references}`
}

function buildCreateSystemPrompt(language: DocumentLanguage): string {
  return [
    '你是 AI Office 的 DocumentWorkbench 后端文稿引擎。',
    '你必须严格参考 vendored MiniMax minimax-docx skill 的规范，输出 DocumentDraft JSON，而不是 Markdown。',
    language === 'en-US'
      ? 'language: en-US\nstyle: formal_office_english'
      : 'language: zh-CN\nstyle: formal_chinese_office',
    'JSON 结构必须为 {"title":"...","sections":[{"id":"...","title":"...","content":"段落1\\n\\n段落2","citations":[{"label":"来源","kind":"knowledge_base|file|manual_note","note":"可选","citationStatus":"verified|partial|unverified"}],"tables":[{"title":"可选","headers":["列1"],"rows":[["值1"]]}]}]}',
    '除非用户明确要求英文，否则一律输出中文正式办公文风。',
    '正文中的事实性、政策性、制度性表述只能引用已提供的知识来源；如果依据不足，必须明确写“需要人工确认依据”，不得编造政策依据。',
  ].join('\n\n')
}

function buildCreateUserPrompt(input: {
  prompt: string
  title: string
  language: DocumentLanguage
  templateLabel?: string
  documentType: DocumentType
  outline: string[]
  knowledgeRefs: DocumentKnowledgeRef[]
}): string {
  return [
    `文稿标题：${input.title}`,
    `文稿类型：${input.documentType}`,
    input.templateLabel ? `模板：${input.templateLabel}` : '',
    input.language === 'en-US'
      ? 'language: en-US\nstyle: formal_office_english'
      : 'language: zh-CN\nstyle: formal_chinese_office',
    input.outline.length > 0
      ? `推荐结构：\n${input.outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
      : '',
    buildKnowledgeRefPromptBlock(input.knowledgeRefs),
    '要求：标题、一级/二级标题、正文、必要表格、依据引用都要完整；不能输出解释性话术。',
    `用户要求：${input.prompt.trim()}`,
  ].filter(Boolean).join('\n\n')
}

function buildDeterministicDraft(input: {
  title: string
  outline: string[]
  language: DocumentLanguage
  documentType: DocumentType
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): DocumentDraft {
  const sections = (input.outline.length > 0 ? input.outline : ['背景说明', '主要内容', '问题分析', '下一步计划'])
    .map((title, index) => ({
      id: `section-${index + 1}`,
      title,
      content: index === 0
        ? '需要人工确认依据。请结合已选知识库和附件补充真实情况后定稿。'
        : `本节围绕“${title}”展开撰写。当前依据不足，需要人工确认依据。`,
    }))
  return normalizeDocumentDraft({
    raw: { title: input.title, sections },
    title: input.title,
    type: input.documentType,
    language: input.language,
    engine: 'minimax_docx',
    templateId: input.templateId,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: input.outline,
  })
}

async function generateDraftViaSkill(input: {
  prompt: string
  title: string
  language: DocumentLanguage
  templateId?: string
  templateLabel?: string
  documentType: DocumentType
  outline: string[]
  knowledgeRefs: DocumentKnowledgeRef[]
}): Promise<DocumentDraft> {
  if (!isLlmConfigured()) {
    return buildDeterministicDraft(input)
  }

  const raw = await invokeLlmJson<MinimaxDraftJson>(
    [
      { role: 'system', content: `${readSkillContext('create')}\n\n${buildCreateSystemPrompt(input.language)}` },
      {
        role: 'user',
        content: buildCreateUserPrompt({
          prompt: input.prompt,
          title: input.title,
          language: input.language,
          templateLabel: input.templateLabel,
          documentType: input.documentType,
          outline: input.outline,
          knowledgeRefs: input.knowledgeRefs,
        }),
      },
    ],
    { temperature: 0.35, maxTokens: 4200 },
  )

  return normalizeDocumentDraft({
    raw,
    title: input.title,
    type: input.documentType,
    language: input.language,
    engine: 'minimax_docx',
    templateId: input.templateId,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: input.outline,
  })
}

async function editSectionViaSkill(input: {
  draft: DocumentDraft
  sectionId: string
  instruction: string
  language: DocumentLanguage
  knowledgeRefs: DocumentKnowledgeRef[]
}): Promise<DocumentDraft> {
  const sectionIndex = input.draft.sections.findIndex((section) => section.id === input.sectionId)
  if (sectionIndex < 0) {
    throw new Error('目标章节不存在')
  }
  const currentSection = input.draft.sections[sectionIndex]
  const nearbySections = getNearbySections(input.draft, input.sectionId)

  const nextContent = isLlmConfigured()
    ? await invokeLlmText(
        [
          {
            role: 'system',
            content: [
              readSkillContext('edit'),
              '你是 AI Office 的章节级文稿编辑引擎。',
              input.language === 'en-US'
                ? 'language: en-US\nstyle: formal_office_english'
                : 'language: zh-CN\nstyle: formal_chinese_office',
              '只允许改写当前章节，不允许重写整篇文稿。',
              '输出只能是修改后的当前章节正文，不要输出标题、解释、编号或多余说明。',
              '如果依据不足，保留或加入“需要人工确认依据”。',
            ].join('\n\n'),
          },
          {
            role: 'user',
            content: [
              `文稿标题：${input.draft.title}`,
              `当前章节：${currentSection.title}`,
              `用户编辑指令：${input.instruction.trim()}`,
              buildKnowledgeRefPromptBlock(input.knowledgeRefs),
              `当前章节正文：\n${currentSection.content}`,
              nearbySections.length > 0
                ? `相邻章节参考：\n${nearbySections.map((section) => `- ${section.title}: ${section.content.slice(0, 300)}`).join('\n')}`
                : '',
            ].filter(Boolean).join('\n\n'),
          },
        ],
        { temperature: 0.35, maxTokens: 2200 },
      )
    : `${currentSection.content}\n\n（已根据指令调整：${input.instruction.trim()}。需要人工确认依据。）`

  const sections = input.draft.sections.map((section, index) => index === sectionIndex
    ? {
        ...section,
        content: nextContent.trim() || section.content,
      }
    : section)
  return {
    ...input.draft,
    sections,
    outline: buildDocumentOutline({ ...input.draft, sections }),
  }
}

export async function runMinimaxDocx(input: {
  userId: string
  prompt: string
  title?: string
  workspacePath: string
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  documentType: DocumentType
  language?: DocumentLanguage
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  const language = resolveDocumentLanguage(input.prompt, input.language)
  const template = getDocumentTemplateDefinition(input.templateId)
  const title = input.title?.trim() || template?.defaultTitle || '办公文稿'
  const draft = await generateDraftViaSkill({
    prompt: input.prompt,
    title,
    language,
    templateId: template?.id,
    templateLabel: template?.label,
    documentType: input.documentType,
    outline: template?.outline || [],
    knowledgeRefs: input.knowledgeRefs,
  })
  draft.id = `document-${randomUUID()}`

  const artifactResult = await saveDocumentDraftDocxArtifact({
    userId: input.userId,
    workspacePath: input.workspacePath,
    skillId: 'minimax.docx',
    documentId: draft.id,
    draft,
    knowledgeRefs: input.knowledgeRefs,
  })

  const now = new Date().toISOString()
  const record: DocumentRecord = {
    documentId: draft.id,
    userId: input.userId,
    workspacePath: input.workspacePath,
    engine: 'minimax_docx',
    skillId: 'minimax.docx',
    title: draft.title,
    language,
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
      engine: 'minimax_docx',
      skillId: 'minimax.docx',
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

export async function runMinimaxDocxWithFallback(input: {
  userId: string
  prompt: string
  title?: string
  workspacePath: string
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  documentType: DocumentType
  language?: DocumentLanguage
  fallback: 'builtin' | 'none'
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  try {
    return await runMinimaxDocx(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (input.fallback !== 'builtin') throw error
    const builtin = await runBuiltinDocumentEngine({
      userId: input.userId,
      workspacePath: input.workspacePath,
      prompt: input.prompt,
      title: input.title?.trim() || '',
      language: resolveDocumentLanguage(input.prompt, input.language),
      templateId: input.templateId,
      documentType: input.documentType,
      knowledgeRefs: input.knowledgeRefs,
    })
    builtin.record.fallbackFrom = 'minimax_docx'
    builtin.record.fallbackReason = message
    builtin.result.fallbackFrom = 'minimax_docx'
    builtin.result.fallbackReason = message
    return builtin
  }
}

export async function editDocumentSectionWithMinimax(input: {
  record: DocumentRecord
  sectionId: string
  instruction: string
}): Promise<DocumentRecord> {
  const updatedDraft = await editSectionViaSkill({
    draft: input.record.draft,
    sectionId: input.sectionId,
    instruction: input.instruction,
    language: input.record.language,
    knowledgeRefs: input.record.knowledgeRefs,
  })
  const exported = await saveDocumentDraftDocxArtifact({
    userId: input.record.userId,
    workspacePath: input.record.workspacePath,
    skillId: input.record.skillId,
    documentId: input.record.documentId,
    draft: updatedDraft,
    knowledgeRefs: input.record.knowledgeRefs,
  })
  return {
    ...input.record,
    draft: updatedDraft,
    artifactId: exported.artifact.id,
    exportUrl: exported.exportUrl,
    filename: exported.filename,
    sourceRefs: exported.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
    artifact: exported.artifact,
    updatedAt: new Date().toISOString(),
  }
}
