# Legacy PPT removal plan

Scope: `ai-office-web` only. This plan does not cover OOXML cleanup and does not modify `ai-office-public-review`.

Protected surfaces:

- Email: `server/src/routes/email.ts`, `server/src/features/email/**`, `src/features/email/**`, `src/communication/**`
- Current HTML PPT new chain: `src/web/pages/HtmlPptPage.tsx`, `server/src/features/artifact-jobs/**`, `server/src/routes/artifacts.ts`

Goal: remove old DeckDocument / old PPTX / old generation-workbench references from the Web mainline without removing frontend entries.

## Import map and classification

| Legacy PPT file | Importers | Import type | Action |
| --- | --- | --- | --- |
| `src/features/ppt/components/GenerationComposer.tsx` | `src/modules/generation/components/GenerationComposer.tsx`; runtime callers `src/features/document/components/EditorPanel.tsx`, `src/components/EmbeddedOfficeEnginePanel.tsx`; dead public export in `src/features/ppt/index.ts`; docs | Web runtime | Retain. It is mislocated under `features/ppt`, but currently serves document/editor generation, not only PPT. Moving requires a separate document-composer extraction. |
| `src/features/ppt/components/GenerationPromptComposer.tsx` | `src/modules/generation/components/GenerationPromptComposer.tsx`; `src/features/knowledge/components/KnowledgeConversationDock.tsx`; old comments/exports/docs | Web runtime, now legacy lazy-load from knowledge dock | Retain source. Removed static import in `KnowledgeConversationDock`; component now loads through `React.lazy`. |
| `src/features/ppt/components/ResultPreviewPanel.tsx` | `src/features/ppt/components/GenerationWorkbenchPanel.tsx`; old public exports/wrappers/docs | legacy | Retain source for lazy-loaded legacy workbench. Its unused compatibility wrapper moved to `src/legacy`. |
| `src/features/ppt/components/PptWorkbenchPanel.tsx` | `ResultPreviewPanel.tsx`; old public export/docs | legacy | Retain source because `ResultPreviewPanel` still composes it. Its unused compatibility wrapper moved to `src/legacy`. |
| `src/features/ppt/services/pptWebGeneration.ts` | old components `GenerationPromptComposer.tsx`, `PptWorkbenchPanel.tsx`, `ResultPreviewPanel.tsx`; old public export/docs | legacy | Retain source for old components. Unused `src/modules/generation/services/pptWebGeneration.ts` compatibility wrapper moved to `src/legacy`. |
| `src/features/ppt/services/webDeckSlides.ts` | old components `GenerationPromptComposer.tsx`, `PptHomePreviewCard.tsx`, `PptWorkbenchPanel.tsx`, `ResultPreviewPanel.tsx` | legacy | Retain source for old components. Not part of current HTML PPT chain. |
| `src/features/ppt/ppt/retemplate/slotBinder.ts` | `electron/main/services/ppt/retemplateEngine.ts` now imports it directly; legacy wrapper in `src/modules/generation/ppt/retemplate/slotBinder.ts` moved to `src/legacy`; old legacy tests/docs | Electron-only plus legacy | Retain source. Removed active import through `src/modules/generation/ppt/**`. |
| `src/modules/generation/**` | Active Web runtime wrappers: `GenerationComposer.tsx`, `GenerationPromptComposer.tsx`, `GenerationWorkbenchPanel.tsx`, `GenerationKnowledgeSidebar.tsx`, primitives/config/utils used by document/knowledge/workbench; dead/legacy wrappers listed below | mixed: Web runtime, legacy, dead | Moved dead and legacy-only wrappers to `src/legacy/modules/generation/**`; retained wrappers still imported by current app code. |
| `electron/main/services/pptxGenerator.ts` | `electron/main/index.ts`, `electron/main/services/ppt/retemplateEngine.ts`, `electron/main/services/pptContentPackageService.ts`; type-only references from `src/features/ppt/ppt/retemplate/deckToPptxAdapter.ts`, `src/types/pptContentPackage.ts` | Electron-only, type-only | Retain. Moving requires decoupling Electron PPT IPC and extracting shared `PptxSlideDefinition` types. |
| `electron/main/services/deckDocumentService.ts` | `electron/main/index.ts`, `electron/main/capabilities/capabilityRouter.ts`, `electron/main/services/ppt/deckBuilder/deckBuilderService.ts`, `deckOptimizerService.ts`, `pptxImportService.ts`; capability catalog docs | Electron-only | Retain. Moving requires a broader Electron PPT capability migration. |
| `electron/main/services/ppt/templateCloneRenderer.ts` | `electron/main/services/ppt/retemplateEngine.ts` | Electron-only | Retain. It remains the Electron retemplate clone-renderer implementation. |

