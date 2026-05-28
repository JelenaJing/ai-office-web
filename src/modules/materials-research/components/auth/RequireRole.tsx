import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import type { UserRole } from "../../types/user";
import { canAccessRoute } from "../../lib/permissions";

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  if (!canAccessRoute(user, roles)) {
    return <Navigate to="/research/forbidden" replace />;
  }
  return <>{children}</>;
}
