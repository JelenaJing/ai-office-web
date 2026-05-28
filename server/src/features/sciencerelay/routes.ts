import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import { listScienceRelayCandidates, listScienceRelayTopics } from './services/sciencerelayDataSource'
import { rankScienceRelayArticles } from './services/sciencerelayRanker'
import { explainRecommendations } from './services/sciencerelayExplain'
import type { ArticleCandidate, RankScienceRelayResponse, ScienceRelayRecoContext } from './types'

const router = Router()

const PARTIAL_MISSING = [
  'Explain is best-effort; falls back when LLM not configured',
  'Use POST /api/sciencerelay/sync after updating remote sciencerelay data',
]

router.get('/articles', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const topic = typeof req.query.topic === 'string' ? req.query.topic : undefined
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 60
  const includeDetails = req.query.includeDetails === '1' || req.query.includeDetails === 'true'

  try {
    const out = await listScienceRelayCandidates({
      topic,
      limit: Number.isFinite(limit) ? limit : 60,
      includeDetails,
    })
    res.json({
      success: true,
      topic: topic ?? 'all',
      total: out.total,
      returned: out.rows.length,
      articles: out.rows,
      partialMissing: PARTIAL_MISSING,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.post('/sync', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const { invalidateScienceRelayCache } = await import('./services/sciencerelayDataSource')
    invalidateScienceRelayCache()
    res.json({ success: true, message: 'cache invalidated; reload manifest on next request' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.get('/topics', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  try {
    const topics = await listScienceRelayTopics()
    res.json({ success: true, topics, count: topics.length, partialMissing: PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.post('/reco/rank', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const topic = typeof req.body?.topic === 'string' ? req.body.topic : undefined
  const candidates = Array.isArray(req.body?.candidates) ? (req.body.candidates as ArticleCandidate[]) : null
  const subscriptionQueries = Array.isArray(req.body?.subscriptionQueries)
    ? (req.body.subscriptionQueries as string[]).map(String)
    : []
  const servedArticleIds = Array.isArray(req.body?.servedArticleIds)
    ? (req.body.servedArticleIds as string[]).map(String)
    : []
  const topK = typeof req.body?.topK === 'number' ? Number(req.body.topK) : undefined
  const dedupeMode =
    req.body?.dedupeMode === 'id' || req.body?.dedupeMode === 'doi' ? req.body.dedupeMode : 'none'
  const servedPenaltyStrength =
    typeof req.body?.servedPenaltyStrength === 'number'
      ? Number(req.body.servedPenaltyStrength)
      : undefined

  if (!candidates || candidates.length === 0) {
    res.status(400).json({ success: false, error: 'candidates 数组不能为空' })
    return
  }

  const ctx: ScienceRelayRecoContext = {
    topic,
    subscriptionQueries,
    servedArticleIds,
    topK,
    dedupeMode,
    servedPenaltyStrength,
  }

  const ranked = rankScienceRelayArticles(candidates, ctx)
  const body: RankScienceRelayResponse = {
    success: true,
    topic,
    candidateCount: candidates.length,
    returnedCount: ranked.length,
    algorithm: 'rule-based-v1',
    inspiredBy: 'x-algorithm candidate-pipeline (Phase A)',
    articles: ranked,
    partialMissing: PARTIAL_MISSING,
  }
  res.json(body)
})

router.post('/reco/explain', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const topic = typeof req.body?.topic === 'string' ? req.body.topic : undefined
  const articles = Array.isArray(req.body?.articles) ? (req.body.articles as ArticleCandidate[]) : null

  if (!articles || articles.length === 0) {
    res.status(400).json({ success: false, error: 'articles 数组不能为空' })
    return
  }

  try {
    const out = await explainRecommendations({ topic, articles })
    res.json({ success: true, ...out, partialMissing: PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

export default router

