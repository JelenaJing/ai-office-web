import { Router, type Request, type Response } from 'express'
import { requireAccountUser } from '../lib/authUser'
import { findBigIntPaths, stringifyJsonSafe, toJsonSafe } from '../lib/jsonSafe'
import {
  fetchInbox,
  fetchFolder,
  fetchFolderList,
  appendToFolder,
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
  saveFolderMappings,
  getFolderMappings,
  getFolderByRole,
  type StoredEmailAccount,
} from '../modules/email'
import type { Artifact } from '../artifacts/ArtifactStore'
import {
  createEmailTriageTask,
  getEmailTriageTask,
  requestEmailTriageCancel,
} from '../features/email/services/emailTriageTaskStore'
import { runEmailUnreadTriage } from '../features/email/services/emailTriageService'
import { assertWorkspaceAccess, WorkspaceAccessError } from '../lib/workspaceAccess'

const router = Router()
const EMAIL_JSONSAFE_VERSION = '2026-05-25-bigint-safe'

console.info(`[email-jsonsafe] version=${EMAIL_JSONSAFE_VERSION} loaded`)

function requestFieldAsString(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== 'object') return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getPayloadTopLevelKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []
  return Object.keys(payload as Record<string, unknown>).slice(0, 50)
}

function logEmailBigIntSerializationIssue(req: Request, payload: unknown, error: unknown): void {
  const accountId = requestFieldAsString(req.query, 'accountId')
    || requestFieldAsString(req.body, 'accountId')
    || requestFieldAsString(req.body, 'user')
  const folder = requestFieldAsString(req.query, 'folder') || requestFieldAsString(req.body, 'folder')
  console.error('[email-jsonsafe] serialization-error', stringifyJsonSafe({
    apiPath: req.path,
    accountId,
    folder,
    bigintPaths: findBigIntPaths(payload),
    payloadTopLevelKeys: getPayloadTopLevelKeys(payload),
    error: error instanceof Error ? error.message : String(error),
  }))
}

function sendEmailRouteError(req: Request, res: Response, error: unknown, status = 502): Response {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Do not know how to serialize a BigInt')) {
    console.error('[email-jsonsafe] route-catch-bigint', stringifyJsonSafe({
      apiPath: req.path,
      accountId: requestFieldAsString(req.query, 'accountId')
        || requestFieldAsString(req.body, 'accountId')
        || requestFieldAsString(req.body, 'user'),
      folder: requestFieldAsString(req.query, 'folder') || requestFieldAsString(req.body, 'folder'),
      error: message,
    }))
  }
  return sendEmailJson(req, res, { message }, status)
}

function sendEmailJson(req: Request, res: Response, payload: unknown, status?: number): Response {
  console.info(`[email-jsonsafe] path=${req.path} using sendEmailJson=true`)
  const bigintPaths = findBigIntPaths(payload)
  if (bigintPaths.length > 0) {
    const accountId = requestFieldAsString(req.query, 'accountId')
      || requestFieldAsString(req.body, 'accountId')
      || requestFieldAsString(req.body, 'user')
    const folder = requestFieldAsString(req.query, 'folder') || requestFieldAsString(req.body, 'folder')
    console.warn('[EmailJsonSafe] Sanitizing BigInt payload', stringifyJsonSafe({
      apiPath: req.path,
      accountId,
      folder,
      bigintPaths,
    }))
  }
  try {
    const response = status === undefined ? res : res.status(status)
    return response.json(toJsonSafe(payload))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Do not know how to serialize a BigInt')) {
      logEmailBigIntSerializationIssue(req, payload, error)
    } else {
      console.error('[email-jsonsafe] sendEmailJson-failed', stringifyJsonSafe({
        apiPath: req.path,
        payloadTopLevelKeys: getPayloadTopLevelKeys(payload),
        error: message,
      }))
    }
    return res.status(500).type('application/json').send(stringifyJsonSafe({
      message: '邮件接口 JSON 序列化失败',
      apiPath: req.path,
    }))
  }
}

