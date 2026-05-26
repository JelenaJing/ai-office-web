# Legacy reference map phase 2

Scope: `ai-office-web` only. `ai-office-public-review` is out of scope and was not modified. Protected surfaces remain untouched: `server/src/routes/email.ts`, `server/src/features/email/**`, `src/features/email/**`, `src/communication/**`, `src/web/pages/HtmlPptPage.tsx`, `server/src/features/artifact-jobs/**`, and `server/src/routes/artifacts.ts`.

This phase maps imports for the second batch of legacy OOXML, old DeckDocument, and old PPTX files before moving anything. Import class meanings:

- **runtime dependency**: loaded by current Web/Electron/server app code.
- **type dependency**: `import type` or declaration-only coupling.
- **test dependency**: smoke/test/manual script only.
- **Electron-only dependency**: used by Electron main/preload or Electron service code, not current Web HTML PPT.
- **dead reference**: docs, comments, `.bak`, public API re-export with no current importer, or package script no longer calling it.

## Reference map

| Legacy file | Importers / references | Import class | Phase 2 action |
| --- | --- | --- | --- |
| `src/features/ppt/components/GenerationComposer.tsx` | Runtime via `src/modules/generation/components/GenerationComposer.tsx`; used by `src/features/document/components/EditorPanel.tsx` and `src/components/EmbeddedOfficeEnginePanel.tsx`; public re-export in `src/features/ppt/index.ts`; docs mention it. | runtime dependency | Retain. Although located under PPT/generation, it still powers current document/editor composer paths. |
| `src/features/ppt/components/GenerationPromptComposer.tsx` | Runtime via `src/modules/generation/components/GenerationPromptComposer.tsx`; used by `src/features/knowledge/components/KnowledgeConversationDock.tsx`; comments in `ResultPreviewPanel`; public re-export in `src/features/ppt/index.ts`; docs mention it. | runtime dependency | Retain. It is still mounted by knowledge/image dock flows. |
| `src/features/ppt/components/ResultPreviewPanel.tsx` | Runtime via `src/features/ppt/components/GenerationWorkbenchPanel.tsx`; compatibility wrapper `src/modules/generation/components/ResultPreviewPanel.tsx`; public re-export in indexes; docs mention it. | runtime dependency, now legacy-lazy for Web workbench | Retain. Web workbench no longer statically imports its parent panel after this phase; desktop/legacy lazy path still needs it. |
| `src/features/ppt/components/PptWorkbenchPanel.tsx` | Runtime from `ResultPreviewPanel.tsx`; compatibility wrapper `src/modules/generation/components/PptWorkbenchPanel.tsx`; docs mention it. | runtime dependency under old generation panel | Retain. Still required by old `ResultPreviewPanel`. |
| `src/features/ppt/services/pptWebGeneration.ts` | Runtime from `GenerationPromptComposer.tsx`, `PptWorkbenchPanel.tsx`, `ResultPreviewPanel.tsx`; compatibility wrapper `src/modules/generation/services/pptWebGeneration.ts`; public re-export in `src/features/ppt/index.ts`; docs mention it. | runtime dependency under old PPT components | Retain. Not used by current `/ppt` HTML PPT page, but still used by old generation components. |
| `src/features/ppt/services/webDeckSlides.ts` | Runtime from `GenerationPromptComposer.tsx`, `PptHomePreviewCard.tsx`, `PptWorkbenchPanel.tsx`, `ResultPreviewPanel.tsx`; docs mention it. | runtime dependency under old PPT components | Retain. Not part of HTML PPT artifact-jobs chain, but still imported by old UI components. |
| `src/features/ppt/ppt/retemplate/slotBinder.ts` | `src/modules/generation/ppt/retemplate/slotBinder.ts` re-export; `electron/main/services/ppt/retemplateEngine.ts` imports through the module wrapper; legacy tests `test-phase1.ts` / `test-phase4.ts`; docs/comments. | Electron-only dependency plus test dependency | Retain source. Moved old test scripts to `scripts/legacy/ppt-deck/`; source still needed by Electron retemplate engine. |
| `electron/main/services/pptxGenerator.ts` | Runtime/Electron from `electron/main/index.ts`, `electron/main/services/ppt/retemplateEngine.ts`, `electron/main/services/pptContentPackageService.ts`; type imports from `src/features/ppt/ppt/retemplate/deckToPptxAdapter.ts` and `src/types/pptContentPackage.ts`; old tests/comments. | Electron-only runtime plus type dependency | Retain. Cannot move until Electron PPT IPC and shared `PptxSlideDefinition` types are decoupled. |
| `electron/main/services/deckDocumentService.ts` | Runtime/Electron from `electron/main/index.ts`, `electron/main/capabilities/capabilityRouter.ts`, `electron/main/services/ppt/deckBuilder/deckBuilderService.ts`, `deckOptimizerService.ts`, `pptxImportService.ts`; capability catalog comments/wrappers; old tests/docs. | Electron-only runtime dependency | Retain. Moving would break Electron capability and deck IPC paths. |
| `electron/main/services/ppt/templateCloneRenderer.ts` | Runtime/Electron from `electron/main/services/ppt/retemplateEngine.ts`; old test script comments. | Electron-only runtime dependency | Retain. It is still the clone-renderer branch for Electron retemplate. |
| `src/engines/documentEngine/**` | Runtime from `src/App.tsx`, `src/features/document/components/EditorPanel.tsx`, `src/components/EmbeddedOfficeEnginePanel.tsx`, `src/components/DocumentFilePanel.tsx`, `src/components/FileExplorer.tsx`, image/knowledge/formal/paper modules; Electron services import `embeddedPaperDocument`; docs mention it. | runtime dependency plus Electron-only dependency plus type dependency | Retain. This is still wired into current document/editor runtime, so direct movement would break Web build and editor behavior. |
| `electron/main/services/documentEngineService.ts` | Runtime/Electron from `electron/main/index.ts`, `documentSchemaDocxBoundary.ts`, `homeworkService.ts`, `workspaceService.ts`; type imports from formal-template services and `src/types/electron.d.ts`; docs/comments. | Electron-only runtime plus type dependency | Retain. Still coupled to Electron IPC and shared declarations. |
| `electron/main/services/generatedOoxmlSnapshot.ts` | Runtime/Electron from `electron/main/services/paperGenerator.ts`, `paperGeneratorNFTCORE.ts`, `paperProjectRunner.ts`; imports `documentEngineService` and `embeddedPaperDocument`. | Electron-only runtime dependency | Retain. Cannot move until Electron paper OOXML snapshot generation is detached. |

