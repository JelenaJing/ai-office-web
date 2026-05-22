/**
 * formalTemplateService.ts — Web formal-template parity runtime
 *
 * Electron source of truth:
 * - electron/main/services/formalTemplate/formalTemplateTaskService.ts
 * - electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts
 * - src/skills/builtins/templateDocumentGenerateLegacySkill.ts
 *
 * Web implementation keeps the same high-level phase model:
 *   analyze -> confirm -> preview -> commit
 *
 * What is preserved:
 * - visit-letter / congratulation-letter route distinction
 * - explicit schema-first vs template-document-rewrite runtime labels
 * - asynchronous task-friendly step/progress callbacks
 *
 * What is not yet preserved:
 * - real DOCX OOXML read/write shell locking via documentEngineService
 */

import { invokeLlmJson, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import {
  applyFieldValues,
  extractFieldsFromText,
  type WebFieldSchema,
} from './formalTemplateFieldExtractor'
import {
  FORMAL_TEMPLATE_PRESETS,
  getDefaultSupportedPreset,
  getPreset,
  listPresetSummaries,
  type FormalTemplatePreset,
  type FormalTemplatePresetSummary,
} from './formalTemplatePresets'

export interface FormalTemplateAnalyzeInput {
  presetId?: string
  customTemplateText?: string
  instruction?: string
}

export interface FormalTemplateAnalyzeResult {
  success: true
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  supported: boolean
  unavailableReason?: string
  templateText: string
  fields: WebFieldSchema[]
  defaultSections: string[]
  diagnostics: { chain: string; steps: string[] }
}

export interface FormalTemplateGenerateInput {
  presetId?: string
  customTemplateText?: string
  instruction: string
  language?: 'zh' | 'en'
  fieldOverrides?: Record<string, string>
  extraContext?: string
  workspacePath?: string
}

export interface FormalTemplateWorkflowStep {
  step: string
  message: string
  progress: number
  partialMarkdown?: string
  partialHtml?: string
}

export interface FormalTemplateGenerateResult {
  success: true
  title: string
  markdown: string
  html: string
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  resolvedFields: Record<string, string>
  previewMetadata: FormalTemplatePreviewMetadata
  commitMetadata: FormalTemplateCommitMetadata
  artifact: FormalTemplateArtifact
  diagnostics: {
    chain: 'web-formal-template-schema-first' | 'web-template-document-rewrite'
    steps: string[]
    partialMissing: string[]
  }
}

export interface FormalTemplatePreviewMetadata {
  stage: 'preview'
  templateKind: string
  runtimeKind: string
  fieldCount: number
  resolvedFieldCount: number
  unavailableReason?: string
}

export interface FormalTemplateCommitMetadata {
  stage: 'commit'
  target: 'a4-editor-html'
  docxCommitStatus: 'not-ported'
  missing: string[]
}

export interface FormalTemplateArtifact {
  artifactId: string
  type: 'formal_template'
  boundary: 'formal-template-result'
  title: string
  presetId: string
  presetLabel: string
  templateKind: string
  runtimeKind: string
  markdown: string
  html: string
  resolvedFields: Record<string, string>
  previewMetadata: FormalTemplatePreviewMetadata
  commitMetadata: FormalTemplateCommitMetadata
  sourceRefs: Array<{ type: 'template' | 'instruction'; id: string; label: string }>
  exportRefs: Array<{ format: 'html' | 'markdown'; status: 'inline' }>
  sourceRuntime: 'web-formal-template-schema-first' | 'web-template-document-rewrite'
}

export type FormalTemplateServiceError = {
  success: false
  error: string
  code?: string
  availableTemplates?: FormalTemplatePresetSummary[]
}

interface WorkflowRunOptions {
  onStep?: (step: FormalTemplateWorkflowStep) => void
  isCancelled?: () => boolean
}

interface ResolvedTemplate {
  preset: FormalTemplatePreset
  templateText: string
}

interface ResolvedFieldState {
  fields: WebFieldSchema[]
  values: Record<string, string>
}

const FORMAL_TEMPLATE_PARTIAL_MISSING = [
  'OOXML block-level shell write-back',
  'header/footer fidelity',
  'schema-first base replace',
  'high-fidelity field extraction',
  'full commit-to-docx parity',
] as const

export async function analyzeFormalTemplate(
  input: FormalTemplateAnalyzeInput,
): Promise<FormalTemplateAnalyzeResult | FormalTemplateServiceError> {
  const resolved = resolveTemplate(input.presetId, input.customTemplateText)
  if (isServiceError(resolved)) return resolved

  const { preset, templateText } = resolved
  const fields = extractFieldsFromText(templateText)
  return {
    success: true,
    presetId: preset.id,
    presetLabel: preset.label,
    templateKind: preset.templateKind,
    runtimeKind: preset.runtimeKind,
    supported: preset.supported,
    unavailableReason: preset.unavailableReason,
    templateText,
    fields,
    defaultSections: preset.defaultSections,
    diagnostics: {
      chain: preset.runtimeKind === 'schema-first'
        ? 'web-formal-template-schema-first'
        : 'web-template-document-rewrite',
      steps: ['analyze:route-template', 'analyze:extract-fields'],
    },
  }
}

export async function generateFormalTemplate(
  input: FormalTemplateGenerateInput,
): Promise<FormalTemplateGenerateResult | FormalTemplateServiceError> {
  return runFormalTemplateWorkflow(input)
}

export async function runFormalTemplateWorkflow(
  input: FormalTemplateGenerateInput,
  options: WorkflowRunOptions = {},
): Promise<FormalTemplateGenerateResult | FormalTemplateServiceError> {
  if (!isLlmConfigured()) {
    return {
      success: false,
      error: '正式模板工作流失败：LLM 配置缺失或调用失败',
      code: 'FT_LLM_NOT_CONFIGURED',
      availableTemplates: listPresets(),
    }
  }

  const resolved = resolveTemplate(input.presetId, input.customTemplateText)
  if (isServiceError(resolved)) return resolved
  const { preset, templateText } = resolved

  const diagnosticsSteps: string[] = []
  const instruction = String(input.instruction || '').trim()
  if (!instruction) {
    return {
      success: false,
      error: '必须提供 instruction（文稿要求）',
      code: 'FT_EMPTY_INSTRUCTION',
      availableTemplates: listPresets(),
    }
  }

  const runtimeChain = preset.runtimeKind === 'schema-first'
    ? 'web-formal-template-schema-first'
    : 'web-template-document-rewrite'

  const emit = (step: string, message: string, progress: number, partial?: { markdown?: string; html?: string }) => {
    diagnosticsSteps.push(step)
    options.onStep?.({
      step,
      message,
      progress,
      partialMarkdown: partial?.markdown,
      partialHtml: partial?.html,
    })
  }

  const ensureNotCancelled = () => {
    if (options.isCancelled?.()) {
      const error = new Error('正式模板任务已取消')
      ;(error as Error & { code?: string }).code = 'FT_CANCELLED'
      throw error
    }
  }

  try {
    ensureNotCancelled()
    emit('analyze', `正在识别模板链路（${preset.runtimeLabel}）…`, 8)

    const fieldState = await resolveFieldState(preset, templateText, input)
    ensureNotCancelled()
    emit('confirm', '正在整理模板字段并确认可填写信息…', 28)

    const preview = await buildPreviewCandidate(preset, input, fieldState.values)
    const previewMetadata = buildPreviewMetadata(preset, fieldState)
    ensureNotCancelled()
    emit('preview', '正在生成模板正文候选…', 62, {
      markdown: preview.partialMarkdown,
      html: textToDocumentHtml(preview.partialMarkdown, preset.label),
    })

    const committed = commitTemplateResult(preset, templateText, fieldState.values, preview)
    const commitMetadata = buildCommitMetadata()
    const artifact = buildFormalTemplateArtifact({
      preset,
      committed,
      resolvedFields: fieldState.values,
      previewMetadata,
      commitMetadata,
      runtimeChain,
    })
    ensureNotCancelled()
    emit('commit', '正在合成最终稿并准备写入编辑器…', 90, {
      markdown: committed.markdown,
      html: committed.html,
    })

    emit('completed', `${preset.label}链路已完成`, 100, {
      markdown: committed.markdown,
      html: committed.html,
    })

    return {
      success: true,
      title: committed.title,
      markdown: committed.markdown,
      html: committed.html,
      presetId: preset.id,
      presetLabel: preset.label,
      templateKind: preset.templateKind,
      runtimeKind: preset.runtimeKind,
      resolvedFields: fieldState.values,
      previewMetadata,
      commitMetadata,
      artifact,
      diagnostics: {
        chain: runtimeChain,
        steps: diagnosticsSteps,
        partialMissing: [...FORMAL_TEMPLATE_PARTIAL_MISSING],
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: message,
      code: error instanceof Error && 'code' in error && typeof (error as { code?: string }).code === 'string'
        ? (error as { code: string }).code
        : 'FT_UNKNOWN',
      availableTemplates: listPresets(),
    }
  }
}

function buildPreviewMetadata(
  preset: FormalTemplatePreset,
  fieldState: ResolvedFieldState,
): FormalTemplatePreviewMetadata {
  const resolvedFieldCount = fieldState.fields
    .filter((field) => String(fieldState.values[field.label] || fieldState.values[field.fieldId] || '').trim())
    .length
  return {
    stage: 'preview',
    templateKind: preset.templateKind,
    runtimeKind: preset.runtimeKind,
    fieldCount: fieldState.fields.length,
    resolvedFieldCount,
    unavailableReason: preset.unavailableReason,
  }
}

function buildCommitMetadata(): FormalTemplateCommitMetadata {
  return {
    stage: 'commit',
    target: 'a4-editor-html',
    docxCommitStatus: 'not-ported',
    missing: [...FORMAL_TEMPLATE_PARTIAL_MISSING],
  }
}

function buildFormalTemplateArtifact(input: {
  preset: FormalTemplatePreset
  committed: { title: string; markdown: string; html: string }
  resolvedFields: Record<string, string>
  previewMetadata: FormalTemplatePreviewMetadata
  commitMetadata: FormalTemplateCommitMetadata
  runtimeChain: FormalTemplateGenerateResult['diagnostics']['chain']
}): FormalTemplateArtifact {
  return {
    artifactId: `formal-template-${Date.now().toString(36)}`,
    type: 'formal_template',
    boundary: 'formal-template-result',
    title: input.committed.title,
    presetId: input.preset.id,
    presetLabel: input.preset.label,
    templateKind: input.preset.templateKind,
    runtimeKind: input.preset.runtimeKind,
    markdown: input.committed.markdown,
    html: input.committed.html,
    resolvedFields: input.resolvedFields,
    previewMetadata: input.previewMetadata,
    commitMetadata: input.commitMetadata,
    sourceRefs: [
      { type: 'template', id: input.preset.id, label: input.preset.label },
      { type: 'instruction', id: `instruction:${input.committed.title}`, label: input.committed.title },
    ],
    exportRefs: [
      { format: 'html', status: 'inline' },
      { format: 'markdown', status: 'inline' },
    ],
    sourceRuntime: input.runtimeChain,
  }
}

export function listPresets(): FormalTemplatePresetSummary[] {
  return listPresetSummaries()
}

async function resolveFieldState(
  preset: FormalTemplatePreset,
  templateText: string,
  input: FormalTemplateGenerateInput,
): Promise<ResolvedFieldState> {
  const fields = extractFieldsFromText(templateText)
  const heuristicValues = inferFieldValuesHeuristically(preset, input.instruction, input.fieldOverrides)

  if (fields.length === 0) {
    return { fields, values: heuristicValues }
  }

  const llmValues = await resolveFieldsViaLlm(preset, fields, input.instruction, input.extraContext ?? '', input.language ?? 'zh')
  return {
    fields,
    values: {
      ...llmValues,
      ...heuristicValues,
      ...(input.fieldOverrides ?? {}),
    },
  }
}

async function buildPreviewCandidate(
  preset: FormalTemplatePreset,
  input: FormalTemplateGenerateInput,
  resolvedFields: Record<string, string>,
): Promise<{ partialMarkdown: string; bodyText: string }> {
  const bodyText = await generateBodyText(preset, input.instruction, resolvedFields, input.extraContext ?? '', input.language ?? 'zh')
  if (preset.runtimeKind === 'schema-first') {
    return {
      bodyText,
      partialMarkdown: applyFieldValues(preset.templateText, {
        ...resolvedFields,
        正文: bodyText,
      }),
    }
  }

  return {
    bodyText,
    partialMarkdown: applyFieldValues(preset.templateText, {
      ...resolvedFields,
      正文: bodyText,
    }),
  }
}

function commitTemplateResult(
  preset: FormalTemplatePreset,
  templateText: string,
  resolvedFields: Record<string, string>,
  preview: { partialMarkdown: string; bodyText: string },
): { title: string; markdown: string; html: string } {
  const mergedFields = {
    ...resolvedFields,
    正文: preview.bodyText,
  }
  const markdown = applyFieldValues(templateText, mergedFields)
  const title = resolveTitle(preset, mergedFields)
  return {
    title,
    markdown,
    html: textToDocumentHtml(markdown, preset.label),
  }
}

function resolveTitle(preset: FormalTemplatePreset, values: Record<string, string>): string {
  return values.标题
    || values.报告标题
    || values.收件人
    || values.收函单位
    || preset.label
}

function resolveTemplate(
  presetId?: string,
  customText?: string,
): ResolvedTemplate | FormalTemplateServiceError {
  if (presetId === 'custom' && !String(customText || '').trim()) {
    return {
      success: false,
      error: '自定义模板文本尚未接入当前 Web formal_template 入口',
      code: 'FT_CUSTOM_TEMPLATE_UNAVAILABLE',
      availableTemplates: listPresets(),
    }
  }

  const preset = presetId ? getPreset(presetId) : getDefaultSupportedPreset()
  if (!preset) {
    return {
      success: false,
      error: '未找到正式模板类型',
      code: 'FT_UNKNOWN_PRESET',
      availableTemplates: listPresets(),
    }
  }
  if (!preset.supported) {
    return {
      success: false,
      error: preset.unavailableReason || `${preset.label}尚未接入 Web`,
      code: 'FT_PRESET_UNAVAILABLE',
      availableTemplates: listPresets(),
    }
  }

  if (presetId === 'custom' && String(customText || '').trim()) {
    return {
      preset,
      templateText: String(customText).trim(),
    }
  }

  return {
    preset,
    templateText: preset.templateText,
  }
}

function isServiceError(value: ResolvedTemplate | FormalTemplateServiceError): value is FormalTemplateServiceError {
  return 'success' in value
}

function inferFieldValuesHeuristically(
  preset: FormalTemplatePreset,
  instruction: string,
  overrides?: Record<string, string>,
): Record<string, string> {
  const text = String(instruction || '').trim()
  const merged = { ...(overrides ?? {}) }

  const pick = (...patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[1]) return match[1].trim()
    }
    return ''
  }

  const date = pick(
    /(?:日期|时间|发函日期)\s*[:：]?\s*([^\n，。；]{4,40})/u,
    /((?:\d{4}年)?\d{1,2}月\d{1,2}日(?:（[^）]+）)?(?:上午|下午|晚上|中午)?[^\n，。；]{0,12})/u,
  )
  const contactPerson = pick(/联系人\s*[:：]?\s*([^\n，。；\s]{2,20})/u)
  const phone = pick(/(?:联系电话|电话|手机)\s*[:：]?\s*([0-9+＋\-*\s]{7,24})/u)

  if (preset.id === 'visit_letter') {
    const recipient = pick(
      /(?:给|致|向|拜访|访问|前往)([^，。；\n]{2,48}(?:办公室|中心|学院|学校|单位|政府|委员会|厅|局|院))/u,
    )
    const sender = pick(
      /(?:发信单位|发函单位|落款单位)\s*[:：]?\s*([^\n，。；]{2,48})/u,
      /由([^，。；\n]{2,48}(?:学校|学院|大学|单位|办公室))发函/u,
    )
    return {
      收函单位: recipient || '有关单位',
      联系人: contactPerson || '联系人',
      联系电话: phone || '联系电话',
      发信单位: sender || '发函单位',
      发函日期: date || 'XXXX年XX月XX日',
      ...merged,
    }
  }

  if (preset.id === 'congratulation_letter') {
    const recipient = pick(
      /(?:给|致|向)([^，。；\n]{2,48}(?:学校|学院|单位|组织|办公室|委员会|团队))/u,
      /收件人\s*[:：]?\s*([^\n，。；]{2,48})/u,
    )
    const sender = pick(/(?:发信单位|落款单位|署名)\s*[:：]?\s*([^\n，。；]{2,48})/u)
    return {
      收件人: recipient || '有关单位',
      发信单位: sender || '发信单位',
      日期: date || 'XXXX年XX月XX日',
      ...merged,
    }
  }

  const title = pick(/(?:标题|题目)\s*[:：]?\s*([^\n]{2,80})/u)
  const issuer = pick(/(?:落款单位|发文单位)\s*[:：]?\s*([^\n，。；]{2,48})/u)
  return {
    标题: title || '正式模板文稿',
    落款单位: issuer || '发文单位',
    日期: date || 'XXXX年XX月XX日',
    ...merged,
  }
}

