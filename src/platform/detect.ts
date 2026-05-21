export type Platform = 'electron' | 'web'

/**
 * Detects the current runtime environment.
 *
 * Web 入口会先安装 electronAPI shim（带 __isWebShim）。
 * 必须先判断 shim，否则会误判为 Electron 并加载 electronPlatformApi。
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'

  const api = (window as { electronAPI?: { __isWebShim?: boolean } }).electronAPI

  if (api && api.__isWebShim === true) {
    return 'web'
  }

  if (api) {
    return 'electron'
  }

  return 'web'
}

/** True when running in browser with the electronAPI compatibility shim. */
export function isWebShim(): boolean {
  return detectPlatform() === 'web' && (window as { electronAPI?: unknown }).electronAPI !== undefined
}
