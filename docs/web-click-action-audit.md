# Web Click Action Audit

> 扫描时间：2026-05-21  
> 范围：`ai-office-web/src/**/*.{tsx,ts}`（不含 `dist-web`、不含 `excel-and-relay` 副本）  
> 目的：全面盘点前端可点击业务动作，标注当前实现方式、Electron 依赖、后端 `/api` 覆盖，以及 Web 迁移策略和优先级。  
> **本文件为第一步 audit，不改业务逻辑。**

---

## 核心原则（迁移约束）

1. 前端保留 UI。
2. 所有业务动作必须通过 `platformApi`（`src/platform/`）。
3. Web `platformApi` 走 `/api/*`。
4. Electron `platformApi` 走 `window.electronAPI` / IPC。
5. 业务组件不得新增直接 `window.electronAPI` 调用。
6. 业务组件不得散落 `fetch('/api/*')`，除非在 `platformApi` 内部。
7. Web 模式下没有后端 API 的功能必须禁用或显示「Web 版即将开放」，不能静默无效。
8. 所有生成动作必须最终进入 Artifact。
9. 所有长任务后续必须改为 SkillJob。
10. 不要删除 Electron 旧逻辑。

---

## Web 处理方式说明

| 值 | 含义 |
|---|---|
| `frontend-only` | 纯前端状态/UI 变化，无需后端 |
| `platform-api` | 已通过 `platformApi` 抽象，Web 走 fetch，Electron 走 IPC |
| `server-api` | 已接入或应接入 `/api/*` 后端接口 |
| `skill-job` | AI 生成任务，调用 `/api/skills/:id/run` → Artifact |
| `web-coming-soon` | Web 版尚未迁移；应显示「Web 版即将开放」或禁用 |
| `electron-only` | 仅 Electron 有意义（OS 文件选择器等），Web 不需实现 |

## 优先级说明

| 级别 | 含义 |
|---|---|
| P0 | 用户主流程必须可用（第三步迁移目标） |
| P1 | 常用办公功能（第四步迁移目标） |
| P2 | 增强功能 |
| P3 | 暂缓 / 仅桌面版 |

---

## platformApi 现状（第二步扩展基线）

| 域 | 接口 | Web 实现 | Electron 实现 | 业务组件已用 |
|---|---|---|---|---|
| `auth` | login/register/logout/getToken/getCurrentUser | ✅ `/api/auth/*` | 部分 IPC | LoginPage、RegisterPage、AiosHomePage |
| `workspaces` | getDefault/list/create/delete | ✅ | `notSupported` | ❌（仍走 shim/context） |
| `files` | list/upload/download/delete | ✅ | `notSupported` | ✅ MyFilesView |
| `artifacts` | list/download/delete | ✅ | `notSupported` | ✅ ResourceWorkspace、WebWritingPanel |
| `skills` | list/run | ✅ | `notSupported` | ✅ WebWritingPanel |
| `system` | isFeatureAvailable/getRuntime | ✅ | ✅ | 少量 |

**P0 组件迁移状态（2026-05-21 已完成第三步）：**

| 组件 | platformApi | 散落 fetch | 备注 |
|---|---|---|---|
| ResourceWorkspace | ✅ files + artifacts | — | 知识库 Tab 为静态占位 |
| MyFilesView | ✅ files.* | — | `downloadWithAuth` 保留作兼容导出 |
| WebWritingPanel | ✅ skills + artifacts | — | |
| SkillManagementView | ✅ skills + artifacts | — | WebDocxCreatePanel 已迁移 |
| WorkWorkspace | ✅ files.upload | — | 上传成功/失败有提示 |
| DocumentFilePanel | ✅ skills + artifacts | — | WebDocxCreateModal 已迁移 |

**platformApi 修复：** `detectPlatform()` 现识别 `__isWebShim`，Web 入口正确加载 `webPlatformApi`。

---

## 违规清单（规则 5 / 6）

### 业务层散落 `fetch('/api/*')`（应迁入 platformApi）

P0 业务文件已清零。允许保留：

