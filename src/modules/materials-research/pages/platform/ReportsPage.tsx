import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function ReportsPage() {
  return (
    <TenantPlaceholderPage
      title="报告生成中心"
      description="组会 PPT、项目申报、质检与工艺优化报告一键生成。"
      bullets={["报告模板按租户筛选", "Markdown 预览", "数据来源勾选", "导出 Word / PDF（演示）"]}
    />
  );
}