## Import edges changed in phase 2

| Edge | Previous state | New state | Reason |
| --- | --- | --- | --- |
| `src/components/WorkspaceViewportHost.tsx` -> `src/modules/generation/components/GenerationWorkbenchPanel.tsx` | Static runtime import for workbench mode | Removed static import; Web workbench renders `HtmlPptPage`; old panel is lazy-loaded only for non-Web runtime | Removes old PPT workbench from Web mainline without hiding any frontend entry. |
| `scripts/smoke/run-web-parity-smoke.ts` -> `scripts/smoke/ppt-smoke.ts` | Dynamic test dependency loaded for `ppt` smoke module | Old `ppt-smoke.ts` moved to `scripts/legacy/smoke/ppt-smoke.ts`; runner falls back to lightweight artifact-list smoke when no current PPT smoke exists | Stops old DeckDocument `/api/ppt/decks/*` smoke from being the main Web parity PPT smoke. |
| root `scripts/test-*.ts` -> old DeckDocument/PPTX internals | Manual test files at root `scripts/` | Moved to `scripts/legacy/ppt-deck/` | Keeps old DeckDocument and template-clone tests for reference only. |

## Files moved to legacy in phase 2

| From | To | Why |
| --- | --- | --- |
| `scripts/smoke/ppt-smoke.ts` | `scripts/legacy/smoke/ppt-smoke.ts` | Old `/api/ppt/decks/*` DeckDocument smoke, not current HTML PPT artifact-jobs chain. |
| `scripts/test-clone-renderer.ts` | `scripts/legacy/ppt-deck/test-clone-renderer.ts` | Manual old template clone renderer test dependency. |
| `scripts/test-deckbuilder.ts` | `scripts/legacy/ppt-deck/test-deckbuilder.ts` | Manual old DeckDocument builder test dependency. |
| `scripts/test-page-type-fit.ts` | `scripts/legacy/ppt-deck/test-page-type-fit.ts` | Manual old DeckDocument page-fit test dependency. |
| `scripts/test-phase1.ts` | `scripts/legacy/ppt-deck/test-phase1.ts` | Manual old DeckDocument retemplate test dependency. |
| `scripts/test-phase4.ts` | `scripts/legacy/ppt-deck/test-phase4.ts` | Manual old DeckDocument retemplate test dependency. |
| `scripts/test-rich-deck-content.ts` | `scripts/legacy/ppt-deck/test-rich-deck-content.ts` | Manual old rich DeckDocument rendering test dependency. |

## Still-retained legacy clusters

These files remain because they have runtime or Electron-only dependencies, not dead/test-only dependencies:

- `src/features/ppt/components/GenerationComposer.tsx`
- `src/features/ppt/components/GenerationPromptComposer.tsx`
- `src/features/ppt/components/ResultPreviewPanel.tsx`
- `src/features/ppt/components/PptWorkbenchPanel.tsx`
- `src/features/ppt/services/pptWebGeneration.ts`
- `src/features/ppt/services/webDeckSlides.ts`
- `src/features/ppt/ppt/retemplate/slotBinder.ts`
- `electron/main/services/pptxGenerator.ts`
- `electron/main/services/deckDocumentService.ts`
- `electron/main/services/ppt/templateCloneRenderer.ts`
- `src/engines/documentEngine/**`
- `electron/main/services/documentEngineService.ts`
- `electron/main/services/generatedOoxmlSnapshot.ts`

## Protected-surface checks

- Email paths: no phase 2 diff.
- Current HTML PPT new chain files: no phase 2 diff.
- `/ppt`: remains backed by `HtmlPptPage`; Web workbench PPT mode now also renders `HtmlPptPage` instead of the old DeckDocument workbench.

