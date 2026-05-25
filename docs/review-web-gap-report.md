# ai-office-public-review -> ai-office-web Feature Gap Report

## Scan scope

**Review repository scanned read-only:** `src`, `src/modules`, `src/document`, `src/capabilities`, `src/skills`, `src/components`, `server/src`, `electron/main`, `ai_writer3.0`, `excel-and-relay`, `aioffice-workflow-service`, `skill_platform_next`, `docs`, `build`, `scripts`.

**Web repository scanned:** `src/features`, `src/modules`, `src/document`, `src/components`, `src/platform`, `src/skills`, `server/src/features`, `server/src/modules`, `server/src/artifacts`, `tests/e2e`, `build`, `scripts`, `docs`, `package.json`, `server/package.json`.

**Keywords covered:** 文稿, 写作, 论文, paper, thesis, academic, research, formal, template, outline, citation, reference, literature, knowledge, 知识库, 引用, 文献, 政策依据, 正式模板, 研究报告, 论文生成, 学术写作, ppt, deck, presentation, slide, retemplate, DeckDocument, pptx, 演示文稿, 模板切换, 幻灯片, 汇报, excel, spreadsheet, xlsx, csv, dataframe, data analysis, 数据分析, chart, plot, image, python, model, visualization, 图表, email, mail, inbox, triage, reply, draft, attachment, 邮件, 回复, 草稿, 附件, 分类, 任务, daily, report, worklog, audit, log, 日报, 工作日志, 审计, 记录, skill, store, manifest, scenario, 场景包, 技能, 模板市场.

## Review capabilities found

| Domain | Review capability | Representative areas |
| --- | --- | --- |
| Document / paper writing | Paper generation, outline planning, section-wise writing, academic/report/formal modes, continuation, section-aware remake, formal templates, citation/reference sidecars | `src/services/PaperService.ts`, `src/modules/paper`, `src/modules/formal`, `src/document`, `ai_writer3.0` |
| Knowledge citations | Knowledge library materialization, selected-only/selected-first/auto retrieval constraints, document categories, chunk metadata, reference export | `src/modules/knowledge`, `electron/main/services/knowledgeService.ts`, `src/types/knowledge*` |
| Data analysis | Local Python plotting agent, CSV/XLSX analysis, chart recommendation, column type inference, correlation/statistics, image outputs | `src/modules/plot`, `excel-and-relay`, `electron/main/services/excelAnalysisService.ts` |
| PPT/deck | `DeckDocument`, prompt/manuscript/imported PPT builders, template manifests, layout matching, deterministic retemplate, PPTX export/preview | `src/modules/generation/ppt`, `src/types/deckDocument.ts`, `electron/main/services/ppt*` |
| Email | Mail triage, rule-first + LLM classification, reply draft, todos, attachment actions, cache, workflow handoff | `src/modules/email`, `electron/main/services/email*`, `aioffice-workflow-service` |
| Image | Image generation, selection/image prompt builders, reference-image chains, poster/illustration flows | `src/modules/image`, `electron/main/services/imageClient.ts` |
| Daily/worklog/audit | Workspace activity snapshots, daily reports, user action logs, report panels | `src/modules/feed`, `electron/main/services/workspaceActivityService.ts`, `dailyReport*` |
| Skill/template/scenario | Built-in skills, skill manifests, skill store service, scenario packaging contracts | `src/skills`, `skill_platform_next` |

## Web capabilities already present

- **DocumentWorkbench:** web HTML A4 editor, `DocumentArtifact = html + canonicalData`, blockId selection, `DocumentCommandEngine`, save/restore, PDF browser print, DOCX export, right-side AI/citation panel.
- **Document artifact and citations:** `src/features/document/services/documentWorkbenchApi.ts`, `documentDraftTransforms.ts`, `documentArtifactToDocx.ts`, `server/src/features/document/services/documentWorkbenchArtifact.ts`.
- **Paper workflow:** server `/api/document/paper-workflow/*`, `paperWorkflowService`, `paperNFTCORERuntime`, frontend `paperWorkflowAdapter`, DocumentWorkbench handoff.
- **Knowledge inputs:** DocumentWorkbench knowledge picker and attachment panel, `resolveDocumentKnowledgeRefs`, prompt injection, sourceRefs/knowledgeRefs on artifacts.
- **Server-side data analysis:** `/api/data-analysis/jobs/*`, `runAnalyzeXlsxSkill`, `excelAnalyzer`, frontend `ExcelAnalysisWorkbench`/`WebExcelAnalysisPanel`.
- **PPT/deck:** server `/api/ppt`, deck builders, template and MiniMax integration.
- **Email/image/report/skill routes:** web feature modules and server routes exist but several flows are still partial versus review.

## Web gaps

### P0 gaps

