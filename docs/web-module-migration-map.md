# Web Module Migration Map

> 扫描时间：2026-05-21  
> 分支基线：`feat/web-service-migration-p1`（含 P0/P0.5、远程知识库 platformApi）  
> 目的：将 **原 UI → platformApi → Web server API → server module → 复用 Electron 业务逻辑** 的剩余迁移路径文档化。  
> **本文件为审计与裁剪决策文档**；`WorkspaceContext` Web 裁剪已落地，其余实现仍按章节推进。  
> **Web 不是 Electron 本地工作区的网页克隆。**

---

## Web 产品形态（与 Electron 的差异）

| 维度 | Electron 桌面版 | AI Office Web |
|---|---|---|
| 资源组织 | 本地工作区目录 + 文件树 + `.aidoc.json` | **资源中心**（我的文件 / 生成记录 / 知识库资料） |
| 工作场景 | 同一套 UI，大量本地路径操作 | 场景入口 + **platformApi**，无本地树 |
| 资源引用 | `workspacePath`、绝对路径 | **`fileId` / `artifactId` / `knowledgeDocumentId` / workspace token** |
| 禁止项 | — | 本地绝对路径、`open*Dialog`、`getWorkspaceTree`、展示 `documents/` 等内部目录 |

### Web 保留的 UI 壳（不重写）

1. **资源中心** — `ResourceWorkspace`、`MyFilesView`、Artifacts、`RemoteKnowledgePanel`  
2. **工作场景** — 文稿（`DocumentEngineHost` / `EditorPanel`）、邮件（`CommunicationWorkbench`）、PPT（`GenerationWorkbenchPanel`）、Excel（`ExcelAnalysisWorkbench`）等**原工作台壳**；执行层逐步接 `platformApi`  
3. **设置 / Skill** — 设置页、Skill 文稿 Tab；Store 后续 server 签发 embed  

---

## UI Restoration First

**Web 化不是重写 UI。** 当前阶段（`feat/web-all-mvp-services` 及后续）优先在浏览器中挂载与 Electron 相同的**原 UI 壳**，已落地的 server 模块、`platformApi`、Web skill **保留不删**；`Web*Panel` 卡片页仅作**临时 fallback**，不得长期替代主入口。

| 原则 | 说明 |
|---|---|
| 先恢复壳 | `WorkspaceViewportHost` 等入口渲染 `DocumentEngineHost`、`CommunicationWorkbench`、`GenerationWorkbenchPanel` 等 |
| 再接执行 | 按钮、生成、保存、收件箱等逐步改为 `platformApi` → `/api/*`，在壳内禁用或替换 Electron-only 操作 |
| 不恢复 | 本地文件树、`DocumentFilePanel`、`.aidoc.json` 树、绝对路径对话框 |
| 不删除 | `server/src/modules/*`、`web.*` skill、`Web*Panel` 源文件（可闲置） |

| 模块 | 原 UI 壳 | 当前 Web 服务 | 主入口是否恢复原 UI | 后续要接的执行动作 |
|---|---|---|---|---|
| 文稿 | **Web**：`WordLikeDocumentEditor`；**Electron**：`DocumentEngineHost` | `web.document.generate` / `web.document.edit` + export | Web Word-like 编辑器 | 见下文 Web Document Skills |
| 邮件 | `CommunicationWorkbench` / `EmailContext` | `/api/email` | 是 | 收件箱 / 发送 / 账号 → `platformApi.email` |
| PPT | `GenerationWorkbenchPanel` / `PptWorkbenchPanel` | `web.pptx.create` | 是 | 生成 / 模板 / 下载 → `platformApi.skills.run` |
| Excel | `ExcelAnalysisWorkbench` | `web.xlsx.analyze` | 是 | 与 Electron 同一壳；Web 仅替换文件选择与 `platformApi.excel.analyze` |
| 日程 | `CalendarWorkspace` | `/api/calendar/events` | 是 | Web/Electron 均用原 `CalendarWorkspace`；Web 经 `calendarRuntime` → `platformApi.calendar` |
| 图片 | `ImageWorkspace` | `web.image.generate` | 是（原 `ImageWorkspace` 壳） | `ImageService` Web 走 `platformApi.skills.run`；本地保存/文件夹拼接已禁用并提示 |
| 日报 | `ActivityReportPanel` | `web.daily.report` | 临时（`WebDailyReportPanel`） | 生成报告 → `platformApi` |
| 设置 | `FullSettingsPanel` / `ModelDevPanel` | `/api/settings/ai` | 临时（`WebSettingsPanel`） | 查看 / 测试 LLM |

**`WorkspaceViewportHost`（Web）当前挂载：**

- `freewrite` → **Web** `WordLikeDocumentEditor`；**Electron** `DocumentEngineHost`  
- `email` → `CommunicationWorkbench`  
- `workbench`（PPT）→ `GenerationWorkbenchPanel`  
- `data` → `ExcelAnalysisWorkbench`  
- `image` → `ImageWorkspace`  
- `paper` + `daily-report` → 临时 `WebDailyReportPanel`；`paper` + `document` → `DocumentEngineHost`  
- `model` → 临时 `WebSettingsPanel`（`ModelDevPanel` 仍依赖 Electron 时）

### Web 工作台路由调试（DEV）

开发环境下 `console.debug` 前缀 `[web-workbench:*]`：

