# Electron → Web Migration Plan

> **Status:** Active  
> **Branch:** main  
> **Source of truth:** Electron runtime in `electron/main/services/`  
> **Principle:** Port real Electron service logic to `server/src/features/`; never replace with LLM prompt tricks or placeholder success

---

## P0-1: Formal Template (正式模板 Beta) ← CURRENT

**Electron pipeline (4 stages):**
1. `formalTemplate:analyze` — read DOCX, extract `{{field}}` patterns and `w:sdt` controls, create `TemplateProfile`
2. `formalTemplate:confirmFields` — resolve field values via KB + LLM
3. `formalTemplate:preview` — build region generation plan
4. `formalTemplate:commit` — generate region content, patch OOXML, write output DOCX

**Web implementation strategy (P0 milestone):**  
Full OOXML round-trip requires `documentEngineService.ts` which depends on native Electron I/O.  
Web pragmatic approach:
- Stage 1: Server reads uploaded/preset DOCX via `unzipper`/`jszip`, extracts `{{field}}` and text regions
- Stage 2: LLM resolves each field value (one prompt per field, structured output)
- Stage 3: LLM generates each text region content given field values + region heading
- Stage 4: Assemble sections into HTML + offer DOCX via html-docx-js
- Accept limitation: output is semantically equivalent but not OOXML-shell-preserving

**New server routes:**
- `POST /api/document/formal-template/analyze` — parse template, return FieldSchema[]
- `POST /api/document/formal-template/generate` — fill fields + generate regions → HTML + DOCX

**New server services:**
- `server/src/features/document/services/formalTemplateService.ts`
- `server/src/features/document/services/formalTemplateFieldExtractor.ts`

**Frontend changes:**
- `src/features/document/components/AICommandBox.tsx` — route `formal_template` → template analyzer UI (not blocked)
- `src/features/document/workflows/documentWorkflowRegistry.ts` — update formal_template handler

**Acceptance tests:**
1. Select "正式模板" → template analyzer UI shows; not blocked with error
2. Server extracts fields from preset template → UI shows field list
3. LLM fills each field → filled document shown in editor
4. Download DOCX works
5. `npm run build:web` + `cd server && npm run build` pass

---

## P0-2: Resource Center (资源中心) — Empty stubs

**Problem:** `server/src/features/resource-center/routes.ts` is an empty TODO.  
**Fix:** Wire ArtifactStore into resource center routes.

**New routes:**
- `GET /api/resource-center/artifacts` — list all artifacts (with pagination + type filter)
- `GET /api/resource-center/artifacts/:id/download` — download artifact bytes
- `DELETE /api/resource-center/artifacts/:id` — delete artifact

**Frontend:** `src/features/resource-center/` already has UI; just needs real API calls.

**Acceptance:** Resource center shows documents, images, PPTX from ArtifactStore; download works.

---

## P0-3: Email AI Triage (AI 整理未读) — Stub

**Problem:** `triageUnread()` is a stub; no LLM classification.  
**Fix:** Implement `server/src/features/email/services/emailTriageService.ts` using LLM + simple schema.

**Schema output per email:**
```json
{ "urgency": "high|medium|low", "category": "task|info|meeting|reply-needed|spam", "summary": "..." }
```

**Route:** `POST /api/email/triage` — accepts `{ accountId, limit }`, returns classified emails.

**Acceptance:** Click "整理未读" → emails labeled with urgency + category.

---

## P0-4: Paper workflow incremental reference pass

**Problem:** Web NFTCORE runtime skips `organizeReferencesStream` and knowledge tree check.  
**Fix:** Add reference organization stage to `paperNFTCORERuntime.ts`; verify completeness.

**Acceptance:** Generated paper has properly formatted references section with citations.

---

## P1-1: PPT RetemplateEngine on server

**Problem:** Server generates flat PPTX; Electron uses RetemplateEngine + DeckDocument for brand templates.  
**Strategy:** Move template asset registry to `server/src/features/ppt/services/`; implement `DeckDocument + SlotBinder` server-side using existing client-side code from `src/modules/generation/ppt/`.

**New route:** `POST /api/ppt/retemplate` — accepts DeckDocument JSON + templateId → PPTX bytes.

**Acceptance:** Generated PPTX uses selected brand theme; slide structure matches DeckDocument.

---

## P1-2: Essay multi-step generation

**Problem:** Web uses single-pass LLM; Electron `essayTaskService.ts` does: topic analysis → outline → section-by-section.  
**Fix:** Port multi-step logic to `server/src/features/document/services/essayWorkflowService.ts`.  
**Make it async:** `POST /api/document/essay/start` + `GET /tasks/:id`.

**Acceptance:** General document shows section-by-section generation with progress.

---

## P1-3: Email auto-reply draft

**New route:** `POST /api/email/messages/:id/generate-reply`  
**Input:** `{ tone?: 'formal'|'casual', context?: string }`  
**Output:** `{ draft: string }`  

**Acceptance:** Draft reply shows in compose window with one click.

---

## P1-4: Daily Report AI generation

**Problem:** `dailyReportSkill.ts` lists artifacts/matters without LLM narrative.  
**Fix:** Port multi-step `dailyReportGenerator.ts`: gather activity → LLM summarize → compose report.

**Acceptance:** Daily report has AI-generated narrative + structured activity breakdown.

---

## P1-5: Knowledge RAG (local fallback)

**Problem:** `remoteKnowledgeClient.ts` requires external service; no local fallback.  
**Fix:** Add BM25 text search fallback using in-memory index over imported documents.

**Acceptance:** KB search returns results even when remote service is offline.

---

## P2-1: PPT import (PPTX → DeckDocument)

**New route:** `POST /api/ppt/import` — accept PPTX upload, return DeckDocument JSON.

---

## P2-2: Personal library

**New routes:** `CRUD /api/knowledge/personal-library`

---

## P2-3: OOXML high-fidelity roundtrip

**Blocked:** Requires porting `documentEngineService.ts` (depends on complex OOXML DOM manipulation).  
**Timeline:** After P0-1 simplified formal template succeeds; evaluate real OOXML library (e.g., `docx4js`, `officegen`, or custom `jszip+xml` parser).

---

## P2-4: Skill Store remote registry

**Blocked:** Requires `SKILL_STORE_URL` to be set; implement install/uninstall lifecycle.

---

## Non-Goals (Web Unsupported)

- Python environment auto-install (`excel:rebuildEnv`) — Web server must have Python pre-installed
- Local file system browsing (file picker dialogs) — replaced by HTTP upload
- Native OS notifications
- Local DOCX shell preservation (OOXML block-level patching) — accept format-loss for P0

---

## Execution Order Summary

| Order | ID | Description | Status |
|-------|----|-------------|--------|
| 1 | P0-1 | Formal template Web pipeline | **IN PROGRESS** |
| 2 | P0-2 | Resource center routes | pending |
| 3 | P0-3 | Email AI triage | pending |
| 4 | P0-4 | Paper incremental references | pending |
| 5 | P1-1 | PPT RetemplateEngine on server | pending |
| 6 | P1-2 | Essay multi-step generation | pending |
| 7 | P1-3 | Email auto-reply draft | pending |
| 8 | P1-4 | Daily report AI generation | pending |
| 9 | P1-5 | Knowledge RAG fallback | pending |
| 10 | P2-1 | PPT import | pending |
| 11 | P2-2 | Personal library | pending |
| 12 | P2-3 | OOXML high-fidelity | blocked |
| 13 | P2-4 | Skill Store registry | blocked |