function sendWorkspaceError(req: Request, res: Response, error: unknown): void {
  const workspaceError = error instanceof WorkspaceAccessError ? error : null
  if (workspaceError) {
    sendEmailJson(req, res, {
      success: false,
      code: workspaceError.code,
      error: workspaceError.message,
      bootstrap: workspaceError.bootstrap,
    }, workspaceError.status)
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  sendEmailJson(req, res, { success: false, error: message }, 500)
}

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
  sendEmailJson(req, res, maskAccount(getEmailAccount(userId)))
})

router.get('/accounts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = maskAccount(getEmailAccount(userId))
  sendEmailJson(req, res, {
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
    return sendEmailJson(req, res, { message: '请填写邮箱账号、密码、IMAP/SMTP 主机' }, 400)
  }
  const account: StoredEmailAccount = {
    user: String(body.user).trim(),
    email: String(body.email || body.user).trim(),
    username: String(body.username || body.user).trim(),
    password: String(body.password),
    displayName: String(body.displayName || body.user).trim(),
    provider: body.provider ? String(body.provider) : undefined,
    label: body.label ? String(body.label) : undefined,
    ownerUserId: userId,
    ownerUsername: body.ownerUsername ? String(body.ownerUsername) : undefined,
    status: body.status ? String(body.status) : 'connected',
    verified: typeof body.verified === 'boolean' ? body.verified : undefined,
    lastVerifiedAt: body.lastVerifiedAt ? String(body.lastVerifiedAt) : new Date().toISOString(),
    imapHost: String(body.imapHost).trim(),
    imapPort: Number(body.imapPort) || 993,
    imapSecure: body.imapSecure !== false,
    imapTlsMode: body.imapTlsMode,
    smtpHost: String(body.smtpHost).trim(),
    smtpPort: Number(body.smtpPort) || 465,
    smtpSecure: body.smtpSecure !== false,
    smtpTlsMode: body.smtpTlsMode,
    allowSelfSignedCerts: Boolean(body.allowSelfSignedCerts),
    isDefaultSend: true,
    isDefaultReceive: true,
  }
  saveEmailAccount(userId, account)
  sendEmailJson(req, res, maskAccount(account))
})

router.post('/test', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return sendEmailJson(req, res, { ok: false, message: '请先保存邮箱配置' }, 400)
  }
  try {
    const message = await testEmailAccount(account)
    sendEmailJson(req, res, { ok: true, message })
  } catch (err) {
    sendEmailRouteError(req, res, err)
  }
})

router.get('/folders', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return sendEmailJson(req, res, { ok: false, message: '请先配置邮箱账号' }, 400)
  }
  try {
    const force = req.query.force === 'true'
    let mappings = force ? [] : getFolderMappings(userId)
    if (mappings.length === 0) {
      console.log('[EmailFolders] Discovering folders for', account.user)
      mappings = await fetchFolderList(account)
      saveFolderMappings(userId, mappings)
      console.log('[EmailFolders] Saved', mappings.length, 'folder mappings for', account.user)
    }
    sendEmailJson(req, res, { ok: true, folders: mappings })
  } catch (err) {
    sendEmailRouteError(req, res, err)
  }
})