## References removed or redirected in this phase

| Previous reference | New reference | Why |
| --- | --- | --- |
| `src/features/knowledge/components/KnowledgeConversationDock.tsx` static import of `../../../modules/generation/components/GenerationPromptComposer` | `React.lazy(() => import('../../../modules/generation/components/GenerationPromptComposer'))` | Keeps current behavior while removing a Web runtime static edge to the old PPT prompt composer. |
| `electron/main/services/ppt/deckBuilder/deckBuilderService.ts` imports from `src/modules/generation/ppt/deckBuilder/**` | imports from `src/features/ppt/ppt/deckBuilder/**` | Removes active Electron dependency on old compatibility wrapper path. |
| `electron/main/services/ppt/deckOptimizerService.ts` import from `src/modules/generation/ppt/deckBuilder/buildDeckFromPrompt` | import from `src/features/ppt/ppt/deckBuilder/buildDeckFromPrompt` | Removes active Electron dependency on old compatibility wrapper path. |
| `electron/main/services/ppt/retemplateEngine.ts` imports from `src/modules/generation/ppt/retemplate/**` | imports from `src/features/ppt/ppt/retemplate/**` | Removes active Electron dependency on old compatibility wrapper path. |
| `scripts/test-prompt-provenance.ts` root legacy test | `scripts/legacy/ppt-deck/test-prompt-provenance.ts` | Old DeckDocument prompt provenance test retained as legacy only. |

## Files moved to legacy in this phase

| From | To | Reason |
| --- | --- | --- |
| `src/modules/generation/components/PptWorkbenchPanel.tsx` | `src/legacy/modules/generation/components/PptWorkbenchPanel.tsx` | Dead compatibility wrapper. |
| `src/modules/generation/components/ResultPreviewPanel.tsx` | `src/legacy/modules/generation/components/ResultPreviewPanel.tsx` | Dead compatibility wrapper. |
| `src/modules/generation/services/pptWebGeneration.ts` | `src/legacy/modules/generation/services/pptWebGeneration.ts` | Dead compatibility wrapper. |
| `src/modules/generation/index.ts` | `src/legacy/modules/generation/index.ts` | Dead public compatibility barrel; active code imports concrete wrappers/config directly. |
| `src/modules/generation/ppt/assembleDeckDocument.ts` | `src/legacy/modules/generation/ppt/assembleDeckDocument.ts` | Legacy compatibility wrapper. |
| `src/modules/generation/ppt/validateDeckDocumentOutput.ts` | `src/legacy/modules/generation/ppt/validateDeckDocumentOutput.ts` | Legacy compatibility wrapper. |
| `src/modules/generation/ppt/deckBuilder/**` | `src/legacy/modules/generation/ppt/deckBuilder/**` | Legacy compatibility wrappers after Electron imports were redirected to `src/features/ppt/ppt/**`. |
| `src/modules/generation/ppt/retemplate/**` | `src/legacy/modules/generation/ppt/retemplate/**` | Legacy compatibility wrappers after Electron imports were redirected to `src/features/ppt/ppt/**`. |
| `scripts/test-prompt-provenance.ts` | `scripts/legacy/ppt-deck/test-prompt-provenance.ts` | Legacy DeckDocument test. |

## Still retained

Retained because they still have Web runtime, Electron-only, or type-only dependencies:

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

## Next safe cuts

1. Extract document/editor generation behavior out of `src/features/ppt/components/GenerationComposer.tsx` into a document-owned composer, then move the PPT-specific remainder to legacy.
2. Replace `KnowledgeConversationDock`'s legacy `GenerationPromptComposer` usage for image/PPT with feature-owned image and HTML PPT entry points.
3. Decouple `PptxSlideDefinition` from `electron/main/services/pptxGenerator.ts` into a shared type before moving Electron PPTX generation to `electron/legacy`.
4. Retire or isolate `electron/main/services/deckDocumentService.ts` and `templateCloneRenderer.ts` after Electron PPT IPC/capability callers are removed.

