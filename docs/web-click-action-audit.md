# Web Click Action Audit

> 扫描时间：2026-05-21  
> 目的：全面盘点前端可点击业务动作，标注当前实现方式、是否依赖 Electron API、是否已有后端 /api，以及 Web 迁移策略和优先级。

**Web 处理方式说明：**
| 值 | 含义 |
|---|---|
| `frontend-only` | 纯前端状态/UI 变化，无需后端 |
| `platform-api` | 已通过 `platformApi` 抽象，Web 走 fetch，Electron 走 IPC |
| `server-api` | 已接入或应接入 `/api/*` 后端接口 |
| `skill-job` | AI 生成任务，调用 `/api/skills/:id/run` |
| `web-coming-soon` | Web 版尚未迁移，显示"即将开放" |
| `electron-only` | 仅 Electron 有意义（OS 文件选择器等），Web 不需实现 |

**优先级说明：**
| 级别 | 含义 |
|---|---|
| P0 | 用户主流程必须可用 |
| P1 | 常用办公功能 |
| P2 | 增强功能 |
| P3 | 暂缓 |

---

## 1. 认证 / 账号

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| auth | `src/web/pages/LoginPage.tsx` | LoginPage | 登录 | `platformApi.auth.login()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/web/pages/RegisterPage.tsx` | RegisterPage | 注册 | `platformApi.auth.register()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/web/pages/AiosHomePage.tsx` | AiosHomePage | 退出登录 | `platformApi.auth.logout()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/LoginGate.tsx` | LoginGate | 登录（旧版门） | `useInternalAccount().login()` | ✗ | ✓ | platform-api | P0 |
| auth | `src/components/ForceChangePasswordModal.tsx` | ForceChangePasswordModal | 修改密码并进入 | `changePassword(old, new)` — context | ✗ | ✗ | server-api | P1 |
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

## 2. 导航

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| nav | `src/components/nav/PrimaryNav.tsx` | PrimaryNav | 导航项点击（工作/学习/生活/资源等） | `onNavigate(section)` — prop | ✗ | ✗ | frontend-only | P0 |
| nav | `src/pages/HomeDashboard.tsx` | HomeDashboard | 工作 / 学习 / 生活 | `onNavigate('work'/'study'/'life')` | ✗ | ✗ | frontend-only | P0 |
| nav | `src/pages/HomeDashboard.tsx` | HomeDashboard | 切换工作区 | `closeWorkspace()` — context | ✗ | ✗ | frontend-only | P2 |

---

## 3. 工作场景入口

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 文稿编辑 | `enterFreeMode()` — context | ✗ | ✗ | frontend-only | P0 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 邮件收发 | `enterEmailMode()` — context | ✗ | ✗ | frontend-only | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 日程管理 | `onNavigate('calendar')` — prop | ✗ | ✗ | frontend-only | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 数据分析 | `enterDataMode()` — context | ✗ | ✗ | frontend-only | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | PPT 生成 | `enterPptGenerationMode()` — context | ✗ | ✗ | frontend-only | P1 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 我的文件 | `setShowFiles(true)` — local state | ✗ | ✗ | frontend-only | P0 |
| work | `src/pages/WorkWorkspace.tsx` | WorkWorkspace | 上传文件 | `uploadRef.current.click()` → `fetch('/api/files/upload', POST)` | ✗ | ✓ | server-api | P0 |
| study | `src/pages/StudyWorkspace.tsx` | StudyWorkspace | 作业解析 | `enterHomeworkMode()` — context | ✗ | ✗ | frontend-only | P2 |
| study | `src/pages/StudyWorkspace.tsx` | StudyWorkspace | AI 课堂 | `enterAiClassMode()` — context | ✗ | ✗ | frontend-only | P2 |
| study | `src/pages/StudyWorkspace.tsx` | StudyWorkspace | 论文写作 | `enterDocumentGenerationMode()` — context | ✗ | ✗ | frontend-only | P2 |
| study | `src/pages/StudyWorkspace.tsx` | StudyWorkspace | 数据图表 | `enterImageGenerationMode()` — context | ✗ | ✗ | frontend-only | P2 |
| life | `src/pages/LifeWorkspace.tsx` | LifeWorkspace | AI 论坛 | `enterAiForumMode()` — context | ✗ | ✗ | frontend-only | P2 |
| life | `src/pages/LifeWorkspace.tsx` | LifeWorkspace | 轻量写作 | `enterFreeMode()` — context | ✗ | ✗ | frontend-only | P2 |
| life | `src/pages/LifeWorkspace.tsx` | LifeWorkspace | 图片创作 | `enterImageGenerationMode()` — context | ✗ | ✗ | frontend-only | P2 |
| life | `src/pages/LifeWorkspace.tsx` | LifeWorkspace | 科学资讯 | `enterDailyFeedMode()` — context | ✗ | ✗ | frontend-only | P2 |

