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

const router = Router()

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
  updateDeckTask(task.taskId, { status: 'running', message: '正在启动 PPT DeckDocument 任务…', progress: 5 })

  void createDeckFromPrompt({
    userId,
    workspacePath,
    title,
    prompt,
    templateId: typeof req.body?.templateId === 'string' ? req.body.templateId : undefined,
    source: req.body?.source === 'manuscript' || req.body?.source === 'matter' ? req.body.source : 'topic',
    isCancelled: () => Boolean(getDeckTask(task.taskId)?.cancelRequested),
    onStep: (message, progress) => updateDeckTask(task.taskId, { status: 'running', message, progress }),
  })
    .then((result) => {
      if (getDeckTask(task.taskId)?.cancelRequested) return
      updateDeckTask(task.taskId, {
        deckId: result.deckId,
        status: 'completed',
        progress: 100,
        message: 'PPT DeckDocument 任务已完成',
        result,
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      const cancelled = error instanceof Error && error.name === 'PptDeckTaskCancelledError'
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
    diagnostics: {
      chain: 'web-deck-document-runtime',
      steps: ['retemplate:metadata-only'],
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
