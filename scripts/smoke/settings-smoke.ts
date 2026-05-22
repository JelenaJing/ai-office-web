import { smokeHttp, type SmokeContext } from './smoke-utils'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function hasSecretShapedKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
    if (/apiKey|api_key|secret|password|token/i.test(key) && typeof nested === 'string' && nested.length > 0) {
      return true
    }
    return hasSecretShapedKey(nested)
  })
}

export default async function runSettingsSmoke(ctx: SmokeContext): Promise<void> {
  await smokeHttp(ctx, 'settings', 'GET', '/api/auth/me', 'auth/me returns current user without exposing secrets', {
    accept: (res) => res.ok && !hasSecretShapedKey(res.body),
    actual: (res) => `HTTP ${res.status}`,
  })

  await smokeHttp(ctx, 'settings', 'GET', '/api/settings/ai', 'AI settings view masks provider key', {
    accept: (res) => res.ok && asRecord(res.body).hasApiKey !== undefined && !hasSecretShapedKey(res.body),
    actual: (res) => `HTTP ${res.status} provider=${String(asRecord(res.body).provider || '')} hasApiKey=${String(asRecord(res.body).hasApiKey)}`,
  })

  await smokeHttp(ctx, 'settings', 'POST', '/api/settings/ai/test', 'AI connection test succeeds or returns explicit provider failure without key leak', {
    accept: (res) => (res.ok || res.status === 502) && !hasSecretShapedKey(res.body),
    actual: (res) => `HTTP ${res.status} ok=${String(asRecord(res.body).ok)}`,
  })

  await smokeHttp(ctx, 'settings', 'GET', '/api/settings/parity-status', 'settings parity status returns partial gaps without key leak', {
    accept: (res) => res.ok && asRecord(res.body).status === 'partial' && !hasSecretShapedKey(res.body),
    actual: (res) => `HTTP ${res.status} status=${String(asRecord(res.body).status || '')}`,
  })
}
