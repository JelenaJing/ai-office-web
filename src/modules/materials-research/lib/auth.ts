import type { User } from "../types/user";

export function getDefaultRoute(user: User): string {
  if (user.role === "admin") return "/research/admin/users";
  if (user.role === "teacher") return "/research/teacher/dashboard";
  if (user.role === "print_rd") return "/research/print-rd/dashboard";
  if (user.role === "student") return "/research/dashboard";
  return "/login";
}

export function directionLabel(direction?: string): string {
  const map: Record<string, string> = {
    polymer: "聚合物方向",
    battery: "电池材料方向",
    polymer_battery: "聚合物-电池交叉",
    other: "其他方向",
  };
  return map[direction ?? ""] ?? "未设置方向";
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: "管理员",
    teacher: "老师",
    student: "学生",
    print_rd: "3D打印材料研发",
  };
  return map[role] ?? role;
}
