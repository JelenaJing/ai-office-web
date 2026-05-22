# Electron → Web Migration Plan

## Goal

以 **当前仓库内 Electron 本地版** 和 **`ai-office-public-review`** 为 source of truth，把 Web 版从“有入口的 MVP”推进到“可逐步替代 Electron 本地版”的状态。

本计划遵循以下约束：

1. 不用 prompt/fallback 假装功能完成。  
2. 不让 Web 前端直接调用 `window.electronAPI`。  
3. Electron main 能力要迁到 `server` / shared service / task runtime。  
4. 长任务必须异步任务化。  
5. 每个模块先审计，再实现，再验收，再单独提交。  
6. 不在一个 commit 里混多个大模块。  

## Source-of-truth policy

### Primary

- `/data/darebug/aioffice-server/ai-office-web/electron`
- `/data/darebug/aioffice-server/ai-office-web/src/modules`
- `/data/darebug/aioffice-server/ai-office-web/src/skills`
- `/data/darebug/aioffice-server/ai-office-web/src/document`
- `/data/darebug/aioffice-server/ai-office-web/src/engines`

### Secondary

- `/data/darebug/aioffice-server/ai-office-public-review`

### Tertiary

- `/data/darebug/aioffice-server/ai-office-web/ai_writer3.0`

> 说明：`ai_writer3.0` 不是完整 truth；仅在缺少主仓 Electron 线索时辅助比对。

## Architecture target

### Frontend

- `src/features/<module>/components`
- `src/features/<module>/services`
- `src/features/<module>/hooks`
- `src/features/<module>/types`
- `src/features/<module>/contexts`（如需要）

前端只负责：

- 工作台入口
- 参数收集
- 任务状态展示
- 结果展示
- Artifact / Matter / Knowledge 的引用视图

### Backend

- `server/src/features/<module>/routes.ts`
- `server/src/features/<module>/services/*`
- `server/src/features/<module>/skills/*`
- `server/src/features/<module>/types.ts`

后端负责：

- 业务执行
- 模型调用
- 文件处理
- 异步任务
- Artifact 持久化
- Knowledge / Auth / Permission / Export

## Phase 1 - Cross-repo audit

### Deliverables

1. `docs/electron-to-web-full-parity-audit.md`
2. `docs/electron-to-web-feature-parity-matrix.md`
3. `docs/electron-to-web-migration-plan.md`

### Exit criteria

- 所有核心模块都有 `full | partial | placeholder | missing | unsupported` 状态
- 每个模块都能追溯到 Electron / public review source files
- 每个模块都有 Web target files、迁移策略、验收方式

## Phase 2 - Document parity completion

### Scope

1. 普通文稿  
2. academic paper  
3. literature review  
4. formal template  
5. manuscript / canonical document  
6. DOCX / PDF / OOXML fidelity  

### Immediate tasks

1. **论文 / 综述**
   - 继续对齐 `paperGeneratorNFTCORE`
   - 补齐 incremental reference organisation
   - 补齐 knowledge tree check
   - 补齐 final full-paper review
   - 补齐 citation verification
   - 规范 `PaperArtifact` / reference sidecar

2. **正式模板**
   - 保持 `analyze / confirm / preview / commit`
   - 继续迁移 OOXML block-level shell write-back
   - 继续迁移 section / header / footer fidelity
   - 继续迁移 schema-first base replace
   - 继续迁移 preview diagnostics
   - 保持 Word 导出

3. **普通文稿 / manuscript**
   - 让 Web session 更明确地保存 structured schema
   - 继续把导入/导出向 canonical document 收口

### Acceptance docs

- `docs/electron-to-web-document-parity-acceptance.md`
- `docs/electron-to-web-paper-workflow-parity-acceptance.md`
- `docs/electron-to-web-formal-template-parity-acceptance.md`

### Commit policy

- `feat(document): complete electron parity for document workflows`

## Phase 3 - PPT parity

### Scope

1. DeckDocument truth layer  
2. RetemplateEngine  
3. 0-token template switch  
4. slot binding / layout matching  
5. PPTX export  
6. document-to-ppt bridge  
7. imported PPTX parsing  

### Required APIs

- `POST /api/ppt/decks/start`
- `GET /api/ppt/decks/tasks/:taskId`
- `POST /api/ppt/decks/tasks/:taskId/cancel`
- `POST /api/ppt/decks/:deckId/retemplate`
- `GET /api/ppt/decks/:deckId`
- `GET /api/ppt/decks/:deckId/download`

### Acceptance docs

- `docs/electron-to-web-ppt-parity-audit.md`
- `docs/electron-to-web-ppt-feature-matrix.md`
- `docs/electron-to-web-ppt-parity-acceptance.md`

## Phase 4 - Email parity

### Scope

1. mailbox config / IMAP / SMTP  
2. unread triage job  
3. summary / priority / risk / task extraction  
4. reply draft  
5. attachment → Artifact  
6. bulk email draft + dry-run  
7. email → Matter / Document / PPT / Calendar  

### Required APIs

- mailbox CRUD / fetch
- async triage job APIs
- reply-draft endpoints
- bulk send dry-run endpoint

### Acceptance docs

- `docs/electron-to-web-email-parity-audit.md`
- `docs/electron-to-web-email-parity-acceptance.md`

## Phase 5 - Image parity

### Scope

1. text-to-image  
2. reference-image generation  
3. style control  
4. poster workflow  
5. Artifact output  
6. download / reuse in document & ppt  

### Required APIs

- `POST /api/image/jobs/start`
- `GET /api/image/jobs/:jobId`
- `POST /api/image/jobs/:jobId/cancel`

### Acceptance docs

