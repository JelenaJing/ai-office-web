# Electron to Web — Full Feature Parity Audit

**Date:** 2026-05-22  
**Web repo:** `/data/darebug/aioffice-server/ai-office-web` (branch `main`)  
**Electron repo:** Same repo — `electron/main/services/` contains the Electron Node.js services

---

## Architecture Overview

The Electron app has three communication layers:
1. **Electron Main** — Node.js services (direct file I/O, OOXML, Python, IMAP/SMTP)
2. **Electron Preload** — IPC bridges (`window.electronAPI.*` methods) exposing main services to renderer
3. **Renderer (shared src/)** — React UI, can use either Electron IPC or Web REST APIs

For Web deployment, all Electron Main capabilities must be ported to `server/src/features/*` as REST APIs.

---

## A. Document / Writing Module

### A1. General Document (普通文稿)
**Electron main services:** `essayGenerator.ts`, `essayTaskService.ts`  
**Electron IPC:** `ai:generateOutline`, `ai:writingAssistant`, `ai:continueWriting`, `ai:rewriteParagraph`  
**Web server:** `server/src/features/document/skills/generateDocumentSkill.ts`, `legacyWritingWorkflow.ts`  
**Web frontend:** `src/features/document/components/WordLikeDocumentEditor.tsx`  
**Status:** `partial parity`  
**Problem:** Electron `essayGenerator.ts` does multi-step generation (topic analysis → outline → section-by-section). Web server uses a single-pass LLM prompt. The "continue writing" and "rewrite paragraph" skills exist but may differ in quality.

### A2. Research Article / Academic Paper (论文/学术文章)
**Electron main services:** `paperGeneratorNFTCORE.ts`, `openAlexClient.ts`, `paperStructurePlanner.ts`, `nftcorePromptFactory.ts`  
**Electron IPC:** `ai:generatePaper`, `compat:submitTask`, `compat:getTaskStatus`, `compat:getTaskResult`  
**Web server:** `server/src/features/document/services/paperNFTCORERuntime.ts` (ported), `/api/document/paper-workflow/start + tasks/:id`  
**Web frontend:** `src/features/document/services/paperWorkflowAdapter.ts` (polls async task)  
**Status:** `partial parity`  
**Problem:** Web NFTCORE runtime is missing: incremental reference pass (`organizeReferencesStream`), knowledge tree check, full-paper review pass. Journal category filtering omitted. Output quality may differ.

### A3. Literature Review (文献综述)
**Status:** `partial parity` — same as A2, uses `paperType: 'review'` path through same NFTCORE runtime.

### A4. Formal Template Beta (正式模板 Beta)
**Electron main services:** `formalTemplate/formalTemplateTaskService.ts` — 4-stage pipeline: analyze → confirm → preview → commit  
Sub-services: `templateAdmissionService.ts`, `fieldExtractionService.ts`, `fieldResolutionService.ts`, `regionLocatorService.ts`, `regionGenerationService.ts`, `templateProfileService.ts`, `shellValidationService.ts`, `formalTemplateRoutingService.ts`  
**Electron IPC:** `formalTemplate:analyze`, `formalTemplate:confirmFields`, `formalTemplate:preview`, `formalTemplate:commit`  
**Web server:** `server/src/features/document/skills/templateDocumentGenerateLegacySkill.ts` — 2-pass LLM only, NO OOXML pipeline  
**Web frontend:** `src/modules/formal/components/FormalTemplatePanel.tsx` (calls Electron IPC in desktop; blocked in web)  
**Status:** `placeholder`  
**Problem:** The Electron pipeline does real OOXML field extraction and structured region generation. The Web "legacy" skill just takes template extracted text and does a single LLM generation. It does NOT preserve template formatting, does NOT do field-by-field resolution, does NOT do region-level generation. The AICommandBox shows "完整模板 Shell 接入中" — the feature is disabled.

### A5. Visit Letter / Formal Template Shell (访问函 / 正式模板 Shell)
**Electron:** `formalTemplate/sampleAdapters/visitLetterTemplateSampleAdapter.ts`, `visitLetterSchemaStrategyService.ts`  
**Web:** No equivalent  
**Status:** `not migrated`

