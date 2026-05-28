import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isPathAllowedForTenant } from "../config/navigation";
import { useTenantStore } from "../store/tenantStore";

/** 切换租户后，若当前路由不在该租户菜单内，则回到总览 */
export function useTenantRouteGuard() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPathAllowedForTenant(pathname, tenantId)) {
      navigate("/dashboard", { replace: true });
    }
  }, [tenantId, pathname, navigate]);
}
