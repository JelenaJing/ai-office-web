import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { Router } from 'express'
import { requireAccountIdentity } from '../../lib/authUser'
import { getArtifact, getArtifactFilePath } from '../../artifacts/ArtifactStore'
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
import { runSlidevDeckGenerator, editSlidevSlide, exportSlidevDeckArtifacts, type SlidevDeckPartialSnapshot } from './services/slidevDeckRunner'
import { resolveSlidevOfficialAppIndexPath, serveOfficialSlidevAsset } from './services/slidevOfficialRunner'
import {
  cleanupTempExportFile,
  ensureOfficialSlidevDist,
  exportOfficialSlidevPdf,
  zipOfficialSlidevDist,
} from './services/slidevOfficialExport'
import {
  loadSlidevMarkdownFromArtifacts,
  rebuildOfficialSlidevPreview,
  renderFallbackSlidevHtmlFromMarkdown,
} from './services/slidevPreviewRestore'
import { generateSlidevHtmlPreview } from './services/slidevHtmlPreview'
import { compileDeckToSlidevMarkdown } from './services/slidevMarkdownCompiler'
import type { WebDeckDocument, WebDeckSlide, WebDeckTaskResult, PptEngine, PptOutputMode } from './types'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../../lib/workspaceAccess'

const router = Router()
const nodeRequire = createRequire(__filename)

