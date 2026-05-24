# Document Workflow Registry Audit

## 结论

当前 Web 文稿模块的真实入口，已经被压缩成两条：

1. **工作场景 → 文稿编辑**  
   `src/pages/WorkWorkspace.tsx:127-135` → `enterFreeMode()`  
   `src/components/WorkspaceViewportHost.tsx:101-108` → `WordLikeDocumentEditor`
2. **学习场景 → 论文写作**  
   `src/pages/StudyWorkspace.tsx:95-106` 在 Web 下走 `enterDailyReportMode()`  
   但 `src/contexts/WorkspaceModeContext.tsx:123-127` 已把 `enterDailyReportMode()` 直接重定向到 `free`  
   结果仍然回到普通文稿/A4 编辑器

因此，**旧有的论文 / 学术文章 / 正式模板 / Article Workspace / Manuscript 工作流并没有作为独立 Web 入口暴露出来**；当前用户看到的基本就是：

- `WordLikeDocumentEditor`
- `A4RichTextEditor`
- 通用 `AICommandBox`
- 三个内置模板：`普通文稿 / 正式函件 / 工作汇报`
  - `src/features/document/webDocumentBuiltInSkills.ts:52-107`

## 路径核对说明

- 用户指定的 `src/services/PaperService.ts` **当前仓库不存在**。  
  现存实际路径是：
  - `src/modules/paper/services/PaperService.ts`
  - `src/skills/builtins/paperGenerateLegacySkill.ts:7-18`
  - `src/skills/builtins/dailyReportGenerateLegacySkill.ts:7-17`
- 用户指定的 `build/run-*paper* / run-*formal-template* / run-*article* / run-*manuscript*` **当前 `build/` 目录下未实际保留这些文件**；但 `package.json:25-92` 仍保留对应 smoke script，说明这些旧链路在历史上存在明确测试注册。

## 工作流注册表

