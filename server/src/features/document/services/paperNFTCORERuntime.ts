/**
 * paperNFTCORERuntime.ts — Web server compatible NFTCORE paper generation pipeline.
 *
 * Mirrors the Electron paperGeneratorNFTCORE.ts multi-step chain:
 *   1. OpenAlex reference search
 *   2. Dynamic structure planning (LLM)
 *   3. Structure thinking
 *   4. Title + abstract
 *   5-N. Per-section: thinking → body with inline citations
 *   N+1. Conclusion
 *   N+2. Reference list formatting
 *   N+3. Final normalisation
 *
 * Differences from Electron version:
 * - No Electron IPC, no window.electronAPI
 * - No image generation
 * - No OOXML snapshots
 * - No streaming (tasks are async; full result returned at completion)
 * - invokeLlmText / invokeLlmJson from server AI gateway instead of completeText(settings, ...)
 */

import { invokeLlmText } from '../../../modules/ai-gateway'
import { formatReferenceList, searchReferencesWithNftcoreStrategy, type ReferenceItem } from './openAlexClient'
import { buildPaperPlanDynamic, type SectionPlan } from './paperStructurePlanner'
import {
  buildConclusionPrompt,
  buildSectionContentPrompt,
  buildSectionThinkingPrompt,
  buildStructureThinkingPrompt,
  buildTitleAbstractPrompt,
  parseTitleAndAbstract,
  shouldDeferReferenceInsertion,
  type CitationMode,
} from './nftcorePromptFactory'
import { markdownToHtml } from './markdownToHtml'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PaperNFTCOREParams {
  topic: string
  paperType: 'research' | 'review' | 'thesis_research'
  language?: 'zh' | 'en'
  yearFrom?: string
  yearTo?: string
  extraContext?: string
  skipSectionThinking?: boolean
  citationMode?: CitationMode
  isCancelled?: () => boolean
}

export interface PaperNFTCOREResult {
  title: string
  markdown: string
  html: string
  paperType: string
  references: ReferenceItem[]
  outline: string[]
  sections: PaperArtifactSection[]
  citationStatus: PaperCitationStatus
  referencesSidecar: PaperReferencesSidecar
  artifact: PaperArtifact
  diagnostics: {
    chain: 'electron-compatible-nftcore' | 'web-paper-runtime' | 'web-paper-compatible-runtime'
    steps: string[]
    partialMissing: string[]
  }
}

export type NFTCOREStepCallback = (step: number, message: string, partial?: string) => void

export interface PaperArtifactSection {
  index: number
  title: string
  markdown: string
  citationMarkers: string[]
}

export interface PaperCitationStatus {
  mode: CitationMode
  markerCount: number
  referenceCount: number
  verified: false
  verificationStatus: 'not-ported'
  missing: string[]
}

export interface PaperReferencesSidecar {
  status: 'generated'
  source: 'openalex' | 'empty'
  references: ReferenceItem[]
  generatedAt: string
}

export interface PaperArtifact {
  type: 'paper'
  boundary: 'paper-result'
  title: string
  paperType: PaperNFTCOREParams['paperType']
  markdown: string
  html: string
  outline: string[]
  sections: PaperArtifactSection[]
  referencesSidecar: PaperReferencesSidecar
  citationStatus: PaperCitationStatus
  sourceRuntime: 'electron-compatible-nftcore'
}

export const PAPER_NFTCORE_PARTIAL_MISSING = [
  'incremental reference organisation pass',
  'knowledge tree check',
  'final full-paper review',
  'citation verification',
] as const