---

## 4. 工作区管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 新建工作区 | `createWorkspace(name)` — context | ✗ | ✓ | server-api | P2 |
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 打开已有工作区（目录选择） | `window.electronAPI.openDirectoryDialog()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/pages/WorkspaceGate.tsx` | WorkspaceGate | 选择最近工作区 | `openWorkspace(wsPath)` — context | ✗ | ✓ | server-api | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 新建工作区 | `createWorkspace(name)` — context | ✗ | ✓ | server-api | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 打开目录 | `window.electronAPI.openDirectoryDialog()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 返回工作区选择 | `closeWorkspace()` — context | ✗ | ✗ | frontend-only | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 删除工作区 | `deleteWorkspace(wsPath)` — context (calls IPC) | ✓ | ✓ | server-api | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 打开文件 | `openDocumentPath(node.path)` — hook | ✗ | ✗ | web-coming-soon | P1 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 新建空白文档 | `window.electronAPI.createBlankDocument()` | ✓ | ✗ | web-coming-soon | P1 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 导入文件 | `window.electronAPI.importFilesToWorkspace()` | ✓ | ✓ | server-api | P1 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 新建文件夹 | `window.electronAPI.createWorkspaceFolder()` | ✓ | ✗ | web-coming-soon | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 重命名 | `window.electronAPI.renameWorkspacePath()` | ✓ | ✗ | web-coming-soon | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 删除文件/文件夹 | `window.electronAPI.deleteWorkspacePath()` | ✓ | ✗ | web-coming-soon | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 剪切/复制/粘贴 | `window.electronAPI.copyWorkspacePath()` / `moveWorkspacePath()` | ✓ | ✗ | web-coming-soon | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 复制路径 | `navigator.clipboard.writeText()` | ✗ | ✗ | frontend-only | P2 |
| workspace | `src/components/FileExplorer.tsx` | FileExplorer | 在 Finder 中显示 | `window.electronAPI.openExternalFile()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/components/resource/WorkspaceFilesPanel.tsx` | WorkspaceFilesPanel | 打开工作区（目录选择） | `window.electronAPI.openDirectoryDialog()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/components/resource/WorkspaceFilesPanel.tsx` | WorkspaceFilesPanel | 新建工作区 | `createWorkspace(name)` — context | ✗ | ✓ | server-api | P2 |
| workspace | `src/components/resource/SaveLocationSelector.tsx` | SaveLocationSelector | 更改保存位置 | `window.electronAPI.openDirectoryDialog()` | ✓ | ✗ | electron-only | P3 |
| workspace | `src/components/resource/SaveLocationSelector.tsx` | SaveLocationSelector | 新建工作区 | `createWorkspace(name)` — context | ✗ | ✓ | server-api | P2 |

---

## 5. 文稿编辑

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 生成 Word 文稿 | `fetch('/api/skills/web.docx.create/run', POST)` | ✗ | ✓ | skill-job | P0 |
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 下载 DOCX | `downloadWithAuth('/api/artifacts/:id/download')` | ✗ | ✓ | server-api | P0 |
| writing | `src/modules/writing/components/WebWritingPanel.tsx` | WebWritingPanel | 再生成一篇 | `handleReset()` — local state | ✗ | ✗ | frontend-only | P0 |
| writing | `src/components/DocumentFilePanel.tsx` | DocumentFilePanel | + 新建文稿（Web） | `WebDocxCreateModal` → `fetch('/api/skills/web.docx.create/run')` | ✗ | ✓ | skill-job | P0 |
| writing | `src/components/DocumentFilePanel.tsx` | DocumentFilePanel | + 新建文稿（Electron） | `window.electronAPI.createBlankDocument()` | ✓ | ✗ | electron-only | P3 |
| writing | `src/components/DocumentFilePanel.tsx` | DocumentFilePanel | 刷新文档树 | `refreshTree()` — context | ✓ | ✗ | electron-only | P3 |
| writing | `src/modules/writing/components/ContinueWritingPanel.tsx` | ContinueWritingPanel | 开始续写 | `ContinueWritingService` → `window.electronAPI` calls | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/modules/writing/components/ContinueWritingPanel.tsx` | ContinueWritingPanel | 停止续写 | `abortRef.current.abort()` — local | ✗ | ✗ | frontend-only | P1 |
| writing | `src/modules/writing/components/ContinueWritingPanel.tsx` | ContinueWritingPanel | 插入到文档 | `setMarkdown()` — local state → Tiptap editor | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/modules/writing/components/EditorPanel.tsx` | EditorPanel | 所有编辑器工具栏操作 | Tiptap chain commands | ✓ | ✗ | electron-only | P3 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 保存 | `onSave?.()` — callback prop → `electronAPI.saveDocument()` | ✓ | ✗ | web-coming-soon | P1 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 导出 PDF | `onExportPdf?.()` — callback prop → `electronAPI` | ✓ | ✗ | web-coming-soon | P2 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 导出 HTML | `onExportHtml?.()` | ✓ | ✗ | web-coming-soon | P2 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 生成 PPT | `onGeneratePptFromDocument?.()` | ✓ | ✗ | web-coming-soon | P2 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 存入知识库 | `onSaveToKnowledge?.()` | ✓ | ✗ | web-coming-soon | P2 |
| writing | `src/components/Toolbar.tsx` | Toolbar | 所有格式化操作（粗体/斜体等） | Tiptap editor chain commands | ✗ | ✗ | electron-only | P3 |

---

## 6. 资源中心 / 文件管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| resource | `src/pages/ResourceWorkspace.tsx` | ResourceWorkspace | Tab 切换（我的文件/生成记录/知识库） | `setTab()` — local state | ✗ | ✗ | frontend-only | P0 |
| resource | `src/pages/ResourceWorkspace.tsx` | ArtifactsTab | 下载生成文件 | `downloadWithAuth('/api/artifacts/:id/download')` | ✗ | ✓ | server-api | P0 |
| resource | `src/components/resource/MyFilesView.tsx` | MyFilesView | 上传文件 | `fetch('/api/files/upload', POST)` multipart | ✗ | ✓ | server-api | P0 |
| resource | `src/components/resource/MyFilesView.tsx` | MyFilesView | 下载文件 | `downloadWithAuth('/api/files/:id/download')` | ✗ | ✓ | server-api | P0 |
| resource | `src/components/resource/MyFilesView.tsx` | MyFilesView | 删除文件 | `fetch('/api/files/:id', DELETE)` | ✗ | ✓ | server-api | P0 |
| resource | `src/pages/MyFilesPanel.tsx` | MyFilesPanel | 关闭面板 | `onClose()` — prop | ✗ | ✗ | frontend-only | P0 |

---

## 7. Skill 管理

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| skills | `src/pages/SkillManagementView.tsx` | WebDocxCreatePanel | 生成文稿（测试） | `fetch('/api/skills/web.docx.create/run', POST)` | ✗ | ✓ | skill-job | P0 |
| skills | `src/pages/SkillManagementView.tsx` | SkillManagementPanel | 刷新已购 Skill 包 | `window.electronAPI.listMySkins?.()` | ✓ | ✗ | electron-only | P3 |
| skills | `src/pages/SkillManagementView.tsx` | SkillManagementPanel | 同步计划诊断 | `window.electronAPI.getSkillSyncPlan?.()` | ✓ | ✗ | electron-only | P3 |
| skills | `src/pages/SkillManagementView.tsx` | SkinCardRow | 下载 Skill 包 | `window.electronAPI.downloadSkillPackage?.()` | ✓ | ✗ | electron-only | P3 |
| skills | `src/pages/SkillManagementView.tsx` | SkinCardRow | 识别并启用 Skill | `window.electronAPI.recognizeSkillPackage?.()` | ✓ | ✗ | electron-only | P3 |
| skills | `src/components/skill/SkillDevPanel.tsx` | SkillDevPanel | 测试知识写作 | `execute({ skillId: 'knowledge.writing.legacy' })` — hook | ✗ | ✓ | server-api | P2 |
| skills | `src/components/skill/SkillDevPanel.tsx` | SkillDevPanel | 测试图片生成 | `execute({ skillId: 'image.generate.legacy' })` — hook | ✗ | ✓ | web-coming-soon | P2 |

---

## 8. PPT / 内容生成

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| generation | `src/modules/generation/components/GenerationComposer.tsx` | GenerationComposer | 生成内容 | `submitTask()` — context (calls LLM via Electron) | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/GenerationComposer.tsx` | GenerationComposer | 停止生成 | `stopTask()` — context | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/GenerationPromptComposer.tsx` | GenerationPromptComposer | 语音输入 | `startChineseVoskVoiceInput()` | ✗ | ✗ | web-coming-soon | P2 |
| generation | `src/modules/generation/components/ResultPreviewPanel.tsx` | ResultPreviewPanel | 应用到文档 | `applyResult()` — context (writes via Electron) | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/ResultPreviewPanel.tsx` | ResultPreviewPanel | 重新生成 | `retryGeneration()` — context | ✓ | ✗ | web-coming-soon | P1 |
| generation | `src/modules/generation/components/PptSkillDrawer.tsx` | PptSkillDrawer | 选择技能 | `setSelectedSkill()` — local state | ✗ | ✗ | frontend-only | P2 |
| generation | `src/modules/generation/components/PptWorkbenchPanel.tsx` | PptWorkbenchPanel | 应用 PPT 生成 | `applyPpt()` — context | ✓ | ✗ | web-coming-soon | P2 |
| generation | `src/modules/generation/components/PptWorkbenchPanel.tsx` | PptWorkbenchPanel | 停止 PPT 生成 | `stopGeneration()` — context | ✓ | ✗ | web-coming-soon | P2 |

