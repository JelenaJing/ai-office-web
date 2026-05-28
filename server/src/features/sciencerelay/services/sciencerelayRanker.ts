import type {
  ArticleCandidate,
  DedupeMode,
  RankedScienceRelayArticle,
  ScienceRelayRankBreakdown,
  ScienceRelayRecoContext,
} from '../types'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
}

function subscriptionBoost(candidate: ArticleCandidate, queries: string[]): number {
  if (!queries.length) return 0
  const blob = normalizeText(
    `${candidate.title} ${candidate.oneLineSummary ?? ''} ${(candidate.subjects ?? []).join(' ')}`,
  )
  let hits = 0
  for (const q of queries) {
    const tokens = tokenizeQuery(q)
    if (tokens.length === 0) continue
    if (tokens.some((t) => blob.includes(t))) hits += 1
  }
  return Math.min(0.12, hits * 0.03)
}

function subjectOverlap(candidate: ArticleCandidate, topic: string): number {
  if (!topic) return 0
  const subj = (candidate.subjects ?? []).map(normalizeText)
  if (subj.length === 0) return 0
  const t = normalizeText(topic)
  const direct = subj.some((s) => s.includes(t) || t.includes(s))
  return direct ? 0.18 : 0
}

function freshnessScore(publishedDate?: string): number {
  if (!publishedDate) return 0
  const ts = Date.parse(publishedDate)
  if (!Number.isFinite(ts)) return 0
  const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24)
  // half-life ~ 45 days
  const halfLife = 45
  const decay = Math.pow(0.5, ageDays / halfLife)
  return 0.15 * clamp01(decay)
}

function qualitySignals(candidate: ArticleCandidate): number {
  let score = 0
  if (candidate.doi) score += 0.05
  if (candidate.citation) score += 0.04
  if ((candidate.subjects ?? []).length > 0) score += 0.03
  if (candidate.oneLineSummary) score += 0.02
  return Math.min(0.12, score)
}

function topicMatch(candidate: ArticleCandidate, topic: string): number {
  if (!topic) return 0
  return normalizeText(candidate.topic) === normalizeText(topic) ? 0.35 : 0
}

function servedPenalty(candidate: ArticleCandidate, served: Set<string>, strength: number): number {
  if (!served.size) return 0
  if (!served.has(candidate.id)) return 0
  const s = Number.isFinite(strength) ? strength : 0.08
  return -Math.max(0, Math.min(0.2, s))
}

function dedupeKey(candidate: ArticleCandidate, mode: DedupeMode): string {
  if (mode === 'doi') return candidate.doi ? normalizeText(candidate.doi) : `id:${candidate.id}`
  if (mode === 'id') return `id:${candidate.id}`
  return ''
}

function scoreCandidate(
  candidate: ArticleCandidate,
  ctx: ScienceRelayRecoContext,
): ScienceRelayRankBreakdown {
  const topic = String(ctx.topic ?? '').trim()
  const subQueries = Array.isArray(ctx.subscriptionQueries) ? ctx.subscriptionQueries : []
  const served = new Set((ctx.servedArticleIds ?? []).map(String))
  const servedStrength = Number(ctx.servedPenaltyStrength ?? 0.08)

  const t = topicMatch(candidate, topic)
  const s = subjectOverlap(candidate, topic)
  const f = freshnessScore(candidate.publishedDate)
  const q = qualitySignals(candidate)
  const sub = subscriptionBoost(candidate, subQueries)
  const sp = servedPenalty(candidate, served, servedStrength)
  const total = t + s + f + q + sub + sp

  return {
    topicMatch: t,
    subjectOverlap: s,
    freshness: f,
    qualitySignals: q,
    subscriptionBoost: sub,
    servedPenalty: sp,
    total,
  }
}

export function rankScienceRelayArticles(
  candidates: ArticleCandidate[],
  ctx: ScienceRelayRecoContext,
): RankedScienceRelayArticle[] {
  const topK = typeof ctx.topK === 'number' && ctx.topK > 0 ? Math.min(ctx.topK, 200) : candidates.length
  const dedupeMode: DedupeMode = ctx.dedupeMode ?? 'none'
  const seen = new Set<string>()

  const scored: RankedScienceRelayArticle[] = []
  for (const candidate of candidates) {
    if (!candidate || !candidate.id) continue
    if (dedupeMode !== 'none') {
      const key = dedupeKey(candidate, dedupeMode)
      if (key && seen.has(key)) continue
      if (key) seen.add(key)
    }
    const rankBreakdown = scoreCandidate(candidate, ctx)
    scored.push({ ...candidate, rankScore: rankBreakdown.total, rankBreakdown })
  }

  scored.sort((a, b) => b.rankScore - a.rankScore)
  return scored.slice(0, topK)
}