function assertNotCancelled(isCancelled?: (() => boolean) | undefined): void {
  if (isCancelled?.()) {
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

function buildCitationStatus(markdown: string, references: ReferenceItem[], mode: CitationMode): PaperCitationStatus {
  return {
    mode,
    markerCount: markdown.match(/\[\d+\]/g)?.length ?? 0,
    referenceCount: references.length,
    verified: false,
    verificationStatus: 'not-ported',
    missing: ['Electron referenceManager citation verification is not yet ported to Web server.'],
  }
}

function buildReferencesSidecar(references: ReferenceItem[]): PaperReferencesSidecar {
  return {
    status: 'generated',
    source: references.length > 0 ? 'openalex' : 'empty',
    references,
    generatedAt: new Date().toISOString(),
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function appendMarkdown(base: string, addition: string): string {
  const b = base.trim()
  const a = addition.trim()
  if (!b) return a
  if (!a) return b
  return `${b}\n\n${a}`
}

function stripMarkdownHeading(text: string): string {
  return text.replace(/^#{1,6}\s+.*$/m, '').trim()
}

function buildReferenceContext(references: ReferenceItem[], limit: number): string {
  return references
    .slice(0, limit)
    .map((ref, idx) => {
      const authors = ref.authors.slice(0, 3).join(', ') || 'Unknown'
      return `[${idx + 1}] ${ref.title} (${ref.year ?? 'n.d.'}) — ${authors}. ${ref.abstract ? ref.abstract.slice(0, 120) + '…' : ''}`
    })
    .join('\n')
}

async function llm(systemPrompt: string, userPrompt: string, opts: { temperature: number; maxTokens: number }): Promise<string> {
  return invokeLlmText(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    opts,
  )
}

async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn('[paperNFTCORERuntime] retry attempt 2:', err instanceof Error ? err.message : err)
    return fn()
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────

export async function runPaperNFTCORE(
  params: PaperNFTCOREParams,
  onStep: NFTCOREStepCallback,
): Promise<PaperNFTCOREResult> {
  const language = params.language ?? 'zh'
  const steps: string[] = []
  let currentStep = 1

  const emit = (message: string, partial?: string): number => {
    assertNotCancelled(params.isCancelled)
    const step = currentStep++
    steps.push(message)
    try { onStep(step, message, partial) } catch { /* ignore */ }
    return step
  }

  emit('校验输入并初始化生成会话')
  emit('准备文献检索查询')

  // ── Step 1–3: Reference search ───────────────────────────────────────────
  let references: ReferenceItem[] = []
  try {
    assertNotCancelled(params.isCancelled)
    emit('正在检索 OpenAlex 学术文献…')
    references = await searchReferencesWithNftcoreStrategy({
      topic: params.topic,
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      maxResults: 20,
    })
    emit(`已检索到 ${references.length} 篇候选文献`)
  } catch (err) {
    emit(`文献检索失败，已跳过并继续生成: ${err instanceof Error ? err.message : String(err)}`)
    references = []
  }

  // ── Step 4–5: Structure planning ─────────────────────────────────────────
  emit(params.paperType === 'research' ? '正在应用研究论文固定章节结构' : '正在用 LLM 动态生成论文章节结构')

  assertNotCancelled(params.isCancelled)
  const paperPlan = await buildPaperPlanDynamic(
    { topic: params.topic, paperType: params.paperType, language, extraContext: params.extraContext },
    references,
  )
  emit(
    `${paperPlan.planMode === 'fixed' ? '章节结构已按固定骨架生成' : '章节结构已动态生成'}，共 ${paperPlan.sections.length} 个章节：${paperPlan.sections.map((s) => s.title).join(' / ')}`,
  )

  const referenceContextLimit = Math.min(10, references.length)
  const referenceContext = buildReferenceContext(references, referenceContextLimit)

  // ── Structure thinking ───────────────────────────────────────────────────
  emit('正在推理全文架构')
  assertNotCancelled(params.isCancelled)
  const structureThinkingPrompt = buildStructureThinkingPrompt({
    topic: params.topic,
    language,
    paperType: params.paperType,
    extraContext: params.extraContext,
    sections: paperPlan.sections,
  })
  await retryOnce(() =>
    llm(structureThinkingPrompt.systemPrompt, structureThinkingPrompt.userPrompt, { temperature: 0.4, maxTokens: 900 }),
  )
  emit('全文架构思考已生成')

  // ── Step 6–7: Title + Abstract ───────────────────────────────────────────
  emit('正在按 NFTCORE 模板生成标题和摘要')
  assertNotCancelled(params.isCancelled)
  const citationMode: CitationMode = params.citationMode
    ?? (shouldDeferReferenceInsertion(params.paperType) ? 'deferred' : 'inline')

  const titleAbstractPrompt = buildTitleAbstractPrompt({
    topic: params.topic,
    language,
    paperType: params.paperType,
    extraContext: params.extraContext,
    sections: paperPlan.sections,
  })
  const titleAbstractMarkdown = await retryOnce(() =>
    llm(titleAbstractPrompt.systemPrompt, titleAbstractPrompt.userPrompt, { temperature: 0.45, maxTokens: 1400 }),
  )

  const parsedTA = parseTitleAndAbstract(titleAbstractMarkdown, params.topic, language)
  const title = (parsedTA.title || params.topic).replace(/^\s*#\s+/, '').trim()
  const abstract = parsedTA.abstract.replace(/^#{1,6}\s+/, '').trim()

  let assembledMarkdown = `# ${title}`
  emit('标题已生成')

  const abstractHeading = language === 'zh' ? '## 摘要' : '## Abstract'
  assembledMarkdown = appendMarkdown(assembledMarkdown, `${abstractHeading}\n\n${abstract}`)
  emit('摘要已按 NFTCORE 模板生成')

  // ── Keywords ─────────────────────────────────────────────────────────────
  const keywordsHeading = language === 'zh' ? '## 关键词' : '## Keywords'
  const keywordsPrompt = language === 'zh'
    ? `请为以下论文题目和摘要提取 4-6 个中文关键词，以分号分隔，只输出关键词本身：\n\n标题：${title}\n摘要：${abstract.slice(0, 400)}`
    : `Extract 4-6 English keywords for the following paper title and abstract. Output comma-separated keywords only:\n\nTitle: ${title}\nAbstract: ${abstract.slice(0, 400)}`
  const keywords = await retryOnce(() =>
    llm('你是一位专业的学术关键词提取助手。', keywordsPrompt, { temperature: 0.3, maxTokens: 120 }),
  )
  assembledMarkdown = appendMarkdown(assembledMarkdown, `${keywordsHeading}\n\n${keywords.trim()}`)
  emit('关键词已生成')

  // ── Step 8–N: Sections ───────────────────────────────────────────────────
  for (const sectionPlan of paperPlan.sections) {
    assertNotCancelled(params.isCancelled)
    // Section thinking
    let thinking = ''
    if (!params.skipSectionThinking) {
      emit(`正在推理章节：${sectionPlan.title}`)
      const thinkingPrompt = buildSectionThinkingPrompt({
        topic: params.topic,
        language,
        paperType: params.paperType,
        extraContext: params.extraContext,
        sectionPlan,
        previousMarkdown: assembledMarkdown,
      })
      thinking = await retryOnce(() =>
        llm(thinkingPrompt.systemPrompt, thinkingPrompt.userPrompt, { temperature: 0.4, maxTokens: 1200 }),
      )
    }

    // Section body
    emit(`正在生成章节正文：${sectionPlan.title}${citationMode === 'inline' ? '（边写边引）' : '（先写后引）'}`)
    const contentPrompt = buildSectionContentPrompt({
      topic: params.topic,
      language,
      paperType: params.paperType,
      extraContext: params.extraContext,
      sectionPlan,
      previousMarkdown: assembledMarkdown,
      title,
      citationMode,
      referenceContext,
    })
    const contentUserPrompt = thinking.trim()
      ? `${contentPrompt.userPrompt}\n\nPlanning notes for this section:\n${thinking.trim()}`
      : contentPrompt.userPrompt

    const sectionBody = await retryOnce(() =>
      llm(contentPrompt.systemPrompt, contentUserPrompt, { temperature: 0.55, maxTokens: 2400 }),
    )

    const normalized = `## ${sectionPlan.title}\n\n${stripMarkdownHeading(sectionBody)}`
    assembledMarkdown = appendMarkdown(assembledMarkdown, normalized)
    emit(`章节 ${sectionPlan.title} 已完成`, assembledMarkdown)
  }

  // ── Conclusion ───────────────────────────────────────────────────────────
  const conclusionTitle = language === 'zh' ? '结论' : 'Conclusion'
  emit(`正在推理结论章节`)

  assertNotCancelled(params.isCancelled)
  const conclusionThinkingPlan: SectionPlan = {
    title: conclusionTitle,
    description: 'Summarize findings and suggest future research directions.',
    importance: 4,
    plannedFigureCount: 0,
  }

  let conclusionThinking = ''
  if (!params.skipSectionThinking) {
    const thinkingPrompt = buildSectionThinkingPrompt({
      topic: params.topic,
      language,
      paperType: params.paperType,
      extraContext: params.extraContext,
      sectionPlan: conclusionThinkingPlan,
      previousMarkdown: assembledMarkdown,
    })
    conclusionThinking = await retryOnce(() =>
      llm(thinkingPrompt.systemPrompt, thinkingPrompt.userPrompt, { temperature: 0.4, maxTokens: 800 }),
    )
  }

  const conclusionPrompt = buildConclusionPrompt({
    topic: params.topic,
    language,
    paperType: params.paperType,
    extraContext: params.extraContext,
    previousMarkdown: assembledMarkdown,
    title,
    citationMode,
    referenceContext,
  })
  const conclusionUserPrompt = conclusionThinking.trim()
    ? `${conclusionPrompt.userPrompt}\n\nPlanning notes:\n${conclusionThinking.trim()}`
    : conclusionPrompt.userPrompt
  const conclusionBody = await retryOnce(() =>
    llm(conclusionPrompt.systemPrompt, conclusionUserPrompt, { temperature: 0.5, maxTokens: 1200 }),
  )

  assembledMarkdown = appendMarkdown(assembledMarkdown, `## ${conclusionTitle}\n\n${stripMarkdownHeading(conclusionBody)}`)
  emit('结论章节已完成', assembledMarkdown)

  // ── Reference list ───────────────────────────────────────────────────────
  const refHeading = language === 'zh' ? '## 参考文献' : '## References'
  if (references.length > 0) {
    assertNotCancelled(params.isCancelled)
    emit('正在整理参考文献')
    const refList = formatReferenceList(references)
    assembledMarkdown = appendMarkdown(assembledMarkdown, `${refHeading}\n\n${refList}`)
  } else {
    assembledMarkdown = appendMarkdown(assembledMarkdown, `${refHeading}\n\n[1] （此处自动整理本文引用的文献，如需精准引用请手动补充。）`)
  }

  emit('论文生成完成，正在转换为 HTML…')
  assertNotCancelled(params.isCancelled)

  const html = markdownToHtml(assembledMarkdown)
  const outline = paperPlan.sections.map((s) => s.title)
  const sections = extractSectionArtifacts(assembledMarkdown)
  const citationStatus = buildCitationStatus(assembledMarkdown, references, citationMode)
  const referencesSidecar = buildReferencesSidecar(references)
  const artifact: PaperArtifact = {
    type: 'paper',
    boundary: 'paper-result',
    title,
    paperType: params.paperType,
    markdown: assembledMarkdown,
    html,
    outline,
    sections,
    referencesSidecar,
    citationStatus,
    sourceRuntime: 'electron-compatible-nftcore',
  }

  return {
    title,
    markdown: assembledMarkdown,
    html,
    paperType: params.paperType,
    references,
    outline,
    sections,
    citationStatus,
    referencesSidecar,
    artifact,
    diagnostics: {
      chain: 'electron-compatible-nftcore',
      steps,
      partialMissing: [...PAPER_NFTCORE_PARTIAL_MISSING],
    },
  }
}
