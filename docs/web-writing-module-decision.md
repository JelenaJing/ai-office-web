# Web 文稿模块专项决策

## 1. 结论

Web 文稿模块应以 Electron `EditorPanel` 已验证的文稿体验为目标，但不能复制 Electron 本地实现。Web V1 的定位是：

> **类 Word A4 编辑器 + TipTap 富文本 + AI 指令框 + legacy writing workflow + server skills + artifact 导出闭环。**

Electron-only 的本地文件系统、IPC、本地 workspace tree、本地 Office 自动化、复杂图片处理和论文级长流程，不进入 Web V1。

## 2. A. 保留

以下体验必须保留，并作为 Web 文稿 V1/V1.5 的核心目标：

| 能力 | Web 决策 |
| --- | --- |
| Word-like 文稿编辑体验 | 保留，打开文稿后就是类 Word A4 编辑器，不再回退到简陋表单页 |
| A4 页面 | 保留，作为默认编辑面；后续对齐 Electron `EditorPage` 的宽度、阴影、边距、正文排版 |
| TipTap 富文本编辑 | 保留，Web 使用 TipTap 作为编辑核心 |
| AI 指令框 | 保留，右侧 `AICommandBox` 是 Web 文稿自然语言入口 |
| 选区改写 | 保留，选中文字后 AI 默认改写选区 |
| 光标插入 | 保留，无选区且正文非空时按指令在光标处插入/续写 |
| 全文优化 | 保留，无选区时支持全文润色、重写和优化 |
| 撤销 | 保留，至少支持撤销上一次 AI 修改 |
| 知识库/资料参与生成 | 保留，知识库 ID 和上传资料 fileId 必须进入 server 上下文构建 |
| Word/PDF/Markdown 导出 | 保留导出入口；Word/Markdown 为 V1 必选，PDF 未配置时清晰提示 |
| 资源中心生成记录 | 保留，生成和导出的结果必须进入 artifact / 资源中心 |
| legacy writing workflow | 保留，Web 文稿生成与编辑继续复用 legacy writing assistant 思路 |

## 3. B. 去掉 / Web 不迁移

以下能力不迁移到 Web，或不以 Electron 原方式迁移：

| Electron 能力 | Web 决策 |
| --- | --- |
| 本地文件树 | 去掉；由资源中心“我的文件 / 生成记录 / 知识库资料”替代 |
| 本地路径打开/保存 | 去掉；由上传文件、artifact 下载、server 文件索引替代 |
| Electron IPC | 去掉；浏览器只调用 `platformApi`、server API、skills |
| 本地 workspace tree | 去掉；Web 工作区由 server workspace 与资源中心承接 |
| 完整复制 `EditorPanel` | 禁止；只能迁移体验、样式规则、prompt 语义和必要 TipTap 扩展 |
| 本地图片路径处理 | 去掉；图片应进入 server 文件/资源中心，并以 artifact 或安全 URL 引用 |
| 本地 Office 自动化 | 去掉；导出、转换、模板处理由 server exporter skills 负责 |

## 4. C. 转化

Electron 中有价值但依赖本地环境的能力，应转化为 Web 原生实现：

| Electron 旧能力 | Web 转化方式 |
| --- | --- |
| 旧右键菜单 | 转为 Web `DocumentContextMenu`：选区改写、扩写、续写、插入、AI 设置等先做文稿 V1 必需项 |
| 旧 A4 页面样式 | 转为 `A4RichTextEditor` CSS：A4 宽高、页边距、标题/正文/列表/表格样式、阴影、页眉页脚 |
| 旧 TipTap 扩展 | Web 按需迁移：Underline、TextAlign、Highlight、Table、TaskList、Typography、TextStyle、FontFamily、FontSize 等分阶段补齐 |
| 旧选区改写语义保护 | 转为 server `web.document.edit` prompt guard，要求只改写选区、保持核心语义、事实判断、结论和信息边界 |
| 旧知识库写作 | 转为 server `documentContextBuilder` + RAG，前端只传 `knowledgeBaseIds` / `fileIds` |
| 旧正式模板流程 | 转为 Web template skill + `web.template.document.generate.legacy` + `templateDocument` workflow |
| 旧导出 | 转为 server exporter skills：`web.docx.export`、`web.markdown.export`、`web.pdf.export`，输出 artifact |
| 旧本地生成文件 | 转为资源中心 artifact，支持下载、删除、追踪 createdBySkillId |
| 旧 `WritingAssistantService` IPC 流式调用 | 转为 `platformApi.skills.run` / server skills；后续可加 server task/stream API |
| 旧本地论文/长文生成服务 | V1 只迁移办公文稿 legacy workflow；长论文流式生成后置 |

