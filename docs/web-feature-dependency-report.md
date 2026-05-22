# Web Feature Module Dependency Audit

> Branch: `feat/web-module-boundaries`
> Generated: 2026-05-22
> Scope: `src/features/**` import analysis

---

## Summary

| Check | Count | Worst Severity |
|-------|-------|----------------|
| Cross-feature internal imports | 0 | — |
| Imports from old `src/modules/` paths | 20 | P1 |
| `window.electronAPI` without `isWebShim` guard | 12 files | P0 |
| `window.electronAPI` with `isWebShim` guard (OK) | 7 files | OK |
| `fetch('/api')` direct calls in features | 0 | — |
| App shell not importing from feature `index.ts` | Yes | P2 |

---

## P0 — Critical: `window.electronAPI` without `isWebShim` guard

These files call `window.electronAPI` directly in Web-capable paths without a `isWebShim()` branch guard. They will throw or silently fail in Web mode.

### `src/features/document/services/`

| File | Calls | Guard? |
|------|-------|--------|
| `WritingAssistantService.ts` | `window.electronAPI.writingAssistant`, `onAiEvent` | ❌ None |
| `RewriteService.ts` | `window.electronAPI.rewriteParagraph`, `onAiEvent` | ❌ None |
| `ContinueWritingService.ts` | `window.electronAPI.continueWriting`, `onAiEvent` | ❌ None |
| `introductionRemakeFlow.ts` | `window.electronAPI.cancelGenerateIntroductionDraftStream`, `inferIntroductionTopicMeta`, `buildIntroductionAllowlistedPool` | ❌ None |
| `importDocumentForRemake.ts` | `window.electronAPI.getKnowledgeDocument` | ❌ None |

> Note: These services are Electron-only features. They are never called in the current Web paths, but they lack an explicit guard. Risk is low today but will bite if Web expands.

### `src/features/email/services/`

| File | Calls | Guard? |
|------|-------|--------|
| `mailTriageClassifier.ts` | `window.electronAPI!.writingAssistant` | ❌ Optional chain (`?.writingAssistant`) only — not `isWebShim()` |
| `bulkEmailDraftService.ts` | `window.electronAPI.writingAssistant` | ❌ Optional chain only |

### `src/features/email/contexts/`

| File | Calls | Guard? |
|------|-------|--------|
| `MailTriageContext.tsx` | `window.electronAPI.writingAssistant` | ❌ Optional chain (`?.writingAssistant`) only |

> `EmailContext.tsx` uses `isWebShim()` guards — ✅ OK.

### `src/features/knowledge/`

| File | Calls | Guard? |
|------|-------|--------|
| `services/knowledgeWorkspace.ts` | `window.electronAPI.materializeKnowledgeWorkspace` | ❌ None |
| `components/KnowledgeConversationDock.tsx` | `window.electronAPI.getKnowledgeDocument`, `previewKnowledgeTaskContext`, `saveKnowledgeTaskRecord`, `saveManuscript`, `writeDocxFile` | ❌ None |

### `src/features/image/services/`

| File | Calls | Guard? |
|------|-------|--------|
| `sharedImageGeneration.ts` | `window.electronAPI.readImageAsDataUrl` | ❌ None |

> `ImageService.ts` uses `isWebShim()` guard — ✅ OK.
> `ImageWorkspace.tsx` uses direct calls without `isWebShim()` — ❌ (multiple calls).

### `src/features/resource-center/components/`

| File | Calls | Guard? |
|------|-------|--------|
| `WorkspaceFilesPanel.tsx` | `window.electronAPI.openDirectoryDialog?.()` | ❌ Optional chain only |
| `SaveLocationSelector.tsx` | `window.electronAPI.openDirectoryDialog?.()` | ❌ Optional chain only |

---

## P0 — Confirmed OK: `window.electronAPI` with proper `isWebShim` guard

These files import and use `isWebShim()` to branch before calling Electron APIs:

| File | Guard |
|------|-------|
| `document/components/EditorPanel.tsx` | ✅ `isWebShim()` in all Electron branches |
| `ppt/components/GenerationPromptComposer.tsx` | ✅ `isWebShim()` guards |
| `ppt/components/GenerationComposer.tsx` | ✅ `isWebShim()` guards |
| `ppt/components/ResultPreviewPanel.tsx` | ✅ `isWebShim()` guards |
| `data-analysis/components/ExcelAnalysisWorkbench.tsx` | ✅ `const webMode = isWebShim()` |
| `email/contexts/EmailContext.tsx` | ✅ `isWebShim()` guards |
| `image/services/ImageService.ts` | ✅ `if (isWebShim())` branch |

