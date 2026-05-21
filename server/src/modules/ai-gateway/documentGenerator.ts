/**
 * documentGenerator.ts — Structured Chinese office document content via LLM or fallback.
 */

import { invokeLlmJson, getLlmModel, isLlmConfigured } from './llmClient'

export interface GeneratedDocxContent {
  title: string
  subtitle?: string
  sections: Array<{
    heading: string
    paragraphs: string[]
  }>
}

export interface DocumentGenerationMeta {
  fallback: boolean
  model: string
}

const SYSTEM_PROMPT = `你是 AI Office 的中文办公文稿生成助手。请根据用户需求生成结构清晰、可直接用于办公场景的中文文稿。

【事实性数据规则 — 必须遵守】
1. 严禁编造用户未明确提供的金额、百分比、客户名称、合同号、订单号、日期、业绩指标、区域销售额、排名等事实性业务数据。
2. 若用户未提供具体数字或事实，不得用“示例数据”“假设”“约”“大约”等方式虚构；缺失处必须使用占位符或提示语，例如：
   - [待补充]
   - 请补充具体数据
   - [销售额]
   - [同比增长率]
   - [客户名称]
   - [完成率]
3. 仅当用户在需求原文中明确写出某数据时，才可在文稿中使用该数据；不得推断、换算或补全未给出的数字。
4. 可以生成正式语气、章节结构、分析框架、写作指引与待填写模板，但不得创造事实。
5. 对事实性内容保持保守；宁可留空占位，不可捏造。

输出要求：不要输出 Markdown。不要输出解释。只输出 JSON。`

const USER_GENERATION_RULES = `【生成要求】
- 输出严格 JSON，结构：{"title":"...","subtitle":"...","sections":[{"heading":"...","paragraphs":["..."]}]}
- 严禁编造未提供的金额、百分比、客户名、合同号、日期、业绩指标、区域销售数据。
- 缺少数据时使用“待补充”、“请补充具体数据”或方括号占位符（如 [销售额]、[同比增长率]）。
- 可生成正式表达与文稿结构，但不得创造事实。
- 用户已明确提供的数据可以原样或合理转述使用；未提供的不得自行添加。`

interface LlmDocxJson {
  title?: string
  subtitle?: string
  sections?: Array<{
    heading?: string
    paragraphs?: string[]
  }>
}

function isSalesReportContext(title: string, prompt: string): boolean {
  const text = `${title} ${prompt}`
  return /销售|业绩|营收|回款|汇报/.test(text)
}

function normalizeContent(raw: LlmDocxJson, input: { title: string; prompt: string }): GeneratedDocxContent {
  const title = (raw.title?.trim() || input.title.trim() || '办公文稿').slice(0, 120)
  const subtitle = raw.subtitle?.trim() || undefined

  const sections = (raw.sections ?? [])
    .map(s => ({
      heading: (s.heading?.trim() || '正文').slice(0, 80),
      paragraphs: (s.paragraphs ?? [])
        .map(p => String(p).trim())
        .filter(Boolean)
        .slice(0, 12),
    }))
    .filter(s => s.paragraphs.length > 0)
    .slice(0, 12)

  if (sections.length === 0) {
    return buildFallbackContent(input)
  }

  return { title, subtitle, sections }
}

/** Heuristic section headings from user prompt (Chinese lists / keywords). */
function extractSectionHeadingsFromPrompt(prompt: string): string[] {
  const headings: string[] = []

  const includesMatch = prompt.match(/包括[：:]\s*([^。.\n]+)/)
  if (includesMatch) {
    includesMatch[1]
      .split(/[、,，;；]/)
      .map(s => s.trim())
      .filter(s => s.length >= 2 && s.length <= 40)
      .forEach(s => headings.push(s))
  }

  const keywordPatterns = [
    '客户拜访',
    '需求沟通',
    '报价进展',
    '下一步',
    '跟进计划',
    '工作进展',
    '问题与风险',
    '总结',
    '背景',
    '目标',
    '方案',
  ]
  for (const kw of keywordPatterns) {
    if (prompt.includes(kw) && !headings.some(h => h.includes(kw))) {
      headings.push(kw.includes('下一步') ? '下一步跟进计划' : kw)
    }
  }

  return [...new Set(headings)].slice(0, 8)
}