## 5. D. 后置

以下能力不进入 Web 文稿 V1：

| 能力 | 后置原因 |
| --- | --- |
| PDF 完整编辑 | 需要 PDF 渲染、坐标、文字层、回写和权限体系，超出 V1 |
| Word 100% 保真编辑 | 需要 OOXML roundtrip、样式映射和复杂兼容，不应阻塞 V1 |
| 复杂图片裁剪/拼接 | Electron 当前依赖本地图片路径和编辑工具；Web 应后续做 server/image skill |
| 公式编辑 | TipTap/KaTeX 扩展可后续迁移，不属于办公文稿 V1 必须项 |
| 引用文献系统 | 属于论文/学术写作增强，不阻塞办公文稿 V1 |
| 多人协作 | 需要权限、同步、冲突解决和 presence |
| 长论文流式生成 | 复杂任务编排和流式写回后置 |
| 红头文件精准壳层回写 | 需要模板壳层、版式约束和 DOCX 回写能力，后置 |

## 6. 文稿模块现状诊断

### 6.1 `WordLikeDocumentEditor` 现在已有能力

当前 Web 文稿工作台已经具备基础闭环：

| 能力 | 现状 |
| --- | --- |
| 工作台壳层 | 使用顶部工具栏 + 中间 A4 编辑区 + 右侧 AI 文稿助手 |
| 标题与模板 | 支持文稿标题输入、模板 skill 选择，模板 manifest 会写入 session |
| A4 编辑器挂载 | 使用 `A4RichTextEditor`，`onChange` 同步 HTML 到 `WebDocumentSession` |
| 基础格式工具栏 | 支持标题、小标题、正文、加粗、列表、清除格式 |
| 知识库选择 | 使用 `KnowledgeTreePicker` 选择知识库，并同步到 workspace/session |
| 资料上传 | 支持 `.docx` / `.pdf` 上传为参考资料，保存 fileId |
| 资料/知识库提示 | 顶部 chip 显示已选知识库和上传资料 |
| 导出 | 支持 Word、PDF、Markdown 导出按钮；导出前读取最新 `editor.getHtml()` |
| PDF 未配置提示 | 当 PDF exporter 返回未配置错误时显示“PDF 导出服务未配置，请先下载 Word。” |
| 最近下载 | session 中有 artifact 时可下载最近导出结果 |
| server/API 依赖 | 全部走 `platformApi`，不依赖 Electron IPC |

主要不足：仍缺右键菜单；A4 样式比 Electron 简化很多；资料上传目前只是参考资料，不是可编辑导入；知识库上下文还不是真正语义检索；导出保真度有限。

### 6.2 `A4RichTextEditor` 现在已有能力

当前 A4 编辑器具备：

| 能力 | 现状 |
| --- | --- |
| TipTap 核心 | 使用 `StarterKit` + `Placeholder` |
| A4 容器 | 根据 `pageSpec.widthMm` / `heightMm` 渲染白色页面、阴影、边框 |
| 页眉页脚 | 支持 `headerText`、`footerText`、对齐方式和 `{page}` 替换为 `1` |
| 内容读写 API | 暴露 `getHtml()`、`getText()`、`replaceDocument()`、`insertAtCursor()`、`replaceSelection()` |
| 选区 API | 暴露 `getSelectionHtml()`、`getSelectionText()`、`hasSelection()` |
| 编辑器控制 | 暴露 `focus()`、`focusEnd()`、`getTipTapEditor()`、`clearFormatting()` |
| 占位提示 | 空文档显示“在此直接输入正文，或选中文字后在右侧输入 AI 指令…” |

