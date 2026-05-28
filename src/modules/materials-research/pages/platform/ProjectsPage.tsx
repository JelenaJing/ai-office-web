import { Link } from "react-router-dom";
import { appMode } from "../../config/appMode";
import { tenants, projects } from "../../config/tenants";
import { useTenantStore, useActiveTenant } from "../../store/tenantStore";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";

export function ProjectsPage() {
  const { setTenant, setProject } = useTenantStore();
  const activeTenant = useActiveTenant();

  const visibleTenants = appMode.lockedTenantId
    ? tenants.filter((t) => t.id === appMode.lockedTenantId)
    : tenants;

  return (
    <div className="space-y-6">
      <PageHeader
        title="项目工作台"
        description={
          appMode.isDeliveryBuild
            ? `${activeTenant.name}当前在研项目与工艺包。`
            : "同一套平台底座，通过不同知识包与工艺模板支撑多个材料方向与客户项目。"
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {visibleTenants.map((tenant) => {
          const tenantProjects = projects.filter((p) => p.tenantId === tenant.id);
          return (
            <SectionCard key={tenant.id} title={tenant.name} subtitle={tenant.description}>
              <ul className="space-y-3">
                {tenantProjects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!appMode.lockedTenantId) setTenant(tenant.id);
                        setProject(p.id);
                      }}
                      className="w-full rounded-lg border border-slate-100 px-4 py-3 text-left text-sm hover:border-primary/30 hover:bg-primary/5"
                    >
                      <p className="font-medium text-slate-800">{p.name}</p>
                      <p className="mt-1 text-xs text-muted">{p.subtitle}</p>
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
                进入总览 →
              </Link>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