| 前缀 | 位置 | 内容 |
|---|---|---|
| `entry` | `WorkWorkspace` / `LifeWorkspace` / `StudyWorkspace` | 点击功能名、`enterXXXMode` |
| `mode` | `WorkspaceModeContext` | `enterFreeMode` / `enterDataMode` / `enterImageGenerationMode` 后的 mode / generationMode |
| `viewport` | `WorkspaceViewportHost` | `activePanel`、`renderComponent` |

**期望路由：**

| 入口 | mode | generationMode | activePanel | 组件 |
|---|---|---|---|---|
| 文稿编辑 | `free` | （不变） | `freewrite` | `WebDocumentWorkbench`（Web） |
| 数据分析 | `generation` | `data` | `data` | `ExcelAnalysisWorkbench` |
| 图片生成 | `generation` | `image` | `image` | `ImageWorkspace` |
| 日程管理 | —（`primarySection=calendar`） | — | — | `CalendarWorkspace` |

Web 文稿：`EditorPanel` 进入 `freewrite` 且无标签时自动 `openTab` 内存文档（`webDocumentSession.ts`），不调用 `createBlankDocument`。

Web 日程：`App.tsx` 不再使用 `WebCalendarPanel` 作主入口；`calendarService` Web 分支走 `calendarRuntime.ts` 与 server 持久化。

Web 数据分析：`ExcelAnalysisWorkbench` 占满视口（`flex:1`），禁止退回 `WebExcelAnalysisPanel`。

## Web Document Skills Architecture

**WebDocumentWorkbench 是 UI 壳**，不硬编码模板/导入/导出/生成逻辑；能力由 **document skill manifest** 描述，经 `platformApi.skills.run(mapsToSkillId)` 执行。

| Skill kind | 职责 | 内置示例 | Server skill |
|---|---|---|---|
| `document-generator` | AI 生成初稿 | `document.generator.office_draft` | `web.document.generate`（alias `web.docx.create` + `patch`） |
| `document-template` | `pageSpec` / `headerFooter` / `bodySlots` | `document.template.general` 等 | （manifest 随请求传入） |
| `document-exporter` | Word / PDF / Markdown 导出 | `document.export.docx` 等 | `web.docx.export` / `web.pdf.export` / `web.markdown.export` |
| `document-importer` | 资料导入 | `document.import.word_reference` | 第一版：`platformApi.files.upload` + `fileIds` |
| `document-transformer` | 选区改写 / 插入 / 全文润色 | 底部 `AICommandBox` 推断 mode | `web.document.edit` → `data.patch` |

**Word-like 编辑壳（Web 专用）：**

- `WordLikeDocumentEditor`：顶栏（标题、模板、格式、知识库、资料、导出）+ `A4RichTextEditor`（TipTap）+ 右侧 `AICommandBox`（含撤销）。
- `A4RichTextEditor` 暴露 `A4EditorHandle`：`getHtml` / `getSelection*` / `replaceSelection` / `insertAtCursor` / `replaceDocument`；页眉页脚与 `pageSpec` 来自当前 template skill。
- `WebDocumentWorkbench` 保留为兼容 re-export，入口以 `WordLikeDocumentEditor` 为准。
- 导出必须读取编辑器最新 HTML，不得使用陈旧 session 快照。
- **Electron** 仍走 `DocumentEngineHost` / `EditorPanel`；不恢复本地文件树；MiniMax 仅作导入/导出 provider。

**数据流：**

1. `useWebDocumentSkills`：合并 `webDocumentBuiltInSkills` + `platformApi.skills.list()`（有 manifest 时追加）。
2. 生成初稿：`web.document.generate`（内部复用 Electron `runWritingAssistant` / 模板两段式 prompt）→ `data.patch.replace_document` + `documentSession` + artifact。
3. 知识库写作：`web.knowledge.writing.legacy`；模板文稿：`web.template.document.generate.legacy`。
4. AI 编辑：`web.document.edit`（选区/插入走 legacy 风格 prompt；全文润色走 `legacyWritingWorkflow`）→ `data.patch`。
5. Server 模块：`server/src/modules/document-generation/`（`writingPromptRecipes`、`legacyWritingWorkflow`、`templateWritingWorkflow`、`documentContextBuilder`）。
3. `documentSession.pageSpec` / `headerFooter` **来自所选 template skill**，预览与导出共用。
4. 导出：运行 exporter skill，输入 `documentSession` + `pageSpec` + `headerFooter`。
5. 后续 Skill Store 可安装更多 manifest，无需改壳。

**相关文件：**

- `src/modules/writing/components/WebDocumentWorkbench.tsx`
- `src/modules/writing/webDocumentBuiltInSkills.ts`
- `src/modules/writing/useWebDocumentSkills.ts`
- `server/src/skills/docx/createDocxSkill.ts` / `exportDocxSkill.ts`
- `server/src/skills/document/exportMarkdownSkill.ts` / `exportPdfSkill.ts`

### 执行层接入（第一批：文稿 / 邮件 / PPT）

| 模块 | 适配层 | Web 行为 |
|---|---|---|
| 文稿 | `docxWebGeneration.ts`、`hostCommands`（禁用本地打开/另存为）、`EditorPanel`（禁用本地保存）、`useFormalTemplateGeneration`、`GenerationComposer.runAssistantTask` | `platformApi.skills.run('web.docx.create')` → artifact；状态栏提示资源中心下载 |
| 邮件 | `emailRuntime.ts` → `EmailContext`；`CommunicationWorkbench` 账号测试 | `platformApi.email.*`；附件 / AI 分拣 / 预回复仍提示后续接入 |
| PPT | `pptWebGeneration.ts` → `GenerationPromptComposer.handleGeneratePpt`；`ResultPreviewPanel` 下载 | `platformApi.skills.run('web.pptx.create')`；`resultPath` 存 artifactId；下载走 `platformApi.artifacts.download` |

