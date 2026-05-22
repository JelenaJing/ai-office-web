# Electron to Web PPT Feature Matrix

| feature | electron source | web target | web api | status | notes |
|---|---|---|---|---|---|
| DeckDocument truth layer | `electron/main/services/deckDocumentService.ts` | `server/src/features/ppt/services/deckRuntime.ts` | `POST /api/ppt/decks/start`, `GET /api/ppt/decks/:deckId` | partial | Web now creates `WebDeckDocument`; persistence is in-memory for this phase. |
| PPTX export | `electron/main/services/pptxGenerator.ts` | `server/src/features/ppt/services/simplePptx.ts` | `GET /api/ppt/decks/:deckId/download` | partial | Uses existing Web PPTX writer and ArtifactStore, not full Electron renderer. |
| Zero-token retemplate | `electron/main/services/ppt/retemplateEngine.ts` | `server/src/features/ppt/routes.ts` | `POST /api/ppt/decks/:deckId/retemplate` | partial | Updates deck template metadata without LLM; full layout matching still missing. |
| Topic to PPT | `deckBuilderService.ts`, `buildDeckFromPrompt.ts` | `runWebPptxCreate` + deck API | `POST /api/ppt/decks/start` | partial | Frontend Web generation now calls deck task API. |
| Document to PPT bridge | `src/bridges/document-to-ppt/*` | unchanged | planned | missing | Not changed in this phase. |
| External PPT import | `pptxImportService.ts` | planned server route | planned | missing | Not changed in this phase. |
| Resource center artifact | skill artifact / workspace file services | `saveSkillArtifact` | artifact export URL | partial | Generated PPTX is saved as `presentation` artifact. |
