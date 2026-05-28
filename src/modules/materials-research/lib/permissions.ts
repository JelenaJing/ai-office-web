import type { User, UserRole } from "../types/user";

export function canAccessRoute(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function canEditDatabase(user: User | null): boolean {
  return user?.role === "teacher" || user?.role === "admin";
}

export function canReviewEln(user: User | null): boolean {
  return user?.role === "teacher" || user?.role === "admin";
}

export function hasPolymerModules(user: User | null): boolean {
  if (!user || user.role !== "student") return false;
  const d = user.researchDirection;
  return d === "polymer" || d === "polymer_battery";
}

export function hasBatteryModules(user: User | null): boolean {
  if (!user || user.role !== "student") return false;
  const d = user.researchDirection;
  return d === "battery" || d === "polymer_battery";
}
