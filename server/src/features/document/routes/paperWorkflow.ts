import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import {
  runPaperWorkflowService,
  type PaperWorkflowPaperType,
  type PaperWorkflowMode,
} from '../services/paperWorkflowService'
import {
  createPaperTask,
  getPaperTask,
  requestPaperTaskCancel,
  updatePaperTask,
} from '../services/paperTaskStore'
import { runPaperNFTCORE } from '../services/paperNFTCORERuntime'

const router = Router()

/**
 * POST /api/document/paper-workflow/start
 *
 * Kicks off an async paper generation task and immediately returns a taskId.
 * The client should poll GET /tasks/:taskId for progress and final result.
 */
router.post('/start', requireAccountUser, async (req, res) => {
  const topic = String(req.body?.topic || '').trim()
  const paperType = String(req.body?.paperType || '').trim() as PaperWorkflowPaperType

  if (!topic) {
    res.status(400).json({ error: 'topic 不能为空' })
    return
  }

  if (!['research', 'review', 'thesis_research'].includes(paperType)) {
    res.status(400).json({ error: 'paperType 必须是 research / review / thesis_research' })
    return
  }

  const task = createPaperTask(paperType)
  const label = paperType === 'review' ? '文献综述' : '研究文章'
  const mode = typeof req.body?.mode === 'string' ? req.body.mode as PaperWorkflowMode : 'full'

  updatePaperTask(task.taskId, { status: 'running', message: `正在启动${label} NFTCORE 链路…`, progress: 5 })

  const isFullMode = !mode || mode === 'full'
  const language: 'zh' | 'en' = req.body?.language === 'en' ? 'en' : 'zh'
  const extraContext = typeof req.body?.extraContext === 'string' ? req.body.extraContext : undefined
  const yearFrom = typeof req.body?.yearFrom === 'string' ? req.body.yearFrom : undefined
  const yearTo = typeof req.body?.yearTo === 'string' ? req.body.yearTo : undefined

  // Fire-and-forget: run generation in background
  ;(isFullMode
    ? runPaperNFTCORE(
        {
          topic,
          paperType,
          language,
          extraContext,
          yearFrom,
          yearTo,
          isCancelled: () => Boolean(getPaperTask(task.taskId)?.cancelRequested),
        },
        (_step, message, partial) => {
          updatePaperTask(task.taskId, { status: 'running', message, partialMarkdown: partial })
        },
      )
    : runPaperWorkflowService({
        topic, paperType, language, extraContext, yearFrom, yearTo, mode,
        onStep: (_step, message, progress) => {
          updatePaperTask(task.taskId, { status: 'running', message, progress })
        },
        isCancelled: () => Boolean(getPaperTask(task.taskId)?.cancelRequested),
      })
  )
    .then((result) => {
      const current = getPaperTask(task.taskId)
      if (current?.cancelRequested) return
      updatePaperTask(task.taskId, {
        status: 'completed',
        progress: 100,
        message: paperType === 'review' ? '文献综述链路已完成' : '研究文章链路已完成',
        result: {
          title: result.title,
          markdown: result.markdown,
          html: result.html,
          paperType: result.paperType as PaperWorkflowPaperType,
          references: result.references,
          outline: result.outline,
          sections: result.sections,
          citationStatus: result.citationStatus,
          referencesSidecar: result.referencesSidecar,
          artifact: result.artifact,
          diagnostics: result.diagnostics,
        },
      })
    })
    .catch((error) => {
      const msg = error instanceof Error ? error.message : '论文工作流失败'
      const cancelled = error instanceof Error && error.name === 'PaperWorkflowCancelledError'
      console.error('[document/paper-workflow/start]', msg)
      updatePaperTask(task.taskId, {
        status: cancelled ? 'cancelled' : 'failed',
        message: msg,
        error: cancelled ? undefined : msg,
      })
    })

  res.json({ success: true, taskId: task.taskId, paperType, status: 'running' })
})

/**
 * GET /api/document/paper-workflow/tasks/:taskId
 *
 * Returns the current state of a paper generation task.
 */
router.get('/tasks/:taskId', requireAccountUser, (req, res) => {
  const task = getPaperTask(req.params.taskId)
  if (!task) {
    res.status(404).json({ error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    message: task.message,
    partialMarkdown: task.partialMarkdown,
    result: task.result,
    error: task.error,
  })
})

router.post('/tasks/:taskId/cancel', requireAccountUser, (req, res) => {
  const task = requestPaperTaskCancel(req.params.taskId)
  if (!task) {
    res.status(404).json({ error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    taskId: task.taskId,
    status: 'cancelled',
  })
})

/**
 * POST /api/document/paper-workflow/generate  (legacy synchronous endpoint — kept for tooling)
 *
 * @deprecated Use /start + GET /tasks/:taskId for long-running generation.
 */
router.post('/generate', requireAccountUser, async (req, res) => {
  const topic = String(req.body?.topic || '').trim()
  const paperType = String(req.body?.paperType || '').trim() as PaperWorkflowPaperType

  if (!topic) {
    res.status(400).json({ error: 'topic 不能为空' })
    return
  }

  if (!['research', 'review', 'thesis_research'].includes(paperType)) {
    res.status(400).json({ error: 'paperType 必须是 research / review / thesis_research' })
    return
  }

  try {
    const result = await runPaperWorkflowService({
      topic,
      paperType,
      language: req.body?.language === 'en' ? 'en' : 'zh',
      workspacePath: typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
      extraContext: typeof req.body?.extraContext === 'string' ? req.body.extraContext : undefined,
      yearFrom: typeof req.body?.yearFrom === 'string' ? req.body.yearFrom : undefined,
      yearTo: typeof req.body?.yearTo === 'string' ? req.body.yearTo : undefined,
      mode: typeof req.body?.mode === 'string' ? req.body.mode as PaperWorkflowMode : undefined,
    })
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '论文工作流失败'
    console.error('[document/paper-workflow/generate]', message)
    res.status(422).json({ error: message })
  }
})

export default router