主要不足：当前只启用最基础扩展，缺 Underline、TextAlign、Highlight、Table、TaskList、Typography、TextStyle、FontFamily、FontSize 等；A4 CSS 未达到 Electron `EditorPage` 的排版细节；没有右键菜单；没有分页估算、字数页数栏、图片/公式/表格增强。

### 6.3 `AICommandBox` 现在已有能力

当前 AI 指令区具备：

| 能力 | 现状 |
| --- | --- |
| 模式提示 | 根据选区、正文是否为空和指令关键词推断“修改选区 / 生成初稿 / 光标插入 / 优化全文 / 重写全文” |
| 生成初稿 | 调用 `runDocumentGenerate`，返回 patch 或 documentSession 后写入编辑器 |
| AI 修改 | 调用 `runDocumentEdit`，支持选区改写、光标插入、全文润色/重写 |
| 全文优化 | 提供“优化全文”按钮，默认指令为正式汇报语气 |
| 撤销 | 保存上一次 AI 修改前的 HTML，可撤销到上一个状态 |
| session 同步 | AI patch 应用后同步 HTML、Markdown、title、updatedAt |
| 状态反馈 | 展示执行中、成功、错误和结果文案 |

主要不足：没有右键菜单触发；缺少选区改写前的差异确认/接受拒绝；没有流式插入；错误处理和 prompt guard 还不够强；知识库语境依赖 server 当前上下文质量。

### 6.4 `documentEditSkills` 现在如何选择生成 skill

`resolveGenerateSkillId` 的选择逻辑是：

| 条件 | 选择的 skill |
| --- | --- |
| `generationMode === 'knowledge-template-document'`，或 `templateDocument.extractedText` 非空 | `web.template.document.generate.legacy` |
| 否则，如果 `knowledgeBaseIds.length > 0` | `web.knowledge.writing.legacy` |
| 否则 | `web.document.generate` |

执行方式：

| skill | 参数特点 |
| --- | --- |
| `web.template.document.generate.legacy` | 传 `templateTitle`、`templateExtractedText`、`templateOutline`、`knowledgeBaseIds`、`fileIds`，走模板文稿 legacy workflow |
| `web.knowledge.writing.legacy` | 传 `instruction`、`title`、`documentText`、`knowledgeBaseIds`、`fileIds`，走知识库语境 legacy workflow |
| `web.document.generate` | 传通用 `params`，server 根据 flow 选择 legacy/template workflow，并创建 docx artifact |
| `web.document.edit` | 编辑固定走该 skill，传 `mode`、选区、全文 HTML/text、模板、知识库、fileIds |

### 6.5 和 Electron `EditorPanel` 相比，Web 版缺哪些关键体验

| 缺口 | Electron 现状 | Web 现状 |
| --- | --- | --- |
| 右键菜单 | 有文本/图片/通用右键菜单，支持重写、扩写、引用、续写、生图、设置 | 暂无 `DocumentContextMenu` |
| TipTap 扩展 | 启用 Underline、TextAlign、Highlight、Table、TaskList、Typography、TextStyle、FontFamily、FontSize、公式、图片等 | 仅 `StarterKit` + `Placeholder` |
| A4 样式 | `EditorPage` 有 794x1123、边距、标题/正文/列表/表格/代码/公式/图片等细节 | A4 视觉基础存在，但排版简化 |
| 选区改写保护 | 有 `INLINE_REWRITE_SEMANTIC_GUARD`，强调保持原意和事实边界 | server prompt 还需显式补强 |
| 知识库写作 | Electron 可预览知识库上下文、模板文档、显式参考资料 | Web 当前 `documentContextBuilder` 主要列 KB/文档名，文本片段只支持文本类上传文件 |
| 流式续写 | Electron 可流式插入，目标标签切换有保护 | Web 当前为一次性 patch |
| 差异确认 | Electron 选区改写可展示原文/改写结果并接受/拒绝 | Web 当前直接替换并依赖撤销 |
| 导出保真 | Electron 可 PDF/HTML/期刊 DOCX，本地能力更丰富 | Web DOCX 基础段落导出，PDF 未配置，Markdown 简化 |
| 本地文件/标签页 | Electron 有多标签、文件树、保存/另存为 | Web 不迁移本地树，应由资源中心和 artifact 替代 |

