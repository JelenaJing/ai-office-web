import type { Project, Tenant } from "../lib/types";

/** 主站嵌入模式：仅保留通用租户，隐藏机构定制信息 */
export const tenants: Tenant[] = [
  {
    id: "generic",
    name: "材料智能研发工作台",
    shortName: "科研工作台",
    description: "文献、实验、配方与数据分析一体化研发环境",
    domains: ["polymer", "battery", "generic-materials"],
    defaultProjectId: "project-generic-materials",
    branding: {
      platformTitle: "材料智能研发工作台",
      platformTagline: "创意发现 · 实验记录 · 数据可视化",
      heroTitle: "科研工作台",
      heroSubtitle:
        "统一管理文献订阅、研究创意、实验记录与模板化科研图表，支撑从想法到验证的完整闭环。",
    },
  },
];

export const projects: Project[] = [
  {
    id: "project-generic-materials",
    tenantId: "generic",
    name: "默认研发课题",
    subtitle: "高分子 · 电池材料 · 交叉方向",
  },
];

export function getTenant(id: string) {
  return tenants.find((t) => t.id === id) ?? tenants[0];
}

export function getProjectsForTenant(tenantId: string) {
  return projects.filter((p) => p.tenantId === tenantId);
}

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}
