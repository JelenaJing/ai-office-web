import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { getDefaultRoute } from "../../lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "student" && !onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  if (user) return <Navigate to={getDefaultRoute(user)} replace />;
  return <>{children}</>;
}
