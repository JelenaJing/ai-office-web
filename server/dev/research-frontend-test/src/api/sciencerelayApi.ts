import { getApiEntryMode, getAuthToken } from './apiBase'

export interface ScienceRelayTopicCount {
  topic: string
  count: number
}

export interface ArticleCandidate {
  id: string
  title: string
  topic: string
  publishedDate?: string
  oneLineSummary?: string
  thumb?: string
  authors?: string[]
  doi?: string
  citation?: string
  journal?: string
  subjects?: string[]
}

export interface RankBreakdown {
  topicMatch: number
  subjectOverlap: number
  freshness: number
  qualitySignals: number
  subscriptionBoost: number
  servedPenalty: number
  total: number
}

export interface RankedArticle extends ArticleCandidate {
  rankScore: number
  rankBreakdown: RankBreakdown
}

export interface ExplainItem {
  id: string
  whyRecommended: string
  nextRead: string
  recommendedKeywords?: string[]
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function srJson<T>(path: string, init?: RequestInit): Promise<T> {
  const mode = getApiEntryMode()
  if (mode !== 'bff') {
    throw new Error('ScienceRelay 推荐仅通过 BFF 使用（需要鉴权与 LLM）。')
  }
  const url = path.startsWith('/api') ? path : `/api/sciencerelay${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  const text = await res.text()
  let body: any = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!res.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || text || res.statusText)
  }
  return body as T
}

export async function listScienceRelayTopics(): Promise<ScienceRelayTopicCount[]> {
  const out = await srJson<{ topics: ScienceRelayTopicCount[] }>('/topics', { method: 'GET' as any })
  return out.topics ?? []
}

export async function listScienceRelayArticles(params: {
  topic?: string
  limit?: number
  includeDetails?: boolean
}): Promise<ArticleCandidate[]> {
  const search = new URLSearchParams()
  search.set('topic', params.topic?.trim() || 'all')
  search.set('limit', String(params.limit ?? 80))
  if (params.includeDetails) search.set('includeDetails', '1')
  const out = await srJson<{ articles: ArticleCandidate[] }>(`/articles?${search.toString()}`, {
    method: 'GET' as any,
  })
  return out.articles ?? []
}

export async function rankScienceRelayArticles(params: {
  topic?: string
  candidates: ArticleCandidate[]
  subscriptionQueries?: string[]
  servedArticleIds?: string[]
  topK?: number
  dedupeMode?: 'none' | 'id' | 'doi'
  servedPenaltyStrength?: number
}): Promise<RankedArticle[]> {
  const out = await srJson<{ articles: RankedArticle[] }>('/reco/rank', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return out.articles ?? []
}

export async function invalidateScienceRelayCache(): Promise<void> {
  await srJson('/sync', { method: 'POST' })
}

export async function explainScienceRelayReco(params: {
  topic?: string
  articles: ArticleCandidate[]
}): Promise<ExplainItem[]> {
  const out = await srJson<{ items: ExplainItem[] }>('/reco/explain', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return out.items ?? []
}

const SERVED_KEY = 'aios_sciencerelay_served_article_ids'

export function loadServedArticleIds(): string[] {
  try {
    const raw = localStorage.getItem(SERVED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function appendServedArticleIds(ids: string[]) {
  const prev = new Set(loadServedArticleIds())
  for (const id of ids) prev.add(id)
  localStorage.setItem(SERVED_KEY, JSON.stringify([...prev].slice(-400)))
}

