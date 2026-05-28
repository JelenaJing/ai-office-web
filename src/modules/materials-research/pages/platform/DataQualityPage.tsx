import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function DataQualityPage() {
  return (
    <TenantPlaceholderPage
      title="数据可信度"
      description="完整度评分、离散度分析、异常数据与训练可用性。"
      bullets={["可用于模型训练 / 趋势分析 / 需复核", "字段完整度热力图", "异常数据列表", "训练可用性判定"]}
    />
  );
}
