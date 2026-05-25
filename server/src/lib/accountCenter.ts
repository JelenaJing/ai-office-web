export const DEFAULT_ACCOUNT_CENTER_BASE_URL = 'http://127.0.0.1:13100'
export const ACCOUNT_CENTER_UNREACHABLE_CODE = 'ACCOUNT_CENTER_UNREACHABLE'
export const ACCOUNT_CENTER_UNREACHABLE_MESSAGE = '账号中心服务不可达，请检查 ACCOUNT_CENTER_BASE_URL 和 13100 服务'

export type AccountCenterErrorType =
  | 'ECONNREFUSED'
  | 'ETIMEDOUT'
  | 'ENOTFOUND'
  | '5xx'
  | 'CORS'
  | 'UNKNOWN'

export function getAccountCenterBaseUrl(): string {
  const configured =
    process.env.ACCOUNT_CENTER_BASE_URL?.trim()
    || process.env.ACCOUNT_CENTER_URL?.trim()
    || DEFAULT_ACCOUNT_CENTER_BASE_URL

  return configured.replace(/\/+$/, '')
}

export function buildAccountCenterUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getAccountCenterBaseUrl()}${normalizedPath}`
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const record = error as Record<string, unknown>
  const directCode = typeof record.code === 'string' ? record.code : ''
  if (directCode) return directCode
  const cause = record.cause
  if (!cause || typeof cause !== 'object') return ''
  return typeof (cause as Record<string, unknown>).code === 'string'
    ? String((cause as Record<string, unknown>).code)
    : ''
}

function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '')
  return raw.replace(/\s+/g, ' ').trim()
}

export function classifyAccountCenterError(error: unknown, status?: number): AccountCenterErrorType {
  if (typeof status === 'number' && status >= 500) return '5xx'

  const code = getErrorCode(error).toUpperCase()
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return code
  if (code === 'ABORT_ERR') return 'ETIMEDOUT'

  const message = getErrorMessage(error).toUpperCase()
  if (message.includes('ECONNREFUSED')) return 'ECONNREFUSED'
  if (message.includes('ETIMEDOUT') || message.includes('TIMEOUT') || message.includes('ABORT')) return 'ETIMEDOUT'
  if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN') || message.includes('DNS')) return 'ENOTFOUND'
  if (message.includes('CORS') || message.includes('FAILED TO FETCH')) return 'CORS'
  return 'UNKNOWN'
}

export function logAccountCenterIssue(input: {
  scope: string
  method: string
  path: string
  baseUrl?: string
  status?: number
  error?: unknown
}): void {
  const baseUrl = input.baseUrl || getAccountCenterBaseUrl()
  const errorType = classifyAccountCenterError(input.error, input.status)
  const statusPart = typeof input.status === 'number' ? ` status=${input.status}` : ''
  const message = getErrorMessage(input.error)
  const messagePart = message ? ` message=${message}` : ''
  console.error(
    `[${input.scope}] baseUrl=${baseUrl} path=${input.path} method=${input.method} errorType=${errorType}${statusPart}${messagePart}`,
  )
}
