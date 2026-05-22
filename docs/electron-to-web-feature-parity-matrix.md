# Electron → Web Feature Parity Matrix

> **Source of truth:** Electron version in `electron/main/services/`  
> **Target:** Web server in `server/src/features/` + frontend in `src/features/`  
> **Status values:** `full` | `partial` | `placeholder` | `missing` | `unsupported`

---

## A. Document Module

| feature | electron_user_flow | electron_entry_file | electron_renderer_service | electron_api_method | electron_main_handler | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| General document | Write prompt → generate → edit → export | `src/features/document/components/AICommandBox.tsx` | `src/features/document/services/documentWorkflowGenerateRouter.ts` | N/A (web) | N/A | N/A | `src/features/document/components/AICommandBox.tsx` | `POST /api/document/generate` | partial | Single-pass LLM; Electron does multi-step outline→sections | Port multi-step essay generator to `server/src/features/document/services/essayWorkflowService.ts` | no | no | P1 | Generate document; confirm outline + sections in output |
| Academic paper | Select type → enter topic → generate with progress | `src/features/document/components/AICommandBox.tsx` | `src/features/document/services/paperWorkflowAdapter.ts` | `compat:submitTask` / `compat:getTaskStatus` | `compatTaskBridgeMain.ts` | `paperGeneratorNFTCORE.ts` | `src/features/document/services/paperWorkflowAdapter.ts` | `POST /api/document/paper-workflow/start` + `GET /tasks/:id` | partial | Missing: incremental reference pass, knowledge tree check, journal quality | Add reference pass stage to `paperNFTCORERuntime.ts`; add KB retrieval hook | yes | yes | P0 | Research structure with all required sections; DOCX download works |
| Literature review | Select type → enter topic → generate with progress | same as above | same as above | same as above | same as above | same `paperType:'review'` | same as above | same endpoints | partial | Same gaps as academic paper | Same as above | yes | yes | P0 | Review structure with all required sections |
| Formal template Beta | Select DOCX template → analyze fields → confirm → generate → commit OOXML | `src/modules/formal/components/FormalTemplatePanel.tsx` | `src/modules/formal/contexts/FormalTemplateSessionContext.tsx` | `formalTemplate:analyze`, `formalTemplate:confirmFields`, `formalTemplate:preview`, `formalTemplate:commit` | `formalTemplateTaskService.ts` | `formalTemplateTaskService.ts` + `fieldExtractionService.ts` + `regionGenerationService.ts` + `documentEngineService.ts` | `src/features/document/components/AICommandBox.tsx` | **MISSING** | placeholder | Web shows "(完整模板 Shell 接入中)" — no actual pipeline | Port simplified field-extract + LLM fill to server; add `/api/document/formal-template/analyze` + `/generate`; accept partial fidelity (no OOXML shell preserve) | yes | yes | **P0** | Shows field UI; generates filled document; can download DOCX |
| Word import | File picker → import → edit | `src/modules/writing/components/WordLikeDocumentEditor.tsx` | `src/modules/writing/services/documentEditSkills.ts` | `documentEngine:readOoxmlPackage`, file dialog | `documentEngineService.ts` | `documentEngineService.ts` | `src/features/document/` | `POST /api/document/import-docx` | partial | OOXML high-fidelity read not on web; only text extract | Implement `docxExtractService.ts` as fallback; accept format loss | no | no | P1 | Upload DOCX; content appears in editor |
| Word export | Generate/edit → Download DOCX | `src/features/document/components/WordLikeDocumentEditor.tsx` | `src/features/document/services/docxWebGeneration.ts` | N/A | N/A | N/A | `src/features/document/services/docxWebGeneration.ts` | client-side `html-docx-js` | partial | Format quality lower than Electron journal format; formulas not rendered | Add server-side DOCX generation using `docx` library for better quality | no | yes | P1 | DOCX downloadable; contains correct content |
| PDF export | Generate/edit → Download PDF | same as Word export | N/A | `ai:exportPdf` | `pdfExporter.ts` | `pdfExporter.ts` | `src/features/document/` | `POST /api/document/export-pdf` | partial | Formula rendering; image inline handling | Use puppeteer on server for PDF; accept formula gap | no | yes | P2 | PDF downloadable |
| Knowledge-based writing | Select KB → enter prompt → generate with KB context | `src/features/document/components/AICommandBox.tsx` | N/A | `knowledge:search` | `knowledgeService.ts` | `knowledgeRetrievalService.ts` | `src/features/document/` | `POST /api/document/generate` with `knowledgeIds` | partial | `remoteKnowledgeClient.ts` must be reachable; no local RAG | Ensure remote knowledge service is configured; add fallback empty context | no | no | P1 | Document includes content from selected KB |