| 文件 | 说明 |
|---|---|
| `src/platform/webPlatformApi.ts` | platformApi 实现层 |
| `src/runtime/electronAPIShim.ts` | 兼容 shim（逐步收敛到 platformApi） |

### 业务组件直接 `window.electronAPI`（应经 platformApi 或保留 Electron 分支）

共 **~55** 个源文件含 `window.electronAPI`（含 services/contexts）。业务 UI 层重点：

| 文件 | 典型动作 | 优先级 |
|---|---|---|
| `DocumentFilePanel.tsx` | createBlankDocument、importFiles | P0/P1 |
| `FileExplorer.tsx` | 工作区文件 CRUD、目录对话框 | P1 |
| `EditorPanel.tsx` | 保存/导出/图片/知识库预览（大量） | P1 |
| `EmbeddedOfficeEnginePanel.tsx` | DOCX 编辑 + AI 续写/重写/生成 | P1 |
| `SkillManagementView.tsx` | Skill 包下载/识别 | P3 |
| `CommunicationWorkbench.tsx` | 邮件收发 | P1 |
| `GenerationComposer.tsx` 等 | PPT/内容生成 | P1 |
| `ExcelAnalysisWorkbench.tsx` | Excel 分析 | P1 |
| `KnowledgeConversationDock.tsx` 等 | 知识库对话 | P1 |
| `InternalAccountPanel.tsx` | 邮件测试连接 | P3 |

---

## Web 视口路由（`WorkspaceViewportHost`）

Web 模式（`electronAPI.__isWebShim === true`）下各面板行为：

| 面板 key | 模式 | Web 渲染 | Web 处理方式 |
|---|---|---|---|
| `freewrite` | 文稿编辑 | `WebWritingPanel` | platform-api / skill-job |
| `paper` | 文章/日报生成 | `WebComingSoon` | web-coming-soon |
| `workbench` | PPT/图文 | `WebComingSoon` | web-coming-soon |
| `email` | 邮件/公文 | `WebComingSoon` | web-coming-soon |
| `homework` | 作业辅助 | `WebComingSoon` | web-coming-soon |
| `data` | Excel 分析 | `WebComingSoon` | web-coming-soon |
| `ai-class` | AI 课堂 | `AiClassWorkbench`（WebView） | web-coming-soon（无后端） |
| `ai-forum` | AI 论坛 | `AiForumWorkbench`（WebView） | web-coming-soon |
| `model` | 模型开发 | `ModelDevPanel` | electron-only / P3 |
| `daily-feed` | 科学资讯 | `DailyFeedWorkbench` | server-api（外部 API） |

**注意：** 从 `WorkWorkspace` / `StudyWorkspace` 点击「进入」仍会 `enterXxxMode()` 并跳转工作区；部分场景在 Web 下会落到 `WebComingSoon`，符合原则 7。邮件/数据分析/PPT 入口在场景页可点，进入后为占位——验收时需确认无「点击完全无反应」。

---

## 后端 `/api` 已实现路由（server）

| 路由 | 说明 |
|---|---|
| `POST /api/auth/login` | 登录 |
| `GET /api/auth/me` | 当前用户 |
| `GET /api/auth/me/bindings` | 绑定状态 |
| `POST /api/auth/change-password` | 改密 |
| `POST /api/auth/logout` | 登出 |
| `GET/POST/DELETE /api/workspaces` | 工作区 CRUD |
| `GET /api/workspaces/default` | 默认工作区 |
| `GET /api/workspaces/tree` | 目录树 |
| `POST /api/workspaces/rename` | 重命名 |
| `POST /api/workspaces/register` | 注册路径 |
| `GET/POST/DELETE /api/files` | 文件列表/上传/删除 |
| `GET /api/files/:id/download` | 文件下载 |
| `GET /api/artifacts` | 生成记录列表 |
| `GET /api/artifacts/:id/download` | Artifact 下载 |
| `GET /api/skills` | Skill 列表 |
| `POST /api/skills/:id/run` | 运行 Skill（含 `web.docx.create`） |
| `GET /api/health` | 健康检查 |
| `*` → AccountCenter 代理 | 通讯录等 `/api/contacts` 等 |