### A6. Word Import (Word 导入)
**Electron:** `wordDocumentCompatibility.ts` — `.doc` → `.docx` conversion via LibreOffice, OOXML reading  
**Electron IPC:** `documentEngine:readOoxmlPackage`, file dialog  
**Web:** `server/src/features/document/services/docxExtractService.ts` — extracts text from DOCX  
**Status:** `partial parity`  
**Problem:** Electron does full OOXML round-trip (read → render → edit → write). Web only extracts text.

### A7. Word Export (DOCX 导出)
**Electron:** `journalDocxExporter.ts` — journal-quality DOCX with headers/footers, Chinese indent, line spacing  
**Electron IPC:** `file:exportWithJournalFormat`  
**Web:** `server/src/features/document/skills/exportDocxSkill.ts` (uses html-docx-js)  
**Status:** `partial parity`  
**Problem:** html-docx-js output quality is lower than Electron's journal-format exporter.

### A8. PDF Export (PDF 导出)
**Electron:** `pdfExporter.ts` — KaTeX formula rendering, markdown→HTML, inline image handling  
**Electron IPC:** `ai:exportPdf`, `ai:exportPdfFromEditor`  
**Web:** `server/src/features/document/skills/exportPdfSkill.ts`  
**Status:** `partial parity`  
**Problem:** Web PDF export uses Puppeteer/puppeteer-html-pdf or similar. Formula rendering may differ.

### A9. Document Engine OOXML (OOXML 高保真)
**Electron:** `documentEngineService.ts` — full OOXML package read/write, formula extraction, LLM enhancement  
**Electron IPC:** `documentEngine:readOoxmlPackage`, `documentEngine:writeOoxmlPackage`  
**Web:** No equivalent server service  
**Status:** `not migrated`  
**Problem:** Full OOXML high-fidelity roundtrip is Electron-only. Web cannot preserve complex Word formatting.

### A10. Knowledge-based Writing (知识库参与文稿)
**Electron:** `knowledgeRetrievalService.ts` feeds into essay/formal template generation  
**Web:** `server/src/features/document/skills/knowledgeWritingLegacySkill.ts`, `documentContextBuilder.ts`  
**Status:** `partial parity`  
**Problem:** Electron uses real vector chunk retrieval. Web uses `remoteKnowledgeClient.ts` which may not have local embedding/RAG.

---

## B. PPT Module

### B1. Generate PPT from Prompt (生成 PPT)
**Electron:** `ppt/deckBuilder/deckBuilderService.ts` → `buildDeckFromPrompt()` — LLM slide plan JSON → DeckDocument → RetemplateEngine → PPTX  
**Electron IPC:** `deck:buildFromPrompt`, `pptx:generate`  
**Web server:** `server/src/features/ppt/services/simplePptx.ts` — simplified slide plan + PptxGenJS (no brand template)  
**Status:** `partial parity`  
**Problem:** Electron applies brand templates and slot binding. Web generates plain PPTX.

### B2. DeckDocument + RetemplateEngine (零 token 模板切换)
**Electron:** `electron/main/services/ppt/retemplateEngine.ts`, `deckDocumentService.ts`  
RetemplateEngine: DeckDocument → TemplateManifest → LayoutMatcher → ContentPaginator → SlotBinder → PPTX (zero LLM cost)  
**Electron IPC:** `deck:render`, `deck:updateDeckDocument`  
**Web frontend:** `src/modules/generation/ppt/` — has retemplate logic client-side  
**Web server:** No equivalent  
**Status:** `partial parity`  
**Problem:** Electron RetemplateEngine does zero-token template switching. Web frontend has the retemplate logic in `src/modules/generation/ppt/` (client-side) but the server doesn't apply templates. The client-side logic may work if given a DeckDocument, but template assets need to be available.

### B3. PPT Import (外部 PPT 导入)
**Electron:** `ppt/pptxImportService.ts` — PPTX → DeckDocument with preview generation  
**Electron IPC:** `pptx:importFromDialog`, `pptx:importFromFile`, `deck:extractPptx`  
**Web:** No server equivalent  
**Status:** `not migrated`