async function resolveFieldsViaLlm(
  preset: FormalTemplatePreset,
  fields: WebFieldSchema[],
  instruction: string,
  extraContext: string,
  language: 'zh' | 'en',
): Promise<Record<string, string>> {
  const fieldList = fields
    .map((field) => `- fieldId: "${field.fieldId}", label: "${field.label}", required: ${field.required}, dataType: "${field.dataType}"`)
    .join('\n')

  const prompt = [
    `你是正式模板字段抽取专家。当前模板类型：${preset.runtimeLabel}。`,
    '你的任务是从用户需求中抽取字段，不要把模板样例中的旧事实直接抄回。',
    `用户需求：${instruction}`,
    extraContext ? `补充背景：${extraContext}` : '',
    '字段清单：',
    fieldList,
    '请只返回 JSON 对象，key 为 fieldId，value 为字段值。',
    `输出语言：${language === 'en' ? 'English' : '简体中文'}`,
  ].filter(Boolean).join('\n\n')

  try {
    const result = await invokeLlmJson<Record<string, string>>(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, maxTokens: 1200 },
    )
    return result ?? {}
  } catch {
    return {}
  }
}

async function generateBodyText(
  preset: FormalTemplatePreset,
  instruction: string,
  resolvedFields: Record<string, string>,
  extraContext: string,
  language: 'zh' | 'en',
): Promise<string> {
  const fieldLines = Object.entries(resolvedFields)
    .filter(([, value]) => String(value || '').trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  const basePrompt = [
    `模板链路：${preset.runtimeLabel}`,
    `模板类型：${preset.label}`,
    `用户需求：${instruction}`,
    extraContext ? `补充背景：${extraContext}` : '',
    fieldLines ? `已确认字段：\n${fieldLines}` : '',
    `输出语言：${language === 'en' ? 'English' : '简体中文'}`,
  ].filter(Boolean).join('\n\n')

  let taskPrompt = ''
  if (preset.id === 'visit_letter') {
    taskPrompt = [
      '请只生成“拜访函”的正文区，不要输出标题、称谓、联系人和落款。',
      '正文要求：',
      '1. 第一段交代来函背景和拜访目的；',
      '2. 第二段说明拟拜访时间、交流事项或来访安排；',
      '3. 第三段写具体请求事项，可使用“1、2、3、”条列；',
      '4. 最后一段保留礼貌、克制的正式语气。',
      '不要输出“以下为正文”等解释。',
    ].join('\n')
  } else if (preset.id === 'congratulation_letter') {
    taskPrompt = [
      '请只生成“贺信”的正文区，不要输出标题、称谓和落款。',
      '正文要求：',
      '1. 第一段点明祝贺对象和主题；',
      '2. 中间段落总结成绩、意义或影响；',
      '3. 最后一段表达祝愿与期待；',
      '4. 语气正式、真诚、庄重。',
    ].join('\n')
  } else {
    taskPrompt = [
      '请基于 template-document-rewrite 链路生成“正文”区内容。',
      '要求保留正式文稿语体，输出可直接写入模板正文的内容。',
      '不要输出标题和落款。',
    ].join('\n')
  }

  try {
    return await invokeLlmText(
      [
        {
          role: 'system',
          content: preset.runtimeKind === 'schema-first'
            ? '你是正式模板 schema-first 文稿起草助手。输出必须严格限定在可写正文区域。'
            : '你是正式模板 template-document-rewrite 助手。输出必须是可直接回填的正式文稿正文。',
        },
        {
          role: 'user',
          content: `${basePrompt}\n\n${taskPrompt}`,
        },
      ],
      { temperature: 0.45, maxTokens: 2200 },
    )
  } catch (error) {
    throw new Error(`正式模板正文生成失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function textToDocumentHtml(text: string, presetLabel?: string): string {
  const escaped = text
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return '<p></p>'
      if (/^(拜访函|贺信)$/.test(t)) return `<h1>${escapeHtml(t)}</h1>`
      if (/^[一二三四五六七八九十]+[、.]/.test(t)) return `<h2>${escapeHtml(t)}</h2>`
      if (/^\d+[、.]\s/.test(t)) return `<p style="text-indent:2em">${escapeHtml(t)}</p>`
      return `<p${/[\u4e00-\u9fff]/.test(t) ? ' style="text-indent:2em"' : ''}>${escapeHtml(t)}</p>`
    })
    .join('\n')

  return `<div class="formal-template-document"${presetLabel ? ` data-template-type="${escapeHtml(presetLabel)}"` : ''}>\n${escaped}\n</div>`
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Avoid tree-shaking complaints when only some helpers are consumed indirectly.
void FORMAL_TEMPLATE_PRESETS