- `docs/electron-to-web-image-parity-audit.md`
- `docs/electron-to-web-image-parity-acceptance.md`

## Phase 6 - Data analysis parity

### Scope

1. xlsx/csv upload  
2. Python environment detection  
3. stable stdout / result json parsing  
4. charts / plots  
5. analysis report  
6. Artifact output  

### Required APIs

- `POST /api/data-analysis/jobs/start`
- `GET /api/data-analysis/jobs/:jobId`
- `POST /api/data-analysis/jobs/:jobId/cancel`
- `GET /api/data-analysis/jobs/:jobId/artifacts`

### Acceptance docs

- `docs/electron-to-web-data-analysis-parity-audit.md`
- `docs/electron-to-web-data-analysis-parity-acceptance.md`

## Phase 7 - Report parity

### Scope

1. user activity event collection  
2. matter / document / ppt / email events into report  
3. self / manager / admin visibility  
4. daily / subordinate / summary views  

### Required APIs

- `POST /api/work-report/events`
- `GET /api/work-report/daily`
- `GET /api/work-report/subordinates`
- `GET /api/work-report/summary`

### Acceptance docs

- `docs/electron-to-web-report-parity-audit.md`
- `docs/electron-to-web-report-parity-acceptance.md`

## Phase 8 - Communication parity

### Scope

1. unified communication workbench  
2. internal account / token unification  
3. Matrix/chat room list + messages + unread  
4. attachment send/receive  
5. directory / department / contacts  
6. chat → Matter / report  

### Required APIs

- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:id/messages`
- `POST /api/chat/rooms/:id/messages`
- `POST /api/chat/rooms/:id/attachments`
- `GET /api/directory`

### Acceptance docs

- `docs/electron-to-web-communication-parity-audit.md`
- `docs/electron-to-web-communication-parity-acceptance.md`

## Phase 9 - Knowledge parity

### Scope

1. upload  
2. extract text  
3. chunk  
4. embedding  
5. vector search  
6. citation source display  
7. permissions  
8. cross-module retrieval visibility  

### Acceptance docs

- `docs/electron-to-web-knowledge-parity-audit.md`
- `docs/electron-to-web-knowledge-parity-acceptance.md`

## Phase 10 - Artifact / Resource center parity

### Scope

1. unified artifact types  
2. preview / download / delete / rename  
3. relation links to Matter / Email / Document / PPT  
4. type filtering  

### Acceptance docs

- `docs/electron-to-web-artifact-parity-audit.md`
- `docs/electron-to-web-artifact-parity-acceptance.md`

## Phase 11 - Skill runtime parity

### Scope

1. install skill  
2. run skill  
3. async skill jobs  
4. output artifacts  
5. template skills  
6. remote store config  

### Acceptance docs

- `docs/electron-to-web-skill-parity-audit.md`
- `docs/electron-to-web-skill-parity-acceptance.md`

## Phase 12 - Settings parity

### Scope

1. AccountCenter login  
2. token persistence  
3. roles / permissions  
4. model provider config  
5. email config  
6. workspace config  

### Acceptance docs

- `docs/electron-to-web-settings-parity-audit.md`
- `docs/electron-to-web-settings-parity-acceptance.md`

## Phase 13 - AIOS / Matter / OA parity

### Scope

1. Matter  
2. Evidence  
3. DecisionPackage  
4. AuditTrail  
5. approval / decision flow  
6. knowledge verification  
7. multi-opinion / committee  
8. audit replay  

### Acceptance docs

- `docs/electron-to-web-aios-parity-audit.md`
- `docs/electron-to-web-aios-parity-acceptance.md`

## Priority order

### P0

1. 文稿剩余深链路补齐  
2. PPT DeckDocument / RetemplateEngine 完整迁移  
3. 邮件 AI 整理未读 + 附件 + 任务识别 + 回复草稿  
4. 知识库 + Artifact 统一底座  
5. 通信 / 内部 IM 主流程  

### P1

1. 图片完整链路  
2. 日报完整组织链路  
3. Excel / 数据分析完整链路  
4. Skill Runtime 异步任务化  

### P2

1. 管理后台  
2. 模板市场  
3. 高级权限  
4. PDF 高保真导出  
5. 高级 RAG / 多租户治理  

## Required validation per phase

每个实现阶段至少执行：

1. `npm run check:boundaries`
2. `npm run build:web`
3. `cd server && npm run build`

如果某阶段引入真实异步任务，还要补：

4. 最小 smoke 或 acceptance 验收文档  
5. UI 中显示真实状态：`full / partial / placeholder / unsupported`

## Commit sequence

1. `docs: add electron to web full parity audit`
2. `feat(document): complete electron parity for document workflows`
3. `feat(ppt): align web ppt with electron deck runtime`
4. `feat(email): align web email with electron communication runtime`
5. `feat(image): align web image workflow with electron runtime`
6. `feat(data-analysis): align web analysis workflow with electron runtime`
7. `feat(report): align web daily report with electron runtime`
8. `feat(communication): align web communication with electron runtime`
9. `feat(knowledge): align web knowledge base with electron runtime`
10. `feat(artifact): align web resource center with electron runtime`
11. `feat(skill): align web skill runtime with electron runtime`
12. `feat(settings): align web account and settings with electron runtime`
13. `feat(aios): complete web matter and oa parity`
14. `docs: add final electron to web parity report`

## Current execution note

当前仓库已经有一批**未提交的文稿正式模板 parity 改动**，包括：

- async formal template task API
- supported / unsupported template diagnostics
- analyze / confirm / preview / commit 语义映射

这些改动应在本次总审计文档提交之后，作为**文稿阶段单独 commit**继续推进。
