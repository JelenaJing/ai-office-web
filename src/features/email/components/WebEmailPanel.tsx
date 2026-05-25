import { useCallback, useEffect, useMemo, useState } from 'react'
import { platformApi } from '../../../platform'
import type {
  EmailAccountInput,
  EmailAccountState,
  EmailMessageDetail,
  EmailMessageSummary,
} from '../../../platform'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpInput, MvpLabel, MvpPage, MvpTextArea, MvpTitle,
} from '../../../components/web/WebMvpLayout'
import styled from 'styled-components'
import { sanitizeHtmlForDisplay } from '../utils/emailHtmlDisplay'

const Split = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`

const ListBox = styled.div`
  background: #fff;
  border: 1px solid #e2e8f2;
  border-radius: 12px;
  max-height: 480px;
  overflow-y: auto;
`

const ListItem = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #eef2f7;
  background: ${p => (p.$active ? '#eef4ff' : '#fff')};
  cursor: pointer;
  font-size: 12px;
  &:hover { background: #f5f8fc; }
`

export default function WebEmailPanel() {
  const [account, setAccount] = useState<EmailAccountState | null>(null)
  const [config, setConfig] = useState<EmailAccountInput>({
    user: '',
    password: '',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    smtpSecure: true,
  })
  const [messages, setMessages] = useState<EmailMessageSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<EmailMessageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' })

  const loadAccount = useCallback(async () => {
    try {
      const a = await platformApi.email.getAccount()
      setAccount(a)
      if (a.user) {
        setConfig(c => ({
          ...c,
          user: a.user ?? c.user,
          imapHost: a.imapHost ?? c.imapHost,
          smtpHost: a.smtpHost ?? c.smtpHost,
        }))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载账号失败')
    }
  }, [])

  const loadInbox = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await platformApi.email.listMessages('inbox')
      setMessages(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '拉取收件箱失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAccount() }, [loadAccount])

  useEffect(() => {
    if (account?.configured) void loadInbox()
  }, [account?.configured, loadInbox])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void platformApi.email.getMessage(selectedId).then(setDetail).catch((e) => {
      setError(e instanceof Error ? e.message : '加载邮件失败')
    })
  }, [selectedId])

  const detailHtml = useMemo(
    () => (detail?.bodyHtml || detail?.htmlBody ? sanitizeHtmlForDisplay(detail.bodyHtml || detail.htmlBody || '').html : ''),
    [detail],
  )

  const saveAccount = async () => {
    setError(null)
    try {
      const a = await platformApi.email.saveAccount(config)
      setAccount(a)
      await loadInbox()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }

  const testConnection = async () => {
    setError(null)
    try {
      await platformApi.email.saveAccount(config)
      const r = await platformApi.email.testConnection()
      if (!r.ok) setError(r.message)
      else setError(null)
      alert(r.ok ? `连接成功：${r.message}` : r.message)
      await loadAccount()
      if (r.ok) await loadInbox()
    } catch (e) {
      setError(e instanceof Error ? e.message : '测试失败')
    }
  }

  const sendMail = async () => {
    setError(null)
    try {
      const r = await platformApi.email.sendMessage(compose)
      if (!r.ok) setError(r.message ?? '发送失败')
      else {
        setCompose({ to: '', subject: '', body: '' })
        alert('邮件已发送')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    }
  }

  if (!account?.configured) {
    return (
      <MvpPage>
        <MvpCard>
          <MvpTitle>邮箱配置</MvpTitle>
          <MvpHint>凭据仅保存在服务器，浏览器不存储密码。</MvpHint>
          {error && <MvpError>{error}</MvpError>}
          <MvpLabel>邮箱账号</MvpLabel>
          <MvpInput value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} />
          <MvpLabel>密码</MvpLabel>
          <MvpInput type="password" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })} />
          <MvpLabel>IMAP 主机 / 端口</MvpLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <MvpInput value={config.imapHost} onChange={e => setConfig({ ...config, imapHost: e.target.value })} />
            <MvpInput type="number" value={config.imapPort} onChange={e => setConfig({ ...config, imapPort: Number(e.target.value) })} style={{ width: 90 }} />
          </div>
          <MvpLabel>SMTP 主机 / 端口</MvpLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <MvpInput value={config.smtpHost} onChange={e => setConfig({ ...config, smtpHost: e.target.value })} />
            <MvpInput type="number" value={config.smtpPort} onChange={e => setConfig({ ...config, smtpPort: Number(e.target.value) })} style={{ width: 90 }} />
          </div>
          <MvpBtn onClick={() => void saveAccount()}>保存配置</MvpBtn>
          <MvpBtn onClick={() => void testConnection()}>测试连接</MvpBtn>
        </MvpCard>
      </MvpPage>
    )
  }

  return (
    <MvpPage>
      <MvpTitle style={{ marginBottom: 12 }}>邮件</MvpTitle>
      {error && <MvpError>{error}</MvpError>}
      <MvpHint>附件发送后续接入。账号：{account.user}</MvpHint>
      <Split>
        <ListBox>
          {loading && <MvpHint style={{ padding: 12 }}>加载中…</MvpHint>}
          {!loading && messages.length === 0 && <MvpHint style={{ padding: 12 }}>收件箱为空</MvpHint>}
          {messages.map(m => (
            <ListItem key={m.id} $active={selectedId === m.id} onClick={() => setSelectedId(m.id)}>
              <strong>{m.subject || '（无主题）'}</strong>
              <div>{m.from}</div>
              <div style={{ color: '#8094a8' }}>{m.preview?.slice(0, 60)}</div>
            </ListItem>
          ))}
        </ListBox>
        <MvpCard>
          {detail ? (
            <>
              <MvpTitle style={{ fontSize: 15 }}>{detail.subject}</MvpTitle>
              <MvpHint>发件人：{detail.from} · {detail.timestamp}</MvpHint>
              {detail.bodyHtml || detail.htmlBody ? (
                <iframe
                  title="邮件正文"
                  srcDoc={detailHtml}
                  sandbox="allow-same-origin"
                  style={{ width: '100%', minHeight: 320, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}
                />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{detail.bodyText || detail.body}</pre>
              )}
            </>
          ) : (
            <MvpHint>选择一封邮件查看详情</MvpHint>
          )}
          <hr />
          <MvpTitle style={{ fontSize: 15 }}>发送邮件</MvpTitle>
          <MvpLabel>收件人</MvpLabel>
          <MvpInput value={compose.to} onChange={e => setCompose({ ...compose, to: e.target.value })} />
          <MvpLabel>主题</MvpLabel>
          <MvpInput value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })} />
          <MvpLabel>正文</MvpLabel>
          <MvpTextArea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })} />
          <MvpBtn onClick={() => void sendMail()}>发送</MvpBtn>
        </MvpCard>
      </Split>
    </MvpPage>
  )
}