---

## B. PPT Module

| feature | electron_user_flow | electron_entry_file | electron_renderer_service | electron_api_method | electron_main_handler | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Generate PPT from prompt | Enter topic → select template → generate PPTX | `src/features/ppt/components/PptWorkbenchPanel.tsx` | `src/features/ppt/services/pptWebGeneration.ts` | `deck:buildFromPrompt` | `deckBuilderService.ts` | `deckBuilderService.ts` + `retemplateEngine.ts` | `src/features/ppt/components/PptWorkbenchPanel.tsx` | `POST /api/ppt/generate` | partial | Flat PPTX without brand templates or slot binding | Migrate RetemplateEngine client-side logic to server-compatible format; or expose `/api/ppt/retemplate` | yes | yes | P0 | PPTX downloads; slides have content |
| DeckDocument + RetemplateEngine | Have DeckDocument → switch template → zero-token PPTX | `src/modules/generation/ppt/` | `pptWebGeneration.ts` | `deck:render` | N/A | `retemplateEngine.ts` | `src/modules/generation/ppt/` | None on server | partial | Client-side code exists but server doesn't use DeckDocument/retemplate | Move template assets to server-accessible location; add `/api/ppt/retemplate` accepting DeckDocument JSON | yes | yes | P1 | Same DeckDocument retemplate with different brand = PPTX with new look |
| PPT from manuscript | Generate/edit document → "转PPT" → structured PPTX | N/A | N/A | `deck:buildFromManuscript` | `deckBuilderService.ts` | `manuscriptToPptService.ts` | Not implemented | Not implemented | missing | Not implemented on web | Add server service that summarizes manuscript → slide plan → PPTX | yes | yes | P1 | Manuscript → PPTX with correct sections |
| PPT Import | File picker → import PPTX → DeckDocument | N/A | `pptxImportService.ts` client | `pptx:importFromDialog` | `pptxImportService.ts` | `pptxImportService.ts` | Not implemented | Not implemented | missing | Not implemented | Add file upload endpoint + PPTX→DeckDocument extraction | no | no | P2 | Uploaded PPTX displayed as DeckDocument |
| PPTX Export | DeckDocument → PPTX | `src/features/ppt/` | N/A | N/A (web) | N/A | N/A | `src/features/ppt/` | `POST /api/ppt/export-pptx` | partial | Same PptxGenJS but no brand styles | Use brand theme from knowledge/config | no | yes | P1 | PPTX downloadable |

---

## C. Email Module

| feature | electron_user_flow | electron_entry_file | electron_renderer_service | electron_api_method | electron_main_handler | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Login / connect inbox | Settings → add email account → test | `src/features/email/` | N/A | N/A | N/A | `emailService.ts` | `src/features/email/` | `POST /api/email/accounts` | full | — | — | no | no | P0 | Account added; inbox fetches |
| Fetch inbox | Open email → inbox list | N/A | N/A | N/A | N/A | `emailService.ts` (ImapFlow) | `src/features/email/` | `GET /api/email/inbox` | full | — | — | no | no | P0 | Inbox renders |
| Read message | Click email → full content | N/A | N/A | N/A | N/A | `emailService.ts` | `src/features/email/` | `GET /api/email/messages/:id` | full | — | — | no | no | P0 | Message body renders |
| Send email | Compose → send | N/A | N/A | N/A | N/A | `emailService.ts` (nodemailer) | `src/features/email/` | `POST /api/email/send` | full | — | — | no | no | P0 | Email sent via SMTP |
| Attachments → workspace | Click attachment → open in editor | N/A | `emailAttachmentOpenService.ts` | `mail:openAttachmentInWorkspace` | `emailAttachmentOpenService.ts` | `emailAttachmentOpenService.ts` | N/A | N/A | partial | Web can download attachment bytes but not open in document editor pipeline | Add `/api/email/messages/:id/attachments/:name/save-to-artifacts` → save to ArtifactStore | no | yes | P1 | Attachment viewable from resource center |
| AI triage unread | "整理未读" → classify by urgency | N/A | `mailTriageClassifier.ts` | N/A (web) | N/A | `autoReplyService.ts` | `src/features/email/` | `/api/email/triage` (stub) | placeholder | Stub; no actual classification | Implement LLM classification service in `server/src/features/email/services/emailTriageService.ts` | no | no | P0 | Unread emails classified into urgency buckets |
| Auto-reply draft | "生成回复" → context-aware draft | N/A | N/A | `email:generateReply` | `autoReplyService.ts` | `autoReplyService.ts` | N/A | Not implemented | missing | Not implemented | Add `POST /api/email/messages/:id/generate-reply` using LLM | no | no | P1 | Draft reply shown; can edit and send |
| Email → document | "转文稿" from email body | N/A | N/A | N/A | N/A | N/A | N/A | Not implemented | missing | Not implemented | Add route using document generator with email body as context | no | yes | P1 | Document created from email body |
| Email → matter | "转事项" from email | N/A | `matterService.ts` | N/A (web) | N/A | N/A | `src/features/email/` | `POST /api/aios/matter/from-email` | partial | Exists but may not be wired in email UI | Wire in email UI; verify output | no | yes | P0 | Matter created from email |