/** Placeholder-only paragraphs for a section — no fabricated metrics. */
function buildPlaceholderParagraphs(heading: string): string[] {
  return [
    `${heading}：[待补充]`,
    '请在本节补充您掌握的具体事实、数据与说明；未提供的信息请保持为“待补充”或方括号占位，不要编造。',
  ]
}

function buildSalesReportFallback(title: string): GeneratedDocxContent {
  return {
    title,
    subtitle: '（模板文稿，请补充真实数据后定稿）',
    sections: [
      {
        heading: '总体业绩概览',
        paragraphs: [
          '本季度销售额：[待补充]',
          '同比变化：[待补充]',
          '目标完成情况：[待补充]',
        ],
      },
      {
        heading: '区域与产品线表现',
        paragraphs: [
          '重点区域/产品线：[待补充]',
          '贡献说明：[待补充]',
        ],
      },
      {
        heading: '重点客户与项目',
        paragraphs: [
          '重点客户：[待补充]',
          '项目/合同进展：[待补充]',
        ],
      },
      {
        heading: '问题与改进',
        paragraphs: [
          '主要问题：[待补充]',
          '改进措施：[待补充]',
        ],
      },
      {
        heading: '下一步计划',
        paragraphs: [
          '下阶段工作重点：[待补充]',
          '需协调事项：[待补充]',
        ],
      },
    ],
  }
}

export function buildFallbackContent(input: {
  title: string
  prompt: string
}): GeneratedDocxContent {
  const title = input.title.trim() || '办公文稿'
  const prompt = input.prompt.trim()

  if (isSalesReportContext(title, prompt)) {
    return buildSalesReportFallback(title)
  }

  let headings = extractSectionHeadingsFromPrompt(prompt)
  if (headings.length === 0) {
    headings = ['背景与目标', '主要工作进展', '重点说明', '下一步计划']
  }

  const sections = headings.map(heading => ({
    heading,
    paragraphs: buildPlaceholderParagraphs(heading),
  }))

  return {
    title,
    subtitle: '（本地模板生成，未连接大模型；请补充真实数据）',
    sections,
  }
}

function buildUserMessage(input: { title: string; prompt: string }): string {
  const title = input.title.trim() || '办公文稿'
  const userPrompt = input.prompt.trim()

  return [
    USER_GENERATION_RULES,
    '',
    '请根据以下信息生成一份中文办公文稿。',
    '',
    `文稿标题：${title}`,
    `用户需求：${userPrompt}`,
    '',
    '再次提醒：用户需求中未出现的具体金额、百分比、客户名称、合同金额、日期、业绩数字一律不得编造；请用“待补充”或 [占位符] 表示缺失项。用户已明确写出的数据方可使用。',
  ].join('\n')
}

async function generateViaLlm(input: {
  title: string
  prompt: string
}): Promise<GeneratedDocxContent> {
  const raw = await invokeLlmJson<LlmDocxJson>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(input) },
    ],
    { temperature: 0.3, maxTokens: 4096 },
  )

  return normalizeContent(raw, input)
}

export async function generateDocumentContent(input: {
  title: string
  prompt: string
}): Promise<GeneratedDocxContent> {
  const result = await generateDocumentContentDetailed(input)
  return result.content
}

export async function generateDocumentContentDetailed(input: {
  title: string
  prompt: string
}): Promise<{ content: GeneratedDocxContent; meta: DocumentGenerationMeta }> {
  if (!isLlmConfigured()) {
    console.warn('[ai-gateway] LLM_API_KEY not set — using fallback document content')
    return {
      content: buildFallbackContent(input),
      meta: { fallback: true, model: 'fallback' },
    }
  }

  try {
    const content = await generateViaLlm(input)
    return {
      content,
      meta: { fallback: false, model: getLlmModel() },
    }
  } catch (err) {
    console.warn(
      '[ai-gateway] LLM failed, using fallback:',
      err instanceof Error ? err.message : err,
    )
    return {
      content: buildFallbackContent(input),
      meta: { fallback: true, model: getLlmModel() },
    }
  }
}