---

## 9. 数据分析 (Excel)

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| excel | `src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx` | ExcelAnalysisWorkbench | 选择文件 | `window.electronAPI.openFileDialog()` | ✓ | ✗ | web-coming-soon | P2 |
| excel | `src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx` | ExcelAnalysisWorkbench | 重建 Python 环境 | `window.electronAPI.excelRebuildEnv()` | ✓ | ✗ | web-coming-soon | P2 |
| excel | `src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx` | ExcelAnalysisWorkbench | 开始分析 | `window.electronAPI.excelAnalysisRun()` | ✓ | ✗ | web-coming-soon | P2 |

---

## 10. 邮件 / 通讯

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| email | `src/communication/CommunicationWorkbench.tsx` | CommunicationWorkbench | 新建邮件 | `openComposeModal()` — context | ✗ | ✗ | web-coming-soon | P2 |
| email | `src/communication/CommunicationWorkbench.tsx` | CommunicationWorkbench | 发送邮件 | `sendEmail()` → `fetch('/api/email/send')` (实际走 Electron SMTP) | ✓ | ✗ | web-coming-soon | P2 |
| email | `src/communication/CommunicationWorkbench.tsx` | CommunicationWorkbench | 启动工作流 | `startEmailWorkflow()` — service | ✓ | ✗ | web-coming-soon | P2 |
| email | `src/modules/email/components/ComposeModal.tsx` | ComposeModal | 发送 | `onSubmit` → `POST /api/emails/send` (未实现路由) | ✗ | ✗ | web-coming-soon | P2 |
| email | `src/modules/email/components/ComposeModal.tsx` | ComposeModal | 选择附件 | `window.electronAPI.selectAttachments()` | ✓ | ✗ | web-coming-soon | P2 |
| email | `src/communication/components/WorkflowTasksPanel.tsx` | WorkflowTasksPanel | 批准 | `completeWorkflowTask(approval)` — service | ✗ | ✓ | web-coming-soon | P2 |
| email | `src/communication/components/WorkflowTasksPanel.tsx` | WorkflowTasksPanel | 拒绝 | `completeWorkflowTask(rejection)` — service | ✗ | ✓ | web-coming-soon | P2 |
| email | `src/communication/components/WorkflowTasksPanel.tsx` | WorkflowTasksPanel | 刷新 | `getMyWorkflowTasks()` — service | ✗ | ✓ | web-coming-soon | P2 |