---

## D. Image Module

| feature | electron_entry_file | electron_api_method | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Image generation | `src/features/image/` | `ai:generateImage` | `imageClient.ts` | `src/features/image/` | `POST /api/image/generate` | full | — | — | yes | yes | P1 | Image generated and shown |
| Reference image style | `src/features/image/` | `ai:generateImage` with style | `imageClient.ts` | `src/features/image/` | same | partial | Style params not fully validated | Add style profile validation | no | yes | P2 | Image uses reference style |
| Image Artifact | — | N/A | N/A | `src/features/resource-center/` | ArtifactStore | full | — | — | no | yes | P1 | Image in resource center |

---

## E. Excel / Data Analysis Module

| feature | electron_entry_file | electron_api_method | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XLSX/CSV upload + analyze | `src/features/data-analysis/` | `excel:analysisRun` | `excelAnalysisService.ts` | `src/features/data-analysis/` | `POST /api/data-analysis/analyze` | partial | Python execution not confirmed on server | Verify Python available on server; implement subprocess execution | yes | yes | P1 | Upload XLSX; get chart + analysis text |
| Python analysis | N/A | `excel:checkEnvStatus` | `excelAnalysisService.ts` | N/A | N/A | unsupported | Web server may not have Python; server-side code gen only | Detect Python at startup; expose env check endpoint | no | no | P1 | If Python available: analysis runs |
| Chart generation | N/A | `excel:analysisProgress` | `plotAgentService.ts` | `src/features/data-analysis/` | included in analyze | partial | Chart PNG depends on Python matplotlib | Same as above | yes | yes | P1 | Chart PNG artifact downloadable |

---

## F. Knowledge Base Module

| feature | electron_entry_file | electron_api_method | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Document import | `src/features/knowledge/` | `knowledge:importDocument` | `knowledgeService.ts` | `src/features/knowledge/` | `POST /api/knowledge/documents` | partial | Text extraction quality | Use `docxExtractService.ts` + `pdfExtractor.ts` | no | no | P0 | Uploaded document appears in KB list |
| RAG / chunk search | `src/features/knowledge/` | `knowledge:search` | `knowledgeRetrievalService.ts` | `src/features/knowledge/` | `POST /api/knowledge/search` | partial | Remote service required; no local vector search | Confirm `remoteKnowledgeClient.ts` target; add local BM25 fallback | no | no | P0 | Search returns relevant chunks |
| Personal library | N/A | `personal-lib:*` | `personalLibraryService.ts` | Not implemented | Not implemented | missing | Not migrated | Implement local file management | no | no | P2 | Files uploadable to personal library |
| Knowledge participation in generation | N/A | part of generate flows | `knowledgeRetrievalService.ts` | `src/features/document/` | included in generate | partial | Knowledge not guaranteed to be used; may silently skip | Add `knowledgeContext` field to diagnostic output | no | no | P1 | Generated doc includes KB reference annotation |

---

## G. Daily Report / Activity Module

