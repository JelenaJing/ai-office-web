# Electron to Web Paper Workflow Parity Audit

**Date:** 2024  
**Status:** NFTCORE runtime ported to Web server

---

## 1. Electron NFTCORE Pipeline (Source of Truth)

### Entry point
`electron/main/services/paperGeneratorNFTCORE.ts` → `generatePaperNFTCORE(settings, outputDir, params, onProgress)`

### UI Entry
- `src/modules/paper/services/PaperService.ts` → calls `window.electronAPI.compatSubmitTask` / `compatGetTaskStatus` / `compatGetTaskResult`
- Electron preload bridges renderer IPC calls to `localTaskService.ts` in main process

### Pipeline steps
| Step | Description | Key function |
|------|-------------|-------------|
| 1–3 | OpenAlex reference search | `searchReferencesWithNftcoreStrategy` |
| 4–5 | Dynamic structure planning (LLM JSON) | `buildPaperPlanDynamic` |
| 5.1 | Structure thinking (LLM) | `buildStructureThinkingPrompt` |
| 6–7 | Title + Abstract (LLM) | `buildTitleAbstractPrompt` + `parseTitleAndAbstract` |
| 7.1 | Keywords generation | inline LLM call |
| 8–N | Per-section: thinking + body + inline citations | `buildSectionThinkingPrompt` + `buildSectionContentPrompt` |
| N+1 | Conclusion | `buildConclusionPrompt` |
| N+2 | Reference organisation (incremental pass) | `organizeReferencesStream` |
| N+3 | Full-paper review (optional) | `reviewFullPaper` |
| N+4 | Artifact normalisation | `normalizePaperGenerationResultToDocumentSchema` |

### paperType support
- `'research'` → fixed section skeleton (introduction / related / methodology / results / discussion / conclusion)
- `'review'` → dynamic or fixed review skeleton (search description / trajectory / themes / representative studies / debates / future directions)
- `'thesis_research'` → same as research with extended word targets

### LLM gateway (Electron)
- `completeText(settings, { systemPrompt, userPrompt, temperature, maxTokens })`
- `streamText(settings, { ... }, onChunk)`

### Task model (Electron)
- `localTaskService.ts`: UUID task IDs, status `queued | running | completed | failed`
- IPC channels: `compatSubmitTask`, `compatGetTaskStatus`, `compatGetTaskResult`, `compatGetActiveTasks`

---

## 2. Electron Components Ported to Web Server

| Electron file | Web server port | Notes |
|--------------|-----------------|-------|
| `openAlexClient.ts` | `server/src/features/document/services/openAlexClient.ts` | Removed `fs`/`path`; replaced `completeText(settings, ...)` with `invokeLlmText` |
| `paperStructurePlanner.ts` | `server/src/features/document/services/paperStructurePlanner.ts` | Same; fixed+dynamic section plans |
| `nftcorePromptFactory.ts` | `server/src/features/document/services/nftcorePromptFactory.ts` | Copied as-is; pure prompt builders, no LLM calls |
| `paperGeneratorNFTCORE.ts` | `server/src/features/document/services/paperNFTCORERuntime.ts` | New Web server runtime; same pipeline without image gen / OOXML snapshots |

---

## 3. Web Current Implementation

### `/start` (POST)
- **Full mode** → `runPaperNFTCORE` (NFTCORE pipeline)
- **Partial modes** (outline, abstract, introduction, etc.) → `runPaperWorkflowService` (legacy 2-pass)

### `/tasks/:taskId` (GET)
- Polls in-memory `paperTaskStore`
- Returns `{ status, progress, message, partialMarkdown, result }`

### Frontend
- `paperWorkflowAdapter.ts`: Web path polls `/start` → `/tasks/:taskId` every 1.5s
- `documentWorkflowGenerateRouter.ts`: routes `academic_paper`→research, `literature_review`→review, `formal_template`→error

---

## 4. Gap Table

| Feature | Electron | Web | Priority |
|---------|----------|-----|----------|
| OpenAlex reference search | ✅ Full (with journal categories) | ✅ (without journal filter) | Done |
| Dynamic structure planning | ✅ LLM JSON | ✅ Ported | Done |
| Structure thinking pass | ✅ | ✅ Ported | Done |
| Title + abstract (NFTCORE template) | ✅ | ✅ Ported | Done |
| Per-section thinking + body | ✅ | ✅ Ported | Done |
| Conclusion | ✅ | ✅ Ported | Done |
| Reference list formatting | ✅ | ✅ (static list) | Done |
| Incremental reference pass (organizeReferencesStream) | ✅ | ❌ | P1 |
| Image generation per section | ✅ (optional) | ❌ | P2 |
| Knowledge tree check | ✅ (optional) | ❌ | P2 |
| Full-paper review pass | ✅ (optional) | ❌ | P2 |
| OOXML snapshot | ✅ | ❌ (not needed for Web) | N/A |
| Journal category filter (bundled DB) | ✅ | ❌ | P2 |
| `formal_template` Web link | ❌ | 🚧 Shows "not available" | P1 |
| `thesis_research` type | ✅ | ✅ Accepted | Done |

---

## 5. Diagnostics Chain Values

| Chain value | Meaning |
|-------------|---------|
| `electron-compatible-nftcore` | Web NFTCORE runtime (this implementation) |
| `paper-workflow-web-adapter` | Legacy 2-pass LLM fallback (partial modes) |
| `paper-workflow` | Reserved for future full Electron bridge |
