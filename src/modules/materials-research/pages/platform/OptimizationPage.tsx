import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function OptimizationPage() {
  return (
    <TenantPlaceholderPage
      title="AI 工艺优化"
      description="参数空间、实验矩阵、结果分析与下一轮推荐。"
      bullets={["籽晶粘贴优化任务", "参数敏感性图", "推荐实验矩阵 R1–R6", "生成实验计划"]}
    />
  );
}
