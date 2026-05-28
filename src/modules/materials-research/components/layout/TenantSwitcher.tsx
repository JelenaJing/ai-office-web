import { appMode } from "../../config/appMode";
import { tenants, getProjectsForTenant } from "../../config/tenants";
import { useTenantStore, useActiveTenant, useActiveProject } from "../../store/tenantStore";

/** 仅开发/演示构建显示；客户交付包中不渲染 */
export function TenantSwitcher() {
  if (!appMode.tenantSwitcherEnabled) {
    return null;
  }

  const { tenantId, projectId, setTenant, setProject } = useTenantStore();
  const tenant = useActiveTenant();
  const project = useActiveProject();
  const projectOptions = getProjectsForTenant(tenantId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">租户</span>
        <select
          value={tenantId}
          onChange={(e) => setTenant(e.target.value as typeof tenantId)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.shortName}
            </option>
          ))}
        </select>
      </label>
      {projectOptions.length > 1 && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">项目</span>
          <select
            value={projectId}
            onChange={(e) => setProject(e.target.value)}
            className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800"
          >
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 sm:inline">
        开发模式
      </span>
      <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 sm:inline">
        {tenant.shortName}
        {project ? ` · ${project.subtitle}` : ""}
      </span>
    </div>
  );
}
