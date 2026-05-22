# Electron to Web PPT Parity Acceptance

## Acceptance checklist

- [x] Web PPT generation calls `POST /api/ppt/decks/start`.
- [x] Task status is available at `GET /api/ppt/decks/tasks/:taskId`.
- [ ] Cancellation is available at `POST /api/ppt/decks/tasks/:taskId/cancel`.
- [x] Completed task result contains `deckId`, `deck`, `artifact`, and `diagnostics`.
- [x] `deck.diagnostics.chain = "web-deck-document-runtime"`.
- [x] Generated PPTX artifact type is `presentation`.
- [x] `POST /api/ppt/decks/:deckId/retemplate` returns `tokenUsed: false`.
- [x] Retemplate does not call LLM.
- [x] `diagnostics.partialMissing` lists RetemplateEngine / import gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts ppt` passes.

## Current status

**partial**

The Deep E2E phase runs topic → DeckDocument → PPTX download, zero-token retemplate preview, Matter → PPT input, and the document-to-PPT bridge conversion. It does not claim full Electron PPT parity.

## Deep E2E coverage

- Topic generation starts an async task, polls completion, returns `deckId`, `deck`, `artifact`, and `relationships`.
- `GET /api/ppt/decks/:deckId` returns slides with slot binding, heuristic layout matching, content-fit diagnostics, and template manifest inventory.
- `GET /api/ppt/decks/:deckId/download` returns the generated PPTX Artifact/file.
- Retemplate returns `tokenUsed: false`, `retemplatePreview`, and manifest/preview diagnostics without an LLM step.
- Matter input is accepted through `source: "matter"` and `matterId`, and task output carries source relationship metadata.
- `src/bridges/document-to-ppt` converts a document outline to deck input without importing document or PPT feature internals.

## Known missing

- External PPT import / parsing.
- Full Electron RetemplateEngine layout matching.
- Full Electron slotBinder / layoutMatcher / contentPaginator fidelity; Web currently exposes server-bound slots, heuristic layout matching, and slide-level content-fit diagnostics.
- Durable DeckDocument persistence beyond the current task/store lifetime.