---

## P0 — Confirmed OK: No `fetch('/api')` in features

```
grep -R "fetch('/api" src/features -- none found
```

All API calls in feature code go through `platformApi` (in `src/platform/webPlatformApi.ts`) or feature services. ✅

---

## P1 — Imports from old `src/modules/` paths (stubs, not yet migrated)

These files inside `src/features/` still import from old `src/modules/` re-export stubs. The re-export stubs are valid and the build passes, but they represent modules not yet migrated into the feature boundary.

### `src/features/data-analysis/`

| File | Old import |
|------|-----------|
| `components/ExcelAnalysisWorkbench.tsx` | `../../../modules/plot/services/PlotService` |

### `src/features/document/`

| File | Old import |
|------|-----------|
| `components/EditorPanel.tsx` | `../../../modules/image/services/ImageService` |
| `components/EditorPanel.tsx` | `../../../modules/generation/components/GenerationComposer` |
| `contexts/EditorSessionContext.tsx` | `../../../modules/paper/services/PaperService` |

### `src/features/email/`

| File | Old import |
|------|-----------|
| `contexts/EmailContext.tsx` | `../../../modules/writing/services/WritingAssistantService` |
| `services/AIReplyService.ts` | `../../../modules/writing/services/WritingAssistantService` |

### `src/features/knowledge/`

| File | Old import |
|------|-----------|
| `components/KnowledgeConversationDock.tsx` | `../../../modules/writing/services/WritingAssistantService` |
| `components/KnowledgeConversationDock.tsx` | `../../../modules/generation/components/generationDockPrimitives` |
| `components/KnowledgeConversationDock.tsx` | `../../../modules/generation/components/GenerationPromptComposer` |
| `components/KnowledgeConversationDock.tsx` | `../../../modules/generation/components/generationWorkbenchConfig` |
| `components/KnowledgeConversationDock.tsx` | `../../../modules/plot/components/PlotWorkspace` |
| `components/KnowledgeSelectionDock.tsx` | `../../../modules/formal/contexts/FormalTemplateSessionContext` |

### `src/features/ppt/`

