import { invokeLlmJson, isLlmConfigured } from '../../../modules/ai-gateway'
import type { GeneratedSlidePlan, SlidePlanItem } from './simplePptx'
import { normalizeGeneratedSlidePlan } from './simplePptx'

function clampText(text: string, max: number): string {
  const value = String(text || '').trim()
  if (!value) return ''
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}

function parseRequestedContentSlideCount(prompt: string): number {
  const match = String(prompt || '').match(/(\d+)\s*页/)
  if (!match) return 4
  const parsed = Number.parseInt(match[1], 10)
  if (!Number.isFinite(parsed)) return 4
  return Math.max(3, Math.min(5, parsed - 2))
}

function buildLeiFengMonthSections(): Array<{ title: string; items: string[] }> {
  return [
    {
      title: '活动背景与意义',
      items: [
        '传承雷锋精神，弘扬助人为乐风尚',
        '结合三月学雷锋月开展主题教育',
        '引导师生参与志愿服务实践',
      ],
    },
    {
      title: '活动目标',
      items: [
        '普及雷锋事迹与新时代内涵',
        '组织校内志愿服务与结对帮扶',
        '评选表彰优秀志愿者与班级',
      ],
    },
    {
      title: '主要安排',
      items: [
        '启动仪式：主题宣讲与倡议签名',
        '志愿实践：社区服务、校园清洁',
        '主题班会：故事分享与心得交流',
      ],
    },
    {
      title: '组织保障',
      items: [
        '成立活动领导小组与联络人',
        '明确时间节点与责任分工',
        '做好宣传报道与安全预案',
      ],
    },
    {
      title: '预期成效',
      items: [
        '提升学生社会责任与参与感',
        '形成可复制的志愿服务案例',
        '营造崇德向善的校园文化氛围',
      ],
    },
  ]
}

function buildGenericSections(topic: string, count: number): Array<{ title: string; items: string[] }> {
  const seed = topic
    .split(/[，,。；;\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .slice(0, 8)

  const base = [
    ...(seed.length > 0 ? seed : []),
    `${topic}的背景与现状`,
    `${topic}的核心内涵`,
    `${topic}的活动设计`,
    `${topic}的组织实施`,
    `${topic}的成果评估`,
    `${topic}的总结展望`,
  ]

  return base.slice(0, count).map((segment, index) => ({
    title: clampText(segment, 18) || `第 ${index + 1} 部分`,
    items: [
      clampText(`${segment}：现状与背景`, 22),
      clampText(`${segment}：关键举措`, 22),
      clampText(`${segment}：预期效果`, 22),
    ],
  }))
}

function inferSectionsFromTopic(topic: string, count: number): Array<{ title: string; items: string[] }> {
  const normalized = topic.toLowerCase()
  if (/学雷锋|雷锋|雷锋月|lei\s*feng/.test(normalized)) {
    return buildLeiFengMonthSections().slice(0, count)
  }
  return buildGenericSections(topic, count)
}

export function buildHeuristicSlidevPlanFromPrompt(title: string, prompt: string): GeneratedSlidePlan {
  const topic = prompt.trim() || title.trim() || '演示文稿'
  const deckTitle = clampText(title.trim() || topic.slice(0, 24), 24) || '演示文稿'
  const contentCount = parseRequestedContentSlideCount(prompt)
  const sections = inferSectionsFromTopic(topic, contentCount)
  const tocItems = sections.map((section) => section.title)

  const slides: SlidePlanItem[] = [
    {
      type: 'cover',
      title: deckTitle,
      subtitle: clampText(topic, 32),
    },
    {
      type: 'toc',
      title: '目录',
      items: tocItems,
    },
    ...sections.map((section) => ({
      type: 'content' as const,
      title: section.title,
      items: section.items.map((item) => clampText(item, 22)),
    })),
    {
      type: 'summary',
      title: '谢谢',
      subtitle: '欢迎交流 · Q & A',
    },
  ]

  return { title: deckTitle, slides }
}

const SLIDEV_LLM_SYSTEM_PROMPT = [
  '你是 Slidev 网页演示文稿策划专家。根据用户主题生成结构化 JSON，供 Slidev 渲染。',
  '输出格式：{ "title": string, "slides": [{ "type": "cover"|"toc"|"content"|"summary", "title": string, "subtitle"?: string, "items"?: string[] }] }',
  '页结构必须为：1 页 cover + 1 页 toc + 3~5 页 content + 1 页 summary（共 6~8 页）。',
  '内容必须紧扣用户 prompt 主题，禁止输出「要点一」「由 AI 自动生成」「后续可接入」等占位语。',
  '排版约束：title ≤18 字；subtitle ≤32 字；每页 items 3~5 条，每条 ≤22 字；仅纯文本，无 Markdown/HTML。',
  'cover 的 subtitle 写活动/汇报摘要；toc 的 items 为各 content 页标题；summary 可写致谢与联系方式。',
].join('\n')

function hasBadText(value: unknown): boolean {
  const text = String(value || '').trim()
  return /^(undefined|null|nan)$/i.test(text)
    || /要点[一二三四五]|由 AI|后续可接入|AI Office Web/i.test(text)
}

function isUsableSlidevPlan(plan: GeneratedSlidePlan): boolean {
  const slides = Array.isArray(plan.slides) ? plan.slides : []
  if (slides.length < 6 || slides.length > 8) return false
  const contentSlides = slides.filter((slide) => slide.type === 'content')
  if (contentSlides.length < 3) return false
  return slides.every((slide, index) => {
    if (!slide.type || hasBadText(slide.title) || hasBadText(slide.subtitle)) return false
    if (index > 1 && (!slide.title || !String(slide.title).trim())) return false
    if (slide.type === 'content') {
      const items = Array.isArray(slide.items) ? slide.items : []
      if (items.length < 3) return false
      return items.every((item) => !hasBadText(item) && String(item || '').trim().length >= 4)
    }
    if (slide.type === 'toc') {
      return Array.isArray(slide.items) && slide.items.length >= 3 && slide.items.every((item) => !hasBadText(item))
    }
    return true
  })
}

export async function buildSlidevPlanFromPrompt(title: string, prompt: string): Promise<GeneratedSlidePlan> {
  const heuristic = buildHeuristicSlidevPlanFromPrompt(title, prompt)

  if (!isLlmConfigured() || !prompt.trim()) {
    console.info('[slidev-plan] using heuristic plan (llm unavailable or empty prompt)')
    return heuristic
  }

  try {
    const plan = await invokeLlmJson<GeneratedSlidePlan>(
      [
        { role: 'system', content: SLIDEV_LLM_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            title: title.trim() || prompt.slice(0, 24),
            prompt: prompt.trim(),
            audience: '校园/机关汇报',
            language: 'zh-CN',
          }),
        },
      ],
      { temperature: 0.5, maxTokens: 4096 },
    )
    if (plan?.slides?.length) {
      const normalized = normalizeGeneratedSlidePlan(plan, heuristic, title)
      if (isUsableSlidevPlan(normalized)) {
        console.info('[slidev-plan] using llm plan', { slides: normalized.slides.length })
        return normalized
      }
      console.info('[slidev-plan] llm plan rejected due to sparse/invalid content, using heuristic', {
        slides: normalized.slides.length,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[slidev-plan] llm failed: ${message}`)
  }

  return heuristic
}
