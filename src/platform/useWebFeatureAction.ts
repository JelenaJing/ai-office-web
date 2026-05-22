import type { SceneFeatureStatus } from '../components/scene/SceneFeatureRow'
import { isWebShim } from './detect'
import { getWebFeatureStatus, runWebFeatureAction, type WebFeatureKey } from './featureGate'

export { runWebFeatureAction }

/** Scene row status for a gated Web feature. */
export function sceneStatusForWebFeature(key: WebFeatureKey): SceneFeatureStatus {
  if (!isWebShim()) return 'available'
  return getWebFeatureStatus(key).enabled ? 'available' : 'comingSoon'
}
