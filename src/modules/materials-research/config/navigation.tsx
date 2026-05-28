import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Atom,
  Beaker,
  Battery,
  FlaskConical,
  FileText,
  BookOpen,
  Network,
  FileOutput,
} from "lucide-react";
import type { TenantId } from "../lib/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const genericNav: NavGroup[] = [
  { label: "", items: [{ to: "/dashboard", label: "研发总览", icon: LayoutDashboard }] },
  {
    label: "材料研发",
    items: [
      { to: "/polymer/monomers", label: "单体知识库", icon: Atom },
      { to: "/polymer/recommendation", label: "配方推荐", icon: Beaker },
      { to: "/battery/hard-carbon", label: "硬碳选材库", icon: Battery },
      { to: "/battery/testing", label: "电池数据分析", icon: FlaskConical },
    ],
  },
  {
    label: "知识与实验",
    items: [
      { to: "/knowledge/literature", label: "文献与专利库", icon: FileText },
      { to: "/eln", label: "实验记录 ELN", icon: BookOpen },
    ],
  },
  {
    label: "创新输出",
    items: [
      { to: "/innovation-map", label: "创新图谱", icon: Network },
      { to: "/outputs", label: "项目输出", icon: FileOutput },
    ],
  },
];

export function getNavGroups(_tenantId: TenantId): NavGroup[] {
  return genericNav;
}

export function getAllowedPaths(_tenantId: TenantId): string[] {
  const paths = new Set<string>(["/settings"]);
  for (const group of genericNav) {
    for (const item of group.items) {
      paths.add(item.to);
    }
  }
  return [...paths];
}

export function isPathAllowedForTenant(pathname: string, tenantId: TenantId): boolean {
  const allowed = getAllowedPaths(tenantId);
  if (allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}
