import { expect, type APIRequestContext } from '@playwright/test'
import { apiGet, type AuthSession } from './auth'

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export async function pollApiTask(
  request: APIRequestContext,
  session: AuthSession,
  pathname: string,
  options: {
    timeoutMs?: number
    intervalMs?: number
    completed?: (body: Record<string, unknown>) => boolean
  } = {},
): Promise<Record<string, unknown>> {
  const timeoutMs = options.timeoutMs ?? 120_000
  const intervalMs = options.intervalMs ?? 1_500
  const startedAt = Date.now()
  let lastBody: Record<string, unknown> = {}

  while (Date.now() - startedAt < timeoutMs) {
    const result = await apiGet<Record<string, unknown>>(request, session, pathname)
    lastBody = asRecord(result.body)
    expect(result.ok, `task polling failed for ${pathname}: HTTP ${result.status} ${result.text}`).toBeTruthy()
    if (options.completed ? options.completed(lastBody) : lastBody.status === 'completed') {
      return lastBody
    }
    if (lastBody.status === 'failed' || lastBody.status === 'cancelled') {
      return lastBody
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`task polling timed out for ${pathname}; last=${JSON.stringify(lastBody).slice(0, 600)}`)
}

export async function artifactExists(
  request: APIRequestContext,
  session: AuthSession,
  artifactId: string,
): Promise<Record<string, unknown>> {
  const result = await apiGet<{ artifact?: Record<string, unknown> }>(request, session, `/api/artifacts/${artifactId}`)
  expect(result.ok, `artifact detail failed for ${artifactId}: HTTP ${result.status} ${result.text}`).toBeTruthy()
  expect(result.body.artifact?.id).toBe(artifactId)
  return asRecord(result.body.artifact)
}
