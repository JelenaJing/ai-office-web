# Electron → Web 正式模板链路对齐验收

## Source of truth

先检查了用户指定路径：

- `/data/darebug/aioffice-server/ai-office-web/ai_writer3.0`

该子目录 **不包含** formal template / document engine / template rewrite 相关实现。实际可用的 Electron 正式模板源码位于当前仓库根目录：

- `electron/main/services/formalTemplate/formalTemplateTaskService.ts`
- `electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts`
- `electron/main/services/formalTemplate/formalTemplateRoutingService.ts`
- `electron/main/services/documentEngineService.ts`
- `src/skills/builtins/templateDocumentGenerateLegacySkill.ts`
- `src/modules/formal/hooks/useFormalTemplateGeneration.ts`

Web 迁移以这些文件为功能标准。

## 本轮完成

### 1. formal_template 不再回退普通文稿生成

`src/features/document/services/documentWorkflowGenerateRouter.ts`

- `workflowId === 'formal_template'` 已改为走 `runFormalTemplateGenerate`
- 不再调用 `runDocumentGenerate`

### 2. 新增 Web 异步任务 API

`server/src/features/document/routes/formalTemplate.ts`

- `POST /api/document/formal-template/start`
- `GET /api/document/formal-template/tasks/:taskId`
- `POST /api/document/formal-template/tasks/:taskId/cancel`

返回状态：

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

### 3. 迁移为 Electron 语义对齐的 Web runtime

`server/src/features/document/services/formalTemplateService.ts`

保留 Electron 的阶段语义：

- `analyze`
- `confirm`
- `preview`
- `commit`

并区分两类链路：

1. **schema-first**
   - `visit_letter`
   - `congratulation_letter`

2. **template-document-rewrite**
   - `generic_template_rewrite`

### 4. 可用模板 / 不可用模板显式展示

`server/src/features/document/services/formalTemplatePresets.ts`
`src/features/document/components/AICommandBox.tsx`

当前明确展示：

- 可用：
  - 拜访函（schema-first / visit-letter / base-replace）
  - 贺信（schema-first / congratulation-letter / base-replace）
  - 通用模板改写（template-document-rewrite / generic）

- 暂不可用：
  - 正式通知
  - 工作报告
  - 调查报告
  - 会议纪要
  - 自定义模板文本

每个不可用项都显示明确原因，不再伪装为已迁移。

### 5. 前端改为轮询异步任务

`src/features/document/services/formalTemplateAdapter.ts`

- 先调用 `/start`
- 每 1.5s 轮询 `/tasks/:taskId`
- 读取 `step / message / partialMarkdown / partialHtml`
- `completed` 后将结果写入当前 A4 编辑器

### 6. 右侧文稿助手显示真实链路

`src/features/document/components/AICommandBox.tsx`

选择 formal_template 后：

- 显示所选模板运行时
- 显示可用模板列表
- 显示不可用模板及原因

### 7. 快捷操作与正式模板链路绑定

`src/features/document/workflows/documentWorkflowRegistry.ts`

formal_template 快捷操作已对齐为：

- 生成拜访函
- 生成贺信
- 按通用模板改写
- 按当前模板生成

其中前三个会显式带 `formalTemplatePresetId`。

## 当前限制

### 1. 还不是完整 OOXML shell 写回

Electron 真链路依赖：

- `documentEngineService.readOoxmlPackage`
- `documentEngineService.writeOoxmlPackage`
- schema-first block patch
- shell validation

Web 版当前做到的是：

- 保留阶段语义
- 保留 template kind / runtime kind / async task 模式
- 保留 visit-letter / congratulation-letter / template-document-rewrite 的链路分流

但 **还没有** 把真实 DOCX OOXML block-level patch 移到 server。

### 2. A4 编辑器写入的是最终 HTML 结果

本轮结果进入当前 A4 编辑器，Word 导出继续使用当前编辑器内容，符合 Web 工作台预期；但还不是 Electron FormalTemplatePanel 的独立预览/提交 UI。

## 验收项

1. 选择“正式模板”后，不再显示“尚未接入”。
2. formal_template 不再调用普通文稿生成。
3. 前端调用：
   - `POST /api/document/formal-template/start`
   - `GET /api/document/formal-template/tasks/:taskId`
4. 提供 `cancel` API。
5. UI 明确展示可用模板与不可用原因。
6. 选“拜访函”时走 `schema-first / visit-letter`。
7. 选“贺信”时走 `schema-first / congratulation-letter`。
8. 选“通用模板改写”时走 `template-document-rewrite / generic`。
9. 生成结果进入当前 A4 编辑器。
10. Word 导出继续使用当前编辑器内容。
11. `npm run check:boundaries` 通过。
12. `npm run build:web` 通过。
13. `cd server && npm run build` 通过。
