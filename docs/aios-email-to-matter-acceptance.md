# AIOS Email → Matter 业务闭环验收报告

> Branch: `feat/aios-matter-mvp`
> Feature: 邮件 → 事项 → 证据 → 决策包 完整闭环

---

## 构建状态

| 检查项 | 状态 |
|--------|------|
| `npm run build:web` | ✅ PASS (9.44s) |
| `cd server && npm run build` | ✅ PASS |

---

## 新增接口

### `POST /api/aios/matters/from-email`

入参：
```json
{
  "workspacePath": "web-workspace:user123",
  "email": {
    "id": "messageId-xxx",
    "subject": "关于项目进度汇报",
    "from": "sender@example.com",
    "to": "me@example.com",
    "body": "邮件正文内容（前 2000 字用于证据）",
    "timestamp": "2026-05-22T06:00:00.000Z",
    "attachments": [
      { "id": "att1", "filename": "进度报告.xlsx", "contentType": "application/vnd.ms-excel", "size": 12345 }
    ]
  },
  "priority": "normal"
}
```

出参：
```json
{
  "matter": { /* Matter 对象 */ },
  "evidence": [ /* 已创建的 MatterEvidence 数组 */ ]
}
```

---

## 服务端变更

### `server/src/features/aios/types.ts`

新增审计动作类型：
- `create_matter_from_email` — 从邮件创建事项时写入
- `add_email_evidence` — 创建邮件正文证据时写入
- `add_attachment_evidence` — 创建附件占位证据时写入

### `server/src/features/aios/services/matterService.ts`

新增函数 `createMatterFromEmail(userId, input)`：
- 自动填充 Matter: `title = subject`, `goal = 处理来自"X"的邮件事项：Y`, `sourceType = email`
- 创建邮件正文证据（`type=email`，body 前 2000 字）
- 为每个附件创建占位证据（`type=attachment`，content = "附件已关联，后续接入文件抽取"）
- 所有动作均写审计事件

### `server/src/features/aios/services/decisionPackageService.ts`

升级决策包生成逻辑（email-aware）：
- **summary** — 当有 email 证据或 `sourceType=email` 时，在摘要中注明"来源邮件"
- **knownFacts** — 邮件证据优先，提取正文中含关键词（需要/请/确认/已/截止/要求/提供/附件/关于/同意/批准等）的句子作为已知事实；其余类型证据照常展示
- **missingMaterials** — 新增：检查邮件是否含联系方式、截止日期是否不明确
- **riskPoints** — 新增：检测邮件正文中的时间紧迫信号（截止/紧急/尽快/今天/明天）、附件未解析风险
- **suggestedActions** — 当有 email 证据时，额外追加：
  - `generate_reply: 回复发件人，确认收到并告知处理进展`
  - `generate_document: 根据邮件内容生成相关文档`
  - `request_more_info: 回复要求补充缺失材料`

---

## 前端变更

### `src/features/aios/services/matterRuntime.ts`

新增 `createMatterFromEmail(input)` API 客户端方法，调用 `POST /api/aios/matters/from-email`。

### `src/features/aios/components/AIOSHome.tsx`

新增 `initialMatterId?: string | null` prop：
- 接受外部传入的初始事项 ID
- 渲染时自动打开对应 MatterWorkbench（`useEffect` 监听 `initialMatterId`）

### `src/App.tsx`

新增 `open-aios-matter` 自定义事件监听：
```javascript
window.dispatchEvent(new CustomEvent('open-aios-matter', { detail: { matterId: 'xxx' } }))
```
效果：
1. 导航切换到「事项」板块（`primarySection = 'aios'`）
2. 将 `matterId` 通过 `initialMatterId` prop 传入 `<AIOSHome />`，自动打开 MatterWorkbench

### `src/features/email/components/CommunicationWorkbench.tsx`

新增：
1. **「📋 转为事项」按钮**，位于邮件详情头部的 `ThreadHeaderActions` 区域（紧邻「转发」按钮）
   - 只在选中邮件时显示
   - 转换中显示 ⏳ 加载状态，完成后显示 ✅ 已转为事项
   - 完成后禁用（防止重复创建）
2. **内联通知条**，位于邮件主题行下方：
   - 成功：绿色提示 + 「打开事项」按钮（点击触发 `open-aios-matter` 事件，自动跳转并打开 MatterWorkbench）
   - 失败：红色错误提示 + ✕ 关闭按钮
3. **切换邮件时自动重置状态**（`useEffect` 监听 `selectedMailId`）

---

## 业务闭环流程

```
用户在邮件工作台选中一封邮件
  ↓
点击「📋 转为事项」按钮
  ↓
前端调用 POST /api/aios/matters/from-email
  ↓
Server:
  1. 创建 Matter (title=主题, goal=自动生成, sourceType=email)
  2. 写审计: create_matter_from_email
  3. 创建邮件正文证据 (type=email, content=body前2000字)
  4. 写审计: add_email_evidence
  5. 为每个附件创建占位证据 (type=attachment)
  6. 写审计: add_attachment_evidence (每个附件)
  ↓
前端显示成功通知 + 「打开事项」按钮
  ↓
用户点击「打开事项」
  ↓
dispatch open-aios-matter 事件
  ↓
App.tsx 切换到 aios 板块，AIOSHome 自动打开 MatterWorkbench
  ↓
用户在 MatterWorkbench 中：
  - 查看证据列表
  - 点击「生成决策包」
  - 决策包包含邮件摘要 + 事实提取 + 风险识别 + 处理建议
```

---

## 审计记录示例

邮件转事项后的审计时间线：

| 时间 | 动作 | 详情 |
|------|------|------|
| T+0 | `create_matter` | title, priority |
| T+0 | `create_matter_from_email` | emailId, subject, from |
| T+0 | `add_email_evidence` | evidenceId, emailId |
| T+0 | `add_attachment_evidence` | evidenceId, filename（每个附件一条） |
| T+1 | `generate_decision_package` | evidenceCount, generatedAt |

---

## 功能状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 邮件一键转为事项 | ✅ 可用 | 点击按钮即可 |
| 邮件正文自动创建证据 | ✅ 可用 | type=email，保存前 2000 字 |
| 附件自动创建占位证据 | ✅ 可用 | type=attachment，content 为占位说明 |
| 附件真实内容解析 | ⏳ 待下一版 | 需接入文件抽取服务 |
| 优先级从邮件分析推断 | ✅ 可用 | 依赖已有 triage 结果（urgent/important/normal） |
| 转换后一键打开事项 | ✅ 可用 | 点击「打开事项」自动跳转 + 打开 MatterWorkbench |
| 邮件感知决策包 | ✅ 可用 | 摘要标注来源、事实提取、邮件专属风险和建议动作 |
| LLM 增强事实提取 | ⏳ 待下一版 | 当前为关键词规则版 |
| 重复创建防护 | ✅ 可用 | 转换成功后按钮变为禁用状态 |
| 审计写入 | ✅ 可用 | create_matter_from_email / add_email_evidence / add_attachment_evidence |

---

## 未修改范围

- 邮件列表/线程展示逻辑 ✅ 未修改
- 邮件 AI 分析/预回复生成 ✅ 未修改
- 邮件发送/转发逻辑 ✅ 未修改
- 邮件日程检测 ✅ 未修改
- Flowable 工作流逻辑 ✅ 未修改
- 其他 9 个 feature 模块 ✅ 未修改
