# Web Feature Parity Audit

> Branch: `feat/web-feature-parity`
> Based on: `feat/aios-matter-mvp`
> Scan date: 2026-05-22

---

## 扫描范围

- `src/features/**`（所有 feature 模块）
- `src/pages/**`（导航入口）
- `src/runtime/electronAPIShim.ts`（shim 行为）
- `server/src/features/**`（对应后端能力）

---

## 一、主导航入口状态

| 导航入口 | section | Web 状态 | 说明 |
|----------|---------|----------|------|
| 首页 | `home` | ✅ full | HomeDashboard 仅展示，无 Electron 依赖 |
| 事项 | `aios` | ✅ full | AIOS Matter MVP 完整 Web 实现 |
| 工作 | `work` | ✅ full | WorkWorkspace 路由入口，子功能见下 |
| 学习 | `study` | ✅ full | StudyWorkspace 路由入口 |
| 生活 | `life` | ✅ full | LifeWorkspace 路由入口 |
| 资源 | `resource` | ✅ full | 文件上传/下载/Artifact 均可用 |
| Skill | `skill-center` | partial | 只读列表，install/manage 为 Electron-only |
| 通讯 | `chat` | partial | Matrix chat，Web 降级为提示 |
| 设置 | `settings` | ✅ full | AI 连接测试/设置均走 server API |
| 账号 | `account` | ✅ full | AccountCenter JWT 登录可用 |
| 日历 | `calendar` | ✅ full | calendarRuntime Web 路径全覆盖 |

---

## 二、各功能模块详细分析

### 2.1 文稿模块 `src/features/document/`

| 功能 | 状态 | 详情 |
|------|------|------|
| AI 生成文稿 | ✅ full | `platformApi.skills.run('web.docx.create')` → 真实 artifact |
| A4 编辑器 | ✅ full | TipTap，无本地依赖 |
| 导出 Word | ✅ full | `platformApi.skills.run('web.docx.export')` → artifact 下载 |
| 导出 Markdown | ✅ full | `platformApi.skills.run('web.markdown.export')` → artifact 下载 |
| 导出 PDF | ❌ missing | `exportPdfFromEditor` shim 返回 null → 显示 **"已取消导出"**（P0 误导） |
| 导出 HTML | ❌ partial | `saveFileDialog` 返回 null → 静默返回（P1） |
| 本地文件另存为 | partial | `saveFileDialog` 返回 null → 显示迁移提示（OK） |
| 插入本地图片 | partial | `isWebShim()` 守卫 → 显示迁移提示（OK） |
| 导入外部 DOCX | ❌ partial | `readOoxmlPackage` shim 返回 `{}` → 解析结果为空（P1） |
| 知识库上下文预览 | ❌ partial | `previewKnowledgeTaskContext` 返回 `{context:'', tokenCount:0}` → AI 获取空知识库无提示（P0 静默） |
| 保存到工作区文件 | partial | `writeFile` shim 返回 `{success:true, filePath:''}` → 无实际写入（P1 静默） |

### 2.2 PPT 模块 `src/features/ppt/`

| 功能 | 状态 | 详情 |
|------|------|------|
| PPT 生成 | ✅ full | `pptWebGeneration.ts` → `platformApi.skills.run('web.pptx.create')` → 真实 PPTX artifact |
| 下载 PPTX | ✅ full | `isWebShim()` 路径 → `platformApi.artifacts.download` |
| deckPreview / deckRender | ❌ electron_only | shim 返回 `{success:true}` 但无数据（P1 静默） |
| 导入 PPTX 文件 | ❌ missing | `pptxImportFromDialog` → shim `{success:false}`；无 Web 上传路径 |
| PPT 模板包列表 | ❌ missing | `pptxListContentPackages` → shim 返回 `{packages:[]}` → 无模板显示（P1） |
| 知识库上下文 | ❌ partial | 同文稿模块，P0 静默 |
| 打开 PPTX 文件 | partial | `openExternalFile` 返回 `{success:false}` → 显示迁移提示（OK） |

### 2.3 数据分析模块 `src/features/data-analysis/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 文件上传 | ✅ full | `/api/files/upload` via `platformApi.files.upload` |
| Excel 分析 | ✅ full | `platformApi.excel.analyze` → artifact |
| 下载分析报告 | ✅ full | `platformApi.artifacts.download` |
| 错误状态显示 | partial | 有 appendEnvLog，但无进度百分比（P2） |