### B4. PPTX Export (PPTX 导出)
**Electron:** `pptxGenerator.ts` — PptxGenJS-based, brand templates  
**Web server:** `simplePptx.ts` uses PptxGenJS (same library, no brand templates)  
**Status:** `partial parity`

### B5. Template Market / Skill Templates (模板市场/技能化模板)
**Electron:** `pptTemplateRegistry.ts`, `pptContentPackageService.ts`, `ppt/templateCloneRenderer.ts`, `skillPlatformService.ts`  
**Web:** `src/features/ppt/` has skill references but no server template registry  
**Status:** `partial parity`

### B6. Build from Manuscript (从文稿生成 PPT)
**Electron:** `deck:buildFromManuscript`  
**Web:** No equivalent  
**Status:** `not migrated`

---

## C. Email Module

### C1. Inbox / IMAP Fetch
**Electron:** `emailService.ts` (ImapFlow)  
**Web server:** `server/src/features/email/services/emailMvp.ts` (ImapFlow — same library)  
**Status:** `full parity`

### C2. Send Email / SMTP
**Electron:** `emailService.ts` (nodemailer)  
**Web server:** `emailMvp.ts` (nodemailer)  
**Status:** `full parity`

### C3. Attachment Handling (邮件附件)
**Electron:** `emailAttachmentOpenService.ts` — download + open in workspace  
**Electron IPC:** `email:downloadAttachment`, `mail:openAttachmentInWorkspace`  
**Web server:** Attachment download in emailMvp.ts — partial  
**Status:** `partial parity`  
**Problem:** Web can download attachments but cannot save to workspace or open in document editor flow.

### C4. AI Triage / Classify (AI 整理未读)
**Electron:** Auto-reply risk classification in `autoReplyService.ts`  
**Web server:** `server/src/features/email/services/emailMvp.ts` has `triageUnread()` stub  
**Status:** `placeholder`  
**Problem:** Real AI triage (classify by urgency/category/task) is not implemented on Web server.

### C5. Auto-Reply Draft (回复草稿)
**Electron:** `autoReplyService.ts` — risk classification, audit logging, delegation  
**Web:** No equivalent server service  
**Status:** `not migrated`

### C6. Email → Document Conversion (邮件转文稿)
**Electron:** Possible via `ai:writingAssistant` with email body as input  
**Web:** Not exposed as a dedicated flow  
**Status:** `partial parity`

### C7. Email → Matter Conversion (邮件转事项)
**Electron:** Part of delegation service  
**Web:** `server/src/features/aios/services/matterService.ts` + `generationService.ts`  
**Status:** `partial parity`

### C8. Bulk Send / Recipients (群发/收件人解析)
**Electron:** Via emailService.ts (standard SMTP)  
**Web:** Partial  
**Status:** `partial parity`

---

## D. Image Module

### D1. Image Generation (图片生成)
**Electron:** `imageClient.ts` — image generation API client  
**Electron IPC:** `ai:generateImage`  
**Web server:** `server/src/features/image/services/imageGenerator.ts`, `createImageSkill.ts`  
**Status:** `full parity`

### D2. Reference Image / Style (参考图/风格)
**Electron:** `imageClient.ts` — reference image normalization, style profiles  
**Web server:** `imageGenerator.ts` accepts style params  
**Status:** `partial parity`

### D3. Image Artifact (图片 Artifact)
**Web:** `server/src/artifacts/ArtifactStore.ts`  
**Status:** `full parity`

---

## E. Excel / Data Analysis Module

### E1. XLSX/CSV Upload + Analysis
**Electron:** `excelAnalysisService.ts` — read table → LLM dimension planning → Python code gen → execute → PNG output  
**Electron IPC:** `excel:analysisRun`, `excel:analysisProgress` (event)  
**Web server:** `server/src/features/data-analysis/services/excelAnalyzer.ts` (stub), `analyzeXlsxSkill.ts`  
**Status:** `partial parity`  
**Problem:** Electron executes Python scripts locally. Web server equivalent would need a Python runtime. Current Web service is a stub.

### E2. Chart Generation (图表生成)
**Electron:** `plotAgentService.ts` (HTTP client to local Python service)  
**Web:** `server/src/features/data-analysis/` — likely calls same Python service if available  
**Status:** `partial parity`

