# Electron → Web Full Parity Audit

**Date:** 2026-05-22  
**Target repo:** `/data/darebug/aioffice-server/ai-office-web`  
**Embedded Electron / legacy source:** `/data/darebug/aioffice-server/ai-office-web/electron` + `src/modules` + `src/skills` + `src/document` + `src/engines` + `build`  
**Public review source:** `/data/darebug/aioffice-server/ai-office-public-review`  
**Optional legacy subtree checked:** `/data/darebug/aioffice-server/ai-office-web/ai_writer3.0`

## Audit boundary

本次审计**不是只看 `src/features`**。实际同时检查了：

1. 当前 Web 仓库的前端入口、`server/src/features/*` 和共享结构层。  
2. 当前仓库里仍然存在的 Electron main / preload / legacy module / skill / document engine 代码。  
3. `ai-office-public-review` 中的公开参考实现和 `docs/web-migration-guide.md`。  
4. `ai_writer3.0` 子目录。  

> 结论：`ai_writer3.0` 子目录不是当前正式模板、文稿引擎、PPT 引擎的完整 source of truth。真正可执行的 Electron 主链主要还在**当前仓库根目录** `electron/main/services/*` 和共享 `src/*` 中；`ai-office-public-review` 主要补充了公开参考能力、迁移说明、通信 / 邮件 /个人库 / 工作日志等线索。

## Overall status snapshot

| Module | Web status | Main gap | Priority |
|---|---|---|---|
| 文稿 | partial | NFTCORE 差最后几步；正式模板未完成 OOXML write-back；普通文稿仍缺 multi-step async | P0 |
| PPT | partial | DeckDocument / RetemplateEngine 还没真正 server 化 | P0 |
| 邮件 | partial | AI 整理未读、回复草稿、附件→Artifact、批量邮件未完整 | P0 |
| 图片 | partial | 参考图 / 风格 / 海报 /异步作业与 Artifact 联动未完全对齐 | P1 |
| Excel / 数据分析 | partial | Python 分析链路、结果 JSON、图表 Artifact 还没稳定 server 化 | P1 |
| 日报 / 工作日志 | partial | workspace activity / subordinate / admin / 权限模型未迁移 | P1 |
| 通信 / 内部 IM | placeholder | Matrix / internal account / directory 仍无完整 Web runtime | P0 |
| 知识库 | partial | embedding / vector search / citation source / 权限仍不完整 | P0 |
| 资源中心 / Artifact | partial | 统一预览 / 删除 / 关联浏览 / 类型筛选仍缺 | P0 |
| Skill Runtime / Store | partial | 安装、执行、异步 Job、Artifact 输出未完成 | P1 |
| 账号 / 设置 / 模型配置 | partial | token 统一、角色/权限、AccountCenter 完整接入未完成 | P1 |
| AIOS / Matter / OA | partial | 审批 / 决策 / 审计回放 / 多人意见未完整 | P1 |

## Architecture findings

### 1. Real source of truth is split

- **Electron runtime truth:** `electron/main/index.ts` + `electron/main/services/*`
- **Renderer / shared logic truth:** `src/modules/*`, `src/document/*`, `src/engines/*`, `src/skills/*`
- **Public review reference truth:** `ai-office-public-review/electron/main/services/*`, `src/communication/*`, `src/contexts/MatrixChatContext.tsx`, `docs/web-migration-guide.md`

### 2. Most Web gaps are not UI gaps

当前最大问题不是页面没入口，而是：

- Electron 能力仍停留在 `window.electronAPI.*`
- server 端没有等价 REST / task runtime
- 长任务还没彻底 task 化
- Artifact / Knowledge / Account 没有形成统一底座

### 3. False parity risks already identified

以下模块最容易“看起来有入口，但实际上没有完成迁移”：

- **PPT**：前端已有生成面板，但 server 仍不是 RetemplateEngine / DeckDocument 真链路  
- **正式模板**：Web 已进入 async formal template task，但还没有 Electron 的 OOXML block-level shell write-back  
- **邮件**：IMAP/SMTP 有基础，但 AI triage / reply / attachment-open / bulk send 仍不完整  
- **知识库**：能选知识库，不代表已经完成 embedding / vector / citation source / permissions  
- **资源中心**：ArtifactStore 存在，不代表完整的 resource-center CRUD / preview / relationship browsing 已完成

## Module details

## 1. 文稿

**Electron / embedded legacy source**

- `electron/main/services/paperGeneratorNFTCORE.ts`
- `electron/main/services/openAlexClient.ts`
- `electron/main/services/paperStructurePlanner.ts`
- `electron/main/services/nftcorePromptFactory.ts`
- `electron/main/services/formalTemplate/formalTemplateTaskService.ts`
- `electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts`
- `electron/main/services/documentEngineService.ts`
- `src/modules/paper/*`
- `src/modules/formal/*`
- `src/skills/builtins/templateDocumentGenerateLegacySkill.ts`
- `src/document/schema/*`
- `src/engines/documentEngine/*`

