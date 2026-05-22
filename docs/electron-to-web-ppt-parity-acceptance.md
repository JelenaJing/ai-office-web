# Electron to Web PPT Parity Acceptance

## Acceptance checklist

- [ ] Web PPT generation calls `POST /api/ppt/decks/start`.
- [ ] Task status is available at `GET /api/ppt/decks/tasks/:taskId`.
- [ ] Cancellation is available at `POST /api/ppt/decks/tasks/:taskId/cancel`.
- [ ] Completed task result contains `deckId`, `deck`, `artifact`, and `diagnostics`.
- [ ] `deck.diagnostics.chain = "web-deck-document-runtime"`.
- [ ] Generated PPTX artifact type is `presentation`.
- [ ] `POST /api/ppt/decks/:deckId/retemplate` returns `tokenUsed: false`.
- [ ] Retemplate does not call LLM.
- [ ] `diagnostics.partialMissing` lists RetemplateEngine / import / slot binding gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

This phase establishes the Web DeckDocument API contract and makes the existing Web PPT generator consume it. It does not claim full Electron PPT parity.

## Known missing

- External PPT import / parsing.
- Full Electron RetemplateEngine layout matching.
- Server-side slotBinder / layoutMatcher / contentPaginator usage.
- Document-to-PPT bridge connection through `/api/ppt/decks/start`.
