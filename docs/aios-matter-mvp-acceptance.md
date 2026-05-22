# AIOS Matter MVP Acceptance Report

> Branch: `feat/aios-matter-mvp`
> Commit: `5164ee8`
> Date: 2026-05-22

---

## Build Status

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `npm run build:web` | ✅ PASS | Vite 构建干净，9.14s |
| `npm run build:electron` | ⚠️ PRE-EXISTING FAIL | `sync:builtin-keys` 脚本缺失，本次未引入，源分支已存在 |
| `cd server && npm run build` | ✅ PASS | Server TSC 零错误 |

---

## 新增文件清单

### Server — `server/src/features/aios/`

| 文件 | 说明 |
|------|------|
| `types.ts` | Matter、MatterEvidence、AuditEvent、DecisionPackage 完整类型定义 |
| `services/matterStore.ts` | 文件存储层：matters.json、evidence.json、audit.jsonl |
| `services/auditTrailService.ts` | 审计事件写入和读取 |
| `services/matterService.ts` | Matter + Evidence CRUD，含自动审计记录 |
| `services/decisionPackageService.ts` | 基于规则生成结构化决策包（无需 AI 调用） |
| `routes.ts` | 完整 REST API |
| `index.ts` | 模块统一导出 |

### Frontend — `src/features/aios/`

| 文件 | 说明 |
|------|------|
| `types.ts` | 前端类型镜像 + label/color 映射常量 |
| `services/matterRuntime.ts` | API 客户端，所有请求经 `/api/aios` 路由 |
| `components/AIOSHome.tsx` | 事项列表 + 状态筛选 + 创建弹窗 |
| `components/MatterWorkbench.tsx` | 三栏工作台（左：信息 / 中：证据 / 右：决策包）+ 底部审计时间线 |
| `components/MatterEvidencePanel.tsx` | 证据添加/查看/删除 |
| `components/DecisionPackagePanel.tsx` | 决策包展示与重新生成 |
| `components/AuditTimelinePanel.tsx` | 时序审计记录展示 |
| `index.ts` | 模块统一导出 |

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/aios/matters` | 列出事项（支持 `?status=` 筛选） |
| POST | `/api/aios/matters` | 创建事项 |
| GET | `/api/aios/matters/:id` | 获取事项详情 + 证据列表 |
| PATCH | `/api/aios/matters/:id` | 更新事项（title/goal/status/priority） |
| DELETE | `/api/aios/matters/:id` | 删除事项（同时清除关联证据） |
| GET | `/api/aios/matters/:id/evidence` | 获取证据列表 |
| POST | `/api/aios/matters/:id/evidence` | 添加证据 |
| DELETE | `/api/aios/matters/:id/evidence/:evidenceId` | 删除证据 |
| POST | `/api/aios/matters/:id/decision-package` | 生成决策包 |
| GET | `/api/aios/matters/:id/audit` | 获取审计时间线 |

---

## 数据模型

### Matter

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| tenantId | string | 租户 ID（默认等于 userId） |
| userId | string | 所属用户 |
| workspacePath | string | 工作区路径 |
| title | string | 事项标题 |
| goal | string | 事项目标 |
| sourceType | `manual \| email \| document \| upload` | 来源类型 |
| status | `new \| todo \| doing \| waiting \| done \| archived` | 状态 |
| priority | `urgent \| important \| normal \| low` | 优先级 |
| evidenceIds | string[] | 关联证据 ID 列表 |
| artifactIds | string[] | 关联产出物 ID 列表 |
| decisionPackage | DecisionPackage? | 最新决策包（若已生成） |
| createdAt / updatedAt | ISO string | 时间戳 |

### MatterEvidence

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 唯一标识 |
| matterId | string | 所属事项 |
| type | `email \| attachment \| file \| note \| knowledge` | 证据类型 |
| title | string | 证据标题 |
| content | string | 内容摘要（可选） |
| sourceRef | string | 来源引用（可选，如邮件ID/文件路径） |
| createdAt | ISO string | 创建时间 |

### AuditEvent

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 唯一标识 |
| matterId | string | 关联事项 |
| actorId | string | 操作者 userId |
| action | enum | 操作类型（8种） |
| detail | object | 操作详情（JSON） |
| createdAt | ISO string | 时间戳 |

**审计动作：**
`create_matter` / `update_matter` / `add_evidence` / `delete_evidence` / `generate_decision_package` / `change_status` / `delete_matter`

---

## 存储结构

```
server/data/aios/{userId}/
  matters.json       — 事项+证据ID列表，JSON array
  evidence.json      — 证据对象列表，JSON array
  audit.jsonl        — 审计事件，每行一条 JSON