**Public review source**

- `ai-office-public-review/electron/main/services/documentEngineService.ts`
- `ai-office-public-review/docs/web-migration-guide.md`

**Current Web state**

- `academic_paper` / `literature_review` 已走 `paper-workflow/start + tasks/:id`
- `formal_template` 已走 `formal-template/start + tasks/:taskId`
- `A4RichTextEditor`、打字机、DOCX 导入、当前编辑器导出已可用

**Status:** `partial`

**Main gaps**

1. 普通文稿仍缺 Electron `essayTaskService.ts` 的 multi-step async 链路。  
2. NFTCORE 还缺：
   - incremental reference organisation pass
   - knowledge tree check
   - final full-paper review
   - citation verification
   - PaperArtifact / references sidecar 正规化
3. formal template 仍缺：
   - OOXML block-level shell write-back
   - section / header / footer 高保真
   - schema-first base-replace 真正写回 docx
   - commit diagnostics 与 shell validation 全量对齐
4. Word/PDF 仍未真正回到 schema-first / canonical document 结构层。

**Audit verdict**

- 论文/综述：`partial`, but on the right track  
- 正式模板：`partial`, not `full`  
- OOXML 高保真：`missing` on web  
- canonical / manuscript：`partial`

## 2. PPT

**Electron / embedded legacy source**

- `electron/main/services/ppt/retemplateEngine.ts`
- `electron/main/services/deckDocumentService.ts`
- `electron/main/services/pptxGenerator.ts`
- `electron/main/services/ppt/deckBuilder/deckBuilderService.ts`
- `electron/main/services/ppt/pptxImportService.ts`
- `src/modules/generation/ppt/*`
- `src/bridges/document-to-ppt/*`

**Public review source**

- `ai-office-public-review/electron/main/services/ppt/retemplateEngine.ts`
- `ai-office-public-review/electron/main/services/deckDocumentService.ts`
- `ai-office-public-review/electron/main/index.ts` (`importPptxFromFile`)
- `ai-office-public-review/docs/AI_OFFICE_CORE_CAPABILITY_API.md`
- `ai-office-public-review/agent-docs/PPT_USER_TEMPLATE_AND_REMOVE_RIGHT_PANEL_TASK.md`

**Current Web state**

- Web 有 `src/features/ppt/*`
- Matter → PPT 有部分接入
- server 端仍以简化 PPT 生成 / flat PPTX 为主

**Status:** `partial`

**Main gaps**

1. DeckDocument 还没成为 Web server 的内容真相层。  
2. RetemplateEngine 仍主要停留在 Electron main / 前端纯函数，未作为真正 Web API 暴露。  
3. 模板切换 0 token 还没有完整变成 Web 能力。  
4. 外部 PPT 导入 / 解析没迁。  
5. 文稿转 PPT bridge 还没有形成稳定 server 链路。

**Audit verdict**

PPT 不能算“已迁移”，只能算 `partial`。

## 3. 邮件

**Electron / embedded legacy source**

- `electron/main/services/emailService.ts`
- `electron/main/services/autoReplyService.ts`
- `electron/main/services/emailAttachmentOpenService.ts`
- `src/modules/email/*`
- `src/communication/CommunicationWorkbench.tsx`
- `src/modules/email/services/mailTriageClassifier.ts`
- `src/modules/email/services/bulkEmailDraftService.ts`

**Public review source**

- `ai-office-public-review/electron/main/services/emailService.ts`
- `ai-office-public-review/electron/main/services/autoReplyService.ts`
- `ai-office-public-review/src/communication/CommunicationWorkbench.tsx`
- `ai-office-public-review/src/communication/services/emailMatterBuilder.ts`
- `ai-office-public-review/src/communication/services/matterEvaluator.ts`
- `ai-office-public-review/src/communication/services/workflowRouter.ts`
- `ai-office-public-review/agent-docs/MAIL_AI_REQUIREMENTS.md`

**Current Web state**

- IMAP/SMTP 基础有 server 端
- 邮件 → Matter 已有部分链路
- CommunicationWorkbench 有入口

**Status:** `partial`

**Main gaps**

1. AI 整理未读不是完整异步任务。  
2. 回复草稿 / 风险识别 / 批量邮件未对齐。  
3. 附件还没有稳定进入 Artifact / 文稿编辑器。  
4. 收件人解析 / 称呼生成 / dry-run 群发未完成。  
5. Email → Calendar / Document / PPT 仍零散。

## 4. 图片

**Electron / embedded legacy source**

- `electron/main/services/imageClient.ts`
- `src/modules/image/*`
- `src/features/image/services/ImageService.ts`