| feature | electron_entry_file | electron_api_method | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AI daily report | `src/features/report/` | `activity:generateReport` | `dailyReportGenerator.ts` | `src/features/report/` | `POST /api/report/generate` | placeholder | Stub: lists artifacts/matters, no LLM narrative | Port `dailyReportGenerator.ts` multi-step pipeline to server | yes | yes | P1 | Report has AI-generated narrative + activity list |
| Activity logging | N/A | `activity:takeSnapshot` | `workspaceActivityService.ts` | Not implemented | Not implemented | missing | Not migrated | Define server-side activity log model; call on each API action | no | no | P2 | Activity logged per operation |

---

## H. AIOS / Matter Module

| feature | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|
| Matter CRUD | `src/features/aios/` | `CRUD /api/aios/matters` | full | — | — | no | no | P0 | Matter created/updated/deleted |
| Evidence / DecisionPackage | `src/features/aios/` | `/api/aios/decisions` | full | — | — | no | yes | P0 | Decision package shown in UI |
| AuditTrail | `src/features/aios/` | `/api/aios/audits` | full | — | — | no | no | P0 | Audit entries logged |
| Email → matter | `src/features/email/` | `POST /api/aios/matter/from-email` | partial | UI not wired | Wire email → matter button | no | yes | P0 | Click "转事项" in email UI |
| AI delegation | `src/features/aios/` | `/api/aios/delegation` | partial | Auto-reply risk scoring not complete | Port `autoReplyService.ts` risk scoring | no | no | P1 | Delegation request processed with risk level |

---

## I. Calendar Module

| feature | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|
| Calendar CRUD | `src/features/calendar/` | `CRUD /api/calendar/events` | partial | Basic CRUD exists; no ICS/email detection | — | no | no | P1 | Events created/deleted |
| Email → event | Not implemented | Not implemented | missing | Not migrated | LLM parse email → ISO8601 event | no | no | P1 | Email body → calendar event |
| Matter ↔ event linkage | Not implemented | Not implemented | missing | Not migrated | Add `matterId` field to event; wire in AIOS | no | no | P2 | Matter deadline shown in calendar |

---

## J. Resource Center / Artifact Module

| feature | web_entry_file | web_api | web_status | current_problem | migration_strategy | async_required | artifact_required | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|---|
| Artifact store | `src/features/resource-center/` | `server/src/artifacts/ArtifactStore.ts` | full | — | — | no | yes | P0 | Artifacts listed |
| File listing / preview | `src/features/resource-center/` | `GET /api/resource-center/artifacts` | placeholder | Routes are empty TODO stubs | Implement routes that query ArtifactStore | no | yes | **P0** | Resource center shows all artifacts |
| File download | N/A | `GET /api/resource-center/artifacts/:id/download` | placeholder | Not implemented | Add download endpoint | no | yes | P0 | Artifact downloadable |
| Delete artifact | N/A | `DELETE /api/resource-center/artifacts/:id` | placeholder | Not implemented | Add delete endpoint | no | yes | P1 | Artifact deleted from store |
| Filter by type | N/A | `GET /api/resource-center/artifacts?type=docx` | placeholder | Not implemented | Add type filter param | no | yes | P1 | Filtering works |

---

## K. Skill Store / Skill Center

| feature | electron_main_service | web_entry_file | web_api | web_status | current_problem | migration_strategy | priority | acceptance_test |
|---|---|---|---|---|---|---|---|---|
| Skill browse / install | `skillPlatformService.ts` | `src/features/skill-center/` | `GET /api/skill-center/skills` | partial | No real remote store URL | Configure `SKILL_STORE_URL`; implement install flow | P2 | Skills browsable; installable |
| Skill job execution | `skillPlatformService.ts` | N/A | `POST /api/skill-center/run` | partial | Execution model unclear | Define `SkillJob` entity; run skills as async tasks | P2 | Skill produces artifact |

---

## L. Settings / Account Module

| feature | web_entry_file | web_api | web_status | current_problem | priority | acceptance_test |
|---|---|---|---|---|---|---|
| LLM provider config | `src/features/settings/` | `PUT /api/settings/llm` | full | — | P0 | LLM config saves; generation works |
| Email account config | `src/features/settings/` | `POST /api/email/accounts` | full | — | P0 | Email account persists |
| Role / permission | `src/features/settings/` | `GET /api/auth/me` | partial | No role-based access control on Web | P2 | Admin sees admin view |
