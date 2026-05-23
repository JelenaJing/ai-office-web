import { Router } from 'express'
import { requireAccountUser } from '../../lib/authUser'
import {
  createDeckTask,
  getDeck,
  getDeckRuntimeMeta,
  getDeckTask,
  getDeckTaskByDeckId,
  requestDeckTaskCancel,
  saveDeck,
  saveDeckRuntimeMeta,
  updateDeckTask,
} from './services/deckTaskStore'
import { createDeckFromPrompt, exportDeckWithBuiltin, retemplateDeck } from './services/deckRuntime'
import { editSlideWithMinimaxPptxGenerator, exportDeckWithMinimaxPptxGenerator, runMinimaxPptxGenerator } from './services/minimaxPptxGeneratorRunner'
import type { WebDeckDocument, WebDeckSlide } from './types'

const router = Router()

type PptEngine = 'builtin' | 'minimax_pptx_generator'

function resolvePptEngine(): { engine: PptEngine; fallback: 'builtin' | 'none' } {
  const engine = process.env.PPT_ENGINE === 'minimax_pptx_generator' ? 'minimax_pptx_generator' : 'builtin'
  const fallback = process.env.PPT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  return { engine, fallback }
}

function resolveDeckEngine(deckId: string, requested: unknown): PptEngine {
  if (requested === 'builtin' || requested === 'minimax_pptx_generator') return requested
  return getDeckRuntimeMeta(deckId)?.engine || resolvePptEngine().engine
}