**Public review source**

- `ai-office-public-review/electron/main/services/imageClient.ts`

**Current Web state**

- 基础图片生成已 web-native
- Artifact 已能承接一部分结果

**Status:** `partial`

**Main gaps**

1. 参考图与风格控制未完全对齐。  
2. 海报 / 宣传图等更高阶场景未核实全量迁移。  
3. 异步 job、取消、Artifact 统一引用未完整。  
4. 图片插入文稿 / PPT 的统一底座未完成。

## 5. Excel / 数据分析

**Electron / embedded legacy source**

- `electron/main/services/excelAnalysisService.ts`
- `electron/main/services/plotAgentService.ts`
- `electron/main/services/plotDataModelService.ts`
- `excel-and-relay/electron/main/services/excelAnalysisService.ts`
- `src/modules/excel-analysis/*`

**Public review source**

- `ai-office-public-review/electron/main/services/excelAnalysisService.ts`
- `ai-office-public-review/excel-and-relay/electron/main/services/excelAnalysisService.ts`

**Current Web state**

- Web 面板已存在
- server 端分析服务不完整，依赖 Python 的链路还不稳定

**Status:** `partial`

**Main gaps**

1. Python 分析任务还没有标准化异步作业接口。  
2. EXCEL_ANALYSIS_RESULT_JSON / stdout 解析稳定性未确认。  
3. 图表 / 报告 Artifact 没完整闭环。  
4. 环境检测 / 诊断与 Electron 不一致。

## 6. 日报 / 工作日志

**Electron / embedded legacy source**

- `electron/main/services/dailyReportGenerator.ts`
- `electron/main/services/dailyReportTaskService.ts`
- `electron/main/services/workspaceActivityService.ts`
- `electron/main/services/workspaceActivitySyncService.ts`
- `electron/main/services/userActionLogService.ts`

**Public review source**

- `ai-office-public-review/electron/main/services/dailyReportGenerator.ts`
- `ai-office-public-review/electron/main/services/workspaceActivityService.ts`
- `ai-office-public-review/electron/main/services/workspaceActivitySyncService.ts`
- `ai-office-public-review/scripts/run-workspace-activity-report-smoke.ts`

**Current Web state**

- report feature 有基础入口
- Matter 已部分参与日报

**Status:** `partial`

**Main gaps**

1. 行为日志采集未完整 server 化。  
2. subordinate / admin / summary 权限视图未迁。  
3. AI 日报生成链路未完整复用 Electron。  
4. 上传日志 / 组织汇总没有完整 API。

## 7. 通信 / 内部 IM / 组织通讯

**Electron / embedded legacy source**

- `src/communication/CommunicationWorkbench.tsx`
- `src/contexts/MatrixChatContext.tsx`
- `src/modules/chat/chatApiClient.ts`
- `src/contexts/InternalAccountContext.tsx`

**Public review source**

- `ai-office-public-review/src/communication/CommunicationWorkbench.tsx`
- `ai-office-public-review/src/contexts/MatrixChatContext.tsx`
- `ai-office-public-review/src/modules/chat/chatApiClient.ts`
- `ai-office-public-review/src/communication/services/*`
- `ai-office-public-review/docs/登录使用指南.md`

**Current Web state**

- 有 CommunicationWorkbench / MatrixChatContext 代码
- 但 server 端没有成体系的 `/api/chat/*` + `/api/directory`

**Status:** `placeholder`

**Main gaps**

1. 聊天会话 / 消息 / 附件 / 未读没有完整 Web runtime。  
2. 内部账号 / AccountCenter 与组织通讯未统一。  
3. directory / department / contact 还没形成正式 server API。  
4. 聊天转 Matter / 日报仍缺正式后端支持。

## 8. 知识库

**Electron / embedded legacy source**

- `electron/main/services/knowledgeService.ts`
- `electron/main/services/knowledgeRetrievalService.ts`
- `src/modules/knowledge/*`
- `src/features/document/services/documentContextBuilder.ts`

**Public review source**

- `ai-office-public-review/electron/main/services/knowledgeService.ts`
- `ai-office-public-review/electron/main/services/knowledgeRetrievalService.ts`
- `ai-office-public-review/docs/web-migration-guide.md`

**Current Web state**

- 可上传、可选知识库、部分生成链路可传入 knowledge ids
- server 端有 `remoteKnowledgeClient.ts`

**Status:** `partial`

**Main gaps**

1. embedding / vector search / local fallback 不完整。  
2. citation source / knowledge task context / trustLevel / 生效期还没完整暴露。  
3. 权限与多租户还不完整。  
4. “知识库是否真实参与生成”仍需更明确诊断。

## 9. 资源中心 / Artifact

**Electron / embedded legacy source**

- `electron/main/services/workspaceService.ts`
- 文件导出、附件打开、图片保存等散落在多个 service
- `src/components/resource/*`