1. **Academic writing workflow:** paper flow exists but the web UI lacks a guided workflow panel for type/topic/research goal/length/language/style/knowledge sources/outline confirmation. Existing `paperType` only covers `research`, `review`, `thesis_research`, not course paper, policy research report, or business research report. The result path also does not consistently bind knowledgeRefs into generated inline citations.
2. **Knowledge citation writing:** block-level citation commands can insert `span.doc-citation`, but they choose the first reference/placeholder and do not expose `chunkId`, `trustLevel`, source type, or cited block metadata in the right panel.
3. **Data analysis images:** web server analysis returns a Markdown artifact; chart image generation is explicitly marked partial, so exitCode/success can occur while no chart is visible.
4. **Demo entry completeness:** document and data-analysis entries exist, but core P0 workflows need obvious in-workbench controls and structural smoke tests.

### P1 gaps

- PPT template switching is present architecturally but still needs full user flow parity for topic-to-PPT, document-to-PPT, preview and no-token retemplate validation.
- Email triage/reply/task/document conversion is partially migrated but not fully artifact/work item centered.
- Image generation exists, but image artifacts are not fully integrated as document/PPT insertable assets across web workflows.
- Daily/worklog can summarize activity, but audit-grade export and document/report artifacts are incomplete.
- Skill/scenario modules exist, but this round should only backfill first-party scenarios rather than rebuild the full store.

### P2 report-only gaps

Full OA/Flowable deep integration, multi-tenant permission matrix, multiplayer collaboration, full Word/PPT lossless compatibility, mobile, marketplace transactions, plugin ecosystem, and complex BI dashboards.

## What can be reused as ideas or prompts

- Review paper outline/body prompts, section planning, literature review structure, policy/business report patterns.
- Knowledge retrieval constraints: selected-only, selected-first, auto, source titles, chunk metadata, citation status/trust.
- Data-analysis profiling ideas: column classification, missing values, numeric summaries, chart recommendation.
- PPT `DeckDocument` and deterministic retemplate concepts.
- Email rule-first triage and action-plan data shape.
- Worklog event schema and daily report artifact concept.

## What must not be copied directly

- Electron IPC, local filesystem runners, desktop-only Python subprocess logic, and direct Office/OOXML desktop workflows cannot be copied because web must keep heavy work on `server` and frontend must not depend on Electron APIs.
- Review UI panels cannot be dropped in wholesale because web already has a single DocumentWorkbench and platformApi boundary.
- Legacy save models must not be copied because DocumentArtifact and server artifact storage are the web source of truth.

## Reimplementation strategy under web architecture

- **Documents:** generate into `DocumentArtifact` with canonical blocks, references, citations, knowledgeRefs and sourceRefs.
- **Citations:** store inline `span.doc-citation` in HTML and structured metadata in artifact/canonicalData; display the right panel from artifact state.
- **Data analysis:** parse and summarize CSV/XLSX on server, generate chart images on server, persist `data_analysis` artifacts, and let frontend render `imageUrls`.
- **PPT/images/email/daily:** keep as Artifact-centered workflows and use server APIs for heavy work.

## Priorities

### P0

1. Guided academic writing workflow inside DocumentWorkbench.
2. Knowledge citation writing with block binding and right panel metadata.
3. Server-side data analysis with chart image output and artifact metadata.
4. Structural smoke coverage for all three.

### P1

1. PPT workflow/template switching parity.
2. Email triage -> task/document/reply artifact flows.
3. Image generation artifact insertion into document/PPT.
4. Daily/worklog report artifact export.
5. Scenario skills for document/PPT/data/email.

### P2

Report-only items listed above.

## This round implementation scope

- Add an AcademicWritingPanel to the existing DocumentWorkbench.
- Add web-native academic writing service/route under `/api/document/academic-writing`.
- Enrich citation/reference types and panel display.
- Add a deterministic server chart renderer for data analysis artifacts.
- Add smoke tests and npm scripts.

## Remaining gaps after this round

- Real knowledge retrieval remains follow-up in this report baseline; remote knowledge-base deep chunk retrieval/vector ranking still remains a remaining gap.
- Full citation style formatting (APA/GB/T/Chicago) remains follow-up.
- PPT P1 deck/template residue, entry/router adjustments, and handoff/research scaffolding currently present in the web worktree remain out of scope for this round and should stay unsubmitted until completed separately.
- Email, image, daily, and skill P1 work remains follow-up unless additional time is available after P0 validation.

## Risks

- Existing web worktree contains unrelated uncommitted changes; commits must stage only relevant files.
- LLM availability is variable, so tests must assert structure rather than natural-language wording.
- Chart rendering should avoid frontend Python and avoid introducing heavy native dependencies.
- Citation metadata must stay compatible with existing DOCX export, save/restore, and document-command E2E.
