/**
 * runtimeEnv.ts — 运行时环境检测
 *
 * 判断当前运行在 web 浏览器还是 Electron 桌面环境。
 * 规则：若 window.electronAPI 已被 Electron preload 注入，则为 desktop；否则为 web。
 */

export type RuntimeEnv = 'web' | 'desktop'

export function getRuntimeEnv(): RuntimeEnv {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { electronAPI?: unknown }).electronAPI !== undefined
  ) {
    return 'desktop'
  }
  return 'web'
}

export const isWeb = (): boolean => getRuntimeEnv() === 'web'
export const isDesktop = (): boolean => getRuntimeEnv() === 'desktop'
