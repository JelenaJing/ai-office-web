/**
 * 从 Electron paperGenerator 迁移的写作 prompt 配方（纯逻辑，无 Electron 依赖）
 */
import type { DocumentTypePreset, OutputLanguage, TemplateDocumentInput, WritingWorkflowInput } from './documentGenerationTypes'

export const WRITING_QUALITY_RULES = [
  '硬性规则：',
  '1. 默认使用简体中文；用户未明确要求英文时不要输出英文。',
  '2. 只输出正文，不输出解释、前言、操作说明。',
  '3. 不要输出“已为你生成如下”“以下是”等引导语。',
  '4. 禁止使用占位符：[日期]、[姓名]、[任务名称]、[待补充]、XX、XXX、某某 等。',
  '5. 用户未提供具体数字、客户名、合同号、日期、业绩指标时，不要编造；可用正式概括表述。',
  '6. 信息不足时，正文保持完整可读；需要用户补充的事实可集中在文末“建议补充的信息”小节，不要混入正文主体。',
  '7. 用户 instruction 优先于 documentTypePreset；preset 仅作结构参考，不得把销售汇报写成工作日报。',
  '8. “销售业绩汇报”“销售汇报”“业绩汇报”必须按销售业绩汇报撰写，不得使用工作日报/日报结构。',
  '9. “工作日报”“今日工作”“日报”才使用日报结构。',
].join('\n')

export function resolveOutputLanguage(
  params: Pick<WritingWorkflowInput, 'outputLanguage' | 'language'>,
): OutputLanguage {
  if (params.outputLanguage === 'en-US') return 'en-US'
  if (params.outputLanguage === 'zh-CN') return 'zh-CN'
  return params.language === 'en' ? 'en-US' : 'zh-CN'
}

export function getLanguagePreferenceLabel(outputLanguage: OutputLanguage): string {
  return outputLanguage === 'en-US' ? 'English' : '简体中文'
}

export function buildOutputLanguageRequirement(outputLanguage: OutputLanguage): string {
  if (outputLanguage === 'en-US') {
    return [
      '输出语言要求：',
      '- 用户已明确要求英文输出，请使用英文完成全文生成。',
      '- 不要在正文中出现 English:、Chinese: 等语言标签。',
    ].join('\n')
  }

  return [
    '输出语言要求：',
    '- 默认使用简体中文。',
    '- 如果用户没有明确要求英文，请不要输出英文。',
    '- 如果用户输入的是中文，请使用中文完成全文生成。',
    '- 标题、正文、段落、小节、总结都必须使用中文。',
    '- 不要在正文中出现 English:、Chinese: 等语言标签。',
  ].join('\n')
}

export function normalizeTemplateOutline(lines: string[] | undefined): string[] {
  if (!Array.isArray(lines)) return []
  return lines
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .slice(0, 10)
}

export function normalizeTemplateDocument(
  templateDocument?: TemplateDocumentInput | null,
): {
  title: string
  sourceType: string
  extractedText: string
  outline: string[]
} | null {
  if (!templateDocument) return null
  const extractedText = String(templateDocument.extractedText || '').trim()
  if (!extractedText) return null
  return {
    title: String(templateDocument.title || '未命名模板').trim() || '未命名模板',
    sourceType: String(templateDocument.sourceType || '').trim().toUpperCase(),
    extractedText: extractedText.slice(0, 16000),
    outline: normalizeTemplateOutline(templateDocument.outline),
  }
}

export function buildDocumentTypePresetHint(preset?: DocumentTypePreset | null): string {
  const hint = preset?.promptHint?.trim()
  if (!hint) return ''
  return [
    '【写作要求补充（仅作结构参考，不得覆盖用户真实任务）】',
    hint,
    '注意：若与用户 instruction 冲突，以用户 instruction 为准。',
  ].join('\n')
}

export function buildLegacyWritingAssistantSystemPrompt(outputLanguage: OutputLanguage): string {
  const languageRequirement = buildOutputLanguageRequirement(outputLanguage)
  return [
    '你是一位专业 AI 写作助手。你的任务是根据用户的自然语言要求直接改写、重组、润色或重写整篇文稿。',
    '若提供了原文，就输出处理后的完整新正文；若未提供原文，就直接根据要求起草完整内容。',
    '正文第一行必须是一级标题（Markdown 格式：`# 文章标题`）。',
    '不要解释你的操作，不要输出分析过程，不要输出"已改写如下"之类的前言。',
    languageRequirement,
    WRITING_QUALITY_RULES,
  ].join('\n\n')
}

