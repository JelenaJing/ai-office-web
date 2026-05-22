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

export default router
