# Review Document Editor Audit

本审计仅覆盖指定的 review 文稿相关 IPC；**不包含** `workspace:*`、`email:*`、`activity:*`、`delegation:*`、`personal-lib:*`、`matrix:*`、`introRemake:*`。

## Summary

- **识别 IPC channel 数量**：19
- **目标**：把 review 中仍有价值的文稿任务识别、选区改写、续写、正式模板、DOCX 读写能力接回 Web `DocumentWorkbench`
- **明确不迁移**：Electron 本地文件壳层、workspace 副本机制、桌面专属 OOXML 锁文件与工作副本提交流程

## IPC audit matrix

| Review IPC channel | Review service 文件 | 输入参数 | 输出结果 | Electron 专属依赖 | Web 目标 API | 当前 Web 是否已有 | 缺口 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ai:writingAssistant` | `electron/main/services/paperGenerator.ts` / `runWritingAssistant` 入口在 `electron/main/index.ts` | `instruction`, `language`, 上下文参数 | 文本流 / 最终文本 | IPC 事件流 | `/api/documents/task-router` + 现有 `/api/documents/start` | **部分已有** | 缺少 Web 侧任务识别入口 | P0 |
| `ai:continueWriting` | `electron/main/services/paperGenerator.ts` | 光标附近上下文、语言、指令 | 续写文本 | IPC streaming | `POST /api/documents/:documentId/continue` | **本轮补齐** | 需要返回 `insert_at_cursor` patch | P0 |
| `ai:rewriteParagraph` | `electron/main/services/paperGenerator.ts` | 选中文本、前后文、指令 | 改写后的段落文本 | IPC streaming | `POST /api/documents/:documentId/edit-selection` | **已有并增强** | 需要和 task-router / Workbench 默认行为对齐 | P0 |
| `ai:generateOutline` | `electron/main/services/paperGenerator.ts` | topic / paper params | 大纲文本 | 无强 Electron 依赖 | `/api/documents/task-router` → paper workflow | **部分已有** | 需要由 router 统一识别论文意图 | P1 |
| `ai:analyzeTopic` | `electron/main/services/paperGenerator.ts` | topic / paper params | 主题分析文本 | 无强 Electron 依赖 | `/api/documents/task-router` → paper workflow | **部分已有** | 还未在 Workbench 主入口统一分发 | P1 |
| `ai:generateExperimentPlan` | `electron/main/services/paperGenerator.ts` | paper params | 实验计划文本 | 无强 Electron 依赖 | `/api/documents/task-router` → paper workflow | **部分已有** | 仍是分散能力，不在 Workbench 主入口 | P1 |
| `ai:generatePaper` | `electron/main/services/paperGenerator.ts` / `paperGeneratorNFTCORE.ts` | `topic`, `paperType`, `workspacePath`, 年份范围等 | 论文结果、引用、artifact | Electron 事件流 / 本地输出目录 | `/api/document/paper-workflow/*` + bridge 到 `/api/documents` | **已有基础，本轮打通 bridge** | 需要落成 `DocumentRecord` 才能回到同一编辑器 | P0 |
| `ai:organizeReferences` | `electron/main/services/referenceManager.ts` | topic / paper markdown / references | 整理后的参考文献信息 | Electron 本地引用管理 | 继续由 paper workflow 服务内消费 | **部分已有** | 不单独暴露到 Workbench，本轮不做独立 UI | P2 |
| `formalTemplate:analyze` | `electron/main/services/formalTemplate/formalTemplateTaskService.ts` | 模板源、说明、字段上下文 | 字段分析 / admission 结果 | 依赖 OOXML 工作副本 admission | `POST /api/document/formal-template/analyze` | **已有** | 仅 Web 结构化分析，无 OOXML 壳层副本 | P0 |
| `formalTemplate:confirmFields` | 同上 | 字段值、用户确认结果 | 缺失字段 / 确认后的字段集 | 依赖模板任务状态 | `POST /api/document/formal-template/confirm-fields` | **本轮补齐** | 需明确缺失字段与 fallbackReason | P0 |
| `formalTemplate:preview` | 同上 | 模板、字段、instruction | 预览稿 html / markdown | 依赖模板 admission/runtime | `POST /api/document/formal-template/preview` | **本轮补齐** | 预览结果要能进入 Workbench 预期形态 | P0 |
| `formalTemplate:commit` | 同上 | 已确认字段、预览上下文 | 提交结果 / OOXML 写回 | 强依赖 `readOoxmlPackage` / `writeOoxmlPackage` | `POST /api/document/formal-template/commit` | **本轮补齐 Web 版 commit** | Web 暂无高保真 OOXML shell commit，需要 `fallbackReason` | P0 |
| `documentEngine:getActive` | `documentEngineService`（由 `electron/main/index.ts` 暴露） | 无 | 活跃文档引擎配置 | Electron 本地 document engine state | 仍由 Web 顶部引擎信息展示，暂无独立 API | **已有替代** | 不需要 1:1 IPC 迁移 | P2 |
| `documentEngine:setPreferred` | 同上 | `engineId` | 设置结果 | Electron 本地持久化 | 暂不迁移；Web 继续使用服务端环境配置 | **无** | 非 P0，避免引入第二套偏好存储 | P2 |
| `documentEngine:readOoxmlPackage` | `documentEngineService` | `filePath` | OOXML snapshot / html / blocks | Electron 本地文件系统 / OOXML package 读写 | `POST /api/documents/import-docx` | **本轮以 Web DOCX 解析替代** | Web 无 block-level OOXML snapshot | P0 |
| `documentEngine:writeOoxmlPackage` | `documentEngineService` | `filePath`, `html/plainText/blocks` | 写回结果 | Electron 本地文件系统 / OOXML 写回 | `POST /api/documents/:documentId/export` | **已有导出，本轮强调最新 payload** | Web 暂无 block-level OOXML shell write-back | P0 |
| `file:read` | `electron/main/index.ts` + Node `fs` + `mammoth` | `filePath` | 文本 / html / docx 提取结果 | 本地路径、DOCX 原文件读取 | `POST /api/documents/import-docx` | **已有旧 `/api/document/import-docx`，本轮补 `/api/documents/import-docx`** | 需要支持 `artifactId` 读回 | P0 |
| `file:writeDocx` | `electron/main/index.ts` | `filePath`, markdown/html | 写入后的 docx 路径 | 本地文件系统 | `/api/documents/:documentId/export` | **已有** | 必须保证导出基于最新编辑内容 | P0 |
| `file:exportWithJournalFormat` | `electron/main/services/journalDocxExporter.ts` | `html`, `config` | journal docx 导出结果 | 本地保存对话框 / 文件路径 | 暂不迁移到 Workbench 主线 | **无** | 非本轮范围 | P2 |

## Web target mapping

### P0

1. `POST /api/documents/task-router`
2. `POST /api/documents/:documentId/edit-selection`
3. `POST /api/documents/:documentId/continue`
4. `POST /api/document/formal-template/analyze`
5. `POST /api/document/formal-template/confirm-fields`
6. `POST /api/document/formal-template/preview`
7. `POST /api/document/formal-template/commit`
8. `POST /api/documents/import-docx`
9. `POST /api/documents/:documentId/export`

### P1

1. router 与 paper workflow 的细粒度阶段联动
2. 论文大纲 / 主题分析结果在 Workbench 的独立 UI 提示

### P2

1. `documentEngine:setPreferred`
2. `file:exportWithJournalFormat`
3. Electron OOXML block-level shell fidelity

## Key gaps kept explicit

1. Web **没有**迁移 Electron 的 workspace 工作副本、锁文件、saveManuscript fail-closed 机制。
2. Web formal template commit 目前是 **结构化字段 + Workbench 持久化**，不是高保真 OOXML shell 写回。
3. Web import-docx 当前输出的是 `html + DocumentDraft + 最新 artifact`，不是 Electron 的完整 OOXML blocks snapshot。
