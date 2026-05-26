# Legacy architecture removal audit

Scope: `ai-office-web` only. `ai-office-public-review` was not inspected or modified. Search keywords: `OOXML`, `ooxml`, `DocumentEngine`, `documentEngine`, `generatedOoxmlSnapshot`, `canonical`, `CanonicalDocument`, `PageSpec`, `document-schema`, `deckDocument`, `DeckDocument`, `DeckSlide`, `deck.json`, `templateCloneRenderer`, `slotBinder`, `pptxGenerator`, `webDeckSlides`, `pptWebGeneration`, `GenerationWorkbench`, `GenerationPromptComposer`, `GenerationComposer`, `ResultPreviewPanel`, `PptWorkbenchPanel`, `templateClone`, `DeckRenderer`.

Current Web PPT mainline is `src/web/pages/HtmlPptPage.tsx` + `server/src/features/artifact-jobs/**` + `server/src/routes/artifacts.ts`. This audit treats old `DeckDocument` / PPTX / Slidev bridge code as legacy unless it is still required by current non-PPT Web document or knowledge surfaces.

## Audit table

| Hit file path(s) | Legacy category | Current Web mainline reference? | Email reference? | HTML PPT new-chain reference? | Can delete now? | Move to legacy first? | Must retain? | Deletion risk | Suggested action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `package.json` | old smoke/test only | No runtime reference | No | No | Yes for old script entries | No code move needed | Keep file | Low | Removed old OOXML/canonical/document-schema/manuscript/old PPTX smoke scripts from main scripts; recorded them in `docs/legacy-scripts.md`. |
| `build/run-ooxml-*`, `build/run-canonical-*`, `build/run-document-schema-docx-*`, `build/run-document-json-*`, `build/run-ppt-generation-ui-smoke.ts`, `build/run-document-preview-ppt-bridge-smoke.ts`, `build/run-paper-*`, `build/run-manuscript-*`, `build/run-template-document-rewrite-commit-smoke.ts`, `build/run-word-bibliography-smoke.ts` | old smoke/test only | No | No | No | Already absent in this checkout | No | No | Low | Main package scripts no longer point at these old smoke files. |
| `docs/legacy-scripts.md` | old smoke/test only | Documentation only | No | No | No | No | Yes | Low | Added as the historical script record after removing package scripts. |
| `src/legacy/README.md` | old PPTX renderer / old Document Engine reference | No | No | No | No | Already legacy | Yes | Low | Added legacy README with “Legacy OOXML/document engine retained for reference only. Not part of Web MVP.” |
| `src/legacy/skills/builtins/presentationGenerateLegacySkill.ts` | old PPTX renderer | No | No | No | Later, after legacy reference window closes | Already moved | No runtime retention required | Low | Moved from `src/skills/builtins/presentationGenerateLegacySkill.ts`; removed registration/default alias from `src/skills/registerBuiltins.ts`. |
| `src/skills/registerBuiltins.ts` | old PPTX renderer registration | Yes, skill registry boot | No | No | No | No | Yes | Medium | Removed only `presentation.generate.legacy`; retained other built-ins so frontend entries and non-PPT skills stay unchanged. |
| `src/engines/documentEngine/**` (`contracts.ts`, `embeddedOfficeAdapter.ts`, `embeddedPaperDocument.ts`, `hostCommands.tsx`, `legacyTiptapAdapter.ts`, `registry.ts`, `runtime.tsx`, `tiptapSelectionQuery.ts`, `types.ts`) | old Document Engine / OOXML bridge | Yes: `src/App.tsx`, `src/features/document/components/EditorPanel.tsx`, `src/components/EmbeddedOfficeEnginePanel.tsx`, `src/components/DocumentFilePanel.tsx`, `src/components/FileExplorer.tsx`, image/document/knowledge surfaces | No direct email import | No | No | Yes, but only after Web document editor is decoupled | Yes | High | Retain for now. Moving would break current document editor/runtime providers and typecheck. |
| `electron/main/services/documentEngineService.ts`, `electron/main/services/generatedOoxmlSnapshot.ts`, `electron/main/services/workspaceService.ts`, `electron/main/services/homeworkService.ts`, `electron/main/services/documentSchemaDocxBoundary.ts`, `electron/main/services/formalTemplate/**`, `electron/main/services/paperGenerator*.ts`, `electron/main/services/paperProjectRunner.ts`, `electron/main/services/localTaskService.ts` | OOXML / old Document Engine / old Electron-only | Not used by current Web Vite runtime, but included by root `tsconfig` and Electron build | No | No | No | Yes, after Electron IPC callers are removed or moved together | Yes | High | Retain this round. They still import each other and are referenced by `electron/main/index.ts` and shared types. |
| `src/types/electron.d.ts` | OOXML / old Electron bridge | Yes, root type surface | No | No | No | No | Yes | High | Retain because it types existing Electron API shims. |
| `src/types/deckDocument.ts`, `src/types/pptBindingPlan.ts`, `src/types/pptTemplateManifest.ts`, `src/types/pptContentPackage.ts`, `src/core/contracts/ppt.ts` | old DeckDocument / old PPTX renderer | Indirectly via old PPT feature modules and Electron types | No | No | No | Yes, after caller graph is cut | Yes | Medium | Retain until old PPT feature modules stop importing DeckDocument types. |
| `src/features/ppt/components/GenerationComposer.tsx`, `src/modules/generation/components/GenerationComposer.tsx` | old Document Engine plus mixed generation dock | Yes: `src/features/document/components/EditorPanel.tsx`, `src/components/EmbeddedOfficeEnginePanel.tsx` | No | No | No | Not safely this round | Yes | High | Retain. Despite living under PPT/generation, it is still the document/editor composer. |
| `src/features/ppt/components/GenerationPromptComposer.tsx`, `src/modules/generation/components/GenerationPromptComposer.tsx` | old DeckDocument / old PPTX renderer | Yes: `src/features/knowledge/components/KnowledgeConversationDock.tsx` | No | No | No | Not safely this round | Yes | High | Retain until knowledge dock no longer mounts old prompt composer. |
| `src/features/ppt/components/ResultPreviewPanel.tsx`, `src/modules/generation/components/ResultPreviewPanel.tsx` | old DeckDocument / old PPTX renderer | Yes through `GenerationWorkbenchPanel` and old generation exports | No | No | No | Not safely this round | Yes | High | Retain; still composes `PptWorkbenchPanel` and old preview/download logic. |
| `src/features/ppt/components/PptWorkbenchPanel.tsx`, `src/modules/generation/components/PptWorkbenchPanel.tsx` | old DeckDocument / old PPTX renderer | Not the `/ppt` route, but still referenced by `ResultPreviewPanel` | No | No | No | Yes, after `ResultPreviewPanel` is retired | Yes | Medium | Retain because direct move breaks imports. Current `/ppt` remains HTML PPT and does not mount it. |
| `src/features/ppt/services/pptWebGeneration.ts`, `src/modules/generation/services/pptWebGeneration.ts` | old PPTX renderer / old Web PPT bridge | Referenced by old PPT components | No | No | No | Yes, after component callers are retired | Yes | Medium | Retain; no longer exposed through package smoke scripts. |
| `src/features/ppt/services/webDeckSlides.ts` | old DeckDocument / old Slidev preview bridge | Referenced by old PPT components | No | No | No | Yes, after component callers are retired | Yes | Medium | Retain; not part of current HTML PPT artifact-jobs chain. |
| `src/features/ppt/ppt/**`, `src/modules/generation/ppt/**`, especially `assembleDeckDocument.ts`, `validateDeckDocumentOutput.ts`, `deckBuilder/**`, `retemplate/slotBinder.ts`, `retemplate/deckToPptxAdapter.ts`, `retemplate/contentPaginator.ts`, `retemplate/layoutMatcher.ts` | old DeckDocument / old PPTX renderer | Indirectly through old PPT components and Electron retemplate engine | No | No | No | Yes, but only as a coordinated move | Yes | High | Retain this round; moving `slotBinder` alone breaks Electron retemplate imports and old test scripts. |
| `electron/main/services/pptxGenerator.ts`, `electron/main/services/deckDocumentService.ts`, `electron/main/services/ppt/templateCloneRenderer.ts`, `electron/main/services/ppt/retemplateEngine.ts`, `electron/main/services/ppt/deckBuilder/**`, `electron/main/services/ppt/deckOptimizerService.ts`, `electron/main/services/ppt/pptxImportService.ts`, `electron/main/services/pptContentPackageService.ts`, `electron/main/services/pptTemplateRegistry.ts` | old DeckDocument / old PPTX renderer / old Electron-only | Not current Web `/ppt`, but root `tsconfig`, Electron main, shared `src/types/*`, and scripts still reference them | No | No | No | Yes, after Electron PPT IPC and shared type callers are retired | Yes | High | Retain. Not moved to avoid breaking root typecheck and Electron build. |
| `server/src/features/ppt/**` (`routes.ts`, `types.ts`, `services/deckRuntime.ts`, `services/deckRenderer.ts`, `services/deckTaskStore.ts`, `services/minimaxPptxGeneratorRunner.ts`, `services/slidev*`) | old DeckDocument / old PPTX renderer | Server route may still be mounted by `server/src/index.ts`; not current HTML PPT route | No | No | No | Yes, after `/api/ppt` consumers are audited | Yes | Medium | Retain; do not confuse with current `artifact-jobs` HTML PPT route. |
| `server/src/index.ts` | route wiring | Yes | No | Yes, mounts both current artifact routes and legacy-ish PPT routes | No | No | Yes | High | No change in this round; current HTML PPT route wiring must stay intact. |
| `server/src/routes/artifacts.ts`, `server/src/features/artifact-jobs/**`, `src/web/pages/HtmlPptPage.tsx` | current HTML PPT new chain | Yes | No | Yes | No | No | Yes | Critical | Protected. No modifications except future build-compatible minimum references. |
| `src/App.tsx`, `src/web/WebApp.tsx`, `src/pages/WorkWorkspace.tsx`, `src/components/nav/PrimaryNav.tsx`, `src/services/htmlPptWorkbenchState.ts`, `src/services/openResourceIntent.ts`, `src/services/pendingResourceOpen.ts` | current Web entry / HTML PPT routing | Yes | No | Yes | No | No | Yes | Critical | Protected entry behavior. No visibility changes. |
| `src/features/email/components/CommunicationWorkbench.tsx` | protected email surface, contains old PPTX import wording/API references | Yes, email entry | Yes | No | No | No | Yes | Critical | Do not edit this round. Email-related files must remain 0 diff. |
| `server/src/routes/email.ts`, `server/src/features/email/**`, `src/features/email/**`, `src/communication/**` | protected email surface | Yes | Yes | No | No | No | Yes | Critical | Protected. No modifications. |
| `src/features/document/**`, `src/document/**`, `server/src/features/document/**`, `server/src/features/document/skills/minimax-docx/**`, `public/html-docx.js` | Canonical Document / document-schema / OOXML-adjacent document stack | Yes for current document workflows | No direct email dependency | No | No | Only after document Web replacement is complete | Yes | High | Retain. These are mixed with current document editor/export capabilities and cannot be blanket-moved without product impact. |
| `src/types/knowledgeCanonical.ts`, `src/shared/knowledge/knowledgeDocumentJson.ts`, `src/types/knowledgeDocumentJson.ts`, `electron/main/services/knowledgeCanonicalImport.ts`, `electron/main/services/knowledgeJsonImport.ts` | Canonical Document / knowledge document JSON | Yes for knowledge/document compatibility | No | No | No | Later, after knowledge document model cleanup | Yes | Medium | Retain. |
| `docs/**`, `agent-docs/**`, `tests/e2e/**`, `scripts/test-*.ts`, `scripts/smoke/ppt-smoke.ts` hit files | old smoke/test only or historical docs | No runtime reference | No | Some docs mention HTML PPT | No need | Optional archival later | Yes as records/tests | Low | Leave untouched except new audit docs. |
| `excel-and-relay/src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx`, `src/features/data-analysis/components/ExcelAnalysisWorkbench.tsx`, `src/features/image/components/ImageWorkspace.tsx`, `src/modules/plot/components/PlotWorkspace.tsx` | incidental keyword hits / current feature modules | Yes | No | No | No | No | Yes | Medium | Retain to preserve all frontend entries. |

