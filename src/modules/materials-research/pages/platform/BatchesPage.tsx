import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function BatchesPage() {
  return (
    <TenantPlaceholderPage
      title="物料与批次追溯"
      description="来料质检、胶水/籽晶批次台账、样品谱系与供应商质量。"
      bullets={["来料批次风险分级", "G-2026-03 胶水批次追溯", "样品谱系图", "待隔离批次提醒"]}
    />
  );
}
