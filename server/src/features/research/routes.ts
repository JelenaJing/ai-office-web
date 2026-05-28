import { Router } from 'express'
import multer from 'multer'
import { requireAccountUser } from '../../lib/authUser'
import {
  getPaperRemakeBaseUrl,
  paperRemakeHealth,
  paperRemakePostJson,
  paperRemakePostMultipart,
  PaperRemakeClientError,
} from './services/paperRemakeClient'
import { mapRawIdeasToCards } from './services/researchIdeaMapper'
import { mapPlotV1ToGenerate, mapRecommendV1 } from './services/plotResponseMapper'
import { rankResearchFeed } from './services/feedRanker'
import type { ResearchIdeaCard } from './types'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const RESEARCH_PARTIAL_MISSING = [
  'Async idea jobs are not implemented; long fulltext runs are synchronous',
  'Workspace file persistence for plots is optional (project_id on FastAPI)',
  'Feed rank uses rule-based scorer only (Phoenix retrieval/ranker not wired)',
]

/** PDF 清洗 + 多段 Idea + 合并，常超过默认 90s BFF 超时 */
const IDEA_FULLTEXT_TIMEOUT_MS = Number(process.env.RESEARCH_IDEA_FULLTEXT_TIMEOUT_MS ?? 600_000)

function sendJsonIfOpen(res: import('express').Response, status: number, body: unknown): boolean {
  if (res.headersSent) return false
  res.status(status).json(body)
  return true
}

router.get('/parity', async (_req, res) => {
  let fastApiHealthy = false
  try {
    const h = await paperRemakeHealth()
    fastApiHealthy = h.status === 'healthy'
  } catch {
    fastApiHealthy = false
  }
  res.json({
    success: true,
    fastApiBaseUrl: getPaperRemakeBaseUrl(),
    fastApiHealthy,
    endpoints: {
      bff: {
        ideaGenerate: 'POST /api/research/ideas/generate',
        ideaGenerateFulltext: 'POST /api/research/ideas/generate/fulltext',
        plotRecommend: 'POST /api/research/plots/recommend',
        plotGenerate: 'POST /api/research/plots/generate',
        plotTemplates: 'GET /api/research/plots/templates',
        plotTemplatePreview: 'POST /api/research/plots/templates/preview',
        feedRank: 'POST /api/research/feed/rank',
      },
      fastApiV1: {
        idea: 'POST /api/v1/remake/idea',
        ideaFulltext: 'POST /api/v1/remake/idea/fulltext',
        plot: 'POST /api/v1/data/plot',
        plotRecommend: 'POST /api/v1/data/plot/recommend',
        plotTemplatePreview: 'POST /api/v1/data/plot/templates/preview',
      },
      fastApiV2: {
        idea: 'POST /api/v1/remake/idea/v2',
        ideaFulltext: 'POST /api/v1/remake/idea/fulltext/v2',
        plot: 'POST /api/v1/data/plot/v2',
        plotRecommend: 'POST /api/v1/data/plot/recommend/v2',
        plotTemplatePreview: 'POST /api/v1/data/plot/templates/preview/v2',
      },
    },
    partialMissing: RESEARCH_PARTIAL_MISSING,
  })
})

router.post('/feed/rank', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const rawIdeas = req.body?.ideas ?? req.body?.candidates
  if (!Array.isArray(rawIdeas) || rawIdeas.length === 0) {
    res.status(400).json({ success: false, error: 'ideas 数组不能为空' })
    return
  }

  const field =
    typeof req.body?.field === 'string'
      ? req.body.field
      : typeof req.body?.selectedField === 'string'
        ? req.body.selectedField
        : undefined
  const servedIdeaIds = Array.isArray(req.body?.servedIdeaIds)
    ? req.body.servedIdeaIds.map(String)
    : Array.isArray(req.body?.served_idea_ids)
      ? req.body.served_idea_ids.map(String)
      : []
  const subscriptionQueries = Array.isArray(req.body?.subscriptionQueries)
    ? req.body.subscriptionQueries.map(String)
    : Array.isArray(req.body?.subscriptions)
      ? req.body.subscriptions
          .filter((s: unknown) => s && typeof s === 'object' && (s as { enabled?: boolean }).enabled !== false)
          .map((s: { query?: string }) => String((s as { query?: string }).query ?? ''))
          .filter(Boolean)
      : []
  const topK =
    typeof req.body?.topK === 'number' && req.body.topK > 0
      ? Math.min(req.body.topK, 100)
      : undefined

  const ideas = rawIdeas as ResearchIdeaCard[]
  const ranked = rankResearchFeed(ideas, {
    field,
    servedIdeaIds,
    subscriptionQueries,
    topK,
  })

  res.json({
    success: true,
    ideas: ranked,
    ranking: {
      algorithm: 'rule-based-v1',
      inspiredBy: 'x-algorithm candidate-pipeline (Phase A)',
      candidateCount: ideas.length,
      returnedCount: ranked.length,
    },
    partialMissing: RESEARCH_PARTIAL_MISSING,
  })
})