### E3. Python Environment Check (Python 环境)
**Electron:** `excel:checkEnvStatus`, `excel:rebuildEnv` — checks/installs Python + pip  
**Web:** Not available  
**Status:** `web unsupported`

---

## F. Knowledge Base Module

### F1. Document Import (文档上传 / 导入)
**Electron:** `knowledgeService.ts` — PDF/DOCX/TXT/MD/PPTX import, text extraction, JSON representation  
**Web:** `server/src/features/knowledge/routes.ts` — document upload endpoints exist  
**Status:** `partial parity`  
**Problem:** Electron has deep text extraction with chunking. Web API exists but underlying extraction quality unknown.

### F2. RAG / Embedding / Vector Search
**Electron:** `knowledgeRetrievalService.ts` — chunk-based search, citation tracking  
**Web server:** `server/src/features/knowledge/services/remoteKnowledgeClient.ts` — proxies to remote knowledge service  
**Status:** `partial parity`  
**Problem:** Web depends on a remote knowledge service being available. No local embedding/vector search.

### F3. Knowledge Remake (文档 AI 改写)
**Electron:** `knowledgeTaskService.ts` — LLM-powered content rewriting  
**Web:** No equivalent  
**Status:** `not migrated`

### F4. Knowledge in Document Generation (知识库参与生成)
**Electron:** `knowledgeRetrievalService.ts` feeds into essay/formal template/paper generation  
**Web:** `documentContextBuilder.ts` retrieves knowledge chunks via remote API  
**Status:** `partial parity`

### F5. Personal Library (个人文件库)
**Electron:** `personalLibraryService.ts` — folder/file management  
**Electron IPC:** `personal-lib:*` channels  
**Web:** Not implemented  
**Status:** `not migrated`

---

## G. Daily Report / Workspace Activity Module

### G1. AI Daily Report Generation (AI 生成日报)
**Electron:** `dailyReportGenerator.ts` — multi-step: topic analysis + OpenAlex + figure gen + composition  
**Electron IPC:** `activity:generateReport`, `activity:getReport`  
**Web server:** `server/src/features/report/skills/dailyReportSkill.ts` — reads artifacts + matters, no AI generation  
**Status:** `placeholder`  
**Problem:** Electron has full multi-step AI generation. Web skill only lists today's artifacts/matters without LLM-generated narrative.

### G2. Workspace Activity Logging (工作日志)
**Electron:** `workspaceActivityService.ts`, `workspaceActivityQueue.ts`, `workspaceActivitySyncService.ts`  
**Electron IPC:** `activity:takeSnapshot`, `activity:getActivity`, `activity:syncStatus`  
**Web:** No equivalent  
**Status:** `not migrated`

### G3. User Action Log (用户行为日志)
**Electron:** `userActionLogService.ts`  
**Electron IPC:** `activity:logUserAction`, `activity:getUserActions`  
**Web:** No equivalent  
**Status:** `not migrated`

### G4. Admin / Management View (管理员/下属日报查看)
**Electron:** `activity:adminFetch`, `activity:adminPost`  
**Web:** No equivalent  
**Status:** `not migrated`

---

## H. AIOS / Matter Module

### H1. Matter Lifecycle (事项)
**Web server:** `server/src/features/aios/services/matterService.ts` + `matterStore.ts`  
**Status:** `full parity`

### H2. Evidence / DecisionPackage / AuditTrail
**Web server:** `auditTrailService.ts`, `decisionPackageService.ts`  
**Status:** `full parity`

### H3. Email → Matter (邮件转事项)
**Web server:** `generationService.ts` — generates matter from email  
**Status:** `full parity`

### H4. Matter → Document / PPT (事项生成文稿/PPT)
**Web:** Partial — depends on document/PPT generation quality  
**Status:** `partial parity`

### H5. AI Delegation / Auto-Reply (AI 委托/自动回复)
**Electron:** `delegationService.ts` — enable/disable, audit log, pending reply queue  
**Web:** `server/src/features/aios/` has delegation references  
**Status:** `partial parity`

---

## I. Calendar Module

