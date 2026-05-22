export async function getSettingsParityStatus(): Promise<{
  status: string
  accountCenter: Record<string, unknown>
  ai: Record<string, unknown>
  emailConfig: Record<string, unknown>
  partialMissing?: string[]
}> {
  const token = typeof window === 'undefined'
    ? null
    : window.localStorage.getItem('aios_auth_token')
      ?? window.localStorage.getItem('aios_itoken')
      ?? window.localStorage.getItem('ai_office_internal_token')
  const response = await fetch('/api/settings/parity-status', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as {
    success?: boolean
    status?: string
    accountCenter?: Record<string, unknown>
    ai?: Record<string, unknown>
    emailConfig?: Record<string, unknown>
    partialMissing?: string[]
    error?: string
    message?: string
  }
  if (!response.ok || !body.success) throw new Error(body.error || body.message || `设置状态获取失败 (${response.status})`)
  return {
    status: body.status || 'partial',
    accountCenter: body.accountCenter || {},
    ai: body.ai || {},
    emailConfig: body.emailConfig || {},
    partialMissing: body.partialMissing,
  }
}