router.post('/ideas/generate', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const projectId = String(req.body?.projectId ?? req.body?.project_id ?? '').trim()
  const selectedText = typeof req.body?.selectedText === 'string'
    ? req.body.selectedText
    : typeof req.body?.selected_text === 'string'
      ? req.body.selected_text
      : typeof req.body?.text === 'string'
        ? req.body.text
        : ''
  const field = typeof req.body?.field === 'string' ? req.body.field : '未分类'
  const useV2 = req.body?.contract === 'v2' || req.query.contract === 'v2'
  const mode = String(req.body?.mode ?? 'selection')

  if (!projectId && !selectedText.trim()) {
    res.status(400).json({ success: false, error: 'projectId 或 text 至少填一项' })
    return
  }

  try {
    if (mode === 'fulltext' && projectId) {
      const v2 = await paperRemakePostJson<{
        success: boolean
        ideas?: unknown[]
        error?: string
        data?: { chunks?: number }
      }>(
        '/api/v1/remake/idea/fulltext/v2',
        {
          project_id: projectId,
          full_text: req.body?.fullText ?? req.body?.full_text ?? null,
          target_chars: req.body?.target_chars ?? 6000,
          overlap_chars: req.body?.overlap_chars ?? 300,
          field,
        },
        { timeoutMs: IDEA_FULLTEXT_TIMEOUT_MS },
      )
      if (!v2.success) {
        sendJsonIfOpen(res, 502, { success: false, error: v2.error ?? 'Idea fulltext failed' })
        return
      }
      sendJsonIfOpen(res, 200, {
        success: true,
        ideas: v2.ideas ?? [],
        data: v2.data,
        partialMissing: RESEARCH_PARTIAL_MISSING,
      })
      return
    }

    if (useV2 && projectId) {
      const v2 = await paperRemakePostJson<{
        success: boolean
        ideas?: unknown[]
        error?: string
      }>('/api/v1/remake/idea/v2', {
        project_id: projectId,
        selected_text: selectedText,
        context: req.body?.context ?? null,
        field,
      })
      if (!v2.success) {
        res.status(502).json({ success: false, error: v2.error ?? 'Idea generation failed' })
        return
      }
      res.json({ success: true, ideas: v2.ideas ?? [], partialMissing: RESEARCH_PARTIAL_MISSING })
      return
    }

    if (!projectId) {
      res.status(400).json({ success: false, error: 'v1 路径需要 projectId' })
      return
    }

    const v1 = await paperRemakePostJson<{
      status: string
      ideas?: Array<Record<string, unknown>>
      message?: string
    }>('/api/v1/remake/idea', {
      project_id: projectId,
      selected_text: selectedText,
      context: req.body?.context ?? null,
    })
    if (v1.status !== 'success') {
      res.status(502).json({ success: false, error: v1.message ?? 'Idea generation failed' })
      return
    }
    const ideas = mapRawIdeasToCards(v1.ideas ?? [], field)
    res.json({ success: true, ideas, partialMissing: RESEARCH_PARTIAL_MISSING })
  } catch (error) {
    const message =
      error instanceof PaperRemakeClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.post('/ideas/generate/fulltext', async (req, res) => {
  req.body = { ...(req.body ?? {}), mode: 'fulltext' }
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const projectId = String(req.body?.projectId ?? req.body?.project_id ?? '').trim()
  const field = typeof req.body?.field === 'string' ? req.body.field : '未分类'
  if (!projectId) {
    res.status(400).json({ success: false, error: 'projectId 不能为空' })
    return
  }

  try {
    const v2 = await paperRemakePostJson<{
      success: boolean
      ideas?: unknown[]
      error?: string
      data?: { chunks?: number }
    }>(
      '/api/v1/remake/idea/fulltext/v2',
      {
        project_id: projectId,
        full_text: req.body?.fullText ?? req.body?.full_text ?? null,
        target_chars: req.body?.target_chars ?? 6000,
        overlap_chars: req.body?.overlap_chars ?? 300,
        field,
      },
      { timeoutMs: IDEA_FULLTEXT_TIMEOUT_MS },
    )
    if (!v2.success) {
      sendJsonIfOpen(res, 502, { success: false, error: v2.error ?? 'Idea fulltext failed' })
      return
    }
    sendJsonIfOpen(res, 200, {
      success: true,
      ideas: v2.ideas ?? [],
      data: v2.data,
      partialMissing: RESEARCH_PARTIAL_MISSING,
    })
  } catch (error) {
    const message =
      error instanceof PaperRemakeClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error)
    sendJsonIfOpen(res, 502, { success: false, error: message })
  }
})

router.post('/plots/recommend', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const useV2 = req.body?.contract === 'v2' || req.query.contract === 'v2'
  const payload = {
    data: req.body?.data,
    raw_text: req.body?.rawText ?? req.body?.raw_text,
    top_n: req.body?.topN ?? req.body?.top_n ?? 5,
    data_type: req.body?.dataType ?? req.body?.data_type,
    template_id: req.body?.templateId ?? req.body?.template_id,
    use_llm_type_detection: req.body?.useLlmTypeDetection ?? req.body?.use_llm_type_detection ?? true,
  }

  try {
    const path = useV2 ? '/api/v1/data/plot/recommend/v2' : '/api/v1/data/plot/recommend'
    const raw = await paperRemakePostJson<Record<string, unknown>>(path, payload)
    if (useV2) {
      if (raw.success === false) {
        res.status(502).json({ success: false, error: String(raw.error ?? 'recommend failed') })
        return
      }
      res.json({ success: true, ...raw, partialMissing: RESEARCH_PARTIAL_MISSING })
      return
    }
    res.json({
      success: true,
      recommendation: mapRecommendV1(raw),
      partialMissing: RESEARCH_PARTIAL_MISSING,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.post('/plots/generate', upload.single('file'), async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const useV2 = req.body?.contract === 'v2' || req.query.contract === 'v2'
  const path = useV2 ? '/api/v1/data/plot/v2' : '/api/v1/data/plot'

  try {
    const raw = await paperRemakePostMultipart<Record<string, unknown>>(path, (form) => {
      if (req.file) {
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' })
        form.append('file', blob, req.file.originalname || 'data.csv')
      }
      const projectId = req.body?.projectId ?? req.body?.project_id
      if (projectId) form.append('project_id', String(projectId))
      if (req.body?.chartType ?? req.body?.chart_type) {
        form.append('chart_type', String(req.body.chartType ?? req.body.chart_type))
      }
      if (req.body?.dataType ?? req.body?.data_type) {
        form.append('data_type', String(req.body.dataType ?? req.body.data_type))
      }
      if (req.body?.templateId ?? req.body?.template_id) {
        form.append('template_id', String(req.body.templateId ?? req.body.template_id))
      }
      const useLlm = req.body?.useLlmTypeDetection ?? req.body?.use_llm_type_detection
      if (useLlm !== undefined) form.append('use_llm_type_detection', String(useLlm))
      if (req.body?.autoRecommend !== undefined) form.append('auto_recommend', String(req.body.autoRecommend))
      if (req.body?.auto_recommend !== undefined) form.append('auto_recommend', String(req.body.auto_recommend))
    })

    if (useV2) {
      if (raw.success === false) {
        res.status(502).json({ success: false, error: String(raw.error ?? 'plot failed') })
        return
      }
      res.json({ ...raw, partialMissing: RESEARCH_PARTIAL_MISSING })
      return
    }

    const mapped = mapPlotV1ToGenerate(raw)
    res.json({ ...mapped, partialMissing: RESEARCH_PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.get('/plots/templates', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  try {
    const base = getPaperRemakeBaseUrl()
    const url = `${base.replace(/\/$/, '')}/api/v1/data/plot/templates/v2`
    const upstream = await fetch(url, { method: 'GET' })
    const raw = (await upstream.json()) as Record<string, unknown>
    if (!upstream.ok || raw.success === false) {
      res.status(502).json({ success: false, error: String(raw.error ?? 'list templates failed') })
      return
    }
    res.json({ success: true, templates: raw.templates ?? [], count: raw.count, partialMissing: RESEARCH_PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

router.post('/plots/templates/preview', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const useV2 = req.body?.contract === 'v2' || req.query.contract === 'v2'
  const path = useV2
    ? '/api/v1/data/plot/templates/preview/v2'
    : '/api/v1/data/plot/templates/preview'
  const style = req.body?.style ?? 'all'
  const useLlm = req.body?.useLlm ?? req.body?.use_llm ?? false

  try {
    const raw = await paperRemakePostJson<Record<string, unknown>>(path, { style, use_llm: useLlm })
    res.json({ success: true, ...raw, partialMissing: RESEARCH_PARTIAL_MISSING })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ success: false, error: message })
  }
})

export default router