### 6.6 哪些缺失应该马上补

P0/P1 应马上补齐：

| 优先级 | 缺失 | 原因 |
| --- | --- | --- |
| P0 | 工作区初始化稳定性 | 文稿生成、编辑、导出都依赖 `workspacePath` |
| P0 | `WordLikeDocumentEditor` 稳定性 | 文稿入口必须稳定，不应回退到简陋页 |
| P0 | 导出读取最新 `editor.getHtml()` | 避免导出旧 session HTML |
| P0 | 生成质量验收 | legacy workflow 必须产出可用正式文稿 |
| P1 | 右键菜单 | 是 Electron 文稿体验的关键入口 |
| P1 | A4 样式对齐 | 直接决定 Web 是否像“办公文稿编辑器” |
| P1 | TipTap 基础扩展 | 表格、对齐、下划线、高亮等是基础办公编辑能力 |
| P1 | 选区语义保护 | 防止 AI 改写改变事实和原意 |
| P1 | 知识库真实检索 | 当前仅“选择了知识库”不足以支撑知识库写作体验 |

### 6.7 哪些缺失应该后置

后置缺失包括：PDF 完整编辑、Word 100% 保真、复杂图片裁剪/拼接、公式编辑、引用文献系统、多人协作、长论文流式生成、红头文件精准壳层回写、本地文件树、多标签本地文件保存。

## 7. Web 文稿 V1 验收标准

Web 文稿 V1 必须满足：

| # | 验收标准 |
| --- | --- |
| 1 | 打开文稿后是类 Word A4 编辑器 |
| 2 | 用户可以自由输入和编辑 |
| 3 | 用户可以选中文字，让 AI 改写/润色/扩写 |
| 4 | 用户可以在光标处让 AI 续写 |
| 5 | 用户可以让 AI 优化全文 |
| 6 | 有右键菜单 |
| 7 | 有知识库选择 |
| 8 | 有资料上传 |
| 9 | 生成和编辑使用 legacy writing workflow |
| 10 | 导出 Word / Markdown |
| 11 | PDF 未配置时清晰提示 |
| 12 | 结果进入资源中心 |
| 13 | Web 不依赖 Electron IPC |
| 14 | Electron 版不受影响 |

## 8. 下一步实施计划

| 优先级 | 目标 | 具体任务 |
| --- | --- | --- |
| P0 | 文稿模块稳定 | 修复工作区初始化；稳定 `WordLikeDocumentEditor`；导出读取最新 `editor.getHtml()`；建立生成质量验收 |
| P1 | 文稿体验补齐 | A4 样式对齐 Electron；增加右键菜单；补齐 TipTap 基础扩展；增加选区语义保护；知识库上下文真实检索 |
| P2 | 数据分析 | 保留原 `ExcelAnalysisWorkbench` 体验；文件来源改资源中心；分析跑 server；生成报告 artifact |
| P3 | PPT | 保留 `GenerationWorkbenchPanel` 工作台体验；DeckDocument 内容/模板分离；server 生成 pptx artifact |
| P4 | 邮件 | 保留 `CommunicationWorkbench` 两栏体验；server 负责 IMAP/SMTP/OAuth/附件；增加 AI 摘要/预回复 |
| P5 | 日程/日报/OA | 日程 server 持久化；日报从日志/邮件/文稿/日程生成；后续权限与组织管理 |

## 9. 本轮禁止事项

本轮只做审计和设计文档，禁止：

1. 不要写新功能。
2. 不要改 UI。
3. 不要删除 Electron 代码。
4. 不要把 `EditorPanel` 整个复制到 Web。
5. 不要恢复本地文件树。
6. 不要提交 `server/data`。
7. 不要提交 `server/.env.local`。
8. 不要提交 `build/ai-config.json`。

## 10. 验证范围

本轮文档完成后的验证范围仅为：

```bash
npm run build

cd server
npx tsc --noEmit
cd ..
```
