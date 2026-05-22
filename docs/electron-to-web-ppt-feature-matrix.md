# Electron to Web PPT Feature Matrix

| feature | electron source | web target | web api | status | notes |
|---|---|---|---|---|---|
| DeckDocument truth layer | `electron/main/services/deckDocumentService.ts` | `server/src/features/ppt/services/deckRuntime.ts` | `POST /api/ppt/decks/start`, `GET /api/ppt/decks/:deckId` | partial | Web creates `WebDeckDocument` with template manifest, source refs, artifact refs, slide diagnostics; persistence is still in-memory. |
| PPTX export | `electron/main/services/pptxGenerator.ts` | `server/src/features/ppt/services/simplePptx.ts` | `GET /api/ppt/decks/:deckId/download` | partial | Uses Web PPTX writer and ArtifactStore; LLM slide JSON is normalized before PPTX writing to prevent malformed `items` failures. |
| Zero-token retemplate | `electron/main/services/ppt/retemplateEngine.ts` | `server/src/features/ppt/routes.ts` | `POST /api/ppt/decks/:deckId/retemplate` | partial | Returns `tokenUsed: false` and `retemplatePreview`; full Electron layout matching still missing. |
| Topic to PPT | `deckBuilderService.ts`, `buildDeckFromPrompt.ts` | `runWebPptxCreate` + deck API | `POST /api/ppt/decks/start` | partial | E2E smoke covers task completion, deck fetch, PPTX download, and artifact relationship. |
| Matter to PPT | AIOS Matter/workflow services | `/api/ppt/decks/start` source refs | `POST /api/ppt/decks/start` with `source: "matter"`, `matterId` | partial | E2E smoke creates a Matter fixture and verifies PPT task output has artifact relationship. |
| Document to PPT bridge | `src/bridges/document-to-ppt/*` | unchanged bridge public API | `src/bridges/document-to-ppt` | partial | Smoke verifies bridge conversion via core contracts only; direct document/PPT feature imports remain disallowed. |
| External PPT import | `pptxImportService.ts` | planned server route | planned | missing | Not changed in this phase. |
| Resource center artifact | skill artifact / workspace file services | `saveSkillArtifact` | artifact export URL | partial | Generated PPTX is saved as `presentation` artifact and task result includes `relationships.artifactId`. |
