import { Router } from 'express'
import { requireAccountUser } from '../lib/authUser'
import {
  fetchInbox,
  fetchMessage,
  getEmailAccount,
  maskAccount,
  saveEmailAccount,
  sendPlainEmail,
  testEmailAccount,
  type StoredEmailAccount,
} from '../modules/email'
import {
  createEmailTriageTask,
  getEmailTriageTask,
  requestEmailTriageCancel,
  updateEmailTriageTask,
} from '../features/email/services/emailTriageTaskStore'
import { runEmailUnreadTriage } from '../features/email/services/emailTriageService'

const router = Router()

router.get('/account', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json(maskAccount(getEmailAccount(userId)))
})

router.post('/account', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const body = req.body as StoredEmailAccount
  if (!body?.user || !body?.password || !body?.imapHost || !body?.smtpHost) {
    return res.status(400).json({ message: '请填写邮箱账号、密码、IMAP/SMTP 主机' })
  }
  const account: StoredEmailAccount = {
    user: String(body.user).trim(),
    password: String(body.password),
    displayName: String(body.displayName || body.user).trim(),
    imapHost: String(body.imapHost).trim(),
    imapPort: Number(body.imapPort) || 993,
    imapSecure: body.imapSecure !== false,
    smtpHost: String(body.smtpHost).trim(),
    smtpPort: Number(body.smtpPort) || 465,
    smtpSecure: body.smtpSecure !== false,
    allowSelfSignedCerts: Boolean(body.allowSelfSignedCerts),
  }
  saveEmailAccount(userId, account)
  res.json(maskAccount(account))
})

router.post('/test', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ ok: false, message: '请先保存邮箱配置' })
  }
  try {
    const message = await testEmailAccount(account)
    res.json({ ok: true, message })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ ok: false, message: msg })
  }
})

router.get('/messages', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ message: '请先配置邮箱账号' })
  }
  try {
    const folder = String(req.query.folder || 'inbox')
    if (folder !== 'inbox') {
      return res.json({ messages: [] })
    }
    const messages = await fetchInbox(account)
    res.json({ messages })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ message: msg })
  }
})

router.get('/messages/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ message: '请先配置邮箱账号' })
  }
  try {
    const message = await fetchMessage(account, req.params.id)
    res.json({ message })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(404).json({ message: msg })
  }
})

router.post('/send', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ ok: false, message: '请先配置邮箱账号' })
  }
  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string }
  if (!to?.trim() || !subject?.trim()) {
    return res.status(400).json({ ok: false, message: '收件人与主题不能为空' })
  }
  try {
    await sendPlainEmail(account, {
      to: to.trim(),
      subject: subject.trim(),
      body: String(body || ''),
    })
    res.json({ ok: true, message: '发送成功' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ ok: false, message: msg })
  }
})

router.post('/triage/start', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ success: false, error: '请先配置邮箱账号' })
  }

  const task = createEmailTriageTask()
  updateEmailTriageTask(task.taskId, {
    status: 'running',
    progress: 5,
    message: '正在启动未读邮件 AI 整理任务…',
  })

  void runEmailUnreadTriage({
    account,
    limit: Number(req.body?.limit) || 20,
    isCancelled: () => Boolean(getEmailTriageTask(task.taskId)?.cancelRequested),
    onStep: (message, progress, results) => updateEmailTriageTask(task.taskId, {
      status: 'running',
      message,
      progress,
      results,
    }),
  })
    .then((results) => {
      if (getEmailTriageTask(task.taskId)?.cancelRequested) return
      updateEmailTriageTask(task.taskId, {
        status: 'completed',
        progress: 100,
        message: '未读邮件整理完成',
        results,
      })
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      const cancelled = error instanceof Error && error.name === 'EmailTriageCancelledError'
      updateEmailTriageTask(task.taskId, {
        status: cancelled ? 'cancelled' : 'failed',
        message,
        error: cancelled ? undefined : message,
      })
    })

  return res.json({ success: true, taskId: task.taskId, status: 'running' })
})

router.get('/triage/tasks/:taskId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const task = getEmailTriageTask(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: '任务不存在或已过期' })
  }
  return res.json({
    success: true,
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    message: task.message,
    results: task.results,
    error: task.error,
  })
})

router.post('/triage/tasks/:taskId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const task = requestEmailTriageCancel(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: '任务不存在或已过期' })
  }
  return res.json({ success: true, taskId: task.taskId, status: 'cancelled' })
})

export default router
