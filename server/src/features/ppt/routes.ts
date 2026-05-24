import { Router } from 'express'
import { requireAccountIdentity } from '../../lib/authUser'
import { resolveWritableWorkspaceForUser } from '../../lib/workspaceStore'
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
import { runSlidevDeckGenerator, editSlidevSlide } from './services/slidevDeckRunner'
import type { WebDeckDocument, WebDeckSlide, WebDeckTaskResult, PptEngine, PptOutputMode } from './types'

const router = Router()

function validateCompletedDeckTaskResult(result: WebDeckTaskResult | undefined): string | null {
  if (!result) return 'PPT 任务缺少 result，无法完成。'
  if (!result.deckId) return 'PPT 任务缺少 deckId，无法完成。'
  if (!result.deck || !Array.isArray(result.deck.slides) || result.deck.slides.length === 0) {
    return 'PPT 任务缺少有效的 deck/slides，无法完成。'
  }
  if (!result.artifact?.id) return 'PPT 任务缺少 artifact，无法完成。'
  if (typeof result.exportUrl !== 'string' || !result.exportUrl.trim()) {
    return 'PPT 任务缺少 exportUrl，无法完成。'
  }
  // Slidev engine: previewImages optional (deck is Markdown/HTML, not PPTX preview images)
  if (result.engine !== 'slidev') {
    if (!Array.isArray(result.previewImages) || result.previewImages.length === 0) {
      return 'PPT 任务缺少 previewImages，无法完成。'
    }
  }
  return null
}

function logTaskOutcome(stage: 'completed' | 'failed', payload: {
  taskId: string
  engine?: PptEngine
  deckId?: string
  previewImagesCount?: number
  artifactId?: string | null
  exportUrl?: string | null
  error?: string
}): void {
  console.info(`[ppt-runtime] status=${stage}`)
  console.info(`[ppt-runtime] taskId=${payload.taskId}`)
  if (payload.engine) console.info(`[ppt-runtime] engine=${payload.engine}`)
  if (payload.deckId) console.info(`[ppt-runtime] deckId=${payload.deckId}`)
  if (typeof payload.previewImagesCount === 'number') console.info(`[ppt-runtime] previewImagesCount=${payload.previewImagesCount}`)
  if (payload.artifactId) console.info(`[ppt-runtime] outputArtifactId=${payload.artifactId}`)
  if (payload.exportUrl) console.info(`[ppt-runtime] exportUrl=${payload.exportUrl}`)
  if (payload.error) console.info(`[ppt-runtime] error=${payload.error}`)
}

function resolvePptEngine(): { engine: PptEngine; fallback: 'builtin' | 'none' } {
  // Default to minimax_pptx_generator; set PPT_ENGINE=builtin/slidev to override
  const envEngine = process.env.PPT_ENGINE
  const engine: PptEngine = envEngine === 'builtin' ? 'builtin' : envEngine === 'slidev' ? 'slidev' : 'minimax_pptx_generator'
  const fallback = process.env.PPT_ENGINE_FALLBACK === 'none' ? 'none' : 'builtin'
  return { engine, fallback }
}

function resolveRequestedEngine(body: unknown): PptEngine | null {
  if (!body || typeof body !== 'object') return null
  const raw = (body as Record<string, unknown>).engine
  if (raw === 'builtin' || raw === 'minimax_pptx_generator' || raw === 'slidev') return raw
  return null
}

function resolveRequestedOutputMode(body: unknown): PptOutputMode | null {
  if (!body || typeof body !== 'object') return null
  const raw = (body as Record<string, unknown>).outputMode
  if (raw === 'editable_pptx' || raw === 'web_deck') return raw
  return null
}

function resolveDeckEngine(deckId: string, requested: unknown): PptEngine {
  if (requested === 'builtin' || requested === 'minimax_pptx_generator' || requested === 'slidev') return requested
  return getDeckRuntimeMeta(deckId)?.engine || resolvePptEngine().engine
}