## Current action decisions

1. Removed old package smoke scripts for OOXML, canonical document, document-schema DOCX, document JSON, manuscript, old paper smoke, and old PPTX/DeckDocument UI/bridge tests.
2. Moved the unused `presentation.generate.legacy` Electron `generatePptx` skill wrapper to `src/legacy/skills/builtins/presentationGenerateLegacySkill.ts`.
3. Left all current frontend entries visible and unchanged.
4. Left email files unchanged.
5. Left current HTML PPT new-chain files unchanged.
6. Did not physically delete old source files that are still imported by current Web document/knowledge/editor code, Electron main, server route wiring, or root type declarations.

## Files temporarily retained because they are still referenced

The following high-risk clusters should be moved only in a coordinated follow-up after callers are removed:

- `src/engines/documentEngine/**`
- `electron/main/services/documentEngineService.ts`
- `electron/main/services/generatedOoxmlSnapshot.ts`
- `electron/main/services/pptxGenerator.ts`
- `electron/main/services/deckDocumentService.ts`
- `electron/main/services/ppt/templateCloneRenderer.ts`
- `src/features/ppt/components/GenerationComposer.tsx`
- `src/features/ppt/components/GenerationPromptComposer.tsx`
- `src/features/ppt/components/ResultPreviewPanel.tsx`
- `src/features/ppt/components/PptWorkbenchPanel.tsx`
- `src/features/ppt/services/pptWebGeneration.ts`
- `src/features/ppt/services/webDeckSlides.ts`
- `src/features/ppt/ppt/retemplate/slotBinder.ts`
- `server/src/features/ppt/**`

## Protected-surface conclusion

- Email: protected paths are intentionally untouched.
- HTML PPT new chain: protected paths are intentionally untouched.
- `/ppt`: current route remains `HtmlPptPage`.
- Old DeckDocument and old OOXML/canonical chains no longer have main `package.json` smoke scripts.

