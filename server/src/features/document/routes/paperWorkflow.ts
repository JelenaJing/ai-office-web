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
  updatePaperTask,
} from '../services/paperTaskStore'

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
  updatePaperTask(task.taskId, { status: 'running', message: `正在启动${label}链路…`, progress: 5 })

  // Fire-and-forget: run generation in background
  runPaperWorkflowService({
    topic,
    paperType,
    language: req.body?.language === 'en' ? 'en' : 'zh',
    extraContext: typeof req.body?.extraContext === 'string' ? req.body.extraContext : undefined,
    yearFrom: typeof req.body?.yearFrom === 'string' ? req.body.yearFrom : undefined,
    yearTo: typeof req.body?.yearTo === 'string' ? req.body.yearTo : undefined,
    mode: typeof req.body?.mode === 'string' ? req.body.mode as PaperWorkflowMode : undefined,
    onStep: (step, message, progress) => {
      updatePaperTask(task.taskId, { status: 'running', message, progress })
    },
  })
    .then((result) => {
      updatePaperTask(task.taskId, {
        status: 'completed',
        progress: 100,
        message: paperType === 'review' ? '文献综述链路已完成' : '研究文章链路已完成',
        result: {
          title: result.title,
          markdown: result.markdown,
          html: result.html,
          paperType: result.paperType,
          diagnostics: result.diagnostics,
        },
      })
    })
    .catch((error) => {
      const msg = error instanceof Error ? error.message : '论文工作流失败'
      console.error('[document/paper-workflow/start]', msg)
      updatePaperTask(task.taskId, { status: 'failed', message: msg, error: msg })
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