### 2.4 邮件模块 `src/features/email/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 账号配置/测试 | ✅ full | `platformApi.email.*` |
| 收件箱刷新 | ✅ full | `platformApi.email.listMessages` |
| 邮件详情 | ✅ full | `platformApi.email.getMessage` |
| 邮件发送/回复 | ✅ full | `platformApi.email.sendMessage` |
| 邮件→事项 | ✅ full | `POST /api/aios/matters/from-email`（本版新增） |
| 已发件/垃圾箱 | ❌ partial | `emailRuntimeFetchSent/Trash` Web 返回 `[]`（P1 静默空） |
| 附件下载 | ❌ missing | 无 Web 路径，附件无法下载 |
| 批量回复草稿 | ❌ partial | `bulkEmailDraftService` 使用 electronAPI（P1） |

### 2.5 图片模块 `src/features/image/`

| 功能 | 状态 | 详情 |
|------|------|------|
| AI 图片生成 | ✅ full | `platformApi.skills.run('web.image.generate')` → PNG artifact → blob 预览 |
| 图片 artifact 下载 | ✅ full | `platformApi.artifacts.download` |
| 保存到工作区 | partial | 按钮在 Web 模式下已 disabled，有说明文字（OK） |
| 插入到编辑器 | partial | Web 模式显示迁移提示（OK） |
| 目录批量导入 | ❌ electron_only | `openDirectoryDialog` 返回 null，无 Web 上传入口 |
| 参考图上传 | ❌ missing | 无 Web 文件上传路径 |
| 图片裁切 | ❌ electron_only | `cropImageFile` 返回空 path → 结果未裁切（P1） |

### 2.6 日程模块 `src/features/calendar/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 创建/编辑/删除 | ✅ full | `calendarRuntime.createCalendarEvent` → HTTP API |
| 列表查看 | ✅ full | `calendarRuntime.listCalendarEvents` → HTTP API |
| 从邮件创建日程 | ✅ full | mailTriageClassifier + calendarRuntime |

### 2.7 日报模块 `src/features/report/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 生成日报 | ✅ full | `platformApi.skills.run('web.daily.report')` → Markdown artifact |
| 下载报告 | ✅ full | `platformApi.artifacts.download` |
| 整合 AIOS 事项 | ❌ missing | dailyReportSkill 仅读 files/artifacts，未读 Matter/AuditTrail |

### 2.8 资源中心模块 `src/pages/ResourceWorkspace.tsx`

| 功能 | 状态 | 详情 |
|------|------|------|
| 文件列表 | ✅ full | `platformApi.files.list` |
| 文件上传 | ✅ full | `platformApi.files.upload` |
| 文件下载 | ✅ full | `platformApi.files.download` |
| Artifact 列表 | ✅ full | `platformApi.artifacts.list` |
| Artifact 下载 | ✅ full | `platformApi.artifacts.download` |
| Artifact 删除 | ✅ full | `platformApi.artifacts.delete` |
| Artifact 类型筛选 | ❌ missing | 无 type filter，所有类型混列（P2） |

### 2.9 知识库模块 `src/features/knowledge/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 远程知识库查看 | ✅ full | RemoteKnowledgePanel |
| 导入文档 | ❌ partial | `importKnowledgeDocuments` shim 返回 `{imported:0}` → 静默（P0） |
| 知识库上下文注入 | ❌ partial | `previewKnowledgeTaskContext` 返回空 → AI 无知识上下文（P0） |

### 2.10 设置模块 `src/features/settings/`

| 功能 | 状态 | 详情 |
|------|------|------|
| AI 连接测试 | ✅ full | `platformApi.settings.testAi` |
| 保存/读取设置 | ✅ full | server API |
| 本地路径/引擎配置 | N/A | Electron-only，Web 不需要 |

### 2.11 AIOS 事项 `src/features/aios/`