---

## 不迁移到 Web（Electron-only）

以下能力**不要**为其设计 Web API，Web 端继续 feature gate / 隐藏 / 资源中心替代：

| 类别 | IPC / 能力 | Web 处理 |
|---|---|---|
| 本地文件树 | `workspace:tree`、`createFolder`、`createFile`、`renamePath`、`movePath`、`deletePath` | `electron-only`；`WorkspaceContext.refreshTree` Web 为 no-op |
| 注册本地目录 | `registerWorkspace`、`openDirectoryDialog` | `electron-only` |
| 本地路径打开 | `openExternal`、`openDocumentPath`、按绝对路径打开 | `electron-only` |
| 本地保存对话框 | `saveDialog`、导出到用户自选路径 | `electron-only`；Web 用 artifact 下载 |
| `.aidoc.json` 树 | 侧栏文件树、`.aidoc.json` 主入口 | Web 不展示；`web-replace-with-resource-center` |
| 本地 Vosk | `voice:*` | `electron-only`；后续 Web Speech / server STT |
| Matrix / 作业 / AI课堂 / AI论坛 | 相关 IPC 与 Workbench | `hidden-for-web`（已有 ComingSoon） |

---

## 需要迁移到 Web（保留原 UI，迁移执行层）

| 模块 | 说明 |
|---|---|
| Knowledge | 远程读接口已迁移；下一步仅 **multipart 上传** |
| Excel | `fileId` + server 分析 → **artifact** |
| PPT | 保留 Deck/PPT UI 思路；server `pptxGenerator` → **pptx artifact** |
| 图片 | `imageClient`；参考图 `fileId`/`artifactId` |
| 邮件 | 保留 Communication/Email UI；凭据仅存 server |
| 日报 | server 生成；来源 files/artifacts/activity log |
| 设置 | provider/model 在 server；API Key 不下发浏览器 |
| Skill Store | server embed URL + 包管理 |

---

## 扫描范围

| 路径 | 说明 |
|---|---|
| `electron/main/index.ts` | IPC handler 注册与 service 委托 |
| `electron/preload/index.ts` | `window.electronAPI` 暴露面 |
| `src/types/electron.d.ts` | 类型契约 |
| `src/runtime/electronAPIShim.ts` | Web mock（Phase 1 占位，非真实 API） |
| `src/contexts/**` | 全局状态与 IPC 调用 |
| `src/modules/**` | 业务模块 UI + services |
| `src/pages/**` | 一级场景入口 |
| `src/communication/**` | 沟通工作台 |
| `src/components/**` | 共享组件 |

**统计：** `src/` 内仍有 **`window.electronAPI` 直接调用的文件约 54 个**（不含 `platform/` 注释与 `electronAPIShim` 本身）。Electron 桌面版继续保留 preload + IPC，Web 版逐步改为 `platformApi` + `/api/*`。

---

## 已完成 Web 化（对照基线）

| 能力 | UI | platformApi | server route | server module | 备注 |
|---|---|---|---|---|---|
| 登录 / 会话 | LoginPage 等 | `auth.*` | `/api/auth/*` | AccountCenter 代理 | Bearer = AC token |
| 默认工作区 token | WorkspaceContext（Web） | `workspaces.getDefault` | `/api/workspaces/default` | `workspaceStore` | **无 fileTree；不走 getWorkspaceTree** |
| 我的文件 | ResourceWorkspace / MyFilesView | `files.*` | `/api/files/*` | `routes/files` | `fileId`，非绝对路径 |
| 生成记录 | ResourceWorkspace | `artifacts.*` | `/api/artifacts/*` | `routes/artifacts` | 下载走 artifactId |
| 文稿生成 Word | `DocumentEngineHost` / EditorPanel / Skill 页 | `skills.run('web.docx.create')` | `/api/skills/:id/run` | `ai-gateway` + `createDocxSkill` | **必须进 Artifact**；UI 壳已恢复，执行层在 Editor 内接入 |
| 远程知识库（读） | RemoteKnowledgePanel | `departments.*` `knowledge.getBaseInfo/listDocuments/deleteDocument` | `/api/departments` `/api/knowledge/:id/*` | `modules/knowledge/remoteKnowledgeClient` | AC 鉴权；**上传待 multipart** |

---

## 必覆盖模块迁移矩阵

### 1. Excel / 数据分析