---

## 11. 日历

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 新建日程 | `setShowCreateForm(true)` | ✗ | ✗ | frontend-only | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 切换视图（周/列表） | `setViewMode()` — local state | ✗ | ✗ | frontend-only | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 上一周/下一周/今天 | `setWeekAnchor()` — local state | ✗ | ✗ | frontend-only | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 保存日程（新建/编辑） | `createCalendarEvent()` / `updateCalendarEvent()` — calendarService | ✗ | ✗ | web-coming-soon | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 确认加入日程 | `updateCalendarEvent({ status: 'confirmed' })` | ✗ | ✗ | web-coming-soon | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 忽略日程 | `updateCalendarEvent({ status: 'ignored' })` | ✗ | ✗ | web-coming-soon | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 删除日程 | `deleteCalendarEvent()` — calendarService | ✗ | ✗ | web-coming-soon | P2 |
| calendar | `src/pages/CalendarWorkspace.tsx` | CalendarWorkspace | 查看来源邮件 | `window.dispatchEvent(CustomEvent)` + sessionStorage | ✗ | ✗ | web-coming-soon | P2 |

---

## 12. 知识库

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| knowledge | `src/components/resource/LocalKnowledgePanel.tsx` | LocalKnowledgePanel | 上传文件到本地知识库 | `importDocuments()` — context (使用 electronAPI) | ✓ | ✗ | web-coming-soon | P2 |
| knowledge | `src/components/resource/KnowledgePanel.tsx` | KnowledgePanel | 上传文件到知识库 | `importDocuments()` — context | ✓ | ✗ | web-coming-soon | P2 |
| knowledge | `src/components/resource/KnowledgePanel.tsx` | KnowledgePanel | 重新连接知识库 | `refresh()` — context | ✗ | ✓ | web-coming-soon | P2 |
| knowledge | `src/modules/knowledge/components/KnowledgeConversationDock.tsx` | KnowledgeConversationDock | 发送提问 | `runWritingAssistant()` → LLM via Electron | ✓ | ✗ | web-coming-soon | P1 |
| knowledge | `src/modules/knowledge/components/PersonalLibrarySidebar.tsx` | PersonalLibrarySidebar | 上传文件 | `electronAPI` or `<input type=file>` | ✓ | ✗ | web-coming-soon | P2 |
| knowledge | `src/modules/knowledge/components/PersonalLibrarySidebar.tsx` | PersonalLibrarySidebar | 删除文件 | `deleteFile()` — context | ✗ | ✓ | web-coming-soon | P2 |
| knowledge | `src/modules/knowledge/components/PersonalLibrarySidebar.tsx` | PersonalLibrarySidebar | 新建文件夹 | `createFolder()` — local state | ✗ | ✗ | web-coming-soon | P2 |

