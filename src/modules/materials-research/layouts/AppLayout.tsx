import { NavLink, Outlet } from "react-router-dom";
import { Settings } from "lucide-react";
import clsx from "clsx";
import { getNavGroups } from "../config/navigation";
import { useActiveTenant, useActiveProject, useTenantStore } from "../store/tenantStore";
import { useAppStore } from "../store/appStore";
import { FileUploadButton } from "../components/common/FileUploadButton";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { uploadLiteratureFile } from "../services/upload";
import { runAction } from "../hooks/usePlatformActions";
import { useUiStore } from "../store/uiStore";
import { appMode } from "../config/appMode";
import { TenantSwitcher } from "../components/layout/TenantSwitcher";
import { useTenantRouteGuard } from "../hooks/useTenantRouteGuard";

export function AppLayout() {
  const tenant = useActiveTenant();
  const project = useActiveProject();
  const tenantId = useTenantStore((s) => s.tenantId);
  const { currentUser } = useAppStore();
  const { createExperiment } = usePlatformActions();
  const showMessage = useUiStore((s) => s.showMessage);
  const navGroups = getNavGroups(tenantId);

  useTenantRouteGuard();

  const handleUpload = async (file: File) => {
    const res = await runAction(() => uploadLiteratureFile(file, { sourceType: "文献" }));
    if (res) showMessage("上传完成", res.message, res.fileName);
  };

  const projectLabel = project?.name ?? "当前项目";

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-10 flex h-full w-60 flex-col border-r border-slate-200 bg-primary text-white">
        <div className="border-b border-white/10 p-5">
          <h1 className="text-sm font-bold leading-tight">{tenant.branding.platformTitle}</h1>
          <p className="mt-1 text-xs text-white/70">{tenant.branding.platformTagline}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.label || "main"} className="mb-4">
              {group.label && (
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/50">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <NavLink
          to="/settings"
          className="flex items-center gap-2 border-t border-white/10 px-5 py-4 text-sm text-white/70 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          系统设置
        </NavLink>
      </aside>

      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {appMode.isDeliveryBuild && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {tenant.name}
              </span>
            )}
            <TenantSwitcher />
            <span>
              <span className="text-muted">当前项目：</span>
              <span className="font-medium text-slate-800">{projectLabel}</span>
            </span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-success">
              本地知识库已同步
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted">{currentUser}</span>
            <FileUploadButton label="上传文献" variant="outline" onFile={handleUpload} className="!py-1.5" />
            <button
              type="button"
              onClick={() => createExperiment()}
              className="rounded-lg border border-primary px-3 py-1.5 text-xs text-primary hover:bg-primary/5"
            >
              创建实验
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
