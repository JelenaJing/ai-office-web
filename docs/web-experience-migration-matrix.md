# Web 版 AI Office 产品体验迁移矩阵

## 1. 总原则

Web 版不是重新做一组简陋替代页面，也不是把 Electron 本地代码完整复制到浏览器里。

Web 版的正确迁移方向是：

> **Electron 已验证的产品体验和工作流 + Web server/service/skill 后端能力。**

也就是说，用户能感知到的办公工作台、交互节奏、AI 辅助方式、生成记录与导出闭环，应尽量复刻 Electron 版已经证明有效的体验；但所有 Electron-only 能力，例如本地文件树、本地路径读写、Electron IPC、本地 Office 自动化、本地 workspace tree，不应直接迁移。Web 版应替换为 `platformApi`、server API、server skills、artifact、资源中心和权限体系。

## 2. 四层架构说明

| 层级 | 定位 | Web 迁移原则 |
| --- | --- | --- |
| 第一层：办公工作台 | 用户直接看到和操作的文稿、数据、PPT、邮件、日程等界面 | 复刻 Electron 中已验证的工作台体验，不做低配替代页；浏览器只负责交互、编辑状态和预览 |
| 第二层：AI 助手 | 用户用自然语言驱动工作台，例如改写选区、续写、生成报告、生成 PPT | 保留自然语言驱动方式，但通过 `platformApi.skills.run` / server API 调用后端，不走 Electron IPC |
| 第三层：Skills | 可插拔能力层，例如文稿生成、文稿编辑、导出、数据分析、图片生成、PPT 生成 | Web 内置 skill manifest 只描述能力和映射；真实执行由 server skills 负责，并产出 artifact |
| 第四层：服务器后台 | 文件、模型、知识库、任务、权限、导出、artifact 管理 | 统一承接 Electron 本地能力：文件上传、知识库/RAG、模型调用、任务执行、导出、资源中心、权限隔离 |

## 3. 当前审计依据

本轮对照了 Electron / AI Writer 3.0 参考实现与当前 Web 主仓库，重点参考：

| 来源 | 审计重点 |
| --- | --- |
| `ai-office-public-review/src/modules/writing/components/EditorPanel.tsx` | 旧文稿右键菜单、TipTap 扩展、A4 页面样式、选区改写、续写、知识库上下文、导出入口 |
| `ai-office-public-review/src/modules/writing/services/WritingAssistantService.ts` | Electron 侧通过 `window.electronAPI.writingAssistant` 流式调用写作助手 |
| `ai-office-public-review/electron/main/services/paperGenerator.ts` | 本地论文/写作生成服务、模板分析、分章节生成、图片/引用等 Electron-only 能力 |
| `ai-office-web/src/modules/writing/components/WordLikeDocumentEditor.tsx` | Web 文稿工作台壳层、A4 编辑器挂载、知识库/资料/导出入口 |
| `ai-office-web/src/modules/writing/components/A4RichTextEditor.tsx` | Web A4 TipTap 编辑器能力 |
| `ai-office-web/src/modules/writing/components/AICommandBox.tsx` | Web AI 指令区、撤销、生成/编辑调用 |
| `ai-office-web/src/modules/writing/services/documentEditSkills.ts` | Web 文稿生成 skill 路由与 patch 应用 |
| `ai-office-web/server/src/modules/document-generation` | legacy writing workflow、模板 workflow、上下文构建 |
| `ai-office-web/server/src/skills/document`、`server/src/skills/docx` | 文稿生成、编辑、知识库写作、模板生成、DOCX/Markdown/PDF 导出 |

## 4. 模块迁移矩阵

