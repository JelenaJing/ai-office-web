import { isWebShim } from './detect'

/** Shown when a control still depends on Electron-only APIs on Web. */
export const WEB_MIGRATION_HINT = 'Web 版正在迁移'

export function isWebPlatform(): boolean {
  return isWebShim()
}

export function webMigrationLabel(feature?: string): string {
  return feature ? `${WEB_MIGRATION_HINT}：${feature}` : WEB_MIGRATION_HINT
}
