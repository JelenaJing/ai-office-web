import type { Artifact } from '../../../platform'

function token(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

function headers(): Record<string, string> {
  const t = token()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function generateDailyReport(params: {
  date: string
  workspacePath: string
}): Promise<{ artifact: Artifact; partialMissing?: string[] }> {
  const qs = new URLSearchParams({ date: params.date, workspacePath: params.workspacePath })
  const response = await fetch(`/api/work-report/daily?${qs.toString()}`, { headers: headers() })
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as {
    success?: boolean
    artifact?: Artifact
    error?: string
    message?: string
    partialMissing?: string[]
  }
  if (!response.ok || !body.success || !body.artifact) {
    throw new Error(body.error || body.message || `日报生成失败 (${response.status})`)
  }
  return { artifact: body.artifact, partialMissing: body.partialMissing }
}