router.get('/messages', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return sendEmailJson(req, res, { message: '请先配置邮箱账号' }, 400)
  }
  try {
    const folderParam = String(req.query.folder || 'inbox').toLowerCase()
    const force = req.query.force === 'true'
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 50

    if (folderParam === 'inbox') {
      // inbox: use INBOX path directly or mapping
      const mapping = getFolderByRole(userId, 'inbox')
      const folderPath = mapping?.path || 'INBOX'
      const { mails, log } = await fetchFolder(account, folderPath, { limit, force })
      console.log('[EmailRoute] inbox sync:', stringifyJsonSafe(log))
      return sendEmailJson(req, res, { messages: mails, syncLog: log })
    }

    // For other folders, lookup mapping first; trigger discovery if missing
    let mappings = getFolderMappings(userId)
    if (mappings.length === 0) {
      console.log('[EmailRoute] No folder mappings, triggering discovery for', account.user)
      mappings = await fetchFolderList(account)
      saveFolderMappings(userId, mappings)
      console.log('[EmailRoute] Discovered', mappings.length, 'folders for', account.user)
    }

    const roleMap: Record<string, string> = {
      sent: 'sent', drafts: 'drafts', trash: 'trash', junk: 'junk', archive: 'archive',
    }
    const role = roleMap[folderParam]
    if (!role) {
      return sendEmailJson(req, res, { messages: [], info: `未知 folder: ${folderParam}` })
    }

    const mapping = mappings.find((m) => m.role === role)
    if (!mapping) {
      return sendEmailJson(req, res, {
        messages: [],
        folderDiscovery: mappings.map((m) => ({ role: m.role, path: m.path })),
        info: `服务器未发现 role=${role} 的文件夹。已发现: ${mappings.map((m) => `${m.role}(${m.path})`).join(', ')}`,
      })
    }

    const { mails, log } = await fetchFolder(account, mapping.path, { limit, force })
    console.log(`[EmailRoute] ${role} sync:`, stringifyJsonSafe(log))
    return sendEmailJson(req, res, { messages: mails, syncLog: log, folderPath: mapping.path })
  } catch (err) {
    sendEmailRouteError(req, res, err)
  }
})

router.get('/messages/:id', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return sendEmailJson(req, res, { message: '请先配置邮箱账号' }, 400)
  }
  try {
    const message = await fetchMessage(account, req.params.id)
    sendEmailJson(req, res, { message })
  } catch (err) {
    sendEmailRouteError(req, res, err, 404)
  }
})

router.post('/messages/:id/attachments/:attachmentId/artifact', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const account = getEmailAccount(userId)
  if (!account) {
    return sendEmailJson(req, res, { success: false, error: '请先配置邮箱账号' }, 400)
  }
  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(req, res, error)
    return
  }
  try {
    const attachment = await fetchMessageAttachment(account, req.params.id, req.params.attachmentId)
    const saved = createEmailAttachmentArtifact({
      userId,
      workspacePath: access.workspacePath,
      emailId: req.params.id,
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: attachment.content,
    })
    sendEmailJson(req, res, { success: true, artifact: saved.artifact, relationship: saved.relationship })
  } catch (err) {
    sendEmailRouteError(req, res, err)
  }
})

router.post('/attachments/artifacts', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(req, res, error)
    return
  }
  const emailId = String(req.body?.emailId || 'manual').trim()
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : []
  if (attachments.length === 0) {
    return sendEmailJson(req, res, { success: false, error: 'attachments 不能为空' }, 400)
  }
  const saved: EmailSavedArtifact[] = attachments.map((attachment: unknown, index: number) => {
    const item = attachment && typeof attachment === 'object' ? attachment as Record<string, unknown> : {}
    const filename = String(item.filename || `email-attachment-${index + 1}.txt`)
    const content = typeof item.contentBase64 === 'string'
      ? Buffer.from(item.contentBase64, 'base64')
      : Buffer.from(String(item.textContent || ''), 'utf-8')
    return createEmailAttachmentArtifact({
      userId,
      workspacePath: access.workspacePath,
      emailId,
      filename,
      contentType: typeof item.contentType === 'string' ? item.contentType : undefined,
      content,
    })
  })
  sendEmailJson(req, res, {
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
    return sendEmailJson(req, res, { ok: false, message: '请先配置邮箱账号' }, 400)
  }
  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string }
  if (!to?.trim() || !subject?.trim()) {
    return sendEmailJson(req, res, { ok: false, message: '收件人与主题不能为空' }, 400)
  }
  try {
    const { messageId, raw } = await sendPlainEmail(account, {
      to: to.trim(),
      subject: subject.trim(),
      body: String(body || ''),
    })

    // Discover folders if needed, then APPEND to sent folder
    let appendWarning: string | undefined
    try {
      let mappings = getFolderMappings(userId)
      if (mappings.length === 0) {
        mappings = await fetchFolderList(account)
        saveFolderMappings(userId, mappings)
      }
      const sentMapping = mappings.find((m) => m.role === 'sent')
      if (sentMapping) {
        const appendResult = await appendToFolder(account, sentMapping.path, raw, messageId)
        console.log(`[EmailSend] APPEND to ${sentMapping.path}: appended=${appendResult.appended} duplicate=${appendResult.duplicate}`)
      } else {
        appendWarning = '未找到已发送文件夹 mapping，跳过 APPEND'
        console.warn('[EmailSend]', appendWarning, '可用 folders:', mappings.map((m) => `${m.role}(${m.path})`).join(', '))
      }
    } catch (appendErr) {
      appendWarning = appendErr instanceof Error ? appendErr.message : String(appendErr)
      console.warn('[EmailSend] APPEND 失败（邮件已发送）:', appendWarning)
    }

    sendEmailJson(req, res, { ok: true, message: '发送成功', appendWarning })
  } catch (err) {
    sendEmailRouteError(req, res, err)
  }
})

