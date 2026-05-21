export { detectPlatform, isWebShim } from './detect'
export {
  isWebFeatureEnabled,
  getWebFeatureStatus,
  runWebFeatureAction,
} from './featureGate'
export type { WebFeatureKey } from './featureGate'
export { sceneStatusForWebFeature } from './useWebFeatureAction'
export type {
  PlatformApi,
  UserInfo,
  AuthResult,
  WorkspaceInfo,
  FileEntry,
  Artifact,
  ArtifactExport,
  SkillInfo,
  SkillInput,
  SkillResult,
} from './types'

import { detectPlatform } from './detect'
import { electronPlatformApi } from './electronPlatformApi'
import { webPlatformApi } from './webPlatformApi'
import type { PlatformApi } from './types'

/**
 * The active platform API singleton, resolved once at module load time.
 *
 * Usage:
 *   import { platformApi } from '@/platform'
 *   await platformApi.auth.login(email, password)
 */
export const platformApi: PlatformApi =
  detectPlatform() === 'electron' ? electronPlatformApi : webPlatformApi