---

## 13. 公文模板

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| formal | `src/modules/formal/components/FormalTemplatePanel.tsx` | FormalTemplatePanel | 应用模板 | `applyTemplate()` — context (writes via Electron) | ✓ | ✗ | web-coming-soon | P2 |
| formal | `src/modules/formal/components/FormalTemplatePanel.tsx` | FormalTemplatePanel | 编辑字段 | `setFieldValue()` — local state | ✗ | ✗ | frontend-only | P2 |
| formal | `src/modules/formal/components/FormalTemplateGeneratePanel.tsx` | FormalTemplateGeneratePanel | 生成文档 | `runWritingAssistant()` — context (Electron LLM) | ✓ | ✗ | web-coming-soon | P2 |
| formal | `src/modules/formal/components/FormalTemplateGeneratePanel.tsx` | FormalTemplateGeneratePanel | 预览 | `setShowPreview()` — local state | ✗ | ✗ | frontend-only | P2 |

---

## 14. 作业辅助

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| homework | `src/modules/homework/components/HomeworkWorkbench.tsx` | HomeworkWorkbench | 上传 PDF | `handleUpload()` → PDF render + LLM | ✗ | ✓ | web-coming-soon | P2 |
| homework | `src/modules/homework/components/HomeworkWorkbench.tsx` | HomeworkWorkbench | 生成答案 | `generateAnswer()` → `fetch('/api/homework/answer')` (路由未实现) | ✗ | ✗ | web-coming-soon | P2 |
| homework | `src/modules/homework/components/HomeworkWorkbench.tsx` | HomeworkWorkbench | 停止生成 | `abortController.abort()` — local | ✗ | ✗ | frontend-only | P2 |

