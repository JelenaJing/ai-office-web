import type { TenantId } from "../lib/types";

/** 主站嵌入：固定通用租户，不展示机构切换 */
export const appMode = {
  lockedTenantId: "generic" as TenantId,
  tenantSwitcherEnabled: false,
  isDeliveryBuild: true,
} as const;

export function resolveTenantId(_preferred?: TenantId): TenantId {
  return "generic";
}