function buildBuiltinEditedSlide(slide: WebDeckSlide, instruction: string): WebDeckSlide {
  const normalized = instruction.trim()
  const items = Array.isArray(slide.items) ? [...slide.items] : []
  const next: WebDeckSlide = {
    ...slide,
    items,
    modified: true,
    modifiedAt: new Date().toISOString(),
    raw: { ...(slide.raw || {}) },
  }
  if (/正式|商务/u.test(normalized)) {
    next.title = slide.title.includes('方案') ? slide.title : `${slide.title}方案概览`
    next.subtitle = slide.subtitle || '管理层沟通版本'
    next.layout = 'two-column'
    next.columns = [
      { title: '核心结论', items: items.slice(0, 2) },
      { title: '行动建议', items: items.slice(2, 4).length > 0 ? items.slice(2, 4) : ['明确优先级', '安排执行计划'] },
    ]
  }
  if (/3\s*个|三点|精简|压缩/u.test(normalized)) {
    next.items = (items.length > 0 ? items : ['核心观点', '关键举措', '预期收益']).slice(0, 3)
  }
  if (/时间线/u.test(normalized)) {
    next.layout = 'timeline'
    next.timeline = (next.items.length > 0 ? next.items : ['阶段一', '阶段二', '阶段三']).slice(0, 4).map((item, index) => ({
      title: `阶段 ${index + 1}`,
      detail: item,
    }))
  }
  if (/(对比表|表格|对比)/u.test(normalized)) {
    next.layout = 'comparison'
    next.table = {
      headers: ['维度', '当前情况', '建议方案'],
      rows: (next.items.length > 0 ? next.items : ['价值主张', '实施方式', '预期收益']).slice(0, 3).map((item, index) => [
        `要点 ${index + 1}`,
        item,
        `优化 ${item}`,
      ]),
    }
  }
  if (/备注|讲稿/u.test(normalized)) {
    next.notes = `${slide.notes || slide.speakerNotes || ''}${slide.notes || slide.speakerNotes ? '\n' : ''}讲稿备注：请围绕本页重点做 30 秒讲解。`
    next.speakerNotes = next.notes
  }
  next.slots = {
    ...slide.slots,
    title: next.title,
    subtitle: next.subtitle || '',
    body: next.items,
  }
  next.raw = {
    ...(next.raw || {}),
    layout: next.layout || slide.layout || slide.layoutId,
    timeline: next.timeline || [],
    table: next.table || null,
    columns: next.columns || [],
  }
  return next
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
      saveDeckRuntimeMeta({
        deckId: result.deckId,
        userId,
        workspacePath,
        engine: result.engine,
        skillId: result.engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : 'web.ppt.deck.create',
        artifactId: result.artifact.id,
        exportUrl: result.exportUrl,
        updatedAt: new Date().toISOString(),
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

router.post('/decks/:deckId/slides/:slideId/edit', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const deck = getDeck(req.params.deckId)
  if (!deck) {
    res.status(404).json({ success: false, error: 'DeckDocument 不存在或已过期' })
    return
  }
  const runtimeMeta = getDeckRuntimeMeta(deck.deckId)
  if (!runtimeMeta) {
    res.status(404).json({ success: false, error: '当前 deck 缺少运行时元数据，无法编辑。' })
    return
  }
  if (runtimeMeta.userId !== userId) {
    res.status(403).json({ success: false, error: '无权编辑该 deck' })
    return
  }
  const instruction = String(req.body?.instruction || '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }

  const engine = resolveDeckEngine(deck.deckId, req.body?.engine)
  console.info('[ppt-runtime] route=/api/ppt/decks/:deckId/slides/:slideId/edit')
  console.info(`[ppt-runtime] engine=${engine}`)
  console.info(`[ppt-runtime] slideId=${req.params.slideId}`)
  console.info(`[ppt-runtime] skillId=${engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : 'web.ppt.deck.create'}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${engine === 'minimax_pptx_generator'}`)

  try {
    if (engine === 'minimax_pptx_generator') {
      const result = await editSlideWithMinimaxPptxGenerator({
        userId,
        workspacePath: runtimeMeta.workspacePath,
        deck,
        slideId: req.params.slideId,
        instruction,
        currentSlide: req.body?.currentSlide && typeof req.body.currentSlide === 'object' ? req.body.currentSlide : undefined,
        deckContext: req.body?.deckContext && typeof req.body.deckContext === 'object' ? req.body.deckContext : undefined,
        routePath: '/api/ppt/decks/:deckId/slides/:slideId/edit',
      })
      saveDeck(result.deck)
      saveDeckRuntimeMeta({
        ...runtimeMeta,
        engine: 'minimax_pptx_generator',
        skillId: 'minimax.pptx-generator',
        artifactId: result.artifact.id,
        exportUrl: result.exportUrl,
        updatedAt: new Date().toISOString(),
      })
      console.info(`[ppt-runtime] outputArtifactId=${result.artifact.id}`)
      console.info(`[ppt-runtime] exportUrl=${result.exportUrl}`)
      res.json({
        success: true,
        engine: result.engine,
        deckId: result.deckId,
        slideId: result.slideId,
        updatedSlide: result.updatedSlide,
        artifact: result.artifact,
        exportUrl: result.exportUrl,
        message: result.message,
      })
      return
    }

    const slideIndex = deck.slides.findIndex((slide) => slide.id === req.params.slideId)
    if (slideIndex < 0) {
      res.status(404).json({ success: false, error: 'slideId 不存在' })
      return
    }
    const updatedSlide = buildBuiltinEditedSlide(deck.slides[slideIndex], instruction)
    const nextDeck: WebDeckDocument = {
      ...deck,
      slides: deck.slides.map((slide, index) => (index === slideIndex ? updatedSlide : slide)),
      updatedAt: new Date().toISOString(),
    }
    const exported = await exportDeckWithBuiltin({
      userId,
      workspacePath: runtimeMeta.workspacePath,
      deck: nextDeck,
      skillId: 'web.ppt.deck.create',
    })
    saveDeck(exported.deck)
    saveDeckRuntimeMeta({
      ...runtimeMeta,
      engine: 'builtin',
      skillId: 'web.ppt.deck.create',
      artifactId: exported.artifact.id,
      exportUrl: exported.exportUrl,
      updatedAt: new Date().toISOString(),
    })
    console.info(`[ppt-runtime] outputArtifactId=${exported.artifact.id}`)
    console.info(`[ppt-runtime] exportUrl=${exported.exportUrl}`)
    res.json({
      success: true,
      engine: 'builtin',
      deckId: nextDeck.deckId,
      slideId: updatedSlide.id,
      updatedSlide,
      artifact: exported.artifact,
      exportUrl: exported.exportUrl,
      message: `已修改第 ${slideIndex + 1} 页`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] error=${message}`)
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/decks/:deckId/export', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return

  const deck = getDeck(req.params.deckId)
  if (!deck) {
    res.status(404).json({ success: false, error: 'DeckDocument 不存在或已过期' })
    return
  }
  const runtimeMeta = getDeckRuntimeMeta(deck.deckId)
  if (!runtimeMeta) {
    res.status(404).json({ success: false, error: '当前 deck 缺少运行时元数据，无法导出。' })
    return
  }
  if (runtimeMeta.userId !== userId) {
    res.status(403).json({ success: false, error: '无权导出该 deck' })
    return
  }

  const engine = resolveDeckEngine(deck.deckId, req.body?.engine)
  console.info('[ppt-runtime] route=/api/ppt/decks/:deckId/export')
  console.info(`[ppt-runtime] engine=${engine}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${engine === 'minimax_pptx_generator'}`)

  try {
    const exported = engine === 'minimax_pptx_generator'
      ? await exportDeckWithMinimaxPptxGenerator({
          userId,
          workspacePath: runtimeMeta.workspacePath,
          deck,
          skillId: 'minimax.pptx-generator',
        })
      : await exportDeckWithBuiltin({
          userId,
          workspacePath: runtimeMeta.workspacePath,
          deck,
          skillId: 'web.ppt.deck.create',
        })

    saveDeck(exported.deck)
    saveDeckRuntimeMeta({
      ...runtimeMeta,
      engine,
      skillId: engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : 'web.ppt.deck.create',
      artifactId: exported.artifact.id,
      exportUrl: exported.exportUrl,
      updatedAt: new Date().toISOString(),
    })
    console.info(`[ppt-runtime] outputArtifactId=${exported.artifact.id}`)
    console.info(`[ppt-runtime] exportUrl=${exported.exportUrl}`)
    res.json({
      success: true,
      engine,
      deckId: deck.deckId,
      artifact: exported.artifact,
      exportUrl: exported.exportUrl,
      deck: exported.deck,
      slides: exported.deck.slides,
      message: 'PPT 已导出',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] error=${message}`)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/decks/:deckId/download', (req, res) => {
  const runtimeMeta = getDeckRuntimeMeta(req.params.deckId)
  const task = getDeckTaskByDeckId(req.params.deckId)
  const url = runtimeMeta?.exportUrl || task?.result?.artifact?.exports?.[0]?.url
  if (url) {
    res.redirect(302, url)
    return
  }
  res.status(404).json({ success: false, error: '当前 DeckDocument 下载链接不可用；请使用任务结果 artifact 下载。' })
})

export default router