**未实现（前端已调用或计划调用）：** `/api/chat/*`、`/api/email/send`、`/api/homework/answer` 等 → 标记 `web-coming-soon`。

---

## 1. 认证 / 账号

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| auth | `src/web/pages/LoginPage.tsx` | LoginPage | 登录 | `platformApi.auth.login()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/web/pages/RegisterPage.tsx` | RegisterPage | 注册 | `platformApi.auth.register()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/web/pages/AiosHomePage.tsx` | AiosHomePage | 退出登录 | `platformApi.auth.logout()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/LoginGate.tsx` | LoginGate | 登录（旧版门） | `useInternalAccount().login()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/ForceChangePasswordModal.tsx` | ForceChangePasswordModal | 修改密码并进入 | `changePassword(old, new)` — context | ✗ | ✓ | server-api | P1 |
| auth | `src/components/InternalAccountPanel.tsx` | LoginForm | 登录内部账号 | `login(username, password)` — context | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/InternalAccountPanel.tsx` | AccountInfo | 退出登录 | `logout()` — context | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/InternalAccountPanel.tsx` | AccountInfo | 刷新绑定状态 | `loadBindings()` — context | ✗ | ✓ | server-api | P2 |
| auth | `src/components/InternalAccountPanel.tsx` | InternalMailSection | 应用邮箱配置 | `applyEmailConfig()` — context | ✗ | ✗ | web-coming-soon | P3 |
| auth | `src/components/InternalAccountPanel.tsx` | InternalMailSection | 测试邮件连接 | `window.electronAPI.emailTestConnection()` | ✓ | ✗ | web-coming-soon | P3 |
| auth | `src/components/InternalChatPanel.tsx` | LoginForm | 登录即时通讯 | `login(password)` — context | ✗ | ✗ | web-coming-soon | P3 |
| auth | `src/components/InternalChatPanel.tsx` | InternalChatPanel | 打开 Element Web | `window.electronAPI.openExternalUrl()` | ✓ | ✗ | web-coming-soon | P3 |
| auth | `src/components/InternalChatPanel.tsx` | MessageView | 发送即时消息 | `sendMessage()` — Matrix context | ✗ | ✓ | web-coming-soon | P3 |
| auth | `src/components/InternalChatPanel.tsx` | InternalChatPanel | 退出即时通讯 | `logout()` — context | ✗ | ✗ | web-coming-soon | P3 |

---

## 2. 导航 / 应用壳

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| nav | `src/components/nav/PrimaryNav.tsx` | PrimaryNav | 导航项点击 | `onNavigate(section)` | ✗ | ✗ | frontend-only | P0 |
| nav | `src/pages/HomeDashboard.tsx` | HomeDashboard | 工作/学习/生活 | `onNavigate(...)` | ✗ | ✗ | frontend-only | P0 |
| nav | `src/pages/HomeDashboard.tsx` | HomeDashboard | 切换工作区 | `closeWorkspace()` | ✗ | ✗ | frontend-only | P2 |
| shell | `src/App.tsx` | App | 返回场景 | `navigateTo(returnToScene)` | ✗ | ✗ | frontend-only | P0 |
| shell | `src/App.tsx` | App | 切换工作区 | `closeWorkspace()` | ✗ | ✗ | frontend-only | P2 |
| shell | `src/App.tsx` | App | 清空/收起输出面板 | local state | ✗ | ✗ | frontend-only | P3 |
| shell | `src/App.tsx` | App | Skill Dev Panel 开关 | local state | ✗ | ✗ | frontend-only | P3 |
| shell | `src/App.tsx` | App | 退出登录 | `onLogout` prop | ✗ | ✓ | platform-api | P0 |

---