---

## 15. AI 聊天

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| chat | `src/modules/chat/ChatWindow.tsx` | ChatWindow | 发送消息 | `fetch('/api/chat/send')` (路由未实现) | ✗ | ✗ | web-coming-soon | P2 |
| chat | `src/modules/chat/ChatWindow.tsx` | ChatWindow | 新建会话 | `fetch('/api/chat/conversations')` (路由未实现) | ✗ | ✗ | web-coming-soon | P2 |
| chat | `src/modules/chat/ChatWindow.tsx` | ChatWindow | 隐藏/解散会话 | `fetch('/api/chat/*')` (路由未实现) | ✗ | ✗ | web-coming-soon | P2 |

---

## 16. 图片创作

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| image | `src/modules/image/components/ImageWorkspace.tsx` | ImageWorkspace | 生成图片 | `runSharedImageGeneration()` → Electron/MiniMax | ✓ | ✗ | web-coming-soon | P2 |
| image | `src/modules/image/components/ImageWorkspace.tsx` | ImageWorkspace | 保存图片 | `saveImageIncrementallyToWorkspace()` — disk write via Electron | ✓ | ✗ | web-coming-soon | P2 |

---

## 17. 科学资讯

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| feed | `src/modules/feed/components/DailyFeedWorkbench.tsx` | DailyFeedWorkbench | 加载更多 | `fetchSciencerelayArticles()` — external API | ✗ | ✓ | server-api | P2 |
| feed | `src/modules/feed/components/DailyFeedWorkbench.tsx` | DailyFeedWorkbench | 过滤话题 | `setActiveTopic()` — local state | ✗ | ✗ | frontend-only | P2 |
| feed | `src/modules/feed/components/DailyFeedWorkbench.tsx` | DailyFeedWorkbench | 查看文章详情 | `setDetailId()` — local state | ✗ | ✗ | frontend-only | P2 |

---

