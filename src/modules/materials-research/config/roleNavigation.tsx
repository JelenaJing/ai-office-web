import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Database,
  Sparkles,
  FileBarChart,
  Settings,
  Beaker,
  LineChart,
  BookOpen,
  Newspaper,
  Battery,
  FlaskConical,
  Boxes,
  FlaskRound,
  Search,
  LineChart as ChartIcon,
  Lightbulb,
} from "lucide-react";
import type { User } from "../types/user";
import { hasBatteryModules, hasPolymerModules } from "../lib/permissions";

export interface RoleNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface RoleNavGroup {
  label: string;
  items: RoleNavItem[];
}

export function getTeacherNav(): RoleNavGroup[] {
  return [
    { label: "", items: [{ to: "/research/teacher/dashboard", label: "课题组总览", icon: LayoutDashboard }] },
    { label: "管理", items: [{ to: "/research/teacher/students", label: "学生进展", icon: Users }] },
    {
      label: "审核",
      items: [{ to: "/research/teacher/eln-review", label: "实验记录审核", icon: ClipboardCheck }],
    },
    {
      label: "数据库管理",
      items: [
        { to: "/research/teacher/databases", label: "数据库总览", icon: Database },
        { to: "/research/teacher/databases/experiments", label: "实验记录库", icon: BookOpen },
        { to: "/research/teacher/databases/papers", label: "论文库", icon: Newspaper },
        { to: "/research/teacher/databases/monomers", label: "单体库", icon: Beaker },
        { to: "/research/teacher/databases/polymers", label: "聚合物库", icon: FlaskConical },
        { to: "/research/teacher/databases/reactions", label: "反应库", icon: Sparkles },
        { to: "/research/teacher/databases/battery-materials", label: "电池材料库", icon: Battery },
      ],
    },
    {
      label: "输出",
      items: [
        { to: "/research/teacher/recommendation-center", label: "推荐与分析", icon: Sparkles },
        { to: "/research/teacher/reports", label: "报告生成", icon: FileBarChart },
        { to: "/research/teacher/settings", label: "系统设置", icon: Settings },
      ],
    },
  ];
}

export function getStudentNav(user: User): RoleNavGroup[] {
  const items: RoleNavGroup[] = [
    { label: "", items: [{ to: "/research/dashboard", label: "我的首页", icon: LayoutDashboard }] },
  ];

  if (hasPolymerModules(user)) {
    items.push({
      label: "聚合物研发",
      items: [
        { to: "/research/polymer/formulation-recommendation", label: "配方推荐", icon: Beaker },
        { to: "/research/polymer/property-prediction", label: "性能预测", icon: LineChart },
      ],
    });
  }

  if (hasBatteryModules(user)) {
    items.push({
      label: "电池材料",
      items: [
        { to: "/research/battery/performance-prediction", label: "电池性能预测", icon: Battery },
        { to: "/research/battery/material-recommendation", label: "材料与配方推荐", icon: FlaskConical },
      ],
    });
  }

  items.push({
    label: "智能分析",
    items: [
      { to: "/research/ideas", label: "创意 Feed", icon: Lightbulb },
      { to: "/research/plot", label: "模板画图", icon: ChartIcon },
    ],
  });

  items.push(
    {
      label: "实验记录",
      items: [{ to: "/research/eln/my-records", label: "实验记录 ELN", icon: BookOpen }],
    },
    {
      label: "文献与推荐",
      items: [{ to: "/research/literature/recommendations", label: "每日论文推荐", icon: Newspaper }],
    },
    {
      label: "数据库",
      items: [{ to: "/research/databases", label: "数据库", icon: Database }],
    }
  );

  return items;
}

export function getAdminNav(): RoleNavGroup[] {
  return [
    { label: "", items: [{ to: "/research/admin/users", label: "用户管理", icon: Users }] },
    { label: "系统", items: [{ to: "/research/admin/roles", label: "角色权限", icon: Settings }] },
  ];
}

export function getPrintRdNav(): RoleNavGroup[] {
  return [
    { label: "", items: [{ to: "/research/print-rd/dashboard", label: "研发工作台", icon: LayoutDashboard }] },
    {
      label: "知识库",
      items: [
        { to: "/research/print-rd/knowledge", label: "资料检索", icon: Search },
        { to: "/research/print-rd/materials", label: "原料库", icon: Boxes },
        { to: "/research/print-rd/experiments", label: "实验记录", icon: FlaskRound },
        { to: "/research/print-rd/formulation", label: "配方推荐", icon: Sparkles },
        { to: "/research/print-rd/performance", label: "性能关联", icon: ChartIcon },
      ],
    },
    {
      label: "工具",
      items: [{ to: "/research/print-rd/eln", label: "实验记录 ELN", icon: BookOpen }],
    },
  ];
}

export function getRoleNav(user: User): RoleNavGroup[] {
  if (user.role === "teacher") return getTeacherNav();
  if (user.role === "admin") return getAdminNav();
  if (user.role === "print_rd") return getPrintRdNav();
  return getStudentNav(user);
}