## 3. 工作场景入口

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 文稿编辑 | `enterFreeMode()` | ✗ | ✗ | frontend-only | P0 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 邮件收发 | `enterEmailMode()` | ✗ | ✗ | frontend-only → viewport web-coming-soon | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 日程管理 | `onNavigate('calendar')` | ✗ | ✗ | frontend-only | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 数据分析 | `enterDataMode()` | ✗ | ✗ | frontend-only → web-coming-soon | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | PPT 生成 | `enterPptGenerationMode()` | ✗ | ✗ | frontend-only → web-coming-soon | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 我的文件 | `setShowFiles(true)` | ✗ | ✗ | frontend-only | P0 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 上传文件 | **`fetch('/api/files/upload')`** ⚠️ | ✗ | ✓ | server-api → **待改 platformApi** | P0 |
| study | `src/pages/StudyWorkspace.tsx` | StudyWorkspace | 作业/课堂/论文/图表 | `enterXxxMode()` | ✗ | ✗ | frontend-only / web-coming-soon | P2 |
| life | `src/pages/LifeWorkspace.tsx` | LifeWorkspace | 论坛/写作/图片/资讯 | `enterXxxMode()` | ✗ | ✗ | frontend-only / 部分可用 | P2 |

---

## 4. 工作区管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 新建工作区 | `createWorkspace(name)` — context | ✗ | ✓ | server-api | P2 |
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 打开目录 | `window.electronAPI.openDirectoryDialog()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 选择最近工作区 | `openWorkspace(wsPath)` | ✗ | ✓ | server-api | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 新建/打开/删除/导入/重命名/剪切粘贴 | 多种 `electronAPI` | ✓ | 部分 ✓ | server-api / web-coming-soon | P1 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 在 Finder 中显示 | `openExternalFile` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/components/resource/WorkspaceFilesPanel.tsx` | WorkspaceFilesPanel | 打开目录/新建工作区 | electronAPI + context | ✓ | ✓ | P2 |
| workspace | `src/components/resource/SaveLocationSelector.tsx` | SaveLocationSelector | 更改保存位置/新建 | electronAPI + context | ✓ | ✓ | P2 |
| workspace | `src/contexts/WorkspaceContext.tsx` | — | Web 默认工作区 | `fetch('/api/workspaces/default')` ⚠️ | shim | ✓ | server-api | P0 |

---

