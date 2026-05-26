const DEFAULT_BASE = 'http://127.0.0.1:8020'

export function getPaperRemakeBaseUrl(): string {
  return (process.env.PAPER_REMAKE_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '')
}

export class PaperRemakeClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message)
    this.name = 'PaperRemakeClientError'
  }
}

export async function paperRemakePostJson<T>(
  path: string,
  body: unknown,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 120_000
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${getPaperRemakeBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const text = await res.text()
    if (!res.ok) {
      throw new PaperRemakeClientError(text || res.statusText, res.status, text)
    }
    return JSON.parse(text) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function paperRemakeGetJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getPaperRemakeBaseUrl()}${path}`, {
    headers: { Accept: 'application/json' },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new PaperRemakeClientError(text || res.statusText, res.status, text)
  }
  return JSON.parse(text) as T
}

export async function paperRemakePostMultipart<T>(
  path: string,
  buildForm: (form: FormData) => void,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 120_000
  const form = new FormData()
  buildForm(form)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${getPaperRemakeBaseUrl()}${path}`, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    })
    const text = await res.text()
    if (!res.ok) {
      throw new PaperRemakeClientError(text || res.statusText, res.status, text)
    }
    return JSON.parse(text) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function paperRemakeHealth(): Promise<{ status: string }> {
  return paperRemakeGetJson('/health')
}
