import { Router } from 'express'
import { requireAccountUser } from '../../../lib/authUser'
import {
  analyzeFormalTemplate,
  generateFormalTemplate,
  runFormalTemplateWorkflow,
  listPresets,
} from '../services/formalTemplateService'
import {
  createFormalTemplateTask,
  getFormalTemplateTask,
  requestFormalTemplateTaskCancel,
  updateFormalTemplateTask,
} from '../services/formalTemplateTaskStore'

const router = Router()

/**
 * GET /api/document/formal-template/presets
 * Returns list of available preset formal document templates.
 */
router.get('/presets', requireAccountUser, (_req, res) => {
  res.json({ success: true, presets: listPresets() })
})

/**
 * POST /api/document/formal-template/analyze
 *
 * Analyzes a formal template and returns extracted fields.
 * Body: { presetId?: string, customTemplateText?: string, instruction?: string }
 * Returns: { success, presetId, presetLabel, templateText, fields, defaultSections, diagnostics }
 */
router.post('/analyze', requireAccountUser, async (req, res) => {
  try {
    const result = await analyzeFormalTemplate({
      presetId: req.body.presetId,
      customTemplateText: req.body.customTemplateText,
      instruction: req.body.instruction,
    })

    if (!result.success) {
      res.status(422).json(result)
      return
    }

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[formal-template/analyze]', message)
    res.status(500).json({ success: false, error: `分析失败：${message}` })
  }
})

/**
 * POST /api/document/formal-template/start
 *
 * Starts an async formal-template task.
 */
router.post('/start', requireAccountUser, async (req, res) => {
  const instruction = String(req.body?.instruction ?? '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: '必须提供 instruction（文稿要求）' })
    return
  }

  const presetId = typeof req.body?.presetId === 'string' ? req.body.presetId : undefined
  const task = createFormalTemplateTask(presetId || 'formal-template')
  updateFormalTemplateTask(task.taskId, {
    status: 'running',
    step: 'analyze',
    message: '正在启动正式模板链路…',
    progress: 5,
  })

  void runFormalTemplateWorkflow(
    {
      presetId,
      customTemplateText: typeof req.body?.customTemplateText === 'string' ? req.body.customTemplateText : undefined,
      instruction,
      language: req.body?.language === 'en' ? 'en' : 'zh',
      fieldOverrides: req.body?.fieldOverrides && typeof req.body.fieldOverrides === 'object'
        ? req.body.fieldOverrides as Record<string, string>
        : undefined,
      extraContext: typeof req.body?.extraContext === 'string' ? req.body.extraContext : undefined,
      workspacePath: typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
    },
    {
      onStep: (step) => {
        updateFormalTemplateTask(task.taskId, {
          status: 'running',
          step: step.step,
          message: step.message,
          progress: step.progress,
          partialMarkdown: step.partialMarkdown,
          partialHtml: step.partialHtml,
        })
      },
      isCancelled: () => Boolean(getFormalTemplateTask(task.taskId)?.cancelRequested),
    },
  )
    .then((result) => {
      const current = getFormalTemplateTask(task.taskId)
      if (current?.cancelRequested) return

      if (!result.success) {
        const statusCode = result.code === 'FT_CANCELLED' ? 'cancelled' : 'failed'
        updateFormalTemplateTask(task.taskId, {
          status: statusCode,
          step: statusCode,
          message: result.error,
          error: result.error,
        })
        return
      }

      updateFormalTemplateTask(task.taskId, {
        status: 'completed',
        step: 'completed',
        progress: 100,
        message: `${result.presetLabel}链路已完成`,
        partialMarkdown: result.markdown,
        partialHtml: result.html,
        result: {
          title: result.title,
          markdown: result.markdown,
          html: result.html,
          presetId: result.presetId,
          presetLabel: result.presetLabel,
          templateKind: result.templateKind,
          runtimeKind: result.runtimeKind,
          resolvedFields: result.resolvedFields,
          previewMetadata: result.previewMetadata,
          commitMetadata: result.commitMetadata,
          artifact: result.artifact,
          diagnostics: result.diagnostics,
        },
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[formal-template/start]', message)
      updateFormalTemplateTask(task.taskId, {
        status: 'failed',
        step: 'failed',
        message,
        error: message,
      })
    })

  res.json({
    success: true,
    taskId: task.taskId,
    presetId: presetId || null,
    status: 'running',
  })
})

/**
 * GET /api/document/formal-template/tasks/:taskId
 */
router.get('/tasks/:taskId', requireAccountUser, (req, res) => {
  const task = getFormalTemplateTask(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }

  res.json({
    success: true,
    taskId: task.taskId,
    presetId: task.presetId,
    status: task.status,
    progress: task.progress,
    step: task.step,
    message: task.message,
    partialMarkdown: task.partialMarkdown,
    partialHtml: task.partialHtml,
    result: task.result,
    error: task.error,
  })
})

/**
 * POST /api/document/formal-template/tasks/:taskId/cancel
 */
router.post('/tasks/:taskId/cancel', requireAccountUser, (req, res) => {
  const task = requestFormalTemplateTaskCancel(req.params.taskId)
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已过期' })
    return
  }
  res.json({
    success: true,
    taskId: task.taskId,
    status: 'cancelled',
  })
})

/**
 * POST /api/document/formal-template/generate
 *
 * Generates a filled formal template document.
 * Body: {
 *   presetId?: string,
 *   customTemplateText?: string,
 *   instruction: string,
 *   language?: 'zh' | 'en',
 *   fieldOverrides?: Record<string, string>,
 *   extraContext?: string,
 *   workspacePath?: string
 * }
 * Returns: { success, title, markdown, html, presetId, presetLabel, resolvedFields, diagnostics }
 */
router.post('/generate', requireAccountUser, async (req, res) => {
  const instruction = String(req.body.instruction ?? '').trim()
  if (!instruction) {
    res.status(400).json({ success: false, error: '必须提供 instruction（文稿要求）' })
    return
  }

  try {
    const result = await generateFormalTemplate({
      presetId: req.body.presetId,
      customTemplateText: req.body.customTemplateText,
      instruction,
      language: req.body.language,
      fieldOverrides: req.body.fieldOverrides,
      extraContext: req.body.extraContext,
      workspacePath: req.body.workspacePath,
    })

    if (!result.success) {
      const statusCode = result.code === 'FT_LLM_NOT_CONFIGURED' ? 503 : 422
      res.status(statusCode).json(result)
      return
    }

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[formal-template/generate]', message)
    res.status(500).json({ success: false, error: `正式模板生成失败：${message}` })
  }
})

export default router
