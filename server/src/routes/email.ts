import { Router } from 'express'
import { requireAccountUser } from '../lib/authUser'
import {
  fetchInbox,
  fetchMessage,
  fetchMessageAttachment,
  getEmailAccount,
  maskAccount,
  createEmailAttachmentArtifact,
  createEmailDraftArtifact,
  resolveDryRunRecipients,
  saveEmailAccount,
  sendPlainEmail,
  testEmailAccount,
  type StoredEmailAccount,
} from '../modules/email'
import type { Artifact } from '../artifacts/ArtifactStore'
import {
  createEmailTriageTask,
  getEmailTriageTask,
  requestEmailTriageCancel,
  updateEmailTriageTask,
} from '../features/email/services/emailTriageTaskStore'
import { runEmailUnreadTriage } from '../features/email/services/emailTriageService'

const router = Router()

interface EmailSavedArtifact {
  artifact: Artifact
  relationship: {
    emailId: string
    artifactId: string
    relation: 'email_draft' | 'attachment'
    filename?: string
  }
}

router.get('/account', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  res.json(maskAccount(getEmailAccount(userId)))
})

router.get('/accounts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = maskAccount(getEmailAccount(userId))
  res.json({
    configured: account.configured,
    accounts: account.configured ? [account] : [],
    manualSetupNeeded: !account.configured,
  })
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

router.post('/messages/:id/attachments/:attachmentId/artifact', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return res.status(400).json({ success: false, error: '请先配置邮箱账号' })
  }
  const workspacePath = String(req.body?.workspacePath || '').trim()
  if (!workspacePath) {
    return res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
  }
  try {
    const attachment = await fetchMessageAttachment(account, req.params.id, req.params.attachmentId)
    const saved = createEmailAttachmentArtifact({
      userId,
      workspacePath,
      emailId: req.params.id,
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: attachment.content,
    })
    res.json({ success: true, artifact: saved.artifact, relationship: saved.relationship })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ success: false, error: msg })
  }
})

router.post('/attachments/artifacts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const workspacePath = String(req.body?.workspacePath || '').trim()
  const emailId = String(req.body?.emailId || 'manual').trim()
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : []
  if (!workspacePath) {
    return res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
  }
  if (attachments.length === 0) {
    return res.status(400).json({ success: false, error: 'attachments 不能为空' })
  }
  const saved: EmailSavedArtifact[] = attachments.map((attachment: unknown, index: number) => {
    const item = attachment && typeof attachment === 'object' ? attachment as Record<string, unknown> : {}
    const filename = String(item.filename || `email-attachment-${index + 1}.txt`)
    const content = typeof item.contentBase64 === 'string'
      ? Buffer.from(item.contentBase64, 'base64')
      : Buffer.from(String(item.textContent || ''), 'utf-8')
    return createEmailAttachmentArtifact({
      userId,
      workspacePath,
      emailId,
      filename,
      contentType: typeof item.contentType === 'string' ? item.contentType : undefined,
      content,
    })
  })
  res.json({
    success: true,
    artifacts: saved.map((item) => item.artifact),
    relationships: saved.map((item) => item.relationship),
  })
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

router.post('/drafts/dry-run', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const recipients = resolveDryRunRecipients(req.body?.recipients ?? req.body?.rawRecipients)
  res.json({
    success: true,
    dryRun: true,
    recipients,
    partialMissing: ['bulk send execution remains manual approval only on Web'],
  })
})

router.post('/drafts/artifact', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const workspacePath = String(req.body?.workspacePath || '').trim()
  const to = String(req.body?.to || '').trim()
  const subject = String(req.body?.subject || '').trim()
  const body = String(req.body?.body || '')
  if (!workspacePath) {
    return res.status(400).json({ success: false, error: 'workspacePath 不能为空' })
  }
  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'to 和 subject 不能为空' })
  }
  const saved = createEmailDraftArtifact({
    userId,
    workspacePath,
    emailId: typeof req.body?.emailId === 'string' ? req.body.emailId : undefined,
    to,
    subject,
    body,
  })
  res.json({
    success: true,
    artifact: saved.artifact,
    relationship: saved.relationship,
  })
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
    userId,
    workspacePath: typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined,
    limit: Number(req.body?.limit) || 20,
    isCancelled: () => Boolean(getEmailTriageTask(task.taskId)?.cancelRequested),
    onStep: (message, progress, results, metadata) => updateEmailTriageTask(task.taskId, {
      status: 'running',
      message,
      progress,
      results,
      cacheKey: metadata?.cacheKey,
      sourceMessageCount: metadata?.sourceMessageCount ?? results.length,
    }),
  })
    .then((results) => {
      if (getEmailTriageTask(task.taskId)?.cancelRequested) return
      updateEmailTriageTask(task.taskId, {
        status: 'completed',
          progress: 100,
          message: '未读邮件整理完成',
          results,
          sourceMessageCount: results.length,
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
    cacheKey: task.cacheKey,
    unreadOnly: task.unreadOnly,
    sourceMessageCount: task.sourceMessageCount,
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