| 字段 | 内容 |
|---|---|
| **模块** | Excel / 数据分析（含 Plot 图表联动） |
| **UI 入口** | `WorkWorkspace`（数据分析行）→ `WorkspaceViewportHost` `data` 模式；`ExcelAnalysisWorkbench`；`PlotWorkspace` + `PlotService` |
| **当前 Electron IPC** | `excel:analysisRun`、`excel:listDataModels`、`excel:checkEnvStatus`、`excel:rebuildEnv`、`excel:pythonDiagnostics`；`plot:recommend`、`plot:generate`、`plot:status`…；`file:openDialog` |
| **当前 Electron service** | `electron/main/services/excelAnalysisService.ts` → `runExcelAnalysis`；`plotAgentService.ts`；`settingsStore.resolveEffectiveSettings` |
| **当前前端调用点** | `ExcelAnalysisWorkbench.tsx`（`openFileDialog` + `excelAnalysisRun`）；`PlotService.ts` / `PlotWorkspace.tsx`；`presentationGenerateLegacySkill` 无关 |
| **目标 platformApi** | `platformApi.excel.runAnalysis({ fileId, requirement, dataModelId? })`；`platformApi.excel.getEnvStatus()`；可选 `platformApi.plot.*` 或合并为 skill |
| **目标 server route** | `POST /api/excel/analyze`（multipart：`file` + JSON fields）；`GET /api/excel/env-status`；或 `POST /api/skills/excel.analyze/run` |
| **目标 server module** | `server/src/modules/excel-analysis/`（**可直接搬迁** `runExcelAnalysis` 核心；Python 子进程/env 检查放 server 侧） |
| **Artifact 输出** | **是** — 分析报告 `.md` / 图表 `.png` / 摘要 JSON → `artifacts` |
| **迁移优先级** | **P1** |
| **Web 约束** | `sourcePath`/`workspacePath` → **`fileId` + workspaceId**；Excel 源文件 **multipart upload**；Python 环境仅 server 安装，不可依赖用户本机 |
| **可搬 server** | ✅ `excelAnalysisService` 主体；⚠️ `plotAgentService` 若仍要本地 Python Agent 需改为 server 托管或降级为静态图表 skill |

---

### 2. PPT 生成

| 字段 | 内容 |
|---|---|
| **模块** | PPT 生成（含 DeckDocument、内容包、模板渲染） |
| **UI 入口** | `WorkWorkspace` PPT 行；`WorkspaceViewportHost` `ppt`；`GenerationWorkbench` / `PptWorkbenchPanel` / `ResultPreviewPanel` / `PptSkillDrawer` |
| **当前 Electron IPC** | `pptx:generate`、`pptx:saveContentPackage`、`pptx:loadContentPackage`、`pptx:listContentPackages`、`pptx:renderWithSkill`、`pptx:listSkills`、`pptx:importFromDialog`、`pptx:importFromFile`；`deck:save/load/render/buildFromPrompt/buildFromManuscript/...` |
| **当前 Electron service** | `electron/main/services/pptxGenerator.ts` → `generatePptx`；`deck` 相关 builder（main 内 IPC 聚合）；content package 存 **workspace 本地目录** |
| **当前前端调用点** | `presentationGenerateLegacySkill.ts`（`generatePptx`）；`ResultPreviewPanel.tsx`（大量 `pptx*` / `deck*`）；`CommunicationWorkbench.tsx`（`pptxImportFromFile`）；`generation/ppt/deckBuilder/*` |
| **目标 platformApi** | `platformApi.skills.run('ppt.generate', { prompt, templateId?, sourceArtifactIds? })`；`platformApi.ppt.listTemplates()`；`platformApi.ppt.import(file)` |
| **目标 server route** | `POST /api/skills/ppt.generate/run`；`GET /api/ppt/templates`；`POST /api/ppt/import`（multipart） |
| **目标 server module** | `server/src/modules/ppt/`（**可搬迁** `pptxGenerator` + 部分 deck pipeline；content package 改存 `server/data/.../artifacts`） |
| **Artifact 输出** | **是** — `.pptx` 必须登记为 Artifact；预览图可选 |
| **迁移优先级** | **P1** |
| **Web 约束** | `outputPath`/`workspacePath` → **artifactId + 预签名下载**；导入 PPT **浏览器选文件 → multipart**；deck 存盘改 objectKey，禁止暴露 server 绝对路径 |
| **可搬 server** | ✅ `generatePptx`；⚠️ deck LLM 构建需长任务 Job + SSE；❌ `openDialog` 类 IPC 不可用 |

---

### 3. 图片生成

| 字段 | 内容 |
|---|---|
| **模块** | 图片生成 |
| **UI 入口** | `LifeWorkspace` / `StudyWorkspace`；`WorkspaceViewportHost` `image`；`ImageWorkspace` |
| **当前 Electron IPC** | `ai:generateImage`；`workspace:saveImage*`；`file:importImage`、`file:readImageAsDataUrl` |
| **当前 Electron service** | `electron/main/services/imageClient.ts` → `generateImage`；`settingsStore` 读 image provider |
| **当前前端调用点** | `ImageService.ts` / `sharedImageGeneration.ts`；`imageGenerateLegacySkill.ts`；`ImageWorkspace.tsx`（知识库检索 + 保存到 workspace 目录） |
| **目标 platformApi** | `platformApi.skills.run('image.generate', { prompt, references?: fileId[] })` |
| **目标 server route** | `POST /api/skills/image.generate/run` |
| **目标 server module** | `server/src/modules/image-generation/`（**可搬迁** `imageClient.generateImage`；密钥仅 server env） |
| **Artifact 输出** | **是** — `.png`/`.webp` → artifacts |
| **迁移优先级** | **P1** |
| **Web 约束** | 参考图：**fileId 或 artifactId**，非 `file_path`；生成结果禁止返回本地绝对路径 |
| **可搬 server** | ✅ LLM/图片 API 调用逻辑；❌ 写入 workspace figures 目录改为 artifact 关联 |

---

### 4. 邮件收发