## 5. 文稿编辑

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 生成 Word | `platformApi.skills.run('web.docx.create')` | ✗ | ✓ | skill-job | P0 |
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 下载 DOCX | `platformApi.artifacts.download` | ✗ | ✓ | platform-api | P0 |
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 再生成一篇 | local reset | ✗ | ✗ | frontend-only | P0 |
| writing | `src/components/DocumentFilePanel.tsx` | WebDocxCreateModal | 生成 Word | **`fetch('/api/skills/...')`** ⚠️ | ✗ | ✓ | skill-job | P0 |
| writing | `src/components/DocumentFilePanel.tsx` | DocumentFilePanel | + 新建文稿（Electron） | `createBlankDocument` | ✓ | ✗ | electron-only | P3 |
| writing | `src/components/DocumentFilePanel.tsx` | DocumentFilePanel | 刷新文档树 | `refreshTree()` — context | ✓ | ✗ | electron-only | P3 |
| writing | `src/modules/writing/components/ContinueWritingPanel.tsx` | ContinueWritingPanel | 续写/停止/插入 | ContinueWritingService → IPC | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/modules/writing/components/EditorPanel.tsx` | EditorPanel | 工具栏/保存/导出/图片 | 大量 `electronAPI` | ✓ | ✗ | electron-only / web-coming-soon | P1 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 保存/导出/PPT/知识库 | callback → IPC | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/components/EmbeddedOfficeEnginePanel.tsx` | EmbeddedOfficeEnginePanel | 打开/保存 DOCX、AI 续写/重写/生成/查文献/插图 | `electronAPI` + WritingAssistant | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/components/ExportJournalDialog.tsx` | ExportJournalDialog | 选期刊格式/确认导出 | `onConfirm` → IPC export | ✓ | ✗ | web-coming-soon | P2 |

---

## 6. 资源中心 / 文件管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| resource | `src/pages/ResourceWorkspace.tsx` | ResourceWorkspace | Tab 切换 | `setTab()` | ✗ | ✗ | frontend-only | P0 |
| resource | `src/pages/ResourceWorkspace.tsx` | ArtifactsTab | 下载生成文件 | `platformApi.artifacts.download` | ✗ | ✓ | platform-api | P0 |
| resource | `src/pages/ResourceWorkspace.tsx` | kb Tab | 知识库资料 | 静态占位文案 | ✗ | ✗ | web-coming-soon | P1 |
| resource | `src/components/resource/MyFilesView.tsx` | MyFilesView | 上传/下载/删除 | `platformApi.files.*` | ✗ | ✓ | platform-api | P0 |
| resource | `src/pages/MyFilesPanel.tsx` | MyFilesPanel | 关闭面板 | `onClose()` | ✗ | ✗ | frontend-only | P0 |
| resource | `src/components/LeftResourceShell.tsx` | LeftResourceShell | 文件/知识库侧栏切换 | local state | ✗ | ✗ | frontend-only | P1 |

---

## 7. Skill 管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| skills | `src/pages/SkillManagementView.tsx` | WebDocxCreatePanel | 生成文稿（测试） | **`fetch('/api/skills/web.docx.create/run')`** ⚠️ | ✗ | ✓ | skill-job | P0 |
| skills | `src/pages/SkillManagementView.tsx` | SkillManagementPanel | 刷新/同步/下载/识别 Skill 包 | `window.electronAPI.*` | ✓ | ✗ | electron-only | P3 |
| skills | `src/components/skill/SkillDevPanel.tsx` | SkillDevPanel | 测试知识写作/图片生成 | `execute({ skillId })` hook | ✗ | 部分 | server-api / web-coming-soon | P2 |

---

## 8. PPT / 内容生成

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| generation | `src/modules/generation/components/GenerationComposer.tsx` | GenerationComposer | 生成/停止 | context → Electron LLM | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/GenerationPromptComposer.tsx` | GenerationPromptComposer | 语音输入 | Vosk → electronAPI | ✓ | ✗ | web-coming-soon | P2 |
| generation | `src/modules/generation/components/ResultPreviewPanel.tsx` | ResultPreviewPanel | 应用/重新生成 | context → Electron | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/PptSkillDrawer.tsx` | PptSkillDrawer | 选择技能 | local state | ✗ | ✗ | frontend-only | P2 |
| generation | `src/modules/generation/components/PptWorkbenchPanel.tsx` | PptWorkbenchPanel | 应用/停止 PPT | context | ✓ | ✗ | web-coming-soon | P1 |

---

## 9. 数据分析 (Excel)

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| excel | `src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx` | ExcelAnalysisWorkbench | 选择文件/重建环境/开始分析 | `openFileDialog` / `excelRebuildEnv` / `excelAnalysisRun` | ✓ | ✗ | web-coming-soon | P1 |

---

## 10. 邮件 / 通讯

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| email | `src/communication/CommunicationWorkbench.tsx` | CommunicationWorkbench | 新建/发送/工作流 | EmailContext + IPC | ✓ | ✗ | web-coming-soon | P1 |
| email | `src/modules/email/components/ComposeModal.tsx` | ComposeModal | 发送/选附件 | fetch + electronAPI | ✓ | ✗ | web-coming-soon | P1 |
| email | `src/communication/components/WorkflowTasksPanel.tsx` | WorkflowTasksPanel | 批准/拒绝/刷新 | workflow service | ✗ | ✓ | web-coming-soon | P2 |
| contacts | `src/components/AddressBook.tsx` | AddressBook | 导航/选人 | local state + AC 代理 | ✗ | ✓ | server-api | P2 |

---

## 11. 日历

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 新建/编辑/删除/确认/忽略日程 | calendarService（本地） | ✗ | ✗ | web-coming-soon | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 周/列表/翻页 | local state | ✗ | ✗ | frontend-only | P2 |

---

## 12. 知识库

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| knowledge | `src/components/resource/LocalKnowledgePanel.tsx` | LocalKnowledgePanel | 上传到本地知识库 | `importDocuments()` → IPC | ✓ | ✗ | web-coming-soon | P1 |
| knowledge | `src/components/resource/KnowledgePanel.tsx` | KnowledgePanel | 上传/刷新 | context | ✓ | ✓ | web-coming-soon | P1 |
| knowledge | `src/modules/knowledge/components/KnowledgeConversationDock.tsx` | KnowledgeConversationDock | 发送提问 | WritingAssistant → IPC | ✓ | ✗ | web-coming-soon | P1 |
| knowledge | `src/modules/knowledge/components/KnowledgeSelectionDock.tsx` | KnowledgeSelectionDock | 导入/刷新/删除/新建文章 | context + IPC | ✓ | ✓ | web-coming-soon | P1 |
| knowledge | `src/modules/knowledge/components/PersonalLibrarySidebar.tsx` | PersonalLibrarySidebar | 上传/删除/新建文件夹 | IPC / file input | ✓ | ✓ | web-coming-soon | P2 |

---

## 13. 公文模板

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| formal | `src/modules/formal/components/FormalTemplatePanel.tsx` | FormalTemplatePanel | 应用模板 | context → Electron | ✓ | ✗ | web-coming-soon | P2 |
| formal | `src/modules/formal/components/FormalTemplateGeneratePanel.tsx` | FormalTemplateGeneratePanel | 生成文档 | WritingAssistant | ✓ | ✗ | web-coming-soon | P2 |

---

## 14. 作业 / 学习 WebView

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| homework | `src/modules/homework/components/HomeworkWorkbench.tsx` | HomeworkWorkbench | 上传 PDF/生成答案/导出 | fetch（路由未实现）+ LLM | ✗ | ✗ | web-coming-soon | P2 |
| homework | `src/modules/homework/components/WebviewWorkbench.tsx` | WebviewWorkbench | 确认 URL/刷新/设置 | local + WebView | ✗ | ✗ | web-coming-soon | P2 |

---

## 15. AI 聊天

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| chat | `src/modules/chat/ChatWindow.tsx` | ChatWindow | 发送/新建/隐藏会话 | `fetch('/api/chat/*')` **未实现** | 部分 admin IPC | ✗ | web-coming-soon | P2 |
| chat | `src/modules/chat/ChatWindow.tsx` | ChatWindow | 活动报告生成 | `activityAdminFetch/Post` | ✓ | ✓ | electron-only | P3 |

---

## 16. 图片 / 图表 / 论文

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| image | `src/modules/image/components/ImageWorkspace.tsx` | ImageWorkspace | 生成/保存图片 | sharedImageGeneration → IPC | ✓ | ✗ | web-coming-soon | P2 |
| plot | `src/modules/plot/components/PlotWorkspace.tsx` | PlotWorkspace | 选文件/换文件/生成图表 | PlotService → IPC | ✓ | ✗ | web-coming-soon | P2 |
| paper | `src/modules/paper/services/PaperService.ts` | —（服务层） | 论文生成全流程 | compat IPC | ✓ | ✗ | web-coming-soon | P2 |

---

## 17. 科学资讯

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| feed | `src/modules/feed/components/DailyFeedWorkbench.tsx` | DailyFeedWorkbench | 加载更多/过滤/详情 | 外部 API + local state | ✗ | ✓ | server-api | P2 |

---

## 18. 设置

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| settings | `src/pages/SettingsView.tsx` | SettingsView | 分类/缩放 | localStorage | ✗ | ✗ | frontend-only | P1 |
| settings | `src/components/FullSettingsPanel.tsx` | FullSettingsPanel | AI 供应商/测试/保存 | `electronAPI` | ✓ | ✗ | web-coming-soon | P1 |
| settings | `src/components/AISidebar.tsx` | AISidebar | 刷新/测试 LLM | `electronAPI` | ✓ | ✗ | web-coming-soon | P1 |

---

## 19. 委派 / 部门 / 管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| delegation | `src/components/delegation/DelegationToggleButton.tsx` | DelegationToggleButton | 启用/禁用委派 | DelegationContext | ✓ | ✗ | web-coming-soon | P3 |
| delegation | `src/components/delegation/DelegationConfirmPanel.tsx` | DelegationConfirmPanel | 确认/取消 | props callback | ✗ | ✗ | frontend-only | P3 |
| admin | `src/components/AdminActivityPanel.tsx` | AdminActivityPanel | 查看/生成报告/聊天审计 | `activityAdmin*` IPC | ✓ | ✓ | electron-only | P3 |
| admin | `src/components/ActivityReportPanel.tsx` | ActivityReportPanel | 快照/分析/日报 | `electronAPI` | ✓ | ✗ | electron-only | P3 |

---

## 汇总统计

| 指标 | 数量 |
|---|---|
| 扫描 TSX 文件含 onClick/onSubmit/button/form | **~75** 文件 |
| 盘点可点击业务动作（含子菜单/工具栏） | **~180+** |
| 已完成 Web 迁移（platform-api / server-api / skill-job） | **~40** |
| 纯前端（frontend-only） | **~45** |
| Web 版即将开放（web-coming-soon） | **~70** |
| 仅 Electron（electron-only） | **~25** |
| 散落 `fetch('/api')` 违规（业务层） | **4** 文件 |
| 含 `window.electronAPI` 的源文件 | **~55** |

---

## 迁移路线图（对应用户步骤 2–4）

### 第二步：扩展 platformApi

- `workspaces` — 已定义，需让 `WorkspaceContext` / shim 统一走 platformApi
- `files` — Web ✅；Electron 保持 IPC 直连（platformApi 抛错指引）
- `artifacts` — Web ✅
- `skills` — Web ✅；补 SkillJob 轮询封装
- `system` — 扩展 `isFeatureAvailable` 与各场景对齐

### 第三步：P0 迁移清单

| 动作 | 当前状态 | 待办 |
|---|---|---|
| ResourceWorkspace | ✅ platformApi | 知识库 Tab 占位已符合原则 7 |
| MyFilesView | ✅ platformApi | 收敛 `downloadWithAuth` 导出 |
| WebWritingPanel | ✅ platformApi | — |
| SkillManagementView | ⚠️ 散落 fetch | 改为 `platformApi.skills.run` |
| WorkWorkspace 上传/我的文件 | ⚠️ 散落 fetch | 改为 `platformApi.files.upload` + MyFilesPanel |

### 第四步：P1 迁移清单

| 域 | 建议 |
|---|---|
| PPT | `POST /api/skills/ppt.generate/run` + Artifact |
| Excel | 上传 → SkillJob → Artifact 报告 |
| Knowledge | 文件上传 `/api/kb` + `knowledge.chat` skill-job |
| Email | `/api/email/*` 或 web-coming-soon 至 SMTP 后端就绪 |

---

## P0 验收对照（当前 audit 结论）

| # | 标准 | audit 结论 |
|---|---|---|
| 1 | `npm run build` 通过 | 未在本步执行；迁移后需跑 |
| 2 | `cd server && npx tsc --noEmit` | 未在本步执行 |
| 3 | Web 无点击无反应 | 主流程 P0 有反馈；WorkWorkspace 上传失败时 **静默** ⚠️ 需修 |
| 4 | 无服务端能力显示「即将开放」 | ViewportHost 已覆盖主要场景；设置/日历等部分仍可能可点但无效 ⚠️ |
| 5 | 已开放按钮完整链路 | files/artifacts/docx.create ✅；违规 fetch 需迁 platformApi |
| 6 | 不提交 server/data | 与 audit 无关，迁移时注意 `.gitignore` |

---

## 附录：扫描方法

```bash
# onClick / button / form 计数
grep -r "onClick\|onSubmit\|<button\|<form" src --include="*.tsx" -l

# 违规 fetch
grep -r "fetch(['\`]/api" src --include="*.ts" --include="*.tsx"

# electronAPI 引用
grep -r "window\.electronAPI" src --include="*.ts" --include="*.tsx"
```

---

*下一步（不在本 audit 范围）：按第三节违规清单完成 P0 platformApi 收敛，再跑 build/tsc 验收。*
