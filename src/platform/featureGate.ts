/**
 * Web feature gate — prevents silent use of Electron-only capabilities in Web mode.
 */

import { isWebShim } from './detect'

export type WebFeatureKey =
  | 'files'
  | 'artifacts'
  | 'docx.generate'
  | 'knowledge'
  | 'excel.analysis'
  | 'ppt.generate'
  | 'pdf.process'
  | 'email'
  | 'calendar'
  | 'daily.report'
  | 'image.generate'
  | 'settings.ai'

interface FeatureDef {
  label: string
  enabled: boolean
  message: string
}

const WEB_FEATURE_DEFS: Record<WebFeatureKey, FeatureDef> = {
  files: {
    label: '我的文件',
    enabled: true,
    message: '',
  },
  artifacts: {
    label: '生成记录',
    enabled: true,
    message: '',
  },
  'docx.generate': {
    label: '文稿生成',
    enabled: true,
    message: '',
  },
  knowledge: {
    label: '知识库',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'excel.analysis': {
    label: '数据分析',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'ppt.generate': {
    label: 'PPT 生成',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'pdf.process': {
    label: 'PDF 处理',
    enabled: false,
    message: 'Web 版即将开放',
  },
  email: {
    label: '邮件收发',
    enabled: false,
    message: 'Web 版即将开放',
  },
  calendar: {
    label: '日程管理',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'daily.report': {
    label: '日报 / 审计文稿',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'image.generate': {
    label: '图片生成',
    enabled: false,
    message: 'Web 版即将开放',
  },
  'settings.ai': {
    label: 'AI 设置',
    enabled: false,
    message: 'Web 版即将开放',
  },
}

/** In Electron mode all features are considered available at the gate layer. */
export function isWebFeatureEnabled(key: WebFeatureKey): boolean {
  if (!isWebShim()) return true
  return WEB_FEATURE_DEFS[key]?.enabled ?? false
}

export function getWebFeatureStatus(key: WebFeatureKey): {
  enabled: boolean
  label: string
  message: string
} {
  if (!isWebShim()) {
    const def = WEB_FEATURE_DEFS[key]
    return { enabled: true, label: def?.label ?? key, message: '' }
  }
  const def = WEB_FEATURE_DEFS[key]
  const enabled = def?.enabled ?? false
  return {
    enabled,
    label: def?.label ?? key,
    message: enabled ? '' : (def?.message ?? 'Web 版即将开放'),
  }
}

/** Run action only when the feature is enabled on Web; otherwise invoke onBlocked. */
export function runWebFeatureAction(
  key: WebFeatureKey,
  onEnabled: () => void,
  onBlocked?: (message: string) => void,
): void {
  if (!isWebShim()) {
    onEnabled()
    return
  }
  const status = getWebFeatureStatus(key)
  if (status.enabled) {
    onEnabled()
  } else {
    onBlocked?.(status.message)
  }
}