| 功能 | 状态 | 详情 |
|------|------|------|
| 事项 CRUD | ✅ full | `/api/aios/matters` |
| 证据管理 | ✅ full | `/api/aios/matters/:id/evidence` |
| 决策包生成 | ✅ full | `/api/aios/matters/:id/decision-package` |
| 审计时间线 | ✅ full | `/api/aios/matters/:id/audit` |
| 邮件→事项 | ✅ full | `/api/aios/matters/from-email` |
| Matter→回复草稿 | ❌ missing | 待实现 |
| Matter→文稿 Artifact | ❌ missing | 待实现 |
| Matter→PPT Artifact | ❌ missing | 待实现 |

---

## 三、违规等级汇总

### P0：静默失败（用户不知道操作无效）

| 文件 | 问题 |
|------|------|
| `EditorPanel.tsx:handleExportPdf` | `exportPdfFromEditor` 返回 null → 显示"已取消导出"，实为 Web 不支持 |
| `EditorPanel.tsx` | `previewKnowledgeTaskContext` 返回 `{context:''}` → AI 知识库上下文静默为空 |
| `EditorPanel.tsx:handleSaveCurrentAsDocx` | `writeFile` shim 返回 `{success:true}` 但无写入 → 已有 Web 守卫（P0 已修复为 partial） |
| `KnowledgeContext` | `importKnowledgeDocuments` shim 返回 `{imported:0}` → 静默失败 |

### P1：功能缺失（按钮不可用或功能入口缺失）

| 文件 | 问题 |
|------|------|
| `EditorPanel.tsx:handleExportHtml` | `saveFileDialog` 返回 null → 静默早返回，无下载 |
| `ResultPreviewPanel.tsx` | `pptxListContentPackages` 返回 `{packages:[]}` → 无模板列表 |
| `emailRuntime.ts` | `emailRuntimeFetchSent/Trash` 返回 `[]` → 空邮件夹无提示 |
| `ImageWorkspace.tsx` | 无参考图上传入口 |
| `bulkEmailDraftService.ts` | 使用 electronAPI，Web 路径缺失 |

### P2：功能未对齐（体验次于 Electron，但不静默）

| 文件 | 问题 |
|------|------|
| `ResourceWorkspace.tsx` | Artifact 列表无类型筛选 |
| `ExcelAnalysisWorkbench.tsx` | 无分析进度百分比 |
| `MatterWorkbench.tsx` | 缺少"从事项生成回复/文稿/PPT"入口 |
| `WebDailyReportPanel.tsx` | 日报未整合 AIOS 事项数据 |

---

## 四、window.electronAPI 调用密度（Top files in src/features）

| 文件 | 调用次数 | 评估 |
|------|----------|------|
| `EditorPanel.tsx` | 41 | 大多数有 Web 守卫或 shim 处理，但 3 处 P0 |
| `ResultPreviewPanel.tsx` | 30 | PPT 下载有 Web 路径，其余 shimmed |
| `GenerationPromptComposer.tsx` | 27 | 知识库相关 shim 静默 |
| `ImageWorkspace.tsx` | 13 | 生成路径已走 platformApi，保存路径有守卫 |
| `KnowledgeConversationDock.tsx` | 6 | previewKnowledgeTaskContext 静默 |

---

## 五、直接 fetch('/api') 检查

```
grep -R "fetch('/api" src/features → 0 条违规
```

所有 API 调用均通过 `platformApi` 或 `matterRuntime`（直接 fetch 到 `/api/aios/`，在 feature service 层）。

---

## 六、直接 window.electronAPI 调用（非 shim 层）违规

```
src/features/document/components/EditorPanel.tsx (41 calls)
src/features/ppt/components/ResultPreviewPanel.tsx (30 calls)
src/features/ppt/components/GenerationPromptComposer.tsx (27 calls)
...
```

大部分已通过 `isWebShim()` 守卫或 shim mock 处理。P0 级别的已在上文标注。

---

## 七、下一步计划

| 阶段 | 目标 | 状态 |
|------|------|------|
| Phase 2 | UI 补全：PDF/HTML 导出 Web 路径；disabled 按钮说明 | 待实现 |
| Phase 3 | 后端：Matter→回复草稿/文稿/PPT；日报整合 AIOS；资源中心类型筛选 | 待实现 |
| Phase 4 | 统一 Artifact：email_draft / decision_package 类型；Matter.artifactIds | 待实现 |

---

_生成此报告后执行 `npm run build:web` 和 `cd server && npm run build` 均通过。_