| 字段 | 内容 |
|---|---|
| **模块** | 邮件收发（IMAP/SMTP + 分拣 + 托管回复） |
| **UI 入口** | `WorkWorkspace` 邮件行；`WorkspaceViewportHost` `email`；`EmailContext` + `ComposeModal`；`CommunicationWorkbench`；`MailTriageContext` |
| **当前 Electron IPC** | `email:getAccount`、`email:saveAccount`、`email:fetchInbox/Sent/Trash`、`email:send`、`email:deleteMessage`、`email:restoreMessage`、`email:downloadAttachment`、`email:selectAttachments`、`email:testConnection`、`email:testSmtp`；`mail:openAttachmentInWorkspace`；`ai:writingAssistant`（分拣/草稿） |
| **当前 Electron service** | `electron/main/services/emailService.ts`（凭据存 **userData**）；`llmClient` 经 `writingAssistant` |
| **当前前端调用点** | `EmailContext.tsx`、`ComposeModal.tsx`、`bulkEmailDraftService.ts`、`mailTriageClassifier.ts`、`CommunicationWorkbench.tsx` |
| **目标 platformApi** | `platformApi.email.{getAccount,saveAccount,fetchInbox,send,...}` |
| **目标 server route** | `/api/email/account`、`/api/email/messages`、`/api/email/send`、`/api/email/attachments`（multipart） |
| **目标 server module** | `server/src/modules/email/`（**可搬迁** `EmailService` 核心；凭据加密存 DB，禁止下发密码到浏览器） |
| **Artifact 输出** | 可选 — 草稿/发送摘要 `.md`；附件入库 → **files/artifacts** |
| **迁移优先级** | **P1**（收发）/ **P2**（分拣 LLM、托管） |
| **Web 约束** | 附件 `tempPath` → **server 暂存 + fileId**；选附件 **multipart**，非 `email:selectAttachments` 对话框 |
| **可搬 server** | ✅ IMAP/SMTP；⚠️ 需后端安全存储账号；❌ 打开附件进 workspace 需改为下载/预览 API |

---

### 5. 日程管理

| 字段 | 内容 |
|---|---|
| **模块** | 日程管理 |
| **UI 入口** | `App.tsx` `primarySection === 'calendar'`；`CalendarWorkspace.tsx`；`WorkWorkspace` 日程行（导航） |
| **当前 Electron IPC** | **无** — 当前为 `src/calendar/calendarService.ts` → **localStorage** |
| **当前 Electron service** | 无（纯前端存储） |
| **当前前端调用点** | `calendarService.ts`（CRUD events）；邮件/沟通模块引用 calendar 元数据 |
| **目标 platformApi** | `platformApi.calendar.{listEvents,create,update,delete}` |
| **目标 server route** | `GET/POST/PATCH/DELETE /api/calendar/events` |
| **目标 server module** | `server/src/modules/calendar/`（新建持久化，非搬迁 IPC） |
| **Artifact 输出** | 否（结构化事件 JSON）；导出 `.ics` 可选 artifact |
| **迁移优先级** | **P2** |
| **Web 约束** | 多设备同步必须 server 存储；与邮件联动用 **eventId**，非本地 ID 硬编码 |
| **可搬 server** | N/A（新建）；Electron 可继续 localStorage 直至统一 |

---

### 6. 日报 / 审计（Workspace Activity）

| 字段 | 内容 |
|---|---|
| **模块** | 日报 / 工作区审计 |
| **UI 入口** | `ActivityReportPanel`；`ChatWindow` 日报弹窗；skill `dailyReport.generate.legacy`；`AdminActivityPanel`；`DelegationContext` |
| **当前 Electron IPC** | `activity:takeSnapshot`、`activity:getActivity`、`activity:analyzeFiles`、`activity:generateReport`、`activity:getReport`、`activity:syncStatus`、`activity:flushSync`、`activity:adminFetch/Post`、`activity:logUserAction`、`activity:getUserActions`、`activity:setIdentity`；`delegation:*` |
| **当前 Electron service** | `workspaceActivityService.ts`、`workspaceActivitySyncService.ts`、`workspaceActivityQueue.ts`；`userActionLogService` |
| **当前前端调用点** | `ActivityReportPanel.tsx`；`ChatWindow.tsx`（admin API）；`DelegationContext.tsx` |
| **目标 platformApi** | `platformApi.activity.generateReport({ workspaceId, date })`；`platformApi.activity.getReport`；或 `platformApi.skills.run('daily.report')` |
| **目标 server route** | `POST /api/activity/snapshot`、`POST /api/activity/analyze`、`POST /api/activity/reports/generate`、`GET /api/activity/reports/:date` |
| **目标 server module** | `server/src/modules/activity/`（**可搬迁** `generateDailyReport` + 文件 diff 逻辑；快照改存 workspace 对象存储） |
| **Artifact 输出** | **是** — 日报 `.md`/`.docx` 应进 artifacts |
| **迁移优先级** | **P1**（生成日报）/ **P2**（admin 同步队列） |
| **Web 约束** | `workspacePath` → **platform workspace path token**；快照来源改为 server 侧 files/artifacts 索引，非本机目录扫描 |
| **可搬 server** | ✅ LLM 报告生成；⚠️ 文件 diff 需基于 server 存储版本；❌ `activity:adminFetch` 可继续直连 AC 代理 |

---

### 7. 设置中心 / 模型配置

