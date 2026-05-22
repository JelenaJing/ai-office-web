# Electron to Web PPT Parity Audit

## Source of truth

- `electron/main/services/deckDocumentService.ts`
- `electron/main/services/ppt/retemplateEngine.ts`
- `electron/main/services/ppt/deckBuilder/deckBuilderService.ts`
- `electron/main/services/pptxGenerator.ts`
- `electron/main/services/ppt/pptxImportService.ts`
- `src/features/ppt/ppt/deckBuilder/*`
- `src/features/ppt/ppt/retemplate/*`
- `ai-office-public-review/electron/main/services/deckDocumentService.ts`
- `ai-office-public-review/electron/main/services/ppt/retemplateEngine.ts`

## Web status

**partial**

This phase introduces a server-side DeckDocument task API so Web PPT generation is no longer only a skill call returning a flat PPTX. It now produces a DeckDocument-shaped content truth layer, renders a PPTX artifact, and exposes a metadata-only retemplate API that does not call the LLM.

## Implemented Web APIs

- `POST /api/ppt/decks/start`
- `GET /api/ppt/decks/tasks/:taskId`
- `POST /api/ppt/decks/tasks/:taskId/cancel`
- `GET /api/ppt/decks/:deckId`
- `POST /api/ppt/decks/:deckId/retemplate`
- `GET /api/ppt/decks/:deckId/download`

## Remaining gaps

- Electron `RetemplateEngine` layout matching is only represented as metadata on Web.
- External PPT import is not yet ported to Web server.
- `slotBinder` / `contentPaginator` are not yet used by server PPTX export.
- Template switch is zero-token, but full visual re-render parity is still partial.

## Migration confidence

Medium. The task contract and DeckDocument boundary are in place, but the Electron rendering engine still needs deeper server-side migration.
