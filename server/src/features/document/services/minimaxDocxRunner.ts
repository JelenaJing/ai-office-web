import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { invokeLlmJson, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { buildDocumentOutline, getNearbySections, normalizeDocumentDraft } from './documentDraft'
import { saveDocumentDraftDocxArtifact } from './documentArtifactService'
import { runBuiltinDocumentEngine } from './documentBuiltinEngine'
import { buildKnowledgeRefPromptBlock } from './documentKnowledgeRefs'
import { getDocumentTemplateDefinition } from './documentTemplateCatalog'
import { buildStructuredWritingPromptBlock } from './documentTaskTypeLabels'
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
  tone?: string
  taskType?: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): string {
  const structured = buildStructuredWritingPromptBlock({
    taskType: input.taskType,
    outline: input.outline,
    tone: input.tone,
    language: input.language,
  })
  return [
    `文稿标题：${input.title}`,
    `文稿类型：${input.documentType}`,
    input.templateLabel ? `模板：${input.templateLabel}` : '',
    structured,
    input.language === 'en-US' ? 'style: formal_office_english' : 'style: formal_chinese_office',
    buildKnowledgeRefPromptBlock(input.knowledgeRefs),
    '要求：标题、一级/二级标题、正文、必要表格、依据引用都要完整；不能输出解释性话术。',
    `用户写作要求：${input.prompt.trim()}`,
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

function buildAcceptanceModeDraft(input: {
  prompt: string
  title: string
  outline: string[]
  language: DocumentLanguage
  documentType: DocumentType
  templateId?: string
  knowledgeRefs: DocumentKnowledgeRef[]
}): DocumentDraft {
  const annualReportSections = [
    {
      id: 'section-achievements',
      title: '主要成绩',
      content: [
        '本年度围绕学院重点工作，持续推进教学改革、科研组织与协同育人机制优化，整体运行平稳有序。',
        '在人才培养方面，学院完善课程建设和实践教学安排，教学质量保障机制进一步健全，重点项目推进效率明显提升。',
        '在治理协同方面，学院强化跨部门协作与过程跟踪，形成了较为清晰的年度任务闭环，为后续工作奠定了基础。',
      ].join('\n\n'),
    },
    {
      id: 'section-problems',
      title: '问题分析',
      content: [
        '当前仍存在部分重点任务推进节奏不均衡、专项工作统筹深度不足的问题，个别事项在计划执行与复盘评估之间衔接不够紧密。',
        '部分业务数据沉淀与共享机制尚未完全打通，导致决策支撑和过程监测的及时性有待提升，部分经验成果尚未形成可复制的制度化做法。',
        '面向下一阶段高质量发展的要求，现有资源配置、风险预警和依据支撑能力仍需进一步加强，涉及政策口径的表述需要人工确认依据。',
      ].join('\n\n'),
    },
    {
      id: 'section-next-plan',
      title: '下一年度计划',
      content: [
        '下一年度将围绕重点任务清单推进落实，进一步细化时间节点、责任分工与过程评估机制，确保重点工作按期闭环。',
        '持续加强教学、科研、管理等关键领域的数据协同和制度建设，提升资源配置效率与治理响应速度。',
        '聚焦品牌项目培育、成果转化与风险防控，完善常态化复盘机制，对涉及政策、制度与数据依据的内容继续坚持人工确认依据后再正式发布。',
      ].join('\n\n'),
    },
  ]
  const useAnnualReport = /年度|annual/i.test(input.prompt) || input.outline.some((item) => /主要成绩|问题分析|下一年度计划/.test(item))
  if (!useAnnualReport) {
    return buildDeterministicDraft(input)
  }
  return normalizeDocumentDraft({
    raw: { title: input.title, sections: annualReportSections },
    title: input.title,
    type: input.documentType,
    language: input.language,
    engine: 'minimax_docx',
    templateId: input.templateId,
    knowledgeRefs: input.knowledgeRefs,
    preferredOutline: annualReportSections.map((section) => section.title),
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
  taskType?: string
  tone?: string
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
          tone: input.tone,
          taskType: input.taskType,
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
  preferredOutline?: string[]
  tone?: string
  taskType?: string
}): Promise<{ record: DocumentRecord; result: DocumentTaskResult }> {
  const language = resolveDocumentLanguage(input.prompt, input.language)
  const template = getDocumentTemplateDefinition(input.templateId)
  const title = input.title?.trim() || template?.defaultTitle || '办公文稿'
  const outline = input.preferredOutline?.length
    ? input.preferredOutline
    : (template?.outline || [])
  const structured = buildStructuredWritingPromptBlock({
    taskType: input.taskType,
    outline,
    tone: input.tone,
    language,
  })
  const prompt = [structured, input.prompt.trim()].filter(Boolean).join('\n\n')
  const draft = await generateDraftViaSkill({
    prompt,
    title,
    language,
    templateId: template?.id,
    templateLabel: template?.label,
    documentType: input.documentType,
    outline,
    knowledgeRefs: input.knowledgeRefs,
    taskType: input.taskType,
    tone: input.tone,
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
      html: record.html,
      documentArtifact: record.documentArtifact,
      outline: buildDocumentOutline(record.draft),
      templateId: record.templateId,
      templateLabel: record.templateLabel,
      knowledgeRefs: record.knowledgeRefs,
    },
  }
}

export async function runAcceptanceModeDocument(input: {
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
  const draft = buildAcceptanceModeDraft({
    prompt: input.prompt,
    title,
    language,
    templateId: template?.id,
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
      html: record.html,
      documentArtifact: record.documentArtifact,
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
    html: exported.html,
    documentArtifact: exported.documentArtifact,
    artifactId: exported.artifact.id,
    exportUrl: exported.exportUrl,
    filename: exported.filename,
    sourceRefs: exported.artifact.sourceRefs ?? [],
    artifactKnowledgeRefs: exported.artifact.knowledgeRefs ?? [],
    artifact: exported.artifact,
    updatedAt: new Date().toISOString(),
  }
}

export async function editDocumentSelectionWithMinimax(input: {
  record: DocumentRecord
  instruction: string
  selectedText: string
  selectionContext?: {
    sectionId?: string
    beforeText?: string
    afterText?: string
    documentTitle?: string
    sectionTitle?: string
  }
}): Promise<string> {
  const selectedText = String(input.selectedText || '').trim()
  if (!selectedText) {
    throw new Error('selectedText 不能为空')
  }

  const replacement = isLlmConfigured()
    ? await invokeLlmText(
        [
          {
            role: 'system',
            content: [
              readSkillContext('edit'),
              '你是 AI Office 的选中文本级文稿编辑引擎。',
              input.record.language === 'en-US'
                ? 'language: en-US\nstyle: formal_office_english'
                : 'language: zh-CN\nstyle: formal_chinese_office',
              '只允许改写用户选中的文本，不能改动其他内容，不能重写全文。',
              '输出只能是替换后的文本，不要输出标题、解释、编号或引号。',
              '如果依据不足，请在必要时保留“需要人工确认依据”。',
            ].join('\n\n'),
          },
          {
            role: 'user',
            content: [
              `文稿标题：${input.selectionContext?.documentTitle || input.record.draft.title}`,
              input.selectionContext?.sectionTitle ? `所在章节：${input.selectionContext.sectionTitle}` : '',
              `用户编辑指令：${input.instruction.trim()}`,
              buildKnowledgeRefPromptBlock(input.record.knowledgeRefs),
              input.selectionContext?.beforeText ? `前文：${input.selectionContext.beforeText}` : '',
              `当前选中文本：${selectedText}`,
              input.selectionContext?.afterText ? `后文：${input.selectionContext.afterText}` : '',
            ].filter(Boolean).join('\n\n'),
          },
        ],
        { temperature: 0.35, maxTokens: 1200 },
      )
    : `${selectedText}（已根据指令调整：${input.instruction.trim()}。需要人工确认依据。）`

  return replacement.trim() || selectedText
}
