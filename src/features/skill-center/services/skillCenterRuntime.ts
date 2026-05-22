function token(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function headers(json = false): Record<string, string> {
  const t = token()
  const h: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  if (t) h.Authorization = `Bearer ${t}`
  return h
}

export async function getSkillCenterStatus(): Promise<{
  status: string
  remoteStoreUrl: string | null
  capabilities: Record<string, unknown>
  partialMissing?: string[]
}> {
  const response = await fetch('/api/skill-center/status', { headers: headers() })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as {
    success?: boolean
    status?: string
    remoteStoreUrl?: string | null
    capabilities?: Record<string, unknown>
    partialMissing?: string[]
    error?: string
  }
  if (!response.ok || !body.success) throw new Error(body.error || `Skill Center 状态获取失败 (${response.status})`)
  return {
    status: body.status || 'partial',
    remoteStoreUrl: body.remoteStoreUrl ?? null,
    capabilities: body.capabilities || {},
    partialMissing: body.partialMissing,
  }
}

export async function startSkillJob(skillId: string, input: Record<string, unknown>): Promise<string> {
  const response = await fetch('/api/skill-center/jobs/start', {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ skillId, input }),
  })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as {
    success?: boolean
    jobId?: string
    error?: string
  }
  if (!response.ok || !body.success || !body.jobId) throw new Error(body.error || `Skill 任务启动失败 (${response.status})`)
  return body.jobId
}