| 字段 | 内容 |
|---|---|
| **模块** | 设置中心 / LLM·Image 配置 |
| **UI 入口** | `FullSettingsPanel.tsx`；`BackendDiagnostic.ts`；Intro remake 设置（部分复用 `testLlmConnection`） |
| **当前 Electron IPC** | `settings:get`、`settings:save`、`settings:testLlm`、`settings:testImage`；`introRemake:testLlmSettings` |
| **当前 Electron service** | `electron/main/services/settingsStore.ts`（读写本地 settings 文件 + env） |
| **当前前端调用点** | `FullSettingsPanel.tsx`（`getSettings/saveSettings/test*`） |
| **目标 platformApi** | `platformApi.settings.getEffective()`（**仅返回非密钥字段**）；`platformApi.settings.testLlm()` |
| **目标 server route** | `GET /api/settings/ai`、`POST /api/settings/ai/test`（不返回 raw API key 到客户端） |
| **目标 server module** | `server/src/modules/settings/`（合并 `build/ai-config.json` + `server/.env.local`；**不要 JWT_SECRET 第二套登录**） |
| **Artifact 输出** | 否 |
| **迁移优先级** | **P2** |
| **Web 约束** | API Key **仅 server**；浏览器只保存 provider/model 选择；与现有 AI Gateway env 对齐 |
| **可搬 server** | ✅ `testLlmConnection` / `testImageConnection`；❌ 不要把用户 key 写入 localStorage |

---

### 8. 文稿高级编辑 / Formal Template

| 字段 | 内容 |
|---|---|
| **模块** | 文稿高级编辑（EditorPanel）+ 正式模板 |
| **UI 入口** | `WorkspaceViewportHost` `docx`/`free`；`EditorPanel.tsx`；`FormalTemplatePanel` / `useFormalTemplateGeneration`；`WebWritingPanel`（已部分 skill 化） |
| **当前 Electron IPC** | `ai:continueWriting`、`ai:rewriteParagraph`、`ai:writingAssistant`、`ai:organizeReferences`、`ai:generateOutline`、`ai:analyzeTopic`；`formalTemplate:analyze/confirmFields/preview/commit`；`documentEngine:read/writeOoxmlPackage`；大量 `workspace:*` 文件树写操作；`file:saveDialog`、`exportPdfFromEditor`、`exportWithJournalFormat` |
| **当前 Electron service** | `FormalTemplateTaskService`；`llmClient` + writing handlers；`documentEngineService`；`workspaceService` |
| **当前前端调用点** | `EditorPanel.tsx`（**最大 IPC 集中点**）；`ContinueWritingService` / `RewriteService` / `WritingAssistantService`；`formal/*`；`ReferenceService.ts` |
| **目标 platformApi** | `platformApi.writing.{continue,rewrite,assistant}`；`platformApi.formalTemplate.{analyze,preview,commit}`；`platformApi.documents.{open,save,export}`（session 基于 artifactId） |
| **目标 server route** | `/api/writing/*`；`/api/formal-template/*`；`/api/documents/:artifactId/content`；导出 `POST /api/skills/.../run` |
| **目标 server module** | `server/src/modules/writing-assistant/`、`formal-template/`、`document-engine/`（**可搬迁** formal + LLM 管线；OOXML 读写放 server） |
| **Artifact 输出** | **是** — 编辑结果 `.docx`/`.aidoc.json` 版本均进 artifacts |
| **迁移优先级** | **P1**（formal template + 导出）/ **P2**（完整 Editor  parity） |
| **Web 约束** | `filePath` 全面改为 **artifactId**；保存/导出用下载 API；知识库上下文走已有 `platformApi.knowledge` + `previewTaskContext`（待补 IPC 迁移） |
| **可搬 server** | ✅ LLM 写作/模板；⚠️ OOXML 引擎需 Node 侧跑；❌ 原生对话框 |

---

### 9. 本地文件树 / 文档打开 / 导出（Web 结论）

| 字段 | 内容 |
|---|---|
| **模块** | 工作区文件树 / 本地文档生命周期 |
| **UI 入口（Electron）** | `FileExplorer.tsx`；`DocumentFilePanel.tsx`（侧栏树）；`WorkspaceFilesPanel`；`WorkspaceGate.tsx` |
| **UI 入口（Web）** | **不显示** FileExplorer / 文件树 / `.aidoc.json`；`App.tsx` Web 下隐藏 `DocumentFilePanel`；用 **资源中心** + `WebWritingPanel` |
| **当前 Electron IPC** | `workspace:tree`、`createFolder`、`createFile`、`renamePath`、`importFiles`；`file:openDialog/saveDialog/openExternal`；`readWorkspaceDocumentSchema` |
| **当前 Electron service** | `workspaceService.ts`、`documentEngineService.ts` |
| **Web 决策** | **不迁移完整本地文件树** |
| **Web 替代** | 我的文件（`fileId`）、生成记录（`artifactId`）、知识库（`knowledgeDocumentId`）、默认 workspace **token**（`web-workspace:{userId}:{wsId}`） |
| **目标 platformApi（Web）** | 已有 `files.*`、`artifacts.*`；`workspaces.getDefault`（**仅 token，无 tree**）；未来 `web-later-document-session` 做高级编辑会话 |
| **目标 server route（Web）** | 不实现 `/api/workspaces/tree`；继续 `/api/files`、`/api/artifacts`、`/api/workspaces/default` |
| **Artifact 输出** | 生成物进 artifacts；上传进 files |
| **迁移优先级** | Web：**N/A（electron-only 树）**；Electron：保持现状 |
| **可搬 server** | ❌ 树操作不搬；✅ 扁平 files/artifacts 已具备 |

---

### 10. 技能平台 / Skill Store

