export const DEFAULT_ACCOUNT_CENTER_BASE_URL = 'http://127.0.0.1:13100'
export const ACCOUNT_CENTER_UNREACHABLE_CODE = 'ACCOUNT_CENTER_UNREACHABLE'
export const ACCOUNT_CENTER_UNREACHABLE_MESSAGE = '账号中心服务不可达，请检查 ACCOUNT_CENTER_BASE_URL 和 13100 服务'

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
