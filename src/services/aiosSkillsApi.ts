import { resolveWebApiUrl } from '../runtime/apiBase'
import { isLegacyHiddenSkillId } from '../app/capabilities'

const PRIMARY_TOKEN_KEY = 'aios_auth_token'
const LEGACY_TOKEN_KEYS = ['aios_itoken', 'ai_office_internal_token'] as const

export interface AiosSkillMetadata {
  id: string
  name: string
  description: string
  type: string
  runner: string
  inputTypes: string[]
  outputTypes: string[]
  entryFile: string
  outputFile: string
  uiPlacement?: string[]
}

function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem(PRIMARY_TOKEN_KEY)
    ?? LEGACY_TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean)
    ?? null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 正式 Skill 目录：仅来自服务端 /api/aios-skills。 */
export async function fetchAiosSkills(): Promise<AiosSkillMetadata[]> {
  const res = await fetch(resolveWebApiUrl('/api/aios-skills'), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }))
    const message =
      (payload as { message?: string; error?: string }).message
      ?? (payload as { error?: string }).error
      ?? res.statusText
    throw new Error(message)
  }
  const data = await res.json() as { success?: boolean; skills?: AiosSkillMetadata[] }
  const skills = data.skills ?? []
  return skills.filter(skill => skill.id && !isLegacyHiddenSkillId(skill.id))
}
