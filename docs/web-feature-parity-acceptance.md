# Web Feature Parity Acceptance

> Branch: `feat/web-feature-parity`
> Date: 2026-05-22
> Based on: `feat/aios-matter-mvp`

---

## Phase 1 — 审计报告 ✅

生成了 `docs/web-feature-parity-audit.md`，扫描所有 `window.electronAPI` 调用、shim 行为、P0/P1/P2 违规。

Commit: `3c6c996` — `docs: web feature parity audit`

---

## Phase 2 — UI Parity Fixes ✅

| 问题 | 修复方式 | 状态 |
|------|---------|------|
| `EditorPanel.handleExportPdf` — shim 返回 null 显示"已取消导出" | 加 `isWebShim()` 守卫，显示"Web 版暂不支持 PDF 导出，请使用导出 Word" | ✅ |
| `EditorPanel.handleExportHtml` — `saveFileDialog` 返回 null 静默退出 | 加 `isWebShim()` 路径，直接用 Blob 触发浏览器下载 | ✅ |

---

## Phase 3 — Backend Priority Implementations ✅

### 3.1 Matter → 回复草稿 / 文稿 / PPT

新增 `server/src/features/aios/services/generationService.ts`：
- `generateReplyDraft(userId, matterId)` — 调用 `invokeLlmText` / 降级模板 → `email_draft` artifact
- `generateDocumentArtifact(userId, matterId)` — 调用 `generateDocumentContent` → `document` (md) artifact
- `generatePptArtifact(userId, matterId)` — 调用 `buildSlidePlanFromPrompt` + `writePptxFile` → `presentation` (pptx) artifact
- 所有结果写入 `Matter.artifactIds`，记录 audit event

新增 AIOS server routes（`server/src/features/aios/routes.ts`）：
- `POST /api/aios/matters/:id/generate-reply`
- `POST /api/aios/matters/:id/generate-document`
- `POST /api/aios/matters/:id/generate-ppt`

新增 AIOS audit actions（`server/src/features/aios/types.ts`）：
- `generate_reply_draft`
- `generate_document_artifact`
- `generate_ppt_artifact`

### 3.2 Matter Workbench — 生成按钮

`src/features/aios/components/MatterWorkbench.tsx` 左侧面板新增"AI 生成"区块：
- ✉️ 生成回复草稿（绿色按钮）
- 📄 生成文稿 Artifact（紫色按钮）
- 🎞 生成 PPT Artifact（橙色按钮）
- 生成成功/失败后显示内联状态消息

`src/features/aios/services/matterRuntime.ts` 新增：
- `generateReplyDraft(matterId)`
- `generateDocumentArtifact(matterId)`
- `generatePptArtifact(matterId)`

### 3.3 日报整合 AIOS 事项

`server/src/features/report/skills/dailyReportSkill.ts` 新增：
- 调用 `listMatters(userId)` 获取所有事项
- 日报新增"今日事项（当日新增）"章节
- 日报新增"进行中事项"章节（最多 10 条）

---

## Phase 4 — 统一 Artifact ✅

### 4.1 Artifact 类型筛选

`src/pages/ResourceWorkspace.tsx` ArtifactsTab 新增：
- 类型筛选 select（从实际 artifact 类型动态生成 options）
- 显示当前筛选结果数量
- `artifacts.filter(a => typeFilter === 'all' || a.type === typeFilter)` 前端过滤

### 4.2 新增 Artifact 类型标签

`src/features/resource-center/services/artifactDisplay.ts` 新增：
- `decision_package` → `'决策包'`
- （`email_draft` 已存在）

---

## 功能验收状态

| 功能 | 验收状态 | 说明 |
|------|---------|------|
| 文稿 AI 生成 | ✅ 可用 | `web.docx.create` skill |
| 文稿导出 Word | ✅ 可用 | `web.docx.export` skill |
| 文稿导出 Markdown | ✅ 可用 | `web.markdown.export` skill |
| 文稿导出 PDF | ⚠️ 降级 | 显示"Web 版暂不支持 PDF 导出，请使用导出 Word" |
| 文稿导出 HTML | ✅ 可用 | 直接浏览器 Blob 下载 |
| PPT 生成 | ✅ 可用 | `web.pptx.create` skill |
| PPT 下载 | ✅ 可用 | `platformApi.artifacts.download` |
| Excel 分析 | ✅ 可用 | `platformApi.excel.analyze` |
| 图片生成 | ✅ 可用 | `web.image.generate` skill |
| 邮件收发 | ✅ 可用 | `platformApi.email.*` |
| 邮件→事项 | ✅ 可用 | `POST /api/aios/matters/from-email` |
| 日历 CRUD | ✅ 可用 | `calendarRuntime` HTTP 全路径 |
| 日报生成 | ✅ 可用 | `web.daily.report` skill + AIOS 事项整合 |
| 资源中心文件 | ✅ 可用 | `platformApi.files.*` |
| 资源中心 Artifact | ✅ 可用 | `platformApi.artifacts.*` + 类型筛选 |
| AIOS 事项 CRUD | ✅ 可用 | `/api/aios/matters` |
| Matter→回复草稿 | ✅ 可用 | `POST /api/aios/matters/:id/generate-reply` |
| Matter→文稿 | ✅ 可用 | `POST /api/aios/matters/:id/generate-document` |
| Matter→PPT | ✅ 可用 | `POST /api/aios/matters/:id/generate-ppt` |
| 设置/AI 连接 | ✅ 可用 | `platformApi.settings.*` |

---

## build 验收

```
cd server && npx tsc --noEmit → ✅ 0 errors
npm run build:web → ✅ built in 9.60s
```

---

## 遗留 P1 问题（未修复，不在本轮范围）

| 问题 | 等级 | 建议 |
|------|------|------|
| 邮件已发件/垃圾箱 Tab 返回空数组无提示 | P1 | 下一版添加"Web 版暂不支持此文件夹"提示 |
| PPT 模板包列表为空 | P1 | 需服务端实现模板包存储接口 |
| 知识库文档导入静默失败 | P1 | 需实现 Web 文件上传→知识库导入流程 |
| `previewKnowledgeTaskContext` 返回空 | P0 | 需实现服务端知识库上下文检索接口 |

---

_本文档为 feat/web-feature-parity 分支收口验收报告。_
