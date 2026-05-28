import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appMode, resolveTenantId } from "../config/appMode";
import { getProject, getTenant } from "../config/tenants";
import type { TenantId } from "../lib/types";

const initialTenantId = resolveTenantId("generic");
const initialProjectId = getTenant(initialTenantId).defaultProjectId;

interface TenantState {
  tenantId: TenantId;
  projectId: string;
  setTenant: (tenantId: TenantId) => void;
  setProject: (projectId: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: initialTenantId,
      projectId: initialProjectId,
      setTenant: (tenantId) => {
        if (appMode.lockedTenantId) return;
        const tenant = getTenant(tenantId);
        set({ tenantId, projectId: tenant.defaultProjectId });
      },
      setProject: (projectId) => {
        const project = getProject(projectId);
        if (!project) return;
        if (appMode.lockedTenantId && project.tenantId !== appMode.lockedTenantId) return;
        set({ projectId, tenantId: project.tenantId });
      },
    }),
    {
      name: appMode.lockedTenantId ? `amp-tenant-${appMode.lockedTenantId}` : "amp-tenant",
      partialize: (state) =>
        appMode.lockedTenantId
          ? { projectId: state.projectId }
          : { tenantId: state.tenantId, projectId: state.projectId },
      merge: (persisted, current) => {
        const p = persisted as Partial<TenantState> | undefined;
        const locked = appMode.lockedTenantId;
        if (locked) {
          return {
            ...current,
            tenantId: locked,
            projectId: p?.projectId ?? getTenant(locked).defaultProjectId,
          };
        }
        return {
          ...current,
          tenantId: (p?.tenantId as TenantId) ?? current.tenantId,
          projectId: p?.projectId ?? current.projectId,
        };
      },
    }
  )
);

export function useActiveTenant() {
  const tenantId = useTenantStore((s) => s.tenantId);
  return getTenant(resolveTenantId(tenantId));
}

export function useActiveProject() {
  const projectId = useTenantStore((s) => s.projectId);
  return getProject(projectId);
}