| 模块 | Electron 现有体验 | Web 是否保留 | Web 如何实现 | 是否复用 UI | 是否改 server/skill | 优先级 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 文稿编辑 | `EditorPanel` 提供类 Word A4 编辑、TipTap 富文本、工具栏、右键菜单、选区改写、续写、知识库写作、导出 | 保留核心体验 | 使用 `WordLikeDocumentEditor` + `A4RichTextEditor` + `AICommandBox`；生成/编辑/导出走 `web.document.*`、`web.docx.export`、`web.markdown.export`、artifact | 复用体验和交互模式，不整文件复制 `EditorPanel` | 是，P0/P1 继续补齐 `web.document.edit` prompt guard、真实 RAG、导出保真 | P0/P1 | Web 当前已有基础闭环，但右键菜单、扩展、A4 样式和知识库检索仍弱 |
| 数据分析 | Electron 保留 Excel 分析工作台体验，围绕表格选择、分析指令、结果下载 | 保留 | Web 使用 `ExcelAnalysisWorkbench`，文件来源改为资源中心上传文件，分析走 `platformApi.excel.analyze` / `web.xlsx.analyze`，输出 Markdown artifact | 是，保留工作台式分析体验 | 是，server 负责 xlsx/csv 解析、分析和 artifact | P2 | 不恢复本地 Python 环境要求；Web 提示“服务器执行” |
| PPT | Electron `GenerationWorkbenchPanel` / PPT 工作台支持内容生成、预览、模板选择、导出 | 保留 | Web 保留 `GenerationWorkbenchPanel` / `PptWorkbenchPanel` 的工作台结构；内容、模板、DeckDocument 分离；server 生成 pptx artifact | 是，优先复刻工作台和预览节奏 | 是，`web.pptx.create` 继续演进为内容/模板分离与 artifact 管理 | P3 | 当前 server 已有基础 `createPptxSkill`，但还不是完整 DeckDocument 工作流 |
| 邮件 | Electron 邮件/通信工作台偏两栏：列表、详情、AI 摘要/预回复、附件联动 | 保留 | Web 从当前 `WebEmailPanel` MVP 迁移到两栏 `CommunicationWorkbench` 体验；IMAP/SMTP/OAuth/附件都由 server 管理 | 是，复用两栏体验，不复用本地 IPC | 是，server 负责账号、OAuth、IMAP/SMTP、附件入资源中心、AI 摘要/预回复 skills | P4 | 当前 Web 已有账号配置、收件箱、详情、发送基础能力，但体验简陋 |
| 日程 | Electron 侧日程应作为办公对象参与 AI 助手和日报 | 保留 | Web 使用 server 持久化日程；浏览器提供日程列表、创建、编辑、删除和 AI 总结入口 | 复用办公日程体验 | 是，server 日程存储、权限、提醒/外部日历后置 | P5 | 当前 `WebCalendarPanel` 是服务器持久化的基础 CRUD |
| 日报 | Electron 中日报应聚合用户当天工作、文件、生成记录和办公上下文 | 保留 | Web 使用 `web.daily.report` 从文件、artifact、邮件、文稿、日程、日志聚合生成 Markdown artifact | 复用“自动汇总 + 可下载报告”体验 | 是，server 扩展活动日志和多源聚合 | P5 | 当前仅聚合文件与生成记录，邮件/日程/文稿日志还需补齐 |
| 图片 | Electron 图片生成/插图可与选区、知识库、文稿图片工具联动 | 保留核心，复杂编辑后置 | Web 图片生成走 `web.image.generate`，结果进入 artifact；参考图来自资源中心；复杂裁剪/拼接不进 V1 | 部分复用生成面板体验 | 是，server 管理图片生成、文件、artifact；复杂编辑可作为后续 skill | P5 | 当前 Web 有基础图片生成与预览，但参考图参数尚未真正进入 server 生成链路 |
| 资源中心 | Electron 本地 workspace tree / 文件系统视图 / 生成文件落盘 | 保留资源中心体验，不保留本地树 | Web 使用 `ResourceWorkspace`：我的文件、生成记录、知识库资料；内部路径不展示；artifact 下载/删除由 `platformApi.artifacts` | 复用资源管理体验，不复用本地文件树 | 是，server 管理文件索引、artifact、权限、下载 | P0-P5 持续 | 是 Web 替换本地文件系统的核心入口 |
| 知识库 | Electron 知识库可选择部门/资料、预览上下文、参与写作/改写/续写 | 保留 | Web 以 `KnowledgePanel` / `KnowledgeTreePicker` 选择知识库；server `documentContextBuilder` + RAG 负责检索与上下文注入 | 复用选择和任务约束体验 | 是，当前需从“列名称/文档名”升级为真实 chunk 检索 | P1/P5 | 文稿 V1 先保证知识库参与生成；真实语义检索是 P1 关键 |
| Skill Store / Skill Center | Electron/平台化方向支持 Skill 管理、安装、调试、运行 | 保留 | Web 使用 `SkillManagementView` 管理已注册 skills / store iframe / 安装计划；server 提供 skill registry 与运行 API | 复用平台化管理体验 | 是，后续需要权限、包签名、版本、启停、审计 | P5 | 当前已有管理页和 `SkillDevPanel` 调试面板，生产化能力需后置 |
| 设置 | Electron 本地 AI 设置、模型、图片服务、工具偏好 | 保留设置入口，但 Web 不暴露密钥 | Web 使用 `WebSettingsPanel` 只读展示 provider/model/baseUrl/配置状态，并提供连接测试；密钥只在 server 环境变量 | 复用设置体验中的状态与测试，不迁移本地写密钥 | 是，server 负责配置读取、连接测试、权限 | P0/P5 | Web 浏览器不能保存或查看密钥；管理员配置为准 |

## 5. 迁移边界

必须迁移的是用户体验和工作流：工作台布局、自然语言驱动、选区/光标/全文编辑、知识库参与、导出和资源中心闭环。

不应迁移的是 Electron 本地实现方式：本地文件树、本地路径打开/保存、`window.electronAPI` / IPC、本地 Office 自动化、本地 workspace tree、本地图片路径和完整复制 `EditorPanel`。

Web 的判断标准不是“有没有一个页面能替代”，而是“用户是否仍然感受到同一套成熟办公工作台体验，并且后端能力已切换到 server/service/skill/artifact”。