function sendWorkspaceError(res: import('express').Response, error: unknown): void {
  const workspaceError = error instanceof WorkspaceAccessError ? error : null
  if (workspaceError) {
    res.status(workspaceError.status).json({
      success: false,
      code: workspaceError.code,
      error: workspaceError.message,
      bootstrap: workspaceError.bootstrap,
    })
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  res.status(500).json({ success: false, error: message })
}

function buildSlidevPartialTaskResult(snapshot: SlidevDeckPartialSnapshot): WebDeckTaskResult {
  return {
    engine: 'slidev',
    outputMode: 'web_deck',
    deckId: snapshot.deckId,
    deck: snapshot.deck,
    slides: snapshot.deck.slides,
    previewImages: snapshot.deck.slides.map((slide, index) => ({
      slideId: slide.id,
      index,
      previewImageUrl: slide.previewImageUrl,
      previewHtmlUrl: slide.previewHtmlUrl,
    })),
    artifact: {
      id: `partial-${snapshot.deckId}`,
      type: 'ppt-deck',
      title: snapshot.deck.title,
      status: 'partial',
      exports: [],
      createdAt: snapshot.deck.createdAt,
      updatedAt: snapshot.deck.updatedAt,
    } as unknown as WebDeckTaskResult['artifact'],
    exportUrl: `/api/ppt/decks/${snapshot.deckId}/download`,
    previewUrl: snapshot.previewUrl || `/api/ppt/decks/${snapshot.deckId}/slidev-preview`,
    slidevMarkdown: snapshot.slidevMarkdown,
    htmlArtifactId: snapshot.htmlArtifactId,
    relationships: {
      deckId: snapshot.deckId,
      artifactId: `partial-${snapshot.deckId}`,
      sourceRefs: snapshot.deck.sourceRefs,
    },
    diagnostics: {
      chain: snapshot.deck.diagnostics.chain,
      steps: [],
      partialMissing: snapshot.deck.diagnostics.partialMissing,
    },
  }
}

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

function resolvePptOutputMode(): PptOutputMode {
  return process.env.PPT_OUTPUT_MODE === 'web_deck' ? 'web_deck' : 'editable_pptx'
}

function checkSlidevCliExportDependencies(): string | null {
  try {
    nodeRequire.resolve('@slidev/cli')
  } catch {
    return '@slidev/cli'
  }
  try {
    nodeRequire.resolve('playwright-chromium')
  } catch {
    return 'playwright-chromium'
  }
  return null
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

function resolveSlidevPreviewRoute(deckId: string): string {
  return `/api/ppt/decks/${encodeURIComponent(deckId)}/slidev-preview`
}

function canUserAccessSlidevDeck(userId: string, deckId: string): boolean {
  if (loadSlidevMarkdownFromArtifacts(deckId, userId)) return true
  const runtimeMeta = getDeckRuntimeMeta(deckId)
  if (!runtimeMeta) return false
  return runtimeMeta.userId === userId
}

function resolveOfficialSlidevPreviewUrl(deckId: string): string | null {
  const runtimeMeta = getDeckRuntimeMeta(deckId)
  if (runtimeMeta?.slidevAppUrl?.includes('/slidev-access/')) {
    return runtimeMeta.slidevAppUrl
  }
  if (runtimeMeta?.slidevPreviewAccessToken && resolveSlidevOfficialAppIndexPath(deckId)) {
    return `/api/ppt/decks/${encodeURIComponent(deckId)}/slidev-access/${encodeURIComponent(runtimeMeta.slidevPreviewAccessToken)}/`
  }
  return null
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

  const requestedWorkspacePath = typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined
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
  let workspaceAccess
  try {
    workspaceAccess = assertWorkspaceAccess(user.id, requestedWorkspacePath, 'editor')
  } catch (error) {
    sendWorkspaceError(res, error)
    return
  }
  const workspacePath = workspaceAccess.workspacePath
  console.info(`[ppt-workspace] userId=${user.id}`)
  console.info(`[ppt-workspace] username=${user.username}`)
  console.info(`[ppt-workspace] workspacePath=${workspacePath}`)
  console.info(`[ppt-workspace] resolvedWorkspaceOwner=${user.id}`)
  console.info('[ppt-workspace] canWrite=true')
  console.info('[ppt-workspace] reason=assertWorkspaceAccess allowed write')

  // Resolve engine: request body takes priority over env
  const requestedEngine = resolveRequestedEngine(req.body)
  const requestedOutputMode = resolveRequestedOutputMode(req.body)
  const engineConfig = resolvePptEngine()
  const defaultOutputMode = resolvePptOutputMode()
  const activeEngine: PptEngine = requestedEngine || engineConfig.engine
  const activeOutputMode: PptOutputMode = activeEngine === 'slidev'
    ? 'web_deck'
    : (requestedOutputMode === 'editable_pptx' ? 'editable_pptx' : defaultOutputMode === 'editable_pptx' ? 'editable_pptx' : 'editable_pptx')

  const task = createDeckTask()
  console.info('[ppt-runtime] route=/api/ppt/decks/start')
  console.info(`[ppt-runtime] engine=${activeEngine}`)
  console.info(`[ppt-runtime] outputMode=${activeOutputMode}`)
  console.info(`[ppt-runtime] taskId=${task.taskId}`)
  console.info(`[ppt-runtime] skillId=${activeEngine === 'minimax_pptx_generator' ? 'minimax.pptx-generator' : activeEngine === 'slidev' ? 'web.ppt.slidev' : 'web.ppt.deck.create'}`)
  console.info(`[ppt-runtime] usingMinimaxSkill=${activeEngine === 'minimax_pptx_generator'}`)
  updateDeckTask(task.taskId, { status: 'running', message: '正在启动 PPT DeckDocument 任务…', progress: 5 })

  const applySlidevPartialSnapshot = (snapshot: SlidevDeckPartialSnapshot, message: string, progress: number) => {
    saveDeck(snapshot.deck)
    saveDeckRuntimeMeta({
      deckId: snapshot.deckId,
      userId: user.id,
      workspacePath,
      engine: 'slidev',
      outputMode: 'web_deck',
      skillId: 'web.ppt.slidev',
      artifactId: null,
      exportUrl: `/api/ppt/decks/${snapshot.deckId}/download`,
      previewUrl: snapshot.previewUrl || `/api/ppt/decks/${snapshot.deckId}/slidev-preview`,
      slidevAppUrl: snapshot.slidevAppUrl || null,
      slidevPreviewAccessToken: snapshot.slidevPreviewAccessToken || null,
      slidevPreviewMode: snapshot.slidevPreviewMode || 'fallback',
      htmlArtifactId: snapshot.htmlArtifactId || null,
      updatedAt: new Date().toISOString(),
    })
    updateDeckTask(task.taskId, {
      deckId: snapshot.deckId,
      status: 'running',
      message,
      progress,
      result: buildSlidevPartialTaskResult(snapshot),
    })
  }

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
      outputMode: 'editable_pptx' as const,
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
          onPartial: (snapshot) => {
            const current = getDeckTask(task.taskId)
            applySlidevPartialSnapshot(
              snapshot,
              current?.message || '正在生成 Slidev 网页演示…',
              current?.progress ?? 55,
            )
          },
        })
        return result as unknown as WebDeckTaskResult
      }
      if (activeEngine === 'minimax_pptx_generator') {
        return runMinimaxPptxGenerator({
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
        onPartial: (snapshot) => {
          const current = getDeckTask(task.taskId)
          applySlidevPartialSnapshot(
            snapshot,
            current?.message || '正在生成 Slidev 网页演示…',
            current?.progress ?? 55,
          )
        },
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
      const slidevResult = result as typeof result & {
        previewUrl?: string
        slidevAppUrl?: string
        slidevPreviewAccessToken?: string
        slidevPreviewMode?: 'official' | 'fallback'
        htmlArtifactId?: string
        outputMode?: PptOutputMode
      }
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
        slidevAppUrl: slidevResult.slidevAppUrl || null,
        slidevPreviewAccessToken: slidevResult.slidevPreviewAccessToken || null,
        slidevPreviewMode: slidevResult.slidevPreviewMode || 'fallback',
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

router.use('/decks/:deckId/slidev-access/:accessToken', (req, res) => {
  const deckId = req.params.deckId
  const accessToken = req.params.accessToken
  const runtimeMeta = getDeckRuntimeMeta(deckId)
  const distReady = Boolean(resolveSlidevOfficialAppIndexPath(deckId))
  const canServeOfficial = (
    (runtimeMeta?.engine === 'slidev' && runtimeMeta.slidevPreviewAccessToken)
    || distReady
  )
  if (!canServeOfficial) {
    res.status(404).json({ success: false, error: 'Slidev 预览不存在' })
    return
  }

  const relativePath = req.path === '/' ? '' : req.path.replace(/^\//, '')
  const served = serveOfficialSlidevAsset({
    deckId,
    accessToken,
    runtimeToken: runtimeMeta?.slidevPreviewAccessToken || accessToken,
    relativePath,
  })
  if (!served.ok) {
    res.status(served.status).json({ success: false, error: served.error })
    return
  }

  res.setHeader('Content-Type', served.contentType)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, max-age=60')
  res.sendFile(path.resolve(served.filePath))
})

router.get('/decks/:deckId/slidev-official.zip', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  const deckId = req.params.deckId
  if (!canUserAccessSlidevDeck(user.id, deckId)) {
    res.status(403).json({ success: false, error: '无权下载该演示文稿' })
    return
  }

  const deck = getDeck(deckId)
  const slidevMarkdown = deck
    ? compileDeckToSlidevMarkdown(deck, { mode: 'official' })
    : (loadSlidevMarkdownFromArtifacts(deckId, user.id) || '')
  if (!slidevMarkdown.trim()) {
    res.status(404).json({ success: false, error: '未找到 Slidev 内容' })
    return
  }

  const runtimeMeta = getDeckRuntimeMeta(deckId)
  const ensured = ensureOfficialSlidevDist({
    deckId,
    slidevMarkdown,
    accessToken: runtimeMeta?.slidevPreviewAccessToken,
  })
  if (!ensured.success) {
    res.status(500).json({ success: false, error: ensured.error || 'Slidev 官方构建失败' })
    return
  }

  if (ensured.appUrl && ensured.accessToken && runtimeMeta) {
    saveDeckRuntimeMeta({
      ...runtimeMeta,
      slidevAppUrl: ensured.appUrl,
      slidevPreviewAccessToken: ensured.accessToken,
      previewUrl: ensured.appUrl,
      slidevPreviewMode: 'official',
      updatedAt: new Date().toISOString(),
    })
  }

  const zipped = zipOfficialSlidevDist(deckId)
  if (!zipped.success || !zipped.zipPath) {
    res.status(500).json({ success: false, error: zipped.error || 'ZIP 打包失败' })
    return
  }

  const title = deck?.title || '演示文稿'
  const filename = `${title.replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'slidev'}.slidev.zip`
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  res.sendFile(path.resolve(zipped.zipPath), (error) => {
    cleanupTempExportFile(zipped.zipPath)
    if (error && !res.headersSent) {
      res.status(500).json({ success: false, error: 'ZIP 下载失败' })
    }
  })
})

router.get('/decks/:deckId/slidev-official.pdf', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  const deckId = req.params.deckId
  if (!canUserAccessSlidevDeck(user.id, deckId)) {
    res.status(403).json({ success: false, error: '无权导出该演示文稿' })
    return
  }

  const deck = getDeck(deckId)
  const slidevMarkdown = deck
    ? compileDeckToSlidevMarkdown(deck, { mode: 'official' })
    : (loadSlidevMarkdownFromArtifacts(deckId, user.id) || '')
  if (!slidevMarkdown.trim()) {
    res.status(404).json({ success: false, error: '未找到 Slidev 内容' })
    return
  }

  const runtimeMeta = getDeckRuntimeMeta(deckId)
  const exported = exportOfficialSlidevPdf({
    deckId,
    slidevMarkdown,
    accessToken: runtimeMeta?.slidevPreviewAccessToken,
  })
  if (!exported.success || !exported.pdfPath) {
    res.status(500).json({ success: false, error: exported.error || 'PDF 导出失败' })
    return
  }

  const title = deck?.title || '演示文稿'
  const filename = `${title.replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'slidev'}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  res.sendFile(path.resolve(exported.pdfPath), (error) => {
    cleanupTempExportFile(exported.pdfPath)
    if (error && !res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF 下载失败' })
    }
  })
})

router.get('/decks/:deckId/slidev-preview', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  let deck = getDeck(req.params.deckId)
  const restoredMarkdown = deck
    ? null
    : loadSlidevMarkdownFromArtifacts(req.params.deckId, user.id)
  if (!deck && !restoredMarkdown) {
    console.info(`[ppt-slidev-preview] deckId=${req.params.deckId}`)
    console.info('[ppt-slidev-preview] error=deck not found')
    res.status(404).json({ success: false, error: '演示文稿预览已过期，请重新生成或刷新页面' })
    return
  }

  const deckId = req.params.deckId
  if (!canUserAccessSlidevDeck(user.id, deckId)) {
    res.status(403).json({ success: false, error: '无权预览该演示文稿' })
    return
  }

  const officialPreviewUrl = resolveOfficialSlidevPreviewUrl(deckId)
  if (officialPreviewUrl) {
    res.redirect(302, officialPreviewUrl)
    return
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  const runtimeMeta = getDeckRuntimeMeta(deckId)
  const artifactId = runtimeMeta?.htmlArtifactId || ''
  if (artifactId) {
    const artifact = getArtifact(artifactId)
    const htmlExport = artifact?.exports.find((entry) => entry.format === 'html') || artifact?.exports[0]
    const filePath = htmlExport ? getArtifactFilePath(artifactId, htmlExport.filename) : ''
    if (filePath && fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath))
      return
    }
  }

  try {
    const slidevMarkdown = deck
      ? compileDeckToSlidevMarkdown(deck, { mode: 'preview' })
      : (restoredMarkdown || '')
    const title = deck?.title || '演示文稿'
    const html = renderFallbackSlidevHtmlFromMarkdown({ deckId, title, slidevMarkdown })
    res.send(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(`[ppt-slidev-preview] error=${message}`)
    res.status(500).json({ success: false, error: '预览渲染失败，请稍后重试' })
  }
})

router.post('/decks/:deckId/slidev-rebuild-preview', async (req, res) => {
  const user = await requireAccountIdentity(req, res)
  if (!user) return

  const deckId = req.params.deckId
  const slidevMarkdown = typeof req.body?.slidevMarkdown === 'string' ? req.body.slidevMarkdown.trim() : ''
  if (!slidevMarkdown) {
    res.status(400).json({ success: false, error: '缺少 slidevMarkdown，无法重建预览' })
    return
  }

  const workspacePath = typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : ''
  const title = typeof req.body?.title === 'string' ? req.body.title : '演示文稿'
  const previousMeta = getDeckRuntimeMeta(deckId)

  try {
    const rebuilt = rebuildOfficialSlidevPreview({
      deckId,
      userId: user.id,
      workspacePath: workspacePath || previousMeta?.workspacePath || '',
      title,
      slidevMarkdown,
      previousMeta,
    })
    res.json({
      success: true,
      deckId,
      previewUrl: rebuilt.previewUrl,
      slidevAppUrl: rebuilt.slidevAppUrl || null,
      slidevPreviewAccessToken: rebuilt.slidevPreviewAccessToken || null,
      slidevPreviewMode: rebuilt.slidevPreviewMode,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
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
        outputMode: 'editable_pptx',
        skillId: 'web.ppt.deck.create',
      artifactId: result.artifact.id,
      exportUrl: result.exportUrl,
      updatedAt: new Date().toISOString(),
    })
      res.json({
        success: true,
        engine: 'builtin',
        outputMode: 'editable_pptx',
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
        htmlArtifactId: result.htmlArtifactId,
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
          outputMode: 'editable_pptx',
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
      outputMode: 'editable_pptx',
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
      outputMode: 'editable_pptx',
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
    if (engine === 'slidev') {
      if (requestedFormat === 'md' || requestedFormat === 'html') {
        const isHtml = requestedFormat === 'html'
        const exported = exportSlidevDeckArtifacts({
          userId: user.id,
          username: user.username,
          workspacePath: runtimeMeta.workspacePath,
          deck,
        })
        saveDeck(exported.deck)

        const slidevMarkdown = exported.slidevMarkdown
        const official = isHtml
          ? ensureOfficialSlidevDist({
            deckId: deck.deckId,
            slidevMarkdown,
            accessToken: runtimeMeta.slidevPreviewAccessToken,
          })
          : null
        const officialPreviewUrl = official?.success && official.appUrl
          ? official.appUrl
          : (runtimeMeta.slidevAppUrl || runtimeMeta.previewUrl || exported.previewUrl)

        saveDeckRuntimeMeta({
          ...runtimeMeta,
          engine: 'slidev',
          outputMode: 'web_deck',
          skillId: 'web.ppt.slidev',
          artifactId: exported.markdownArtifactId,
          exportUrl: isHtml
            ? `/api/ppt/decks/${encodeURIComponent(deck.deckId)}/slidev-official.zip`
            : exported.exportUrl,
          previewUrl: officialPreviewUrl,
          slidevAppUrl: official?.appUrl || runtimeMeta.slidevAppUrl || null,
          slidevPreviewAccessToken: official?.accessToken || runtimeMeta.slidevPreviewAccessToken || null,
          slidevPreviewMode: official?.success ? 'official' : (runtimeMeta.slidevPreviewMode || 'fallback'),
          htmlArtifactId: exported.htmlArtifactId,
          updatedAt: new Date().toISOString(),
        })
        res.json({
          success: true,
          engine: 'slidev',
          outputMode: 'web_deck',
          deckId: deck.deckId,
          format: requestedFormat,
          deck: exported.deck,
          slides: exported.slides,
          artifact: isHtml ? exported.htmlArtifact : exported.artifact,
          exportUrl: isHtml
            ? `/api/ppt/decks/${encodeURIComponent(deck.deckId)}/slidev-official.zip`
            : exported.exportUrl,
          previewUrl: officialPreviewUrl,
          slidevMarkdown: exported.slidevMarkdown,
          markdownArtifactId: exported.markdownArtifactId,
          htmlArtifactId: exported.htmlArtifactId,
          message: isHtml ? 'Slidev 官方 HTML 包已准备' : 'Slidev Markdown 已准备',
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
        const missing = checkSlidevCliExportDependencies()
        if (missing) {
          res.status(501).json({
            success: false,
            error: `Slidev CLI export 未启用，请设置 SLIDEV_CLI_ENABLED=1 并安装 @slidev/cli 与 playwright-chromium。缺失依赖：${missing}`,
            message: 'Slidev PPTX 为图片型 PPTX，文字不可直接编辑，不作为正式可编辑 PPTX 主方案。',
          })
          return
        }
        res.status(501).json({
          success: false,
          error: 'Slidev PPTX 导出功能尚未实现。',
          message: 'Slidev PPTX 为图片型 PPTX，文字不可直接编辑，不作为正式可编辑 PPTX 主方案。',
        })
        return
      }
      if (requestedFormat === 'pdf') {
        const slidevMarkdown = compileDeckToSlidevMarkdown(deck, { mode: 'official' })
        const ensured = ensureOfficialSlidevDist({
          deckId: deck.deckId,
          slidevMarkdown,
          accessToken: runtimeMeta.slidevPreviewAccessToken,
        })
        if (!ensured.success) {
          res.status(500).json({ success: false, error: ensured.error || 'PDF 导出前官方构建失败' })
          return
        }
        if (ensured.appUrl && ensured.accessToken) {
          saveDeckRuntimeMeta({
            ...runtimeMeta,
            slidevAppUrl: ensured.appUrl,
            slidevPreviewAccessToken: ensured.accessToken,
            previewUrl: ensured.appUrl,
            slidevPreviewMode: 'official',
            updatedAt: new Date().toISOString(),
          })
        }
        res.json({
          success: true,
          engine: 'slidev',
          outputMode: 'web_deck',
          deckId: deck.deckId,
          format: 'pdf',
          exportUrl: `/api/ppt/decks/${encodeURIComponent(deck.deckId)}/slidev-official.pdf`,
          previewUrl: ensured.appUrl || runtimeMeta.slidevAppUrl || runtimeMeta.previewUrl,
          slidevMarkdown,
          message: 'Slidev PDF 已准备，请下载',
        })
        return
      }
      if (requestedFormat === 'png') {
        const slidevCliEnabled = process.env.SLIDEV_CLI_ENABLED === '1'
        if (!slidevCliEnabled) {
          res.status(501).json({
            success: false,
            error: 'Slidev PNG export 未启用，请设置 SLIDEV_CLI_ENABLED=1 并安装 @slidev/cli 与 playwright-chromium。',
          })
          return
        }
        const missing = checkSlidevCliExportDependencies()
        if (missing) {
          res.status(501).json({
            success: false,
            error: `Slidev PNG export 未启用。缺失依赖：${missing}`,
          })
          return
        }
        res.status(501).json({ success: false, error: 'Slidev PNG 导出功能尚未实现。' })
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
        outputMode: 'editable_pptx',
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
      outputMode: 'editable_pptx',
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
