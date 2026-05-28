import { invokeLlmJson, isLlmConfigured, type LlmMessage } from '../../../modules/ai-gateway'
import type { ArticleCandidate } from '../types'

export interface ScienceRelayExplainItem {
  id: string
  whyRecommended: string
  nextRead: string
  recommendedKeywords?: string[]
}

export interface ScienceRelayExplainResult {
  topic?: string
  items: ScienceRelayExplainItem[]
}

function buildMessages(topic: string, articles: ArticleCandidate[]): LlmMessage[] {
  const payload = articles.map((a) => ({
    id: a.id,
    title: a.title,
    topic: a.topic,
    publishedDate: a.publishedDate,
    subjects: a.subjects ?? [],
    oneLineSummary: a.oneLineSummary ?? '',
    citation: a.citation ?? '',
    doi: a.doi ?? '',
  }))

  const user = `你在为 AI for Science 测试版主页做“学科文章推荐”。\n\n目标学科：${topic || '未指定'}\n\n请对下面每篇文章输出推荐说明（简短、可读）。\n\n文章列表 JSON：\n${JSON.stringify(payload, null, 2)}\n\n返回 JSON 格式：\n{\n  \"items\": [\n    {\n      \"id\": \"<same id>\",\n      \"whyRecommended\": \"1-2 句：为什么推荐（结合学科、主题、重要性）\",\n      \"nextRead\": \"1-2 句：建议读者下一步怎么看/查什么（可给关键词或角度）\",\n      \"recommendedKeywords\": [\"keyword1\",\"keyword2\"]\n    }\n  ]\n}\n\n约束：只输出 JSON；不要 markdown；items 顺序与输入一致；字段都要有（keywords 可空数组）。`

  return [
    {
      role: 'system',
      content:
        'You are a helpful scientific editor. Output ONLY valid JSON matching the requested schema.',
    },
    { role: 'user', content: user },
  ]
}

export async function explainRecommendations(params: {
  topic?: string
  articles: ArticleCandidate[]
}): Promise<ScienceRelayExplainResult> {
  const topic = String(params.topic ?? '').trim()
  const articles = params.articles ?? []
  if (articles.length === 0) return { topic, items: [] }

  if (!isLlmConfigured()) {
    // graceful fallback
    return {
      topic,
      items: articles.map((a) => ({
        id: a.id,
        whyRecommended: 'LLM 未配置，暂仅展示规则推荐结果。',
        nextRead: '可先阅读摘要与关键词，再查看引用与相近主题文章。',
        recommendedKeywords: (a.subjects ?? []).slice(0, 3),
      })),
    }
  }

  const messages = buildMessages(topic, articles.slice(0, 12))
  const out = await invokeLlmJson<{ items?: Array<Partial<ScienceRelayExplainItem>> }>(messages, {
    temperature: 0.3,
    maxTokens: 2500,
    timeoutMs: 60_000,
  })

  const itemsRaw = Array.isArray(out.items) ? out.items : []
  const byId = new Map(itemsRaw.map((x) => [String(x.id ?? ''), x]))
  const items: ScienceRelayExplainItem[] = articles.slice(0, 12).map((a) => {
    const hit = byId.get(a.id) ?? {}
    return {
      id: a.id,
      whyRecommended: String(hit.whyRecommended ?? '').trim() || '推荐理由生成失败（已降级）。',
      nextRead: String(hit.nextRead ?? '').trim() || '建议查看摘要、方法与关键实验设置。',
      recommendedKeywords: Array.isArray(hit.recommendedKeywords)
        ? hit.recommendedKeywords.map(String).filter(Boolean).slice(0, 6)
        : (a.subjects ?? []).slice(0, 3),
    }
  })

  return { topic, items }
}