| File | Old import |
|------|-----------|
| `components/GenerationComposer.tsx` | `../../../modules/image/services/ImageService` |
| `components/GenerationComposer.tsx` | `../../../modules/image/services/imageGenerationPrompt` |
| `components/GenerationComposer.tsx` | `../../../modules/image/services/sharedImageGeneration` |
| `components/GenerationComposer.tsx` | `../../../modules/writing/services/sectionAwareRemake` |
| `components/GenerationComposer.tsx` | `../../../modules/writing/services/WritingAssistantService` |
| `components/GenerationComposer.tsx` | `../../../modules/writing/services/docxWebGeneration` |
| `components/GenerationComposer.tsx` | `../../../modules/paper/services/PaperService` |
| `components/GenerationComposer.tsx` | `../../../modules/paper/services/paperStreaming` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/formal/hooks/useFormalTemplateGeneration` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/formal/contexts/FormalTemplateSessionContext` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/image/services/imageGenerationPrompt` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/image/services/sharedImageGeneration` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/image/services/ImageService` |
| `components/GenerationPromptComposer.tsx` | `../../../modules/writing/services/WritingAssistantService` |
| `components/ResultPreviewPanel.tsx` | `../../../modules/formal/hooks/useFormalTemplateGeneration` |
| `components/ResultPreviewPanel.tsx` | `../../../modules/formal/contexts/FormalTemplateSessionContext` |
| `components/ResultPreviewPanel.tsx` | `../../../modules/writing/components/ReadonlyDocumentPreview` |
| `contexts/GenerationWorkbenchContext.tsx` | `../../../modules/image/services/imageGenerationPrompt` |

### `src/features/resource-center/`

| File | Old import |
|------|-----------|
| `components/PersonalFilesPanel.tsx` | `../../../modules/knowledge/components/PersonalLibrarySidebar` |

### Not-yet-migrated modules referenced
The following `src/modules/` subtrees are still referenced by feature code and have **not** been migrated to `src/features/` yet:

| Module | Consumed by features |
|--------|---------------------|
| `modules/image/` | document, ppt, data-analysis, image |
| `modules/writing/services/` | document, ppt, email, knowledge |
| `modules/generation/components/` | document, knowledge |
| `modules/paper/services/` | document, ppt |
| `modules/formal/` | ppt, knowledge |
| `modules/plot/` | data-analysis, knowledge |
| `modules/knowledge/components/` | resource-center |

---

## P1 — Cross-feature internal imports

```
grep -rn "from '.*features/" src/features -- none found
```

No feature imports from another feature's internal files. ✅

---

## P2 — App shell not importing from `src/features/*/index.ts`

`src/components/WorkspaceViewportHost.tsx` is the main viewport switcher. It still imports from old module paths:

| Import in WorkspaceViewportHost | Should become |
|---------------------------------|---------------|
| `../modules/writing/components/DocumentEngineHost` | `../features/document` |
| `../modules/writing/components/WordLikeDocumentEditor` | `../features/document` |
| `../modules/generation/components/GenerationWorkbenchPanel` | `../features/ppt` |
| `../communication/CommunicationWorkbench` | `../features/email` |
| `../modules/excel-analysis/components/ExcelAnalysisWorkbench` | `../features/data-analysis` |
| `../modules/image/components/ImageWorkspace` | `../features/image` |
| `../modules/report/components/WebDailyReportPanel` | `../features/report` |
| `../modules/settings/components/WebSettingsPanel` | `../features/settings` |

`src/pages/CalendarWorkspace.tsx` imports from old `../calendar/` paths (re-export stubs exist, but not yet updated to feature index).

---

## Violation Summary by Feature

| Feature | P0 (no guard) | P1 (old modules) | P2 (app shell) |
|---------|---------------|------------------|----------------|
| document | ⚠️ 5 service files (Electron-only risk) | ✅ 3 refs | ⚠️ Not referenced via index |
| ppt | ✅ All guarded | ⚠️ 18 refs | ⚠️ Not referenced via index |
| data-analysis | ✅ Guarded | ⚠️ 1 ref | ⚠️ Not referenced via index |
| email | ⚠️ 3 files (optional chain only) | ⚠️ 2 refs | ⚠️ Not referenced via index |
| image | ⚠️ 2 files (no guard) | — | — |
| calendar | — | — | — |
| report | — | — | — |
| resource-center | ⚠️ 2 files (optional chain only) | ⚠️ 1 ref | — |
| knowledge | ⚠️ 2 files (no guard) | ⚠️ 6 refs | — |
| settings | — | — | — |
| skill-center | — | — | — |

---

## Recommended Fix Priority

### Immediate (P0)
1. Add `isWebShim()` guard to `email/services/mailTriageClassifier.ts` and `bulkEmailDraftService.ts` — these run on Web today
2. Add `isWebShim()` guard to `email/contexts/MailTriageContext.tsx`
3. Add `isWebShim()` guard to `knowledge/services/knowledgeWorkspace.ts` (called from Web UI)
4. Add `isWebShim()` guard to `image/services/sharedImageGeneration.ts` (used in Web image generation)
5. Add `isWebShim()` guard to `resource-center/components/WorkspaceFilesPanel.tsx` / `SaveLocationSelector.tsx`

### Next sprint (P1 — module migration)
Migrate remaining `src/modules/` subtrees that are heavily consumed by features:
1. `modules/image/services/` → `src/features/image/services/`
2. `modules/writing/services/WritingAssistantService` → `src/features/document/services/`
3. `modules/paper/services/` → decide ownership (ppt vs document)
4. `modules/formal/` → decide ownership (ppt vs new formal module)
5. `modules/plot/` → `src/features/data-analysis/`

### Nice to have (P2)
Update `WorkspaceViewportHost.tsx` and `CalendarWorkspace.tsx` to import from `src/features/*/index.ts` instead of old module paths.

---

## Build & Type-check Status

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Passed |
| `cd server && npx tsc --noEmit` | ✅ Passed |
| `fetch('/api')` in features | ✅ None found |
| Unguarded `window.electronAPI` in features | ⚠️ 12 files (see P0 above) |
