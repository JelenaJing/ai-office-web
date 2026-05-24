import { invokeLlmJson, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { markdownToHtml } from './markdownToHtml'
import {
  PAPER_NFTCORE_PARTIAL_MISSING,
  type PaperArtifact,
  type PaperArtifactSection,
  type PaperCitationStatus,
  type PaperReferencesSidecar,
} from './paperNFTCORERuntime'
import type { ReferenceItem } from './openAlexClient'
import type { DocumentTaskResult } from '../types'

export type PaperWorkflowPaperType = 'research' | 'review' | 'thesis_research'

export type PaperWorkflowMode =
  | 'full'
  | 'outline'
  | 'abstract'
  | 'introduction'
  | 'methodology'
  | 'conclusion'
  | 'trajectory'
  | 'representative-studies'
  | 'debates'
  | 'future-directions'

export interface PaperWorkflowGenerateInput {
  topic: string
  paperType: PaperWorkflowPaperType
  language?: 'zh' | 'en'
  workspacePath?: string
  extraContext?: string
  yearFrom?: string
  yearTo?: string
  mode?: PaperWorkflowMode
  /** Optional progress callback — called at key pipeline steps. */
  onStep?: (step: string, message: string, progress: number) => void
  isCancelled?: () => boolean
}

export interface PaperWorkflowGenerateResult {
  success: true
  title: string
  markdown: string
  html: string
  paperType: PaperWorkflowPaperType
  references: ReferenceItem[]
  outline: string[]
  sections: PaperArtifactSection[]
  citationStatus: PaperCitationStatus
  referencesSidecar: PaperReferencesSidecar
  artifact: PaperArtifact
  documentResult?: DocumentTaskResult
  diagnostics: {
    chain: 'paper-workflow' | 'paper-workflow-web-adapter' | 'electron-compatible-nftcore' | 'web-paper-runtime' | 'web-paper-compatible-runtime'
    steps: string[]
    partialMissing: string[]
  }
}

interface PaperOutlinePlan {
  title: string
  keywords: string[]
  outline: string[]
  referencesPlan: string[]
}

const RESEARCH_SECTIONS = [
  '标题',
  '摘要',
  '关键词',
  '引言',
  '研究背景与问题',
  '相关研究',
  '研究方法 / 分析框架',
  '结果或分析',
  '讨论',
  '结论',
  '参考文献',
]

const REVIEW_SECTIONS = [
  '标题',
  '摘要',
  '关键词',
  '引言',
  '文献检索与筛选说明',
  '研究脉络',
  '主要观点 / 主题分类',
  '代表性研究',
  '争议与不足',
  '未来研究方向',
  '结论',
  '参考文献',
]

function normalizeKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) return []
  return keywords
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 6)
}