router.post('/drafts/dry-run', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const recipients = resolveDryRunRecipients(req.body?.recipients ?? req.body?.rawRecipients)
  sendEmailJson(req, res, {
    success: true,
    dryRun: true,
    recipients,
    partialMissing: ['bulk send execution remains manual approval only on Web'],
  })
})

router.post('/drafts/artifact', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(req, res, error)
    return
  }
  const to = String(req.body?.to || '').trim()
  const subject = String(req.body?.subject || '').trim()
  const body = String(req.body?.body || '')
  if (!to || !subject) {
    return sendEmailJson(req, res, { success: false, error: 'to 和 subject 不能为空' }, 400)
  }
  const saved = createEmailDraftArtifact({
    userId,
    workspacePath: access.workspacePath,
    emailId: typeof req.body?.emailId === 'string' ? req.body.emailId : undefined,
    to,
    subject,
    body,
  })
  sendEmailJson(req, res, {
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
    return sendEmailJson(req, res, { success: false, error: '请先配置邮箱账号' }, 400)
  }

  let access
  try {
    access = assertWorkspaceAccess(userId, typeof req.body?.workspacePath === 'string' ? req.body.workspacePath : undefined, 'editor')
  } catch (error) {
    sendWorkspaceError(req, res, error)
    return
  }

  const task = createEmailTriageTask()

  void runEmailUnreadTriage({
    taskId: task.taskId,
    account,
    userId,
    limit: Number(req.body?.limit) || 20,
    messageIds: Array.isArray(req.body?.messageIds)
      ? req.body.messageIds.map((id: unknown) => String(id)).filter(Boolean)
      : undefined,
    force: req.body?.force === true,
    isCancelled: () => Boolean(getEmailTriageTask(task.taskId)?.cancelRequested),
  })
    .catch((error) => {
      console.warn('[EmailTriageRoute] runEmailUnreadTriage failed:', error instanceof Error ? error.message : String(error))
    })

  return sendEmailJson(req, res, { success: true, taskId: task.taskId, status: 'running' })
})

router.get('/triage/tasks/:taskId', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const task = getEmailTriageTask(req.params.taskId)
  if (!task) {
    return sendEmailJson(req, res, { success: false, error: '任务不存在或已过期' }, 404)
  }
  return sendEmailJson(req, res, {
    success: true,
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    message: task.message,
    jobs: task.jobs,
    summary: task.summary,
    unreadOnly: task.unreadOnly,
    sourceMessageCount: task.sourceMessageCount,
    promptVersion: task.promptVersion,
    modelUnavailable: task.modelUnavailable,
    error: task.error,
  })
})

router.post('/triage/tasks/:taskId/cancel', async (req, res) => {
  const userId = await requireAccountUser(req, res)
  if (!userId) return
  const task = requestEmailTriageCancel(req.params.taskId)
  if (!task) {
    return sendEmailJson(req, res, { success: false, error: '任务不存在或已过期' }, 404)
  }
  return sendEmailJson(req, res, { success: true, taskId: task.taskId, status: 'cancelled' })
})

export default router