| 字段 | 内容 |
|---|---|
| **模块** | Skill 包管理 / Skill Store |
| **UI 入口** | `SkillManagementView.tsx`（管理 Tab + 商店 Tab）；`skills/registerBuiltins.ts` |
| **当前 Electron IPC** | `skill:openStore`、`skill:getSyncPlan`、`skill:listMySkins`、`skill:downloadPackage`、`skill:getEmbedUrl`、`skill:recognizePackage`、`skill:listTemplates` |
| **当前 Electron service** | main 进程内嵌启动 Skill Store 子服务（library 4010 / store 4030） |
| **当前前端调用点** | `SkillManagementView.tsx`（**管理/商店仍 IPC**）；Web 仅 **生成文稿 Tab** 走 `platformApi.skills` |
| **目标 platformApi** | `platformApi.skills.list()`（已有）；`platformApi.skills.store.{getEmbedUrl,sync,download}` |
| **目标 server route** | `/api/skills/store/embed`、`/api/skills/sync`、`POST /api/skills/packages/download` |
| **目标 server module** | `server/src/modules/skill-store/`（代理或托管 store 服务） |
| **Artifact 输出** | 下载的 skill 包可选登记；运行结果仍走 skill run → artifact |
| **迁移优先级** | **P2** |
| **Web 约束** | 商店 iframe URL 由 server 签发；包安装路径在 server，非用户 Downloads |
| **可搬 server** | ⚠️ 依赖现有 Skill Store 部署方式；可先做 HTTP 代理 |

---

## 关联模块（建议一并规划）

| 模块 | UI 入口 | 主要 IPC | Electron service | 目标 platformApi | 优先级 |
|---|---|---|---|---|---|
| 远程知识库（高级） | `EditorPanel`、`KnowledgeConversationDock`、`CommunicationWorkbench` | `knowledge:getDocument`、`previewTaskContext`、`retrieveChunks`、`materializeWorkspace`、`saveManuscript` | `remoteKnowledgeClient` + 本地 `knowledgeService` fallback | 扩展 `platformApi.knowledge.*` | P1 |
| 知识库上传（Web） | `RemoteKnowledgePanel` | `knowledge:importDocuments`（系统对话框） | `remoteKnowledgeClient.ingestFiles` | `POST /api/knowledge/:id/import` multipart | P1 |
| 个人文库 | `PersonalLibrarySidebar` | `personal-lib:*`（`personalLibraryAPI`） | `personalLibraryService` | `platformApi.personalLibrary.*` | P2 |
| 论文生成 | Paper 模式 / `PaperService` | `ai:generatePaper`、`paper:*`、`compat:*` | paper 管线 + compat task | `platformApi.skills.run('paper.*')` | P2 |
| 作业辅助 | `HomeworkWorkbench` | `homework:*` | homework handlers | skill job | P2 |
| Matrix 内网聊天 | `MatrixChatContext`、`InternalChatPanel` | `matrix:*` | 外部 Matrix SDK | `platformApi.matrix.*` 或保持 AC | P3 |
| 托管/Delegation | `DelegationContext` | `delegation:*` | delegation service | `/api/delegation/*` | P3 |
| 语音输入 | `voskVoiceInput.ts` | `voice:*` | voice proxy | Web Speech API / server STT | P3 |
| 介绍改写 Intro Remake | 设置/论文流程 | `introRemake:*` | `introductionRemakeService` | `/api/intro-remake/*` | P3 |

---

## 横切约束（所有模块）

### 可直接迁入 `server/src/modules/` 的逻辑

- LLM 调用：`llmClient` / `documentGenerator` 模式（已在 AI Gateway 验证）
- 远程知识库 HTTP：`remoteKnowledgeClient`（**已完成**）
- Excel：`excelAnalysisService.runExcelAnalysis`
- PPT：`pptxGenerator.generatePptx`（长任务需 Job 化）
- 图片：`imageClient.generateImage`
- 邮件：`EmailService`（凭据改 server 存储）
- 日报：`workspaceActivity.generateDailyReport`
- Formal template：`FormalTemplateTaskService`
- Settings 测试连接：`testLlmConnection` / `testImageConnection`

### 必须改为 multipart upload（原系统对话框 / 本地路径）

| 场景 | 原 IPC / 行为 | Web 替代 |
|---|---|---|
| Excel 分析源文件 | `file:openDialog` + `sourcePath` | `POST /api/files/upload` → `fileId` |
| PPT 导入 | `pptx:importFromDialog` | `input type=file` → multipart |
| 知识库上传 | `knowledge:importDocuments`（dialog） | `POST /api/knowledge/:id/import` multipart（**路由已预留 501**） |
| 邮件附件 | `email:selectAttachments` | multipart + `fileId[]` |
| 工作区导入 | `workspace:importFiles` | `POST /api/workspaces/import` |
| 图片参考图 | `file:importImage` | files API |

### 本地路径 → Web 标识

| Electron 概念 | Web 标识 |
|---|---|
| `workspacePath`（磁盘路径） | `web-workspace:{userId}:{workspaceId}`（**已有**） |
| `sourcePath` / `filePath` | `fileId` 或 `artifactId` |
| `outputPath` | artifact 记录 + `/api/artifacts/:id/download` |
| `tempPath`（邮件附件） | server 临时 object + `fileId` |
| 知识库 `departmentId` | 保持不变（远程 KB partition id） |

### 必须进入 Artifact 的生成类输出

- Word / docx（**已做** `web.docx.create`）
- Excel 分析报告、图表
- PPT `.pptx`
- 图片生成结果
- 日报 Markdown/Word
- Formal template 输出稿
- 论文/作业导出（若 Web 开放）

---

## `electronAPIShim` 与 `platformApi` 关系

| 层 | Web 现状 | 目标 |
|---|---|---|
| `electronAPIShim` | 全量 mock，避免渲染崩溃 | 逐步 **缩小** mock 面；已迁移能力改走 `platformApi` |
| `platformApi` | auth/workspaces/files/artifacts/skills/departments/knowledge | 按上表扩展域对象，**禁止**业务组件新增 `fetch('/api')` |
| Electron 桌面 | 继续 `window.electronAPI` | `electronPlatformApi` 委托 IPC，不删除 |