function normalizeOutline(outline: unknown, paperType: PaperWorkflowPaperType): string[] {
  const fallback = paperType === 'review' ? REVIEW_SECTIONS : RESEARCH_SECTIONS
  if (!Array.isArray(outline)) return fallback
  const normalized = outline.map((item) => String(item || '').trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : fallback
}

function resolveSteps(mode: PaperWorkflowMode): string[] {
  const base = ['analyze-topic', 'retrieve-references', 'draft-outline', 'generate-sections', 'prepare-references']
  if (mode === 'outline') return ['analyze-topic', 'draft-outline']
  if (mode === 'abstract') return ['analyze-topic', 'draft-title-abstract']
  return base
}

function assertNotCancelled(input: Pick<PaperWorkflowGenerateInput, 'isCancelled'>): void {
  if (input.isCancelled?.()) {
    const error = new Error('论文任务已取消')
    error.name = 'PaperWorkflowCancelledError'
    throw error
  }
}

function extractSectionArtifacts(markdown: string): PaperArtifactSection[] {
  const matches = Array.from(markdown.matchAll(/^##\s+(.+)$/gm))
  return matches.map((match, index) => {
    const start = match.index ?? 0
    const next = matches[index + 1]?.index ?? markdown.length
    const sectionMarkdown = markdown.slice(start, next).trim()
    return {
      index: index + 1,
      title: String(match[1] || '').trim(),
      markdown: sectionMarkdown,
      citationMarkers: Array.from(new Set(sectionMarkdown.match(/\[\d+\]/g) ?? [])),
    }
  })
}

function buildWebAdapterPaperResult(params: {
  title: string
  markdown: string
  html: string
  paperType: PaperWorkflowPaperType
  outline: string[]
  diagnosticsSteps: string[]
}): PaperWorkflowGenerateResult {
  const sections = extractSectionArtifacts(params.markdown)
  const referencesSidecar: PaperReferencesSidecar = {
    status: 'generated',
    source: 'empty',
    references: [],
    generatedAt: new Date().toISOString(),
  }
  const citationStatus: PaperCitationStatus = {
    mode: 'deferred',
    markerCount: params.markdown.match(/\[\d+\]/g)?.length ?? 0,
    referenceCount: 0,
    verified: false,
    verificationStatus: 'not-ported',
    missing: [
      'OpenAlex references are only available in the full NFTCORE runtime.',
      'Electron referenceManager citation verification is not yet ported to Web server.',
    ],
  }
  const artifact: PaperArtifact = {
    artifactId: `paper-${Date.now().toString(36)}`,
    type: 'paper',
    boundary: 'paper-result',
    title: params.title,
    paperType: params.paperType,
    markdown: params.markdown,
    html: params.html,
    outline: params.outline,
    sections,
    referencesSidecar,
    citationStatus,
    sourceRefs: [
      { type: 'topic', id: `topic:${params.title}`, label: params.title },
    ],
    exportRefs: [
      { format: 'html', status: 'inline' },
      { format: 'markdown', status: 'inline' },
      { format: 'references', status: 'inline' },
    ],
    sourceRuntime: 'electron-compatible-nftcore',
  }

  return {
    success: true,
    title: params.title,
    markdown: params.markdown,
    html: params.html,
    paperType: params.paperType,
    references: [],
    outline: params.outline,
    sections,
    citationStatus,
    referencesSidecar,
    artifact,
    diagnostics: {
      chain: 'paper-workflow-web-adapter',
      steps: params.diagnosticsSteps,
      partialMissing: [
        'full NFTCORE OpenAlex reference search for partial modes',
        ...PAPER_NFTCORE_PARTIAL_MISSING,
      ],
    },
  }
}

function buildOfflineMarkdown(input: PaperWorkflowGenerateInput): string {
  const title = input.topic.trim() || (input.paperType === 'review' ? '文献综述' : '研究文章')
  const mode = input.mode ?? 'full'

  if (mode === 'outline') {
    const sections = input.paperType === 'review' ? REVIEW_SECTIONS : RESEARCH_SECTIONS
    return [
      `# ${title}`,
      '',
      '## 关键词',
      '- 关键词 1',
      '- 关键词 2',
      '- 关键词 3',
      '',
      '## 论文大纲',
      ...sections.map((section, index) => `${index + 1}. ${section}`),
      '',
      '## 说明',
      '（LLM 未配置，当前返回结构化大纲占位结果。）',
    ].join('\n')
  }

  const sections = input.paperType === 'review' ? REVIEW_SECTIONS : RESEARCH_SECTIONS
  return [
    `# ${title}`,
    '',
    '## 摘要',
    '（LLM 未配置，当前返回论文工作流结构占位结果。）',
    '',
    '## 关键词',
    '关键词1；关键词2；关键词3',
    '',
    ...sections
      .filter((section) => !['标题', '摘要', '关键词'].includes(section))
      .flatMap((section) => [`## ${section}`, `（${section}内容待生成）`, '']),
  ].join('\n')
}

function buildPlannerMessages(input: PaperWorkflowGenerateInput) {
  const sections = input.paperType === 'review' ? REVIEW_SECTIONS : RESEARCH_SECTIONS
  const paperLabel = input.paperType === 'review' ? '文献综述' : input.paperType === 'thesis_research' ? '学位论文' : '研究文章'
  return [
    {
      role: 'system' as const,
      content: `你是一位${paperLabel}结构规划专家。你要先分析主题，再输出严格 JSON，用于后续论文链路生成。`,
    },
    {
      role: 'user' as const,
      content: [
        `主题：${input.topic}`,
        `论文类型：${paperLabel}`,
        `语言：${input.language === 'en' ? 'English' : '简体中文'}`,
        input.yearFrom || input.yearTo ? `参考年份范围：${input.yearFrom || '不限'} - ${input.yearTo || '不限'}` : '',
        input.extraContext ? `补充上下文：\n${input.extraContext}` : '',
        `必须围绕以下结构规划：\n${sections.map((section, index) => `${index + 1}. ${section}`).join('\n')}`,
        '请输出 JSON，字段为：',
        '{',
        '  "title": "论文标题",',
        '  "keywords": ["关键词1", "关键词2", "关键词3"],',
        '  "outline": ["章节1", "章节2", "章节3"],',
        '  "referencesPlan": ["应优先覆盖的参考主题1", "应优先覆盖的参考主题2"]',
        '}',
      ].filter(Boolean).join('\n\n'),
    },
  ]
}

function buildBodyPrompt(input: PaperWorkflowGenerateInput, plan: PaperOutlinePlan): string {
  const common = [
    `主题：${input.topic}`,
    `规划标题：${plan.title}`,
    `关键词：${normalizeKeywords(plan.keywords).join('；') || '关键词1；关键词2；关键词3'}`,
    input.extraContext ? `补充上下文：\n${input.extraContext}` : '',
    plan.referencesPlan.length > 0 ? `参考主题线索：\n${plan.referencesPlan.map((item, index) => `${index + 1}. ${item}`).join('\n')}` : '',
    `规划大纲：\n${normalizeOutline(plan.outline, input.paperType).map((item, index) => `${index + 1}. ${item}`).join('\n')}`,
  ].filter(Boolean)

  const mode = input.mode ?? 'full'
  if (mode === 'outline') {
    return [
      ...common,
      '只输出论文大纲，不要生成完整正文。',
      '格式要求：',
      '1. 第一行使用 # 标题',
      '2. 然后输出 ## 关键词',
      '3. 然后输出 ## 论文大纲，并用编号列出章节要点',
    ].join('\n\n')
  }

  if (input.paperType === 'review') {
    if (mode === 'trajectory') {
      return [...common, '只输出“研究脉络”章节，要求按时间和主题演进梳理研究发展。'].join('\n\n')
    }
    if (mode === 'representative-studies') {
      return [...common, '只输出“代表性研究”章节，按主题分类概括核心观点、方法和贡献。'].join('\n\n')
    }
    if (mode === 'debates') {
      return [...common, '只输出“争议与不足”章节，总结主要分歧、限制和研究空白。'].join('\n\n')
    }
    if (mode === 'future-directions') {
      return [...common, '只输出“未来研究方向”章节，提出后续研究建议和潜在突破点。'].join('\n\n')
    }

    return [
      ...common,
      '请生成一篇完整的文献综述，必须使用 Markdown 输出，并严格包含以下结构：',
      '1. 标题',
      '2. 摘要',
      '3. 关键词',
      '4. 引言',
      '5. 文献检索与筛选说明',
      '6. 研究脉络',
      '7. 主要观点 / 主题分类',
      '8. 代表性研究',
      '9. 争议与不足',
      '10. 未来研究方向',
      '11. 结论',
      '12. 参考文献',
      '参考文献必须使用占位格式 [1] [2] [3]，不要编造 DOI 或真实作者细节。',
      '不要输出分析过程，不要输出“以下是论文”之类说明。',
    ].join('\n\n')
  }

  if (mode === 'abstract') {
    return [...common, '只输出标题、摘要、关键词三个部分，摘要需体现研究目标、方法、发现与意义。'].join('\n\n')
  }
  if (mode === 'introduction') {
    return [...common, '只输出引言与研究背景相关部分，强调问题定义、研究意义和研究贡献。'].join('\n\n')
  }
  if (mode === 'methodology') {
    return [...common, '只输出“研究方法 / 分析框架”章节，说明研究设计、变量、数据来源和分析步骤。'].join('\n\n')
  }
  if (mode === 'conclusion') {
    return [...common, '只输出“结论”章节，包含主要发现、贡献、局限和未来方向。'].join('\n\n')
  }

  return [
    ...common,
    '请生成一篇完整的研究文章，必须使用 Markdown 输出，并严格包含以下结构：',
    '1. 标题',
    '2. 摘要',
    '3. 关键词',
    '4. 引言',
    '5. 研究背景与问题',
    '6. 相关研究',
    '7. 研究方法 / 分析框架',
    '8. 结果或分析',
    '9. 讨论',
    '10. 结论',
    '11. 参考文献',
    '参考文献必须使用占位格式 [1] [2] [3]，不要编造 DOI 或真实作者细节。',
    '不要输出分析过程，不要输出“以下是论文”之类说明。',
  ].join('\n\n')
}

export async function runPaperWorkflowService(
  input: PaperWorkflowGenerateInput,
): Promise<PaperWorkflowGenerateResult> {
  const normalizedInput: PaperWorkflowGenerateInput = {
    ...input,
    language: input.language ?? 'zh',
    mode: input.mode ?? 'full',
  }

  const diagnostics = {
    chain: 'paper-workflow-web-adapter' as const,
    steps: resolveSteps(normalizedInput.mode ?? 'full'),
    partialMissing: [
      'full NFTCORE OpenAlex reference search for partial modes',
      ...PAPER_NFTCORE_PARTIAL_MISSING,
    ],
  }

  if (!normalizedInput.topic.trim()) {
    throw new Error('必须提供 topic')
  }

  if (!isLlmConfigured()) {
    assertNotCancelled(normalizedInput)
    const markdown = buildOfflineMarkdown(normalizedInput)
    return buildWebAdapterPaperResult({
      title: normalizedInput.topic.trim(),
      markdown,
      html: markdownToHtml(markdown),
      paperType: normalizedInput.paperType,
      outline: normalizeOutline([], normalizedInput.paperType),
      diagnosticsSteps: diagnostics.steps,
    })
  }

  const plan = await (async () => {
    assertNotCancelled(normalizedInput)
    normalizedInput.onStep?.('analyze-topic', '正在分析主题和规划大纲…', 20)
    return invokeLlmJson<PaperOutlinePlan>(buildPlannerMessages(normalizedInput), {
      temperature: 0.35,
      maxTokens: 1800,
    })
  })()

  const title = String(plan.title || normalizedInput.topic).trim() || normalizedInput.topic.trim()
  assertNotCancelled(normalizedInput)
  normalizedInput.onStep?.('generate-sections', '正在生成论文正文…', 50)
  const markdown = await invokeLlmText(
    [
      {
        role: 'system' as const,
        content:
          normalizedInput.paperType === 'review'
            ? '你是一位资深综述论文写作专家。你必须输出结构化 Markdown，不得退化为普通办公文稿，不得省略参考文献占位。'
            : '你是一位资深研究论文写作专家。你必须输出结构化 Markdown，不得退化为普通办公文稿，不得省略参考文献占位。',
      },
      {
        role: 'user' as const,
        content: buildBodyPrompt(normalizedInput, {
          title,
          keywords: normalizeKeywords(plan.keywords),
          outline: normalizeOutline(plan.outline, normalizedInput.paperType),
          referencesPlan: Array.isArray(plan.referencesPlan)
            ? plan.referencesPlan.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
            : [],
        }),
      },
    ],
    {
      temperature: 0.45,
      maxTokens: 4200,
    },
  )

  assertNotCancelled(normalizedInput)
  normalizedInput.onStep?.('prepare-references', '正在整理参考文献占位…', 90)
  return buildWebAdapterPaperResult({
    title,
    markdown,
    html: markdownToHtml(markdown),
    paperType: normalizedInput.paperType,
    outline: normalizeOutline(plan.outline, normalizedInput.paperType),
    diagnosticsSteps: diagnostics.steps,
  })
}