| 文稿类型 / 工作流 | 旧文件 / 旧服务 | 当前 Web 是否有入口 | 是否已接入 A4 编辑器 | 是否能导出 Word | 是否需要知识库 / 引用 / 模板 | 缺失入口 / 当前缺口 | 恢复优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **普通文稿 / 办公文稿** | `src/features/document/components/WordLikeDocumentEditor.tsx`；`src/features/document/components/A4RichTextEditor.tsx`；`src/features/document/services/documentEditSkills.ts` | **有**：`WorkWorkspace.tsx:127-135` | **是**：当前主编辑器就是 A4 | **是**：`webDocumentBuiltInSkills.ts:109-140` + `docxWebGeneration.ts` | 可选知识库 / 文件引用：`WordLikeDocumentEditor.tsx` 顶部知识库与资料导入 | 当前是唯一稳定入口，但过于通用，替代了更多专门工作流 | **P0** |
| **正式函件 / 通知 / 正式模板 Beta** | `src/modules/formal/components/FormalTemplatePanel.tsx`；`src/modules/formal/components/FormalTemplateGeneratePanel.tsx`；`src/modules/formal/hooks/useFormalTemplateGeneration.ts`；`src/document/profiles/templateDocument/orchestrator/templateDocumentOrchestrator.ts`；`src/document/commands/bridges/templateDocumentRewriteBridge.ts`；`src/skills/builtins/templateDocumentGenerateLegacySkill.ts:17-88` | **无独立入口**；当前只剩模板下拉里的 `document.template.formal_letter` | **部分**：A4 能承接最终内容，但正式模板 4 阶段 UI 没挂出来 | **是**：标准 docx 导出仍可走当前导出链路 | **强依赖模板**；知识库模板 ID / `templateDocumentId` 仍在类型里保留：`src/types/knowledge.ts`、`src/document/schema/index.ts:1-16` | 缺少模板上传、字段确认、区域预览、visit-letter Beta 入口；旧正式模板面板未暴露到 Web 导航 | **P0** |
| **工作汇报 / 报告** | 旧模板化路径：`webDocumentBuiltInSkills.ts:91-107`（`document.template.work_report`）；日报/总结 legacy：`src/skills/builtins/dailyReportGenerateLegacySkill.ts:19-61`；`src/modules/paper/services/PaperService.ts` | **部分**：只有“工作汇报”模板可选；没有独立“报告/总结”工作流入口 | **部分**：最终仍落到 A4 | **是** | 旧链路偏主题生成 / paper service；当前模板链路偏静态版式 | 缺少“报告/总结”作为显式生成模式；只有模板外观，没有原工作流参数 | **P1** |
| **论文 / 学术文章 / 综述 / 学位论文** | `src/skills/builtins/paperGenerateLegacySkill.ts:12-68`（`paperType: research / review / thesis_research`）；`src/modules/paper/services/PaperService.ts`；`electron/main/services/paperGenerator.ts`；`electron/main/services/paperGeneratorNFTCORE.ts`；`electron/main/services/paperProjectRunner.ts`；`electron/main/services/paperResultNormalizer.ts`；`electron/main/services/journalDocxExporter.ts` | **表面有，实际被压平**：`StudyWorkspace.tsx:95-106` 在 Web 下不进独立论文链路，而是走 `enterDailyReportMode()` → `WorkspaceModeContext.tsx:123-127` → `free` | **最终可接**：`paperResultNormalizer.ts`、`DocumentProfile='paper'`、`src/document/schema/index.ts:1-16` 表明可归一到文档 schema / A4 | **是**：`journalDocxExporter.ts` + 当前 docx 导出链路 | **强依赖引用/文献/年份/论文类型**；`PaperService`、`openAlexClient`、`paperResultNormalizer` | Web 缺少 paperType、citationMode、figure/reference 策略、年份过滤等 UI；“论文写作”按钮当前被重定向掉 | **P0** |
| **Article Workspace / 学术文章工作区** | `src/services/ArticleClassificationService.ts`（仓库中仍被旧链路引用）；`package.json:40,51,52`（`smoke:article-workspace` / `writer-article-ui`）；`src/modules/generation/components/GenerationComposer.tsx` 中仍保留 article/manuscript 相关桥接 | **无** | **未直接暴露**：理论上可落到 A4 / schema，但当前没有 Web 路由或面板 | **理论上可导出**，但当前没有完整 UI | 通常需要文章 blueprint / section 规划 / 引用模板 | 缺少 Article 创建入口、文章类型选择、分节工作区 | **P2** |
| **Manuscript / 稿件工作流** | `src/document/editorTabs.ts`；`src/document/commands/index.ts`（`ManuscriptProfileId = 'freewrite' | 'paper' | 'templateDocument'`）；`package.json:48-71` 大量 `smoke:manuscript-*`；`src/features/document/components/EditorPanel.tsx` | **无单独 Web 入口**；Electron 仍主要走 `EditorPanel` | **是**：A4 当前就是其 Web 表现层，但简化掉了多 tab / manuscript profile 差异 | **是** | 依赖 canonical doc / editor tab / selection bridge | 当前 Web 只保留单一 A4 结果面，没有稿件 profile、tab factory、selection bridge UI 暴露 | **P1** |
| **Canonical Document / 标准文档内核** | `src/document/schema/index.ts`；`src/engines/documentEngine/contracts.ts`；`src/engines/documentEngine/hostCommands.tsx`；`package.json:42-47`（`smoke:canonical-*`） | **无用户直达入口**；只作为底层能力存在 | **是**：A4/OOXML/Schema 都建立在这层之上 | **是** | 主要是文档结构、分页、引用、资源，不是用户选择项 | 不缺后端能力，缺的是把不同文稿类型映射回 canonical profile 的 UI | **P1** |
| **Template Document Rewrite / Remake** | `src/features/document/services/importDocumentForRemake.ts`；`src/features/document/services/introductionRemakeFlow.ts`；`src/document/commands/bridges/templateDocumentRewriteBridge.ts`；`package.json:73,77,98`（`smoke:template-document-rewrite` / introduction remake） | **无显式入口** | **部分**：导入后最终进入主编辑器或 template rewrite bridge | **是** | **强依赖模板文档 / 知识库 / 文献池** | 缺少“导入模板文稿并进入 rewrite/remake”独立入口；现在只剩普通导入 + 通用 AI 助手 | **P1** |
| **Paper Normalizer / Paper Export** | `electron/main/services/paperResultNormalizer.ts`；`electron/main/services/journalDocxExporter.ts`；`package.json:88,92`（`smoke:paper-normalizer` / `smoke:paper-export`） | **无直接入口**，属于论文链路后段 | **是**：normalizer 明确把论文结果归一到文档 schema | **是** | 强依赖论文结果、引用、结构块 | 不是入口缺失，而是整个论文链路入口缺失，导致 normalizer/export 对用户不可见 | **P1** |

