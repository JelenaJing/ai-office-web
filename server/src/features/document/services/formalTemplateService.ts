/**
 * formalTemplateService.ts — Web formal template pipeline
 *
 * Simplified equivalent of Electron's 4-stage formalTemplateTaskService:
 *   analyze → confirm → preview → commit
 *
 * Web strategy:
 *   1. Analyze: extract {{field}} placeholders from preset or custom template text
 *   2. Resolve:  LLM fills each field based on user instruction + context
 *   3. Generate: LLM writes each section content given resolved fields
 *   4. Assemble: merge filled template + sections → final HTML document
 *
 * Limitation: no OOXML shell preservation (documentEngineService not available on Web).
 * diagnostics.chain = 'web-formal-template-runtime'
 */

import { invokeLlmText, invokeLlmJson, isLlmConfigured } from '../../../modules/ai-gateway'
import { markdownToHtml } from './markdownToHtml'
import {
  extractFieldsFromText,
  applyFieldValues,
  type WebFieldSchema,
} from './formalTemplateFieldExtractor'
import {
  FORMAL_TEMPLATE_PRESETS,
  getPreset,
  type FormalTemplatePreset,
} from './formalTemplatePresets'

// ---- Public types ----

export interface FormalTemplateAnalyzeInput {
  presetId?: string
  customTemplateText?: string
  instruction?: string
}

export interface FormalTemplateAnalyzeResult {
  success: true
  presetId: string
  presetLabel: string
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

export interface FormalTemplateGenerateResult {
  success: true
  title: string
  markdown: string
  html: string
  presetId: string
  presetLabel: string
  resolvedFields: Record<string, string>
  diagnostics: { chain: string; steps: string[] }
}

export type FormalTemplateServiceError = { success: false; error: string; code?: string }

// ---- Public API ----

export async function analyzeFormalTemplate(
  input: FormalTemplateAnalyzeInput,
): Promise<FormalTemplateAnalyzeResult | FormalTemplateServiceError> {
  const { preset, templateText } = resolveTemplate(input.presetId, input.customTemplateText)
  if (!templateText.trim()) {
    return { success: false, error: '模板内容为空，请选择预设模板或提供自定义模板文本', code: 'FT_EMPTY_TEMPLATE' }
  }

  const fields = extractFieldsFromText(templateText)
  return {
    success: true,
    presetId: preset?.id ?? 'custom',
    presetLabel: preset?.label ?? '自定义模板',
    templateText,
    fields,
    defaultSections: preset?.defaultSections ?? [],
    diagnostics: {
      chain: 'web-formal-template-runtime',
      steps: ['analyze:load-template', 'analyze:extract-fields'],
    },
  }
}

export async function generateFormalTemplate(
  input: FormalTemplateGenerateInput,
): Promise<FormalTemplateGenerateResult | FormalTemplateServiceError> {
  if (!isLlmConfigured()) {
    return {
      success: false,
      error: '正式模板生成失败：LLM 配置缺失。请检查服务器 LLM_API_KEY 环境变量。',
      code: 'FT_LLM_NOT_CONFIGURED',
    }
  }

  const steps: string[] = []

  // 1. Load template
  steps.push('load-template')
  const { preset, templateText } = resolveTemplate(input.presetId, input.customTemplateText)
  if (!templateText.trim()) {
    return { success: false, error: '模板内容为空', code: 'FT_EMPTY_TEMPLATE' }
  }

  const fields = extractFieldsFromText(templateText)
  const defaultSections = preset?.defaultSections ?? []
  const instruction = input.instruction.trim()
  const language = input.language ?? 'zh'
  const lang = language === 'zh' ? '中文' : 'English'

  // 2. Resolve fields via LLM
  steps.push('resolve-fields')
  let resolvedFields: Record<string, string> = {}
  if (fields.length > 0) {
    const fieldResult = await resolveFieldsViaLlm(fields, instruction, input.extraContext ?? '', lang)
    if (!fieldResult.success) return fieldResult
    resolvedFields = { ...fieldResult.values, ...input.fieldOverrides }
  }
  if (input.fieldOverrides) {
    resolvedFields = { ...resolvedFields, ...input.fieldOverrides }
  }

  // 3. Generate section content via LLM
  steps.push('generate-sections')
  const sectionContent: Record<string, string> = {}
  for (const sectionLabel of defaultSections) {
    const text = await generateSectionContent({
      sectionLabel,
      instruction,
      resolvedFields,
      templatePresetLabel: preset?.label ?? '正式文稿',
      extraContext: input.extraContext ?? '',
      language: lang,
    })
    sectionContent[sectionLabel] = text
  }

  // 4. Build filled template text
  steps.push('assemble-document')
  const allValues: Record<string, string> = {
    ...resolvedFields,
    ...sectionContent,
  }
  const filledText = applyFieldValues(templateText, allValues)

  // 5. Convert to HTML
  steps.push('render-html')
  const markdown = filledText
  const html = textToDocumentHtml(filledText, preset?.label)

  const title = resolvedFields['标题'] ?? resolvedFields['报告标题'] ?? resolvedFields['会议名称'] ?? resolvedFields['subject'] ?? (preset?.label ? `${preset.label}` : '正式模板文稿')

  return {
    success: true,
    title,
    markdown,
    html,
    presetId: preset?.id ?? 'custom',
    presetLabel: preset?.label ?? '自定义模板',
    resolvedFields,
    diagnostics: {
      chain: 'web-formal-template-runtime',
      steps,
    },
  }
}

export function listPresets(): Array<{ id: string; label: string; description: string; category: string }> {
  return FORMAL_TEMPLATE_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    category: p.category,
  }))
}

