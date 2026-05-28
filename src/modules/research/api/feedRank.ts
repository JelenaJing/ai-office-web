import { getAuthToken } from './apiBase'
import type { ResearchIdeaCard } from '../types'

export interface FeedRankScoreBreakdown {
  fieldMatch: number
  novelty: number
  feasibility: number
  evidence: number
  paperRelevance: number
  riskAdjust: number
  subscriptionBoost: number
  servedPenalty: number
  total: number
}

export interface RankedResearchIdea extends ResearchIdeaCard {
  rankScore: number
  rankBreakdown: FeedRankScoreBreakdown
}

export interface RankFeedParams {
  ideas: ResearchIdeaCard[]
  field: string
  servedIdeaIds?: string[]
  subscriptionQueries?: string[]
  topK?: number
}

export interface RankFeedResult {
  success: boolean
  ideas: RankedResearchIdea[]
  ranking?: {
    algorithm: string
    inspiredBy?: string
    candidateCount: number
    returnedCount: number
  }
  error?: string
}

/** Always uses Express BFF — independent of FastAPI v2 idea entry mode. */
export async function rankFeed(params: RankFeedParams): Promise<RankFeedResult> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch('/api/research/feed/rank', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ideas: params.ideas,
      field: params.field,
      servedIdeaIds: params.servedIdeaIds,
      subscriptionQueries: params.subscriptionQueries,
      topK: params.topK,
    }),
  })

  const text = await res.text()
  let body: RankFeedResult = { success: false, ideas: [] }
  try {
    body = JSON.parse(text) as RankFeedResult
  } catch {
    throw new Error(text || res.statusText)
  }
  if (!res.ok || body.success === false) {
    throw new Error(body.error || text || res.statusText)
  }
  return body
}

const SERVED_KEY = 'research_test_served_idea_ids'

export function loadServedIdeaIds(): string[] {
  try {
    const raw = localStorage.getItem(SERVED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function appendServedIdeaIds(ids: string[]) {
  const prev = new Set(loadServedIdeaIds())
  for (const id of ids) prev.add(id)
  localStorage.setItem(SERVED_KEY, JSON.stringify([...prev].slice(-200)))
}