## 18. 设置

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| settings | `src/pages/SettingsView.tsx` | SettingsView | 分类切换（AI配置/显示/Skill等） | `setCategory()` — local state | ✗ | ✗ | frontend-only | P1 |
| settings | `src/pages/SettingsView.tsx` | DisplayScaleSection | 缩放比例 | `localStorage + document.zoom` | ✗ | ✗ | frontend-only | P1 |
| settings | `src/components/FullSettingsPanel.tsx` | FullSettingsPanel | AI 供应商选择 | `handleLlmProviderChange()` — local state | ✗ | ✗ | web-coming-soon | P1 |
| settings | `src/components/FullSettingsPanel.tsx` | FullSettingsPanel | 检测文字模型连通性 | `window.electronAPI.testLlmConnection()` | ✓ | ✗ | web-coming-soon | P1 |
| settings | `src/components/FullSettingsPanel.tsx` | FullSettingsPanel | 检测图片模型连通性 | `window.electronAPI.testImageConnection()` | ✓ | ✗ | web-coming-soon | P2 |
| settings | `src/components/FullSettingsPanel.tsx` | FullSettingsPanel | 保存 AI 设置 | `window.electronAPI.saveSettings()` | ✓ | ✗ | web-coming-soon | P1 |
| settings | `src/components/AISidebar.tsx` | AISidebar | 刷新配置 | `window.electronAPI.getSettings()` | ✓ | ✗ | web-coming-soon | P1 |
| settings | `src/components/AISidebar.tsx` | AISidebar | 测试文字 LLM | `window.electronAPI.testLlmConnection()` | ✓ | ✗ | web-coming-soon | P1 |
| settings | `src/components/AISidebar.tsx` | AISidebar | Tab 切换 | `setActiveTab()` — local state | ✗ | ✗ | frontend-only | P1 |

---

## 19. 活动报告（管理员）

| 模块 | 文件 | 组件 | 按钮/动作 | 当前实现 | 依赖 electronAPI | 已有 /api | Web 处理方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| admin | `src/components/ActivityReportPanel.tsx` | ActivityReportPanel | 记录快照 | `window.electronAPI.activityTakeSnapshot()` | ✓ | ✗ | electron-only | P3 |
| admin | `src/components/ActivityReportPanel.tsx` | ActivityReportPanel | 分析文件 | `window.electronAPI.activityAnalyzeFiles()` | ✓ | ✗ | electron-only | P3 |
| admin | `src/components/ActivityReportPanel.tsx` | ActivityReportPanel | 生成日报 | `window.electronAPI.activityGenerateReport()` | ✓ | ✗ | electron-only | P3 |

---

## 汇总统计

| 指标 | 数量 |
|---|---|
| 扫描到的可点击动作总数 | **~150** |
| 已完成 Web 迁移（platform-api / server-api / skill-job） | **~35** |
| 纯前端状态，无需后端（frontend-only） | **~40** |
| Web 版即将开放（web-coming-soon） | **~55** |
| 仅 Electron 有意义（electron-only） | **~20** |

---

## P0 动作清单（必须可用）

| 动作 | 当前状态 |
|---|---|
| 登录 / 登出 | ✅ 已接 platform-api |
| 进入文稿编辑 | ✅ 已接 frontend-only |
| 生成 Word 文稿 | ✅ 已接 skill-job |
| 下载 DOCX | ✅ 已接 server-api |
| 上传文件 | ✅ 已接 server-api |
| 下载文件 | ✅ 已接 server-api |
| 删除文件 | ✅ 已接 server-api |
| 查看生成记录 Tab | ✅ 已接 server-api |
| 进入资源中心 | ✅ 已接 frontend-only |
| 导航（工作/学习/生活） | ✅ 已接 frontend-only |

## P1 动作清单（下一阶段目标）

| 动作 | 建议实现方式 |
|---|---|
| AI 模型配置（供应商/Key/测试） | `GET/POST /api/settings` |
| 续写功能 | `POST /api/skills/continue-writing/run` |
| 知识库对话 | `POST /api/skills/knowledge.chat/run` |
| 论文生成 | `POST /api/skills/paper.generate/run` |
| 修改密码 | `POST /api/auth/change-password` |
| 工作场景生成（邮件/PPT/数据分析） | `web-coming-soon` 占位 → 后续逐个接 skill-job |
