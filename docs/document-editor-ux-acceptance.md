# Document Editor UX Acceptance

## Scope

仅覆盖 Web 文稿模块：

- `src/features/document/components/WordLikeDocumentEditor.tsx`
- `src/features/document/components/AICommandBox.tsx`
- `src/features/document/components/A4RichTextEditor.tsx`
- `src/features/document/services/docxWebGeneration.ts`
- `src/features/document/services/documentEditSkills.ts`
- `src/features/document/hooks/useDocumentPatchActions.ts`
- `src/features/document/services/documentStreamingUi.ts`

不涉及 PPT、邮件、AIOS、资源中心主流程。

## Acceptance Checklist

- [x] 生成初稿时，正文按段逐步写入编辑器，而不是一次性整篇替换
- [x] 生成过程中显示“AI 正在写入第 x / n 段”
- [x] 生成过程中可点击“停止生成”，并保留已写入内容
- [x] 右侧 AICommandBox 升级为“AI 文稿助手”，包含状态提示与快捷操作
- [x] 生成完成后，右侧出现操作卡片与下载按钮
- [x] 点击“下载 Word”后，直接下载当前编辑器内容对应的 Word 文件
- [x] 点击“下载 Markdown”后，不需要再去资源中心
- [x] 点击“下载 HTML”后，直接下载当前 HTML 内容
- [x] Word / Markdown 导出后立即触发 `platformApi.artifacts.download(...)`
- [x] 导出成功后同步更新当前 session 的 artifact 记录
- [x] PDF 显示明确降级提示：“Web 版 PDF 导出暂未开放，请先下载 Word。”
- [x] 草稿保存到 `localStorage`
- [x] 草稿 key 使用 `web-document-draft:${activeWorkspacePath}`
- [x] 页面刷新后可恢复最近草稿
- [x] 顶部显示保存状态：已保存 / 保存中 / 草稿已恢复

## Notes

1. 第一阶段实现的是**前端感知流式**：服务端仍返回完整正文，前端再把 HTML 按块拆分并逐步写入编辑器。
2. HTML 下载目前走浏览器本地文件下载；Word / Markdown 仍通过现有导出 skill + artifact 下载链路。
3. 现有“下载最近”按钮保留为兼容入口，但主路径已经改为文稿界面直接下载。
