import { TenantPlaceholderPage } from "../../components/common/TenantPlaceholderPage";

export function AssistantPage() {
  return (
    <TenantPlaceholderPage
      title="AI 研发助手"
      description="基于证据链回答工艺问题，并给出可执行操作建议。"
      bullets={["租户上下文感知问答", "证据卡片与关联对象", "生成实验计划 / 打开批次", "非纯聊天框交互"]}
    />
  );
}