**Public review source**

- `ai-office-public-review/docs/web-migration-guide.md`
- `ai-office-public-review/electron/main/services/personalLibraryService.ts`

**Current Web state**

- `server/src/artifacts/ArtifactStore.ts` 已存在
- 资源中心 UI 入口有，但 CRUD / preview 不完整

**Status:** `partial`

**Main gaps**

1. 统一预览 / 删除 / 重命名没齐。  
2. Matter / Email / Document / PPT 关联浏览不完整。  
3. 类型筛选与统一下载接口未完全落地。  
4. 附件、图表、决策包等 Artifact 类型还需统一 schema。

## 10. Skill Runtime / Skill Store

**Electron / embedded legacy source**

- `electron/main/services/skillPlatformService.ts`
- `skill_platform_next/services/skill-engine/*`
- `skill_platform_next/services/skill-library-backend/*`
- `src/features/skill-center/*`

**Public review source**

- `ai-office-public-review/electron/main/services/skillPlatformService.ts`
- `ai-office-public-review/docs/web-migration-guide.md`

**Current Web state**

- Skill Center 入口有
- 部分模板技能与 API 已接入

**Status:** `partial`

**Main gaps**

1. 技能安装流程不完整。  
2. Skill Job 没完整异步任务化。  
3. 技能输出 Artifact 未统一。  
4. 远程 store 地址 / 认证 / 安装状态还不完整。

## 11. 账号 / 设置 / 模型配置

**Electron / embedded legacy source**

- `electron/main/services/settingsStore.ts`
- `src/contexts/InternalAccountContext.tsx`
- `src/services/accountCenterClient.ts`
- `src/utils/aiToolSettings.ts`

**Public review source**

- `ai-office-public-review/docs/web-migration-guide.md`
- `ai-office-public-review/docs/登录使用指南.md`

**Current Web state**

- Web token 登录可用
- 设置、LLM 配置、邮箱配置有基础能力

**Status:** `partial`

**Main gaps**

1. AccountCenter / internal account / email / IM token 还没统一。  
2. 角色 / 权限 / 管理员视角未完整。  
3. Electron settings → server settings 的统一持久化还可继续收敛。  
4. 模型配置与 provider 还需更清晰的租户/用户边界。

## 12. AIOS / Matter / OA

**Electron / embedded legacy source**

- `server/src/features/aios/*`（当前仓库中 Web 已有不少迁移）
- `src/communication/services/emailMatterBuilder.ts`
- `src/communication/services/matterEvaluator.ts`
- `src/communication/services/workflowRouter.ts`

**Public review source**

- `ai-office-public-review/src/communication/services/emailMatterBuilder.ts`
- `ai-office-public-review/src/communication/services/matterEvaluator.ts`
- `ai-office-public-review/src/communication/services/workflowRouter.ts`
- `ai-office-public-review/src/communication/types/workflowMatter.ts`

**Current Web state**

- Matter / Evidence / DecisionPackage / AuditTrail 已有基础
- 邮件转 Matter 已部分可用

**Status:** `partial`

**Main gaps**

1. 多人意见 / committee / approval policy 仍缺。  
2. 决策与知识核验联动未闭环。  
3. 审计回放仍不完整。  
4. OA 级 workflow 能力仍分散在 communication / aios / email 中。

## Corrections to previous optimistic assumptions

1. **PPT 不是 full parity。** 当前只能算 `partial`。  
2. **formal template 不是 full parity。** 当前只到 async task + partial route semantics。  
3. **knowledge 不是 full parity。** 当前仍依赖 remote client，缺 vector / citation / permission 全量能力。  
4. **resource center 不是 full parity。** ArtifactStore 只是底层，不等于资源中心闭环。  
5. **communication / IM 不是 missing UI，而是 missing runtime。**

## Recommended migration order

### P0

1. 文稿剩余深链路补齐  
2. PPT DeckDocument / RetemplateEngine 完整迁移  
3. 邮件 AI 整理未读 + 附件 + 任务识别 + 回复草稿  
4. 知识库 + Artifact 统一底座  
5. 通信 / 内部 IM 主流程  

### P1

1. 图片完整链路  
2. 日报完整组织链路  
3. Excel / 数据分析完整链路  
4. Skill Runtime 异步任务化  

### P2

1. 管理后台  
2. 模板市场  
3. 高级权限  
4. PDF 高保真导出  
5. 高级 RAG / 多租户治理  

## Immediate next step

按迁移计划，**文稿模块**仍是当前第一优先级：

1. 论文 / 综述补齐 NFTCORE 尾部步骤  
2. 正式模板继续向 OOXML write-back 推进  
3. 普通文稿补齐 multi-step async workflow  
4. manuscript / canonical document / schema-first session 持久化继续收口
