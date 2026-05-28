import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function DefectsPage() {
  return (
    <TenantPlaceholderPage
      title="图像与缺陷分析"
      description="缺陷图库、标注任务、自动识别结果与缺陷趋势。"
      bullets={["无缺陷 / 边缘溢胶 / 中心气泡等标签", "缺陷分布图", "标注任务队列", "自动识别复核"]}
    />
  );
}