function wrapMinimaxEditError(message: string): string {
  return message.startsWith('MiniMax PPTX Generator 页面级修改失败：')
    ? message
    : `MiniMax PPTX Generator 页面级修改失败：${message}`
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
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  const requestedWorkspacePath = String(req.body?.workspacePath || '').trim()
  const prompt = String(req.body?.prompt || req.body?.topic || '').trim()
  const title = String(req.body?.title || prompt.slice(0, 40) || '演示文稿').trim()
  console.info('[ppt-runtime] received request /api/ppt/decks/start')
  console.info(`[ppt-runtime] requestedWorkspacePath=${requestedWorkspacePath || 'n/a'}`)
  console.info(`[ppt-runtime] promptLength=${prompt.length}`)
  console.info(`[ppt-runtime] title=${title || '演示文稿'}`)
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' })
    return
  }
  const workspaceAccess = resolveWritableWorkspaceForUser(user.id, requestedWorkspacePath)
  const workspacePath = workspaceAccess.workspacePath
  console.info(`[ppt-workspace] userId=${user.id}`)
  console.info(`[ppt-workspace] username=${user.username}`)
  console.info(`[ppt-workspace] workspacePath=${workspacePath}`)
  console.info(`[ppt-workspace] resolvedWorkspaceOwner=${workspaceAccess.resolvedWorkspaceOwner}`)
  console.info(`[ppt-workspace] canWrite=${workspaceAccess.canWrite}`)
  console.info(`[ppt-workspace] reason=${workspaceAccess.reason}`)
  if (workspaceAccess.switchedFrom && workspaceAccess.switchedTo) {
    console.warn(`[ppt-workspace] switchedFrom=${workspaceAccess.switchedFrom}`)
    console.warn(`[ppt-workspace] switchedTo=${workspaceAccess.switchedTo}`)
  }

  // Resolve engine: request body takes priority over env
  const requestedEngine = resolveRequestedEngine(req.body)
  const requestedOutputMode = resolveRequestedOutputMode(req.body)
  const engineConfig = resolvePptEngine()
  const activeEngine: PptEngine = requestedEngine || engineConfig.engine
  const activeOutputMode: PptOutputMode = requestedOutputMode
    || (activeEngine === 'slidev' ? 'web_deck' : 'editable_pptx')

  const task = createDeckTask()
  console.info('[ppt-runtime] route=/api/ppt/decks/start')
  console.info(`[ppt-runtime] engine=${activeEngine}`)
  console.info(`[ppt-runtime] outputMode=${activeOutputMode}`)
  console.info(`[ppt-runtime] taskId=${task.taskId}`)
  console.info(`[ppt-runtime] skillId=${activeEngine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : activeEngine === 'slidev' ? 'web.ppt.slidev' : 'web.ppt.deck.create'}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${activeEngine === 'minimax_pptx_generator'}`)
  updateDeckTask(task.taskId, { status: 'running', message: '正在启动 PPT DeckDocument 任务…', progress: 5 })

  const runBuiltinEngine = async (fallbackReason?: string) => {
    if (fallbackReason) {
      console.info('[ppt-runtime] fallback=builtin')
      console.info(`[ppt-runtime] error=${fallbackReason}`)
    } else {
      console.info('[ppt-runtime] fallback=')
    }
    const result = await createDeckFromPrompt({
      userId: user.id,
      username: user.username,
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

  const runSelectedEngine = async (): Promise<WebDeckTaskResult> => {
    // PPT_ACCEPTANCE_MODE: skip external LLM, return deterministic deck
    if (process.env.PPT_ACCEPTANCE_MODE === '1') {
      console.info('[ppt-runtime] PPT_ACCEPTANCE_MODE=1 — using deterministic acceptance deck')
      if (activeEngine === 'slidev') {
        const result = await runSlidevDeckGenerator({
          userId: user.id,
          username: user.username,
          workspacePath,
          title,
          prompt,
          taskId: task.taskId,
          isCancelled: () => Boolean(getDeckTask(task.taskId)?.cancelRequested),
          onStep: (message, progress) => updateDeckTask(task.taskId, { status: 'running', message, progress }),
        })
        return result as unknown as WebDeckTaskResult
      }
      return runBuiltinEngine()
    }

    if (activeEngine === 'slidev') {
      const result = await runSlidevDeckGenerator({
        userId: user.id,
        username: user.username,
        workspacePath,
        title,
        prompt,
        taskId: task.taskId,
        language: req.body?.language === 'en-US' ? 'en-US' : 'zh-CN',
        slideCount: typeof req.body?.slideCount === 'number'
          ? req.body.slideCount
          : Number(req.body?.slideCount || 0) || undefined,
        source: req.body?.source === 'manuscript' || req.body?.source === 'matter' ? req.body.source : 'topic',
        sourceId: typeof req.body?.matterId === 'string'
          ? req.body.matterId
          : typeof req.body?.documentId === 'string'
            ? req.body.documentId
            : undefined,
        isCancelled: () => Boolean(getDeckTask(task.taskId)?.cancelRequested),
        onStep: (message, progress) => updateDeckTask(task.taskId, { status: 'running', message, progress }),
      })
      return result as unknown as WebDeckTaskResult
    }

    if (activeEngine !== 'minimax_pptx_generator') {
      return runBuiltinEngine()
    }
    try {
      return await runMinimaxPptxGenerator({
        userId: user.id,
        username: user.username,
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
      const validationError = validateCompletedDeckTaskResult(result)
      if (validationError) {
        throw new Error(validationError)
      }
      logTaskOutcome('completed', {
        taskId: task.taskId,
        engine: result.engine,
        deckId: result.deckId,
        previewImagesCount: result.previewImages.length,
        artifactId: result.artifact.id,
        exportUrl: result.exportUrl || result.artifact.exports?.[0]?.url || `/api/ppt/decks/${result.deckId}/download`,
      })
      const engineLabel = result.engine === 'minimax_pptx_generator'
        ? 'MiniMax PPTX Generator 任务已完成'
        : result.engine === 'slidev'
          ? 'Slidev 网页演示任务已完成'
          : 'PPT DeckDocument 任务已完成'
      updateDeckTask(task.taskId, {
        deckId: result.deckId,
        status: 'completed',
        progress: 100,
        message: engineLabel,
        result,
      })
      const slidevResult = result as typeof result & { previewUrl?: string; htmlArtifactId?: string; outputMode?: PptOutputMode }
      saveDeckRuntimeMeta({
        deckId: result.deckId,
        userId: user.id,
        workspacePath,
        engine: result.engine,
        outputMode: slidevResult.outputMode || activeOutputMode,
        skillId: result.engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : result.engine === 'slidev' ? 'web.ppt.slidev' : 'web.ppt.deck.create',
        artifactId: result.artifact.id,
        exportUrl: result.exportUrl,
        previewUrl: slidevResult.previewUrl || null,
        htmlArtifactId: slidevResult.htmlArtifactId || null,
        updatedAt: new Date().toISOString(),
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      const cancelled = error instanceof Error && (
        error.name === 'PptDeckTaskCancelledError'
        || error.name === 'MinimaxPptxGeneratorCancelledError'
      )
      logTaskOutcome(cancelled ? 'failed' : 'failed', {
        taskId: task.taskId,
        engine: activeEngine,
        error: message,
      })
      updateDeckTask(task.taskId, {
        status: cancelled ? 'cancelled' : 'failed',
        message,
        error: cancelled ? undefined : message,
      })
    })

  console.info(`[ppt-runtime] startAccepted taskId=${task.taskId}`)
  res.json({ success: true, taskId: task.taskId, status: 'running' })
})

router.get('/decks/tasks/:taskId', (req, res) => {
  let task = getDeckTask(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  const inconsistentError = task.status === 'completed'
    ? validateCompletedDeckTaskResult(task.result)
    : (task.status === 'running' && task.error ? task.error : null)
  if (inconsistentError) {
    updateDeckTask(task.taskId, {
      status: 'failed',
      message: inconsistentError,
      error: inconsistentError,
    })
    task = getDeckTask(req.params.taskId)
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在或已过期' })
      return
    }
    logTaskOutcome('failed', {
      taskId: task.taskId,
      deckId: task.deckId,
      error: inconsistentError,
    })
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

router.post('/decks/:deckId/retemplate', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  const current = getDeck(req.params.deckId)
  if (!current) {
    res.status(404).json({ success: false, error: 'DeckDocument 不存在或已过期' })
    return
  }
  const runtimeMeta = getDeckRuntimeMeta(current.deckId)
  if (!runtimeMeta) {
    res.status(404).json({ success: false, error: '当前 deck 缺少运行时元数据，无法切换模板。' })
    return
  }
  if (runtimeMeta.userId !== user.id) {
    res.status(403).json({ success: false, error: '无权切换该 deck 模板' })
    return
  }
  const templateId = String(req.body?.templateId || '').trim()
  if (!templateId) {
    res.status(400).json({ success: false, error: 'templateId 不能为空' })
    return
  }

  try {
    const result = await retemplateDeck({
      userId: user.id,
      username: user.username,
      workspacePath: runtimeMeta.workspacePath,
      deck: current,
      templateId,
      skillId: 'web.ppt.deck.create',
    })
    const deck = saveDeck(result.deck)
    saveDeckRuntimeMeta({
      ...runtimeMeta,
      engine: 'builtin',
      skillId: 'web.ppt.deck.create',
      artifactId: result.artifact.id,
      exportUrl: result.exportUrl,
      updatedAt: new Date().toISOString(),
    })
    res.json({
      success: true,
      engine: 'builtin',
      deck,
      slides: deck.slides,
      artifact: result.artifact,
      exportUrl: result.exportUrl,
      previewImages: result.previewImages,
      tokenUsed: false,
      message: '模板已切换，不消耗 token',
      retemplatePreview: {
        deckId: deck.deckId,
        templateId: deck.templateId,
        slideCount: deck.slides.length,
        layouts: deck.templateManifest.layouts,
        tokenUsed: false,
      },
      diagnostics: {
        chain: 'web-deck-document-runtime',
        steps: ['retemplate:manifest-inventory', 'retemplate:pptx-render', 'retemplate:preview-render'],
        partialMissing: deck.diagnostics.partialMissing,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/decks/:deckId/slides/:slideId/edit', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

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
  if (runtimeMeta.userId !== user.id) {
    res.status(403).json({ success: false, error: '无权编辑该 deck' })
    return
  }
  const instruction = String(req.body?.instruction || '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: 'instruction 不能为空' })
    return
  }

  const engine = resolveDeckEngine(deck.deckId, req.body?.engine)
  const allowFallback = req.body?.allowFallback === true
  console.info('[ppt-runtime] route=/api/ppt/decks/:deckId/slides/:slideId/edit')
  console.info(`[ppt-runtime] engine=${engine}`)
  console.info(`[ppt-runtime] slideId=${req.params.slideId}`)
  console.info(`[ppt-runtime] skillId=${engine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : engine === 'slidev' ? 'web.ppt.slidev' : 'web.ppt.deck.create'}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${engine === 'minimax_pptx_generator'}`)
  console.info(`[ppt-runtime] allowFallback=${allowFallback}`)

  try {
    // Slidev engine: use Slidev-specific edit logic
    if (engine === 'slidev') {
      const result = await editSlidevSlide({
        userId: user.id,
        username: user.username,
        workspacePath: runtimeMeta.workspacePath,
        deck,
        deckId: req.params.deckId,
        slideId: req.params.slideId,
        instruction,
      })
      saveDeck(result.deck)
      saveDeckRuntimeMeta({
        ...runtimeMeta,
        engine: 'slidev',
        outputMode: 'web_deck',
        skillId: 'web.ppt.slidev',
        artifactId: result.artifact.id,
        exportUrl: result.exportUrl,
        previewUrl: result.previewUrl,
        htmlArtifactId: result.htmlArtifactId,
        updatedAt: new Date().toISOString(),
      })
      console.info(`[ppt-runtime] outputArtifactId=${result.artifact.id}`)
      console.info(`[ppt-runtime] previewUrl=${result.previewUrl}`)
      res.json({
        success: true,
        engine: result.engine,
        outputMode: result.outputMode,
        deckId: result.deckId,
        slideId: result.slideId,
        deck: result.deck,
        slides: result.deck.slides,
        previewImages: result.previewImages,
        updatedSlide: result.updatedSlide,
        artifact: result.artifact,
        exportUrl: result.exportUrl,
        previewUrl: result.previewUrl,
        slidevMarkdown: result.slidevMarkdown,
        changedSlideIds: result.changedSlideIds,
        unchangedSlideIds: result.unchangedSlideIds,
        message: result.message,
      })
      return
    }

    if (engine === 'minimax_pptx_generator') {
      try {
        const result = await editSlideWithMinimaxPptxGenerator({
          userId: user.id,
          username: user.username,
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
          skillId: result.skillId,
          artifactId: result.artifact.id,
          exportUrl: result.exportUrl,
          updatedAt: new Date().toISOString(),
        })
        console.info(`[ppt-runtime] outputArtifactId=${result.artifact.id}`)
        console.info(`[ppt-runtime] exportUrl=${result.exportUrl}`)
        res.json({
          success: true,
          engine: result.engine,
          skillId: result.skillId,
          deckId: result.deckId,
          slideId: result.slideId,
          deck: result.deck,
          slides: result.deck.slides,
          previewImages: result.previewImages,
          updatedSlide: result.updatedSlide,
          artifact: result.artifact,
          exportUrl: result.exportUrl,
          changedSlideIds: result.changedSlideIds,
          unchangedSlideIds: result.unchangedSlideIds,
          message: result.message,
        })
        return
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!allowFallback) {
          throw new Error(wrapMinimaxEditError(message))
        }
        console.info('[ppt-runtime] editFallback=builtin')
        console.info(`[ppt-runtime] error=${message}`)
      }
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
      userId: user.id,
      username: user.username,
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
      skillId: 'web.ppt.deck.create',
      deckId: nextDeck.deckId,
      slideId: updatedSlide.id,
      deck: exported.deck,
      slides: exported.deck.slides,
      previewImages: exported.previewImages,
      updatedSlide: exported.deck.slides[slideIndex] || updatedSlide,
      artifact: exported.artifact,
      exportUrl: exported.exportUrl,
      changedSlideIds: [updatedSlide.id],
      unchangedSlideIds: exported.deck.slides.filter((slide) => slide.id !== updatedSlide.id).map((slide) => slide.id),
      message: `已使用内置 fallback 修改第 ${slideIndex + 1} 页。只修改当前页，其他页面未变更。`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-runtime] error=${message}`)
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/decks/:deckId/export', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

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
  if (runtimeMeta.userId !== user.id) {
    res.status(403).json({ success: false, error: '无权导出该 deck' })
    return
  }

  const engine = resolveDeckEngine(deck.deckId, req.body?.engine)
  const requestedFormat = typeof req.body?.format === 'string' ? req.body.format : 'pptx'
  console.info('[ppt-runtime] route=/api/ppt/decks/:deckId/export')
  console.info(`[ppt-runtime] engine=${engine}`)
  console.info(`[ppt-runtime] format=${requestedFormat}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${engine === 'minimax_pptx_generator'}`)

  try {
    // Slidev engine: return existing markdown/html artifacts or 501 for pdf/png/pptx
    if (engine === 'slidev') {
      if (requestedFormat === 'md' || requestedFormat === 'html') {
        const isHtml = requestedFormat === 'html'
        const artifactId = isHtml ? (runtimeMeta.htmlArtifactId || null) : runtimeMeta.artifactId
        const url = isHtml ? (runtimeMeta.previewUrl || null) : runtimeMeta.exportUrl
        if (!url) {
          res.status(404).json({ success: false, error: `Slidev ${requestedFormat} artifact 不存在` })
          return
        }
        res.json({
          success: true,
          engine: 'slidev',
          outputMode: 'web_deck',
          deckId: deck.deckId,
          format: requestedFormat,
          artifactId,
          exportUrl: url,
          message: isHtml ? 'Slidev HTML preview 已准备' : 'Slidev Markdown 已准备',
        })
        return
      }
      if (requestedFormat === 'pptx') {
        const slidevCliEnabled = process.env.SLIDEV_CLI_ENABLED === '1'
        if (!slidevCliEnabled) {
          res.status(501).json({
            success: false,
            error: 'Slidev CLI export 未启用，请设置 SLIDEV_CLI_ENABLED=1 并安装 @slidev/cli 与 playwright-chromium。',
            message: 'Slidev PPTX 为图片型 PPTX，文字不可直接编辑。',
          })
          return
        }
        res.status(501).json({
          success: false,
          error: 'Slidev PPTX 导出功能尚未实现。',
          message: 'Slidev PPTX 为图片型 PPTX，文字不可直接编辑。',
        })
        return
      }
      if (requestedFormat === 'pdf' || requestedFormat === 'png') {
        const slidevCliEnabled = process.env.SLIDEV_CLI_ENABLED === '1'
        if (!slidevCliEnabled) {
          res.status(501).json({
            success: false,
            error: `Slidev ${requestedFormat.toUpperCase()} export 未启用，请设置 SLIDEV_CLI_ENABLED=1 并安装 @slidev/cli 与 playwright-chromium。`,
          })
          return
        }
        res.status(501).json({ success: false, error: `Slidev ${requestedFormat.toUpperCase()} 导出功能尚未实现。` })
        return
      }
      res.status(400).json({ success: false, error: `不支持的 Slidev export format: ${requestedFormat}` })
      return
    }

    const exported = engine === 'minimax_pptx_generator'
      ? await exportDeckWithMinimaxPptxGenerator({
          userId: user.id,
          workspacePath: runtimeMeta.workspacePath,
          deck,
          skillId: 'minimax.pptx-generator',
        })
      : await exportDeckWithBuiltin({
          userId: user.id,
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
      previewImages: 'previewImages' in exported ? exported.previewImages : [],
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
