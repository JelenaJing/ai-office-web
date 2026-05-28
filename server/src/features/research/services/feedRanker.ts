/**
 * Rule-based feed ranker (Phase A — inspired by X candidate-pipeline scoring).
 * Ranks ResearchIdeaCard candidates without Phoenix weights.
 */

import type { ResearchIdeaCard, ResearchRiskLevel } from '../types'

export interface FeedRankUserContext {
  /** Active research field label, e.g. "AI for Science" */
  field?: string
  /** Idea ids already shown in this session (served history) */
  servedIdeaIds?: string[]
  /** Enabled subscription queries — soft keyword boost */
  subscriptionQueries?: string[]
  topK?: number
}

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

const RISK_ADJUST: Record<ResearchRiskLevel, number> = {
  low: 0.05,
  medium: 0.02,
  high: -0.05,
}

function normalizeField(s: string): string {
  return s.trim().toLowerCase()
}

function titleFingerprint(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80)
}

function subscriptionBoost(idea: ResearchIdeaCard, queries: string[]): number {
  if (!queries.length) return 0
  const blob = `${idea.title} ${idea.coreObservation} ${idea.hypothesis}`.toLowerCase()
  let hits = 0
  for (const q of queries) {
    const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 3)
    if (tokens.some((t) => blob.includes(t))) hits += 1
  }
  return Math.min(0.08, hits * 0.03)
}

function scoreIdea(idea: ResearchIdeaCard, ctx: FeedRankUserContext): FeedRankScoreBreakdown {
  const targetField = ctx.field?.trim() ?? ''
  const fieldMatch =
    targetField && normalizeField(idea.field) === normalizeField(targetField) ? 0.35 : 0
  const novelty = 0.25 * Math.max(0, Math.min(1, idea.noveltyScore))
  const feasibility = 0.2 * Math.max(0, Math.min(1, idea.feasibilityScore))
  const evidence = 0.1 * Math.min(1, (idea.sourcePapers?.length ?? 0) / 3)
  const paperRelevance =
    idea.sourcePapers?.length > 0
      ? 0.1 *
        (idea.sourcePapers.reduce((s, p) => s + (p.relevanceScore ?? 0.5), 0) /
          idea.sourcePapers.length)
      : 0
  const riskAdjust = RISK_ADJUST[idea.riskLevel] ?? 0
  const subBoost = subscriptionBoost(idea, ctx.subscriptionQueries ?? [])
  const served = new Set(ctx.servedIdeaIds ?? [])
  const servedPenalty = served.has(idea.id) ? -0.4 : 0

  const total =
    fieldMatch + novelty + feasibility + evidence + paperRelevance + riskAdjust + subBoost + servedPenalty

  return {
    fieldMatch,
    novelty,
    feasibility,
    evidence,
    paperRelevance,
    riskAdjust,
    subscriptionBoost: subBoost,
    servedPenalty,
    total,
  }
}

export function rankResearchFeed(
  candidates: ResearchIdeaCard[],
  ctx: FeedRankUserContext,
): RankedResearchIdea[] {
  const topK = ctx.topK ?? candidates.length
  const seenTitles = new Set<string>()

  const scored: RankedResearchIdea[] = []
  for (const idea of candidates) {
    const fp = titleFingerprint(idea.title)
    if (seenTitles.has(fp)) continue
    seenTitles.add(fp)

    const rankBreakdown = scoreIdea(idea, ctx)
    scored.push({
      ...idea,
      rankScore: rankBreakdown.total,
      rankBreakdown,
    })
  }

  scored.sort((a, b) => b.rankScore - a.rankScore)
  return scored.slice(0, topK)
}