### I1. Calendar CRUD
**Web server:** `server/src/features/calendar/services/calendarStore.ts`  
**Web frontend:** `src/features/calendar/`  
**Status:** `partial parity`  
**Problem:** Basic CRUD exists but no ICS import/export, no email-to-event detection, no matter linkage.

### I2. Email → Calendar Event Detection
**Status:** `not migrated`

### I3. Calendar ↔ Daily Report / Matter Linkage
**Status:** `not migrated`

---

## J. Resource Center / Artifact Module

### J1. Artifact Store
**Web server:** `server/src/artifacts/ArtifactStore.ts` — unified artifact store  
**Status:** `full parity`  

### J2. Resource Center UI (文件列表/预览/下载)
**Web frontend:** `src/features/resource-center/` — stub UI  
**Web server:** `server/src/features/resource-center/routes.ts` — empty TODO  
**Status:** `placeholder`  
**Problem:** Route file is empty (`// TODO: migrate routes`). No actual file listing, preview, or download endpoints.

### J3. Artifact Association (关联 Matter/Email/文稿/PPT)
**Status:** `partial parity` — ArtifactStore records associations but no UI to browse them

---

## K. Skill Store / Skill Center

### K1. Skill Installation / Runtime
**Electron:** `skillPlatformService.ts` — launches `skill-library-backend` and `skill-store-web` background services  
**Electron IPC:** `skill:openStore`, `skill:listTemplates`, `skill:downloadPackage`  
**Web frontend:** `src/features/skill-center/` — UI for browsing skills  
**Web server:** `server/src/features/skill-center/services/index.ts` — minimal  
**Status:** `partial parity`

### K2. Skill Job Execution / Artifact Output
**Status:** `partial parity`

---

## L. Settings / Account / Model Config

### L1. LLM Provider Configuration
**Electron:** `settingsStore.ts` — persists to local JSON  
**Web:** Server reads from env vars / `build/ai-config.json`  
**Status:** `full parity`

### L2. Email Account Config
**Electron:** `emailService.ts` stores IMAP/SMTP creds  
**Web server:** `emailStore.ts` persists email accounts  
**Status:** `full parity`

### L3. Workspace Configuration
**Electron:** `workspaceService.ts`  
**Web:** `server/src/lib/workspaceStore.ts`  
**Status:** `full parity`

---

## Summary Table

| Module | Feature | Status |
|--------|---------|--------|
| Document | General document | partial parity |
| Document | Academic paper | partial parity |
| Document | Literature review | partial parity |
| Document | Formal template (4-stage) | **placeholder** |
| Document | Visit letter / template shell | not migrated |
| Document | Word import (OOXML) | partial parity |
| Document | Word export (DOCX) | partial parity |
| Document | PDF export | partial parity |
| Document | OOXML high-fidelity roundtrip | not migrated |
| Document | Knowledge-based writing | partial parity |
| PPT | Generate from prompt | partial parity |
| PPT | RetemplateEngine / DeckDocument | partial parity |
| PPT | PPT import | not migrated |
| PPT | Build from manuscript | not migrated |
| Email | Inbox / IMAP | full parity |
| Email | Send / SMTP | full parity |
| Email | Attachments to workspace | partial parity |
| Email | AI triage | placeholder |
| Email | Auto-reply draft | not migrated |
| Image | Image generation | full parity |
| Excel | Python analysis | partial parity |
| Excel | Python env check/rebuild | web unsupported |
| Knowledge | Document import | partial parity |
| Knowledge | RAG / vector search | partial parity |
| Knowledge | Knowledge remake | not migrated |
| Knowledge | Personal library | not migrated |
| Report | AI daily report | placeholder |
| Report | Workspace activity log | not migrated |
| Report | User action log | not migrated |
| AIOS | Matter lifecycle | full parity |
| AIOS | AI delegation | partial parity |
| Calendar | Basic CRUD | partial parity |
| Calendar | Email → event | not migrated |
| Resource Center | Artifact store | full parity |
| Resource Center | File listing/preview/download | placeholder |
| Skill Store | Skill install / runtime | partial parity |
| Settings | LLM config | full parity |
| Settings | Email account | full parity |
