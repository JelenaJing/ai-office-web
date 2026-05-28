import type { PrimarySection } from '../components/nav/PrimaryNav'
import { DEFAULT_APP_ROUTE } from '../config/productFeatures'

/** 已下线事项中心：旧路径解析为首页（避免直链白屏）。 */
const LEGACY_MATTER_CENTER_PATH_PREFIXES = [
  '/aios',
  '/matters',
  '/matter',
  '/aios-matters',
] as const

/** Web 产品区 pathname ↔ PrimarySection 映射（已登录 App Shell 内使用）。 */
export const WEB_SECTION_ROUTE_MAP: Partial<Record<PrimarySection, string>> = {
  home: '/home',
  work: '/work',
  research: '/research',
  study: '/study',
  life: '/life',
  resource: '/resource',
  chat: '/chat',
  settings: '/settings',
  account: '/account',
  'skill-center': '/skills',
  calendar: '/calendar',
  'html-ppt': '/ppt',
  'document-studio': '/document',
  'ai4science-battery': '/ai4science/battery',
}

export function defaultPrimarySection(): PrimarySection {
  return DEFAULT_APP_ROUTE.replace(/^\//, '') as PrimarySection
}

/** 事项中心已下线：导航与编程式跳转统一回落到首页。 */
export function normalizePrimarySection(section: PrimarySection): PrimarySection {
  if (section === 'aios') return defaultPrimarySection()
  return section
}

function isLegacyMatterCenterPath(pathname: string): boolean {
  return LEGACY_MATTER_CENTER_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** 带子路由的产品区：pathname 前缀命中即视为该区（如 /research/recommend）。 */
const SECTION_PATH_PREFIXES: Partial<Record<PrimarySection, string>> = {
  research: '/research',
}

export function resolvePrimarySectionFromPathname(pathname: string): PrimarySection {
  const fallback = defaultPrimarySection()
  const normalizedPath = pathname.replace(/\/+$/, '') || DEFAULT_APP_ROUTE

  if (isLegacyMatterCenterPath(normalizedPath)) {
    return fallback
  }

  for (const [section, prefix] of Object.entries(SECTION_PATH_PREFIXES) as [PrimarySection, string][]) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      return section
    }
  }

  const matchedEntry = Object.entries(WEB_SECTION_ROUTE_MAP).find(([, path]) => path === normalizedPath)
  return (matchedEntry?.[0] as PrimarySection | undefined) ?? fallback
}

/** 从当前浏览器地址解析 PrimarySection（有 window 时始终读 pathname，避免误判为默认区）。 */
export function resolvePrimarySectionFromLocation(): PrimarySection {
  if (typeof window === 'undefined') {
    return defaultPrimarySection()
  }
  return resolvePrimarySectionFromPathname(window.location.pathname)
}

export function getRouteForPrimarySection(section: PrimarySection): string | undefined {
  return WEB_SECTION_ROUTE_MAP[section]
}

/** 主导航高亮：html-ppt 无独立 nav 项时高亮「行政」。 */
export function isPrimaryNavItemActive(navSection: PrimarySection, currentSection: PrimarySection): boolean {
  if (currentSection === 'html-ppt' && navSection === 'work') return true
  if (currentSection === 'document-studio' && navSection === 'work') return true
  if (currentSection === 'ai4science-battery' && navSection === 'work') return true
  return currentSection === navSection
}