## 当前 Web 版实际暴露的文稿类型

当前用户在 Web 文稿编辑器里真正能选到的类型，只剩：

1. `document.template.general` → **普通文稿**
2. `document.template.formal_letter` → **正式函件**
3. `document.template.work_report` → **工作汇报**

来源：`src/features/document/webDocumentBuiltInSkills.ts:52-107`

这意味着以下原本应可见的类型，**目前没有 Web 一级入口**：

- 论文
- 学术文章
- 综述
- 学位论文
- 正式模板 Beta（含 visit letter）
- 模板文稿 rewrite / remake
- Article Workspace
- 稿件 profile（paper / templateDocument）

## 当前 Web 与 A4 编辑器的接入关系

### 已接入 A4 的

- 普通文稿：`WordLikeDocumentEditor.tsx`
- 正式函件 / 工作汇报：通过内置模板切换
- 旧论文 / 正式模板 / manuscript：底层 **都能** 归一到 `DocumentSchema` / OOXML / A4，但前台入口未恢复

### 还没作为 A4 用户入口暴露的

- Formal Template 四阶段面板
- 论文参数化生成 UI
- Article Workspace
- Template rewrite / Remake
- Manuscript profile 区分

## 缺失入口清单

### P0

1. **论文 / 学术文章入口被错误压平**
   - `StudyWorkspace.tsx:95-106`
   - `WorkspaceModeContext.tsx:123-127`
   - 当前 Web 点击“论文写作”不会进入独立论文链路

2. **正式模板 Beta / visit letter 工作流没有 Web 入口**
   - `src/modules/formal/components/FormalTemplatePanel.tsx`
   - `src/modules/formal/components/FormalTemplateGeneratePanel.tsx`
   - 现有 UI 存在，但未挂入 Web 导航

### P1

1. **Manuscript / templateDocument profile 没有暴露**
   - `src/document/commands/index.ts`
   - `src/document/editorTabs.ts`
   - `src/features/document/components/EditorPanel.tsx`

2. **Template rewrite / remake 入口缺失**
   - `src/features/document/services/importDocumentForRemake.ts`
   - `src/document/commands/bridges/templateDocumentRewriteBridge.ts`

3. **Paper normalizer / journal export 没有在 Web 文档链路中显式呈现**
   - `electron/main/services/paperResultNormalizer.ts`
   - `electron/main/services/journalDocxExporter.ts`

### P2

1. **Article Workspace 未恢复**
   - `package.json:40,51,52`
   - 代码/测试注册仍在，但当前无 Web 入口

## 审计判断

当前 Web 文稿模块不是“没有文稿能力”，而是：

- **底层能力仍在**
- **A4 编辑器已经成为统一结果编辑器**
- 但 **旧有文稿类型选择器 / 工作流入口 / 参数面板 / Beta 模板链路** 没有恢复

换句话说，现状是：

> **文稿生成结果可以落进 A4，但“先选什么文稿类型、走哪条生成链路”这层入口被压平了。**

这也是为什么当前用户只能感知到“普通文稿 + A4 编辑器 + 通用 AI 助手”。