export function buildLegacyWritingAssistantUserPrompt(input: WritingWorkflowInput): string {
  const instruction = String(input.instruction || '').trim()
  const documentText = String(input.documentText || '').trim()
  const extraContext = String(input.extraContext || '').trim()
  const outputLanguage = resolveOutputLanguage(input)
  const presetHint = buildDocumentTypePresetHint(input.documentTypePreset)

  return [
    '请作为 AI 写作助手处理当前文档。',
    `语言偏好: ${getLanguagePreferenceLabel(outputLanguage)}`,
    buildOutputLanguageRequirement(outputLanguage),
    `用户要求:\n${instruction}`,
    presetHint,
    extraContext ? `补充上下文:\n${extraContext}` : '',
    documentText
      ? `当前文档全文:\n${documentText}\n\n请直接输出处理后的完整正文。`
      : '当前文档为空，请直接根据用户要求生成完整正文。',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildTemplateAnalysisSystemPrompt(): string {
  return '你是一位资深文档模板分析师。你的任务是从给定模板中提炼可复用的结构、语气、格式和表达约束，用于指导另一篇新文档写作。只输出模板分析结果，不要代写正文，不要复述无关原文。'
}

export function buildTemplateAnalysisUserPrompt(
  template: NonNullable<ReturnType<typeof normalizeTemplateDocument>>,
  instruction: string,
  outputLanguage: OutputLanguage,
): string {
  return [
    '请分析下面这份知识库模板文档，并输出一份可直接用于全文写作的模板分析报告。',
    `语言偏好: ${getLanguagePreferenceLabel(outputLanguage)}`,
    buildOutputLanguageRequirement(outputLanguage),
    instruction ? `新任务要求: ${instruction}` : '',
    `模板标题: ${template.title}`,
    template.sourceType ? `模板来源: ${template.sourceType}` : '',
    template.outline.length
      ? `模板章节线索:\n${template.outline.map((line, index) => `${index + 1}. ${line}`).join('\n')}`
      : '',
    '请按下面格式输出，且每一节都要结合模板内容给出具体结论：',
    '## 篇章骨架\n说明模板常见的章节顺序、层级深度、每章承担的任务。',
    '## 行文风格\n说明语气、句式长度、信息密度、常见过渡方式、偏好的表达习惯。',
    '## 格式与呈现约束\n说明标题风格、段落组织、列表/表格/小结的使用习惯、是否偏好先总后分。',
    '## 生成时应保留的写法\n列出 5-8 条应继承的写法原则。',
    '## 生成时必须替换的旧信息\n列出必须避免照抄的主题、事实、数据、时间、机构、结论等旧内容类别。',
    `模板正文:\n${template.extractedText}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildTemplateWritingSystemPrompt(outputLanguage: OutputLanguage): string {
  const languageRequirement = buildOutputLanguageRequirement(outputLanguage)
  return [
    '你是一位专业全文写作助手。你必须先严格遵循提供的模板分析结果，再结合用户要求和已有文稿生成一篇全新的完整正文。',
    '输出只能是最终正文，不要解释，不要输出分析过程，不要复述模板原文。',
    '若原文为空，则直接起草完整新文，正文第一行必须是一级标题（Markdown 格式：`# 文章标题`）；',
    '若原文不为空，则将其重写为符合模板风格的新全文。',
    languageRequirement,
    WRITING_QUALITY_RULES,
  ].join('\n\n')
}

export function buildTemplateWritingUserPrompt(
  input: WritingWorkflowInput,
  templateAnalysis: string,
): string {
  const instruction = String(input.instruction || '').trim()
  const documentText = String(input.documentText || '').trim()
  const extraContext = String(input.extraContext || '').trim()
  const outputLanguage = resolveOutputLanguage(input)
  const presetHint = buildDocumentTypePresetHint(input.documentTypePreset)

  return [
    '请基于知识库模板分析结果生成全文。',
    `语言偏好: ${getLanguagePreferenceLabel(outputLanguage)}`,
    buildOutputLanguageRequirement(outputLanguage),
    `用户要求:\n${instruction}`,
    presetHint,
    extraContext ? `补充上下文:\n${extraContext}` : '',
    `模板分析结果:\n${templateAnalysis}`,
    documentText
      ? `当前文档全文:\n${documentText}\n\n请输出一篇参考模板格式与风格、但内容围绕当前要求重新生成的完整正文。`
      : '当前文档为空，请直接围绕用户要求输出一篇参考模板格式与风格的完整正文。',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildRewriteSelectionSystemPrompt(outputLanguage: OutputLanguage): string {
  return [
    '你是一位专业文稿编辑助手。只改写用户选中的片段，保持原意，根据用户指令调整语气与表达。',
    '只输出改写后的选区正文（Markdown 片段即可），不要输出整篇文章，不要输出解释。',
    [
      '选区语义边界规则（强制）：',
      '1. 不得改变选区中的事实陈述、数据、结论、立场和信息边界。',
      '2. 改写仅限于：表达方式、语气、流畅度、措辞。',
      '3. 扩写时不得编造未在选区中出现的具体数据、人名、金额、日期或机构名称。',
      '4. 润色时不得新增或删除实质性信息。',
      '5. 如用户要求润色但未指定方向，默认以"更正式、更流畅"为目标，不改变任何事实。',
    ].join('\n'),
    buildOutputLanguageRequirement(outputLanguage),
    WRITING_QUALITY_RULES,
  ].join('\n\n')
}

export function buildRewriteSelectionUserPrompt(input: {
  instruction: string
  selectedText: string
  selectedHtml?: string
  extraContext?: string
}): string {
  return [
    `用户指令：\n${input.instruction.trim()}`,
    `选中纯文本：\n${input.selectedText.trim()}`,
    input.selectedHtml?.trim() ? `选中 HTML（参考）：\n${input.selectedHtml.trim().slice(0, 4000)}` : '',
    input.extraContext?.trim() ? `补充上下文：\n${input.extraContext.trim()}` : '',
    '请只输出改写后的选区内容。',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildInsertAtCursorSystemPrompt(outputLanguage: OutputLanguage): string {
  return [
    '你是一位专业文稿编辑助手。根据用户指令生成可插入到光标处的新增内容。',
    '只输出要插入的片段（Markdown），不要输出整篇文章，不要输出一级标题，除非用户明确要求标题。',
    buildOutputLanguageRequirement(outputLanguage),
    WRITING_QUALITY_RULES,
  ].join('\n\n')
}

export function buildInsertAtCursorUserPrompt(input: {
  instruction: string
  documentText?: string
  extraContext?: string
}): string {
  return [
    `用户指令：\n${input.instruction.trim()}`,
    input.documentText?.trim() ? `当前全文（供衔接参考）：\n${input.documentText.trim().slice(0, 8000)}` : '',
    input.extraContext?.trim() ? `补充上下文：\n${input.extraContext.trim()}` : '',
    '请只输出要插入的正文片段。',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** 测试用：检查输出是否违反质量规则 */
export function findWritingQualityViolations(text: string): string[] {
  const issues: string[] = []
  const patterns: Array<[RegExp, string]> = [
    [/\[日期\]/, '包含 [日期]'],
    [/\[待补充\]/, '包含 [待补充]'],
    [/\[姓名\]/, '包含 [姓名]'],
    [/\bXX\b|\bXXX\b/, '包含 XX/XXX'],
    [/已为你生成|以下是|如下内容/, '包含引导语'],
    [/已改写如下/, '包含改写前言'],
  ]
  for (const [re, msg] of patterns) {
    if (re.test(text)) issues.push(msg)
  }
  return issues
}

export function detectTaskMismatch(instruction: string, markdown: string): string | null {
  const wantsSales = /销售业绩汇报|销售汇报|业绩汇报/.test(instruction)
  const looksDaily = /工作日报|今日工作|日报结构|本日工作/.test(markdown)
  if (wantsSales && looksDaily) {
    return '用户要求销售业绩汇报，但输出像工作日报'
  }
  return null
}