---

## 推荐实施顺序

1. **P1-A**：Excel 分析 skill + fileId 上传  
2. **P1-B**：PPT `ppt.generate` skill + artifact  
3. **P1-C**：Image `image.generate` skill + artifact  
4. **P1-D**：知识库高级检索 `previewTaskContext` / `getDocument`（复用 remoteKnowledgeClient）  
5. **P1-E**：Activity 日报 → skill + artifact  
6. **P2**：Email、Settings、Skill Store  
7. **P2+**：Calendar server 持久化、`web-later-document-session`（非文件树）  

---

## 验收口径（迁移阶段）

- 业务组件：**零新增** `window.electronAPI`（Electron 分支除外）  
- Web 生成类：**必须** `platformApi` → skill/job → **Artifact**  
- 不提交 `server/data`、`server/.env.local`  
- Electron 回归：桌面版 IPC 路径保留且可用  

---

# Web Conversion Decision

> 决策值枚举：`convert-to-web` | `electron-only` | `web-replace-with-resource-center` | `web-later-document-session` | `hidden-for-web`

| 功能 | 当前状态 | Web 决策 | 处理方式 | 优先级 |
|---|---|---|---|---|
| 登录 / AccountCenter | Web 已接 AC 代理 | convert-to-web | `platformApi.auth` + `/api/auth/*` | P0 ✅ |
| 我的文件 | platformApi.files | convert-to-web | `/api/files/*` | P0 ✅ |
| 生成记录 | platformApi.artifacts | convert-to-web | `/api/artifacts/*` | P0 ✅ |
| 远程知识库列表/读/删 | platformApi.knowledge | convert-to-web | `/api/knowledge/*` + remoteKnowledgeClient | P0 ✅ |
| 知识库上传 | IPC 系统对话框 | convert-to-web | `POST .../import` multipart（待做） | P1 |
| 默认 workspace token | Web 已用 getDefault | convert-to-web | 无 fileTree；`WorkspaceContext` Web 裁剪 ✅ | P0 ✅ |
| 本地 workspace 文件树 | Electron IPC tree | electron-only | Web 不调用 `getWorkspaceTree` | — |
| FileExplorer / 侧栏树 | Electron UI | electron-only | Web 隐藏 | — |
| .aidoc.json 文稿树 | DocumentFilePanel | web-replace-with-resource-center | Web 用 WebWritingPanel + 生成记录 | P0 ✅ |
| 文稿生成 Word | WebWritingPanel + skill | convert-to-web | `web.docx.create` → artifact | P0 ✅ |
| Excel 数据分析 | ExcelAnalysisWorkbench | convert-to-web | fileId + server `runExcelAnalysis` → artifact | P1 |
| PPT 生成 | GenerationWorkbench | convert-to-web | skill/job + pptx artifact | P1 |
| 图片生成 | ImageWorkspace | convert-to-web | skill + image artifact | P1 |
| 邮件收发 | EmailContext / Communication | convert-to-web | `/api/email/*`，凭据 server-only | P1 |
| 日报 / 审计 | ActivityReportPanel | convert-to-web | server activity + report artifact | P1 |
| 设置中心 | FullSettingsPanel | convert-to-web | `/api/settings/ai`，key 不下发 | P2 |
| Skill Store | SkillManagementView 商店 Tab | convert-to-web | server embed + 包管理 | P2 |
| Formal Template / EditorPanel | 桌面编辑器 | web-later-document-session | 非文件树；artifact 会话 | P2+ |
| 本地路径打开/保存对话框 | file/workspace IPC | electron-only | artifact 下载 / multipart 上传 | — |
| 日历 | localStorage | convert-to-web | `/api/calendar/events`（新建） | P2 |
| Vosk 语音 | voice IPC | electron-only | 后续 Web Speech / STT | P3 |
| Matrix 聊天 | matrix IPC | hidden-for-web | 非 Web 主线 | — |
| 作业辅助 / AI课堂 / AI论坛 | homework IPC | hidden-for-web | feature gate + ComingSoon | — |
| Plot 实时图表（附属） | plot IPC | electron-only 或合并 Excel | 随 Excel P1 规划 | P2 |
| 论文生成 / compat 任务 | paper IPC | hidden-for-web 或 P3 | 非 Web 主线 | P3 |
| 个人文库 personal-lib | personalLibraryAPI | electron-only / P3 | 非资源中心主线 | P3 |
| electronAPIShim 全量 mock | 启动 shim | web-replace-with-resource-center | 随各域迁移缩小 mock | 持续 |

---

## Web UI 裁剪清单（代码已做 / 应保持）

| Web 显示 | 组件 |
|---|---|
| ✅ | `ResourceWorkspace`、`MyFilesView`、Artifacts、`RemoteKnowledgePanel` |
| ✅ | `WebWritingPanel`（文稿）；`WorkspaceViewportHost` feature gate |
| ❌ | `FileExplorer`、`DocumentFilePanel`（Web 已隐藏侧栏）、workspace 文件树、`.aidoc.json` 树 |
| ⏳ | PPT/Excel/Email 未迁移前：`WebFeatureComingSoon`，不挂载旧 Electron 面板 |

---

*实现时请按模块拆 PR：保留原场景 UI，迁移执行层到 platformApi + server module，勿把 Electron 本地工作区完整搬到 Web。*
