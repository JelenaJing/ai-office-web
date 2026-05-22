/**
 * paperStructurePlanner.ts — Web server port of electron/main/services/paperStructurePlanner.ts
 *
 * Replaces Electron llmClient.completeText(settings, ...) with server invokeLlmText(messages, opts).
 */

import { invokeLlmText } from '../../../modules/ai-gateway'
import type { ReferenceItem } from './openAlexClient'

export interface SectionPlan {
  title: string
  description: string
  importance: number
  plannedFigureCount: number
}

export interface PaperPlan {
  topic: string
  paperType: 'review' | 'research' | 'thesis_research'
  planMode: 'fixed' | 'dynamic'
  sections: SectionPlan[]
  totalPlannedFigures: number
}

function buildFixedResearchSections(language: 'zh' | 'en'): SectionPlan[] {
  if (language === 'zh') {
    return [
      { title: '引言', description: '交代研究背景、问题提出、研究意义与相关文献基础。', importance: 5, plannedFigureCount: 0 },
      { title: '相关研究', description: '系统梳理已有相关研究，分析研究现状与不足。', importance: 4, plannedFigureCount: 0 },
      { title: '研究方法 / 分析框架', description: '说明研究方法、实验设计、关键参数与分析流程。', importance: 4, plannedFigureCount: 0 },
      { title: '结果或分析', description: '展示结果数据与关键发现，与既有研究对照。', importance: 5, plannedFigureCount: 0 },
      { title: '讨论', description: '深入讨论结果的意义、局限与影响。', importance: 4, plannedFigureCount: 0 },
    ]
  }
  return [
    { title: 'Introduction', description: 'Research background, problem definition, significance.', importance: 5, plannedFigureCount: 0 },
    { title: 'Related Work', description: 'Systematic review of existing research.', importance: 4, plannedFigureCount: 0 },
    { title: 'Methodology', description: 'Research methods, experimental design, analysis framework.', importance: 4, plannedFigureCount: 0 },
    { title: 'Results and Analysis', description: 'Experimental results, key findings.', importance: 5, plannedFigureCount: 0 },
    { title: 'Discussion', description: 'Significance, limitations, and implications.', importance: 4, plannedFigureCount: 0 },
  ]
}

function buildFixedReviewSections(language: 'zh' | 'en'): SectionPlan[] {
  if (language === 'zh') {
    return [
      { title: '引言', description: '综述范围与重要性说明。', importance: 5, plannedFigureCount: 0 },
      { title: '文献检索与筛选说明', description: '说明文献来源、检索策略与纳入标准。', importance: 3, plannedFigureCount: 0 },
      { title: '研究脉络', description: '按时间和主题演进梳理研究发展历程。', importance: 5, plannedFigureCount: 0 },
      { title: '主要观点 / 主题分类', description: '按研究主题对文献进行系统分类与综合。', importance: 5, plannedFigureCount: 0 },
      { title: '代表性研究', description: '重点概括核心观点、方法和贡献。', importance: 4, plannedFigureCount: 0 },
      { title: '争议与不足', description: '总结主要分歧、限制与研究空白。', importance: 4, plannedFigureCount: 0 },
      { title: '未来研究方向', description: '提出后续研究建议与潜在突破点。', importance: 4, plannedFigureCount: 0 },
    ]
  }
  return [
    { title: 'Introduction', description: 'Scope and significance of the review.', importance: 5, plannedFigureCount: 0 },
    { title: 'Literature Search and Screening', description: 'Data sources, search strategy, inclusion criteria.', importance: 3, plannedFigureCount: 0 },
    { title: 'Research Trajectory', description: 'Chronological and thematic evolution.', importance: 5, plannedFigureCount: 0 },
    { title: 'Thematic Classification', description: 'Systematic classification and synthesis.', importance: 5, plannedFigureCount: 0 },
    { title: 'Representative Studies', description: 'Core contributions and methods.', importance: 4, plannedFigureCount: 0 },
    { title: 'Controversies and Gaps', description: 'Disagreements, limitations, and research gaps.', importance: 4, plannedFigureCount: 0 },
    { title: 'Future Directions', description: 'Recommendations and potential breakthroughs.', importance: 4, plannedFigureCount: 0 },
  ]
}

export async function buildPaperPlanDynamic(
  params: { topic: string; paperType: 'review' | 'research' | 'thesis_research'; language: 'zh' | 'en'; extraContext?: string },
  references: ReferenceItem[],
): Promise<PaperPlan> {
  const { topic, paperType, language, extraContext } = params

  const referenceContext = references
    .slice(0, 6)
    .map((ref, idx) => `[${idx + 1}] ${ref.title} (${ref.year ?? 'n.d.'})`)
    .join('\n')

  const paperTypeLabel = paperType === 'review' ? '综述论文' : paperType === 'thesis_research' ? '学位论文' : '研究文章'
  const languageInstruction = language === 'zh' ? '所有章节标题必须使用简体中文。' : 'All section titles must be in English.'

  const systemPrompt = paperType === 'review'
    ? '你是一位学术综述论文结构规划专家，擅长设计主题驱动的章节结构。'
    : '你是一位科学研究论文结构规划专家，擅长为创新研究设计清晰逻辑的章节结构。'

  const userPrompt = `请为以下${paperTypeLabel}设计章节结构（4-8个主体章节，不含摘要和结论）。

主题：${topic}
语言：${language === 'zh' ? '中文' : 'English'}
${extraContext ? `补充上下文：${extraContext}` : ''}
${referenceContext ? `参考文献样本：\n${referenceContext}` : ''}

要求：
1. ${languageInstruction}
2. 输出4-8个主体章节
3. 每个章节包含：title（章节标题）、description（1-2句描述）、importance（1-5）

严格输出 JSON 格式：
{"sections": [{"title": "...", "description": "...", "importance": 4}, ...]}

请生成章节结构：`

  try {
    const response = await invokeLlmText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 1600 },
    )

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no JSON in response')

    const parsed = JSON.parse(jsonMatch[0]) as { sections?: SectionPlan[] }
    const rawSections = Array.isArray(parsed.sections) ? parsed.sections : []
    if (rawSections.length < 4) throw new Error(`only ${rawSections.length} sections`)

    const sections: SectionPlan[] = rawSections.slice(0, 8).map((s) => ({
      title: String(s.title || '').trim(),
      description: String(s.description || '').trim(),
      importance: Math.max(1, Math.min(5, Number(s.importance) || 3)),
      plannedFigureCount: 0,
    })).filter((s) => s.title)

    return { topic, paperType, planMode: 'dynamic', sections, totalPlannedFigures: 0 }
  } catch (error) {
    console.warn('[paperStructurePlanner] dynamic planning failed, using fixed fallback:', error instanceof Error ? error.message : error)
    const sections = paperType === 'review' ? buildFixedReviewSections(language) : buildFixedResearchSections(language)
    return { topic, paperType, planMode: 'fixed', sections, totalPlannedFigures: 0 }
  }
}