// ---- Private helpers ----

function resolveTemplate(
  presetId?: string,
  customText?: string,
): { preset: FormalTemplatePreset | undefined; templateText: string } {
  if (presetId && presetId !== 'custom') {
    const preset = getPreset(presetId)
    if (preset) return { preset, templateText: preset.templateText }
  }
  if (customText?.trim()) {
    return { preset: getPreset('custom'), templateText: customText.trim() }
  }
  // Default to official notice
  const defaultPreset = FORMAL_TEMPLATE_PRESETS[1]
  return { preset: defaultPreset, templateText: defaultPreset.templateText }
}

interface FieldResolveResult {
  success: true
  values: Record<string, string>
}

async function resolveFieldsViaLlm(
  fields: WebFieldSchema[],
  instruction: string,
  extraContext: string,
  lang: string,
): Promise<FieldResolveResult | FormalTemplateServiceError> {
  const fieldList = fields
    .map((f) => `- fieldId: "${f.fieldId}", label: "${f.label}", dataType: "${f.dataType}", required: ${f.required}`)
    .join('\n')

  const prompt = [
    `你是一个行政文书专家。根据用户的指令，为正式文稿模板中的字段推断合理的填写值。`,
    ``,
    `用户指令：${instruction}`,
    extraContext ? `补充背景：${extraContext}` : '',
    ``,
    `需要填写的字段：`,
    fieldList,
    ``,
    `请以 JSON 对象返回，key 为 fieldId，value 为填写的内容。`,
    `对于不确定的字段，返回合理的占位内容（如日期用"XXXX年XX月XX日"）。`,
    `对于可选字段，可以返回空字符串。`,
    `语言：${lang}`,
    `只返回 JSON，不要其他内容。`,
  ]
    .filter((l) => l !== undefined)
    .join('\n')

  try {
    const raw = await invokeLlmJson<Record<string, string>>(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3 },
    )
    return { success: true, values: raw ?? {} }
  } catch (err) {
    return {
      success: false,
      error: `字段解析失败：${err instanceof Error ? err.message : String(err)}`,
      code: 'FT_FIELD_RESOLUTION_FAILED',
    }
  }
}

interface SectionGenerateInput {
  sectionLabel: string
  instruction: string
  resolvedFields: Record<string, string>
  templatePresetLabel: string
  extraContext: string
  language: string
}

async function generateSectionContent(input: SectionGenerateInput): Promise<string> {
  const fieldContext = Object.entries(input.resolvedFields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const prompt = [
    `你是一个行政文书专家。为正式文稿的"${input.sectionLabel}"章节生成规范内容。`,
    ``,
    `文稿类型：${input.templatePresetLabel}`,
    `用户指令：${input.instruction}`,
    input.extraContext ? `背景信息：${input.extraContext}` : '',
    fieldContext ? `已填写字段：\n${fieldContext}` : '',
    ``,
    `请直接输出"${input.sectionLabel}"的正文内容（不要包含章节标题本身）。`,
    `语言：${input.language}`,
    `风格：正式、规范、简洁。`,
    `长度：2-4 段落。`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    return await invokeLlmText(
      [{ role: 'user', content: prompt }],
      { temperature: 0.4 },
    )
  } catch {
    return `[${input.sectionLabel}内容待填写]`
  }
}

/** Convert filled template text to document HTML */
function textToDocumentHtml(text: string, presetLabel?: string): string {
  const escaped = text
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return '<p></p>'
      // Headings
      if (/^[一二三四五六七八九十]+[、.]/.test(t)) {
        return `<h2>${escapeHtml(t)}</h2>`
      }
      // Numbered items
      if (/^\d+[、.]\s/.test(t)) {
        return `<p style="text-indent:2em">${escapeHtml(t)}</p>`
      }
      // Regular paragraphs with indent for Chinese text
      const isChinese = /[\u4e00-\u9fff]/.test(t)
      return `<p${isChinese ? ' style="text-indent:2em"' : ''}>${escapeHtml(t)}</p>`
    })
    .join('\n')

  return `<div class="formal-template-document"${presetLabel ? ` data-template-type="${escapeHtml(presetLabel)}"` : ''}>\n${escaped}\n</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
