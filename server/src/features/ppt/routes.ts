import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import {
  createDeckTask,
  getDeck,
  getDeckTask,
  getDeckTaskByDeckId,
  requestDeckTaskCancel,
  saveDeck,
  updateDeckTask,
} from './services/deckTaskStore'
import { createDeckFromPrompt, retemplateDeck } from './services/deckRuntime'
import { runMinimaxPptxGenerator } from './services/minimaxPptxGeneratorRunner'

const router = Router()

type PptEngine = 'builtin' | 'minimax_pptx_generator'

function resolvePptEngine(): { engine: PptEngine; fallback: 'builtin' | 'none' } {
  const engine = process.env.PPT_ENGINE === 'minimax_pptx_generator' ? 'minimax_pptx_generator' : 'builtin'
  const fallback = process.env.PPT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  return { engine, fallback }
}

router.post('/decks/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const workspacePath = String(req.body?.workspacePath || '').trim()
  const prompt = String(req.body?.prompt || req.body?.topic || '').trim()
  const title = String(req.body?.title || prompt.slice(0, 40) || '演示文稿').trim()
  if (!workspacePath) {
    res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
    return
  }
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }

  const task = createDeckTask()
  const engineConfig = resolvePptEngine()
  console.info('[ppt-runtime] route=/api/ppt/decks/start')
  console.info(`[ppt-runtime] engine=${engineConfig.engine}`)
  console.info(`[ppt-runtime] taskId=${task.taskId}`)
  console.info(`[ppt-runtime] skillId=${engineConfig.engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : 'web.ppt.deck.create'}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${engineConfig.engine === 'minimax_pptx_generator'}`)
  updateDeckTask(task.taskId, { status: 'running', message: '正在启动 PPT DeckDocument 任务…', progress: 5 })

  const runBuiltinEngine = async (fallbackReason?: string) => {
    if (fallbackReason) {
      console.info('[ppt-runtime] fallback=builtin')
      console.info(`[ppt-runtime] error=${fallbackReason}`)
    } else {
      console.info('[ppt-runtime] fallback=')
    }
    const result = await createDeckFromPrompt({
      userId,
      workspacePath,
      title,
      prompt,
      taskId: task.taskId,
      templateId: typeof req.body?.templateId === 'string' ? req.body.templateId : undefined,
      source: req.body?.source === 'manuscript' || req.body?.source === 'matter' ? req.body.source : 'topic',
      sourceId: typeof req.body?.matterId === 'string'
        ? req.body.matterId
        : typeof req.body?.documentId === 'string'
          ? req.body.documentId
          : undefined,
      isCancelled: () => Boolean(getDeckTask(task.taskId)?.cancelRequested),
      onStep: (message, progress) => updateDeckTask(task.taskId, { status: 'running', message, progress }),
    })
    if (!fallbackReason) return result
    return {
      ...result,
      engine: 'builtin' as const,
      fallbackFrom: 'minimax_pptx_generator' as const,
      fallbackReason,
    }
  }

  const runSelectedEngine = async () => {
    if (engineConfig.engine !== 'minimax_pptx_generator') {
      return runBuiltinEngine()
    }
    try {
      return await runMinimaxPptxGenerator({
        userId,
        workspacePath,
        title,
        prompt,
        taskId: task.taskId,
        routePath: '/api/ppt/decks/start',
        skillId: 'minimax.pptx-generator',
        language: req.body?.language === 'en-US' ? 'en-US' : 'zh-CN',
        slideCount: typeof req.body?.slideCount === 'number'
          ? req.body.slideCount
          : Number(req.body?.slideCount || 0) || undefined,
        themeId: typeof req.body?.themeId === 'string' ? req.body.themeId : undefined,
        source: req.body?.source === 'manuscript' || req.body?.source === 'matter' ? req.body.source : 'topic',
        sourceId: typeof req.body?.matterId === 'string'
          ? req.body.matterId
          : typeof req.body?.documentId === 'string'
            ? req.body.documentId
            : undefined,
        isCancelled: () => Boolean(getDeckTask(task.taskId)?.cancelRequested),
        onStep: (message, progress) => updateDeckTask(task.taskId, { status: 'running', message, progress }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (engineConfig.fallback === 'builtin') {
        return runBuiltinEngine(message)
      }
      console.info('[ppt-runtime] fallback=none')
      console.info(`[ppt-runtime] error=${message}`)
      throw error
    }
  }

  void runSelectedEngine()
    .then((result) => {
      if (getDeckTask(task.taskId)?.cancelRequested) return
      console.info(`[ppt-runtime] outputArtifactId=${result.artifact.id}`)
      console.info(`[ppt-runtime] exportUrl=${result.exportUrl || result.artifact.exports?.[0]?.url || `/api/ppt/decks/${result.deckId}/download`}`)
      updateDeckTask(task.taskId, {
        deckId: result.deckId,
        status: 'completed',
        progress: 100,
        message: result.engine === 'minimax_pptx_generator' ? 'MiniMax PPTX Generator 任务已完成' : 'PPT DeckDocument 任务已完成',
        result,
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      const cancelled = error instanceof Error && (
        error.name === 'PptDeckTaskCancelledError'
        || error.name === 'MinimaxPptxGeneratorCancelledError'
      )
      updateDeckTask(task.taskId, {
        status: cancelled ? 'cancelled' : 'failed',
        message,
        error: cancelled ? undefined : message,
      })
    })

  res.json({ success: true, taskId: task.taskId, status: 'running' })
})

router.get('/decks/tasks/:taskId', (req, res) => {
  const task = getDeckTask(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    taskId: task.taskId,
    deckId: task.deckId,
    status: task.status,
    progress: task.progress,
    message: task.message,
    result: task.result,
    error: task.error,
  })
})

router.post('/decks/tasks/:taskId/cancel', (req, res) => {
  const task = requestDeckTaskCancel(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({ success: true, taskId: task.taskId, status: 'cancelled' })
})

router.get('/decks/:deckId', (req, res) => {
  const deck = getDeck(req.params.deckId)
  if (!deck) {
    res.status(404).json({ success: false, error: 'DeckDocument 不存在或已过期' })
    return
  }
  res.json({ success: true, deck })
})

router.post('/decks/:deckId/retemplate', (req, res) => {
  const current = getDeck(req.params.deckId)
  if (!current) {
    res.status(404).json({ success: false, error: 'DeckDocument 不存在或已过期' })
    return
  }
  const templateId = String(req.body?.templateId || '').trim()
  if (!templateId) {
    res.status(400).json({ success: false, error: 'templateId 不能为空' })
    return
  }
  const deck = saveDeck(retemplateDeck(current, templateId))
  res.json({
    success: true,
    deck,
    tokenUsed: false,
    retemplatePreview: {
      deckId: deck.deckId,
      templateId: deck.templateId,
      slideCount: deck.slides.length,
      layouts: deck.templateManifest.layouts,
      tokenUsed: false,
    },
    diagnostics: {
      chain: 'web-deck-document-runtime',
      steps: ['retemplate:manifest-inventory', 'retemplate:preview', 'retemplate:metadata-only'],
      partialMissing: deck.diagnostics.partialMissing,
    },
  })
})

router.get('/decks/:deckId/download', (req, res) => {
  const task = getDeckTaskByDeckId(req.params.deckId)
  const url = task?.result?.artifact?.exports?.[0]?.url
  if (url) {
    res.redirect(302, url)
    return
  }
  res.status(404).json({ success: false, error: '当前 DeckDocument 下载链接不可用；请使用任务结果 artifact 下载。' })
})

export default router