```

---

## 决策包生成逻辑（V1 规则版）

不依赖 AI 调用，基于事项元数据 + 证据列表规则生成：

| 字段 | 生成逻辑 |
|------|---------|
| summary | 事项标题 + 优先级 + 状态 + 目标文本 |
| knownFacts | 遍历所有证据，生成「[类型] 标题: 内容前120字」格式列表 |
| missingMaterials | 检查是否缺邮件/文件/备注；是否填写目标；证据是否 < 2 条 |
| riskPoints | 检查紧急标记、等待状态、空证据、超7天未完成 |
| suggestedActions | 基于当前状态推荐下一步动作 |

后续 Sprint 可替换为 LLM skill 调用，API 合约不变。

---

## 导航入口

- **主导航**：`ClipboardList` 图标，标签「事项」，位置在「首页」后
- **功能开关**：`PRODUCT_FEATURES.aios = true`（`src/config/productFeatures.ts`）
- **App.tsx**：`primarySection === 'aios'` 渲染 `<AIOSHome />`

---

## Web 功能状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 查看事项列表 | ✅ 可用 | GET /api/aios/matters，支持状态筛选 |
| 创建事项 | ✅ 可用 | 弹窗表单，支持标题/目标/来源类型/优先级 |
| 打开事项工作台 | ✅ 可用 | 三栏布局，左侧信息/中间证据/右侧决策包 |
| 更新状态/优先级 | ✅ 可用 | 工作台左栏下拉直接修改，实时写审计 |
| 编辑事项目标 | ✅ 可用 | 工作台左栏文本区 + 保存按钮 |
| 添加证据材料 | ✅ 可用 | 5种类型（邮件/附件/文件/备注/知识库） |
| 删除证据 | ✅ 可用 | 证据卡片 ✕ 按钮 |
| 生成决策包 | ✅ 可用 | 一键生成，含摘要/已知事实/缺失材料/风险点/建议动作 |
| 审计时间线 | ✅ 可用 | 工作台底部，时序展示全部操作记录 |
| 删除事项 | ✅ 可用 | 列表页删除按钮，含确认提示 |
| 按状态筛选 | ✅ 可用 | 顶部下拉筛选，默认隐藏已归档 |
| AI 增强决策包 | ⏳ 待下一版 | 当前为规则版，待接入 LLM skill |
| 跨事项关联 | ⏳ 待下一版 | 目前每个事项独立 |
| 文件上传到事项 | ⏳ 待下一版 | 当前通过 sourceRef 引用，未直接上传 |
| 从邮件/文档自动创建事项 | ⏳ 待下一版 | 手动创建，sourceType 已预留 |

---

## 遗留与下一步

1. **LLM 增强决策包**：将 `decisionPackageService.ts` 中的规则逻辑替换为 `/api/skills/run` 调用，API 合约不变
2. **文件关联**：添加 `/api/aios/matters/:id/attach-file` 端点，将已上传文件关联到事项
3. **邮件 → 事项**：在 `CommunicationWorkbench` 邮件卡片上添加「创建事项」按钮，自动填充 sourceType=email
4. **事项导出**：决策包导出为 DOCX/PDF，复用 document feature 的 artifact 流程
5. **批量操作**：多选事项变更状态
6. **归档视图**：专门的已归档事项列表

---

## 不影响现有功能验证

| 模块 | 影响 |
|------|------|
| 文稿编辑 | ✅ 无影响 |
| PPT 生成 | ✅ 无影响 |
| 邮件 | ✅ 无影响 |
| 数据分析 | ✅ 无影响 |
| 资源中心 | ✅ 无影响 |
| 日程 | ✅ 无影响 |
| 知识库 | ✅ 无影响 |
| 设置 | ✅ 无影响 |
| Skill Center | ✅ 无影响 |
