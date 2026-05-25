function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getWebApiBase(): string {
  const envUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL?.trim()
  if (envUrl) return trimTrailingSlash(envUrl)

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '3001') {
      return trimTrailingSlash(window.location.origin)
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const hostname = window.location.hostname || '127.0.0.1'
    return `${protocol}//${hostname}:3001`
  }

  return 'http://127.0.0.1:3001'
}

export function resolveWebApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${getWebApiBase()}${path.startsWith('/') ? path : `/${path}`}`
}
