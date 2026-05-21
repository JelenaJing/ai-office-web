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

const SYSTEM_PROMPT = `你是 AI Office 的中文办公文稿生成助手。请根据用户需求生成结构清晰、可直接用于办公场景的中文文稿。不要输出 Markdown。不要输出解释。只输出 JSON。`

interface LlmDocxJson {
  title?: string
  subtitle?: string
  sections?: Array<{
    heading?: string
    paragraphs?: string[]
  }>
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

export function buildFallbackContent(input: {
  title: string
  prompt: string
}): GeneratedDocxContent {
  const title = input.title.trim() || '办公文稿'
  const prompt = input.prompt.trim()
  let headings = extractSectionHeadingsFromPrompt(prompt)

  if (headings.length === 0) {
    headings = ['工作背景', '主要进展', '重点说明', '下一步计划']
  }

  const sections = headings.map((heading, idx) => {
    const lead =
      idx === 0
        ? `围绕「${title}」主题，结合用户需求整理如下内容。`
        : `本节围绕「${heading}」展开说明。`
    return {
      heading,
      paragraphs: [
        lead,
        `根据提示：${prompt.slice(0, 280)}${prompt.length > 280 ? '…' : ''}`,
        `建议在正式定稿前补充具体数据、责任人与完成时限，使「${heading}」表述更准确、可执行。`,
      ],
    }
  })

  return {
    title,
    subtitle: '（本地模板生成，未连接大模型）',
    sections,
  }
}

async function generateViaLlm(input: {
  title: string
  prompt: string
}): Promise<GeneratedDocxContent> {
  const userPayload = {
    title: input.title.trim() || '办公文稿',
    userPrompt: input.prompt.trim(),
    requiredJsonShape: {
      title: 'string',
      subtitle: 'string (optional)',
      sections: [{ heading: 'string', paragraphs: ['string'] }],
    },
  }

  const raw = await invokeLlmJson<LlmDocxJson>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          '请根据以下信息生成一份中文办公文稿，输出严格 JSON。',
          'JSON 结构必须是：',
          '{"title":"...","subtitle":"...","sections":[{"heading":"...","paragraphs":["...","..."]}]}',
          '',
          `文稿标题：${userPayload.title}`,
          `用户需求：${userPayload.userPrompt}`,
        ].join('\n'),
      },
    ],
    { temperature: 0.5, maxTokens: 4096 },
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
