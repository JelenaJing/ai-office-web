# Web Foundation Acceptance Report

> Branch: `feat/web-module-boundaries`
> Status: Pre-merge review

This document records the true Web availability status of each top-level feature. "可用" means a user can successfully complete the workflow entirely in the browser. "降级" means the feature works with reduced capability. "禁用" means the feature is not yet accessible from the web UI.

---

## 一、文稿编辑（Document）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 新建文档 / 富文本编辑 | **可用** | WordLikeDocumentEditor / A4RichTextEditor 正常渲染 |
| AI 续写 / 指令编辑 | **可用** | 经 `/api/writing/stream` server skill 调用 |
| 导出 DOCX | **可用** | `platformApi.artifacts.download()` → `/api/artifacts/:id/download` |
| 本地文件树 | **禁用** | 依赖 Electron IPC；Web 版无本地目录访问 |
| 知识库草稿工作区 | **禁用** | `openKnowledgeWorkspaceDraft` 在 `isWebShim()` 时抛出明确错误 |

---

## 二、PPT 生成（PPT）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 输入主题生成 PPT 大纲 | **可用** | GenerationWorkbenchPanel → `/api/ppt/generate` |
| 下载 PPTX | **可用** | platformApi artifact 下载 |
| 本地模板选择 | **禁用** | 依赖 Electron 文件对话框 |

---

## 三、数据分析（Data Analysis）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 上传 Excel / CSV | **可用** | `/api/files/upload` |
| AI 分析 + 图表 | **可用** | ExcelAnalysisWorkbench → `/api/excel/analyze` |
| 导出结果 | **可用** | platformApi artifact 下载 |
| WebExcelAnalysisPanel | **降级（temporary）** | 旧入口保留，最终将替换为 ExcelAnalysisWorkbench |

---

## 四、邮件（Email）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| IMAP 收件箱 | **可用** | CommunicationWorkbench → server IMAP bridge |
| 发送邮件 | **可用** | `/api/email/send` |
| AI 邮件分拣 | **降级** | `isWebShim()` 时跳过 LLM 分拣，仅使用本地规则 |
| AI 预生成草稿 | **降级** | `isWebShim()` 时跳过 writingAssistant IPC，返回基础草稿 |
| 批量草稿生成 | **降级** | 同上，fallback 到模板草稿 |
| WebEmailPanel | **降级（temporary）** | 旧入口保留 |

---

## 五、图片生成（Image）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 文生图 | **可用** | `/api/image/generate` |
| 参考图（知识库图片引用） | **降级** | `isWebShim()` 时使用 HTTP URL fallback，跳过 readImageAsDataUrl |
| 下载生成图片 | **可用** | platformApi artifact 下载 |
| WebImageGenerationPanel | **降级（temporary）** | 旧入口保留 |

---

## 六、日程（Calendar）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 查看日程 | **可用** | `/api/calendar/events` |
| 新建 / 编辑日程 | **可用** | `/api/calendar/events` POST/PUT |
| 删除日程 | **可用** | `/api/calendar/events/:id` DELETE |
| WebCalendarPanel | **降级（temporary）** | 旧入口保留 |

---

## 七、日报（Report）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| AI 生成日报 | **可用** | `/api/report/generate` server skill |
| 导出 DOCX | **可用** | platformApi artifact 下载 |
| WebDailyReportPanel | **降级（temporary）** | 旧入口保留 |

---

## 八、资源中心（Resource Center）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 查看 Artifacts 列表 | **可用** | platformApi.artifacts.list() |
| 下载 Artifact 文件 | **可用** | platformApi.artifacts.download() |
| 选择本地工作区目录 | **禁用** | `isWebShim()` 时显示"Web 版暂未开放" |
| 本地文件浏览器 | **禁用** | 依赖 Electron 文件系统访问 |

---

## 九、知识库（Knowledge）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 查看部门知识库 | **可用** | `/api/departments` + `/api/knowledge` |
| 知识库文档列表 | **可用** | RemoteKnowledgePanel |
| 打开草稿工作区 | **禁用** | `isWebShim()` 时抛出明确错误（依赖本地文件系统） |

---

## 十、设置（Settings）

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 邮箱账号配置 | **可用** | `/api/settings/email` |
| 邮箱密码加密存储 | **可用** | AES-256-GCM with `EMAIL_SECRET`（production 必须配置） |
| AI 模型配置 | **可用** | `/api/settings` |
| WebSettingsPanel | **降级（temporary）** | 旧入口保留 |

---

## 十一、Skill Center

| 功能 | Web 状态 | 说明 |
|------|----------|------|
| 查看 skill 列表 | **可用** | `/api/skills` |
| 安装 / 卸载 skill | **可用** | `/api/store` |
| 本地 skill 开发 | **禁用** | 依赖 Electron 本地文件编辑 |

---

## 生产安全状态

| 检查项 | 状态 |
|--------|------|
| 所有 API 路由在 production 无 token 时返回 401 | ✅ 已修复（`requireAccountUser` 替换 `resolveUserId`） |
| artifacts.ts 本地 resolveUserId 已移除 | ✅ 已修复 |
| 邮箱密码加密（AES-256-GCM） | ✅ 已实现（`EMAIL_SECRET` env var） |
| production 无 `EMAIL_SECRET` 时拒绝保存密码 | ✅ 已实现 |
| AI 邮件分拣 `writingAssistant` shim 绕过 | ✅ `isWebShim()` guard 已添加 |
| 批量草稿 `writingAssistant` shim 绕过 | ✅ `isWebShim()` guard 已添加 |
| 知识库工作区 `materializeKnowledgeWorkspace` 静默成功 | ✅ 已修复（Web 时抛出明确错误） |
| `openDirectoryDialog` 静默返回 null | ✅ 已修复（Web 时显示"Web 版暂未开放"） |
| `readImageAsDataUrl` Electron-only 调用 | ✅ 已修复（`isWebShim()` 时使用 HTTP URL fallback） |

---

## 已配置 npm scripts

```
npm run check:web    # typecheck + build:web
npm run check:server # server TypeScript build
npm run check:all    # check:web + build:electron + check:server
```

---

## 下一步建议

1. **配置 `EMAIL_SECRET`**：生产环境部署时设置强随机值（建议 32 字节 hex）
2. **Web 鉴权接入**：确保 `ACCOUNT_CENTER_URL` 正确配置，`requireAccountUser` 能正常验证 token
3. **暂时入口清理**：后续 Sprint 可逐步删除 `WebXXXPanel` temporary 入口，统一使用新 feature module 组件
4. **本地文件操作替代方案**：资源中心"选择工作区"可改为 Web 上传 + 云存储 workspace 方案
5. **邮件 AI 增强**：Web 版邮件 AI 分拣可接入 platformApi skill 通道，替代 Electron writingAssistant IPC
