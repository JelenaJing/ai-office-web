function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getWebApiBase(): string {
  const envUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL?.trim()
  if (envUrl) return trimTrailingSlash(envUrl)

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '3001') {
      // Running directly on the backend port — use absolute origin
      return trimTrailingSlash(window.location.origin)
    }
    // Running on any other port (e.g. Vite dev server :5173, or production nginx).
    // Return empty string so all /api/* requests are sent as relative URLs.
    // The Vite proxy (or reverse proxy) then forwards them to the backend.
    // This avoids direct cross-origin requests to port 3001 that may be blocked.
    return ''
  }

  return 'http://127.0.0.1:3001'
}

export function resolveWebApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${getWebApiBase()}${path.startsWith('/') ? path : `/${path}`}`
}
