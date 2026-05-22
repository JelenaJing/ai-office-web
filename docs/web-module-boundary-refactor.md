# Web Module Boundary Refactor Plan

> Branch: `feat/web-module-boundaries`
> Base: `feat/web-all-mvp-services`
> Goal: Reorganize scattered Web office features into clear per-capability modules.

---

## Principles

- **No new features. No UI changes. No prompt changes.**
- Old paths kept as re-export stubs — no broken imports.
- Server routes stay thin (validate → call feature service).
- Skills must not depend on React/UI.
- `src/platform/` and `server/src/lib/` are shared infra — not moved.

---

## Target Frontend Structure: `src/features/<module>/`

Each module contains:
```
components/
hooks/         (if applicable)
contexts/      (if applicable)
services/
types/
skills/        (if applicable)
index.ts
```

| Module          | src/features path            |
|-----------------|------------------------------|
| document        | src/features/document/       |
| ppt             | src/features/ppt/            |
| data-analysis   | src/features/data-analysis/  |
| email           | src/features/email/          |
| image           | src/features/image/          |
| calendar        | src/features/calendar/       |
| report          | src/features/report/         |
| resource-center | src/features/resource-center/|
| knowledge       | src/features/knowledge/      |
| settings        | src/features/settings/       |
| skill-center    | src/features/skill-center/   |

---

## Target Server Structure: `server/src/features/<module>/`

Each module contains:
```
routes.ts
services/
skills/        (if applicable)
types.ts
index.ts
```

---

## File Migration Map

### 1. document

**Frontend → `src/features/document/`**

| Source (old path) | Action |
|---|---|
| `src/modules/writing/components/WordLikeDocumentEditor.tsx` | git mv |
| `src/modules/writing/components/A4RichTextEditor.tsx` | git mv |
| `src/modules/writing/components/AICommandBox.tsx` | git mv |
| `src/modules/writing/components/DocumentContextMenu.tsx` | git mv |
| `src/modules/writing/components/EditorPanel.tsx` | git mv |
| `src/modules/writing/components/DocumentEngineHost.tsx` | git mv |
| `src/modules/writing/components/ReadonlyDocumentPreview.tsx` | git mv |
| `src/modules/writing/components/DocumentPreviewPane.tsx` | git mv |
| `src/modules/writing/components/WebDocumentWorkbench.tsx` | git mv |
| `src/modules/writing/components/WebWritingPanel.tsx` | git mv (temporary) |
| `src/modules/writing/hooks/useDocumentPatchActions.ts` | git mv |
| `src/modules/writing/services/documentEditSkills.ts` | git mv |
| `src/modules/writing/services/docxWebGeneration.ts` | git mv |
| `src/modules/writing/services/WritingAssistantService.ts` | git mv |
| `src/modules/writing/services/ContinueWritingService.ts` | git mv |
| `src/modules/writing/services/RewriteService.ts` | git mv |
| `src/modules/writing/services/sectionAwareRemake.ts` | git mv |
| `src/modules/writing/services/importDocumentForRemake.ts` | git mv |
| `src/modules/writing/services/introductionRemakeFlow.ts` | git mv |
| `src/modules/writing/webDocumentTypes.ts` | git mv |
| `src/modules/writing/webDocumentSkillTypes.ts` | git mv |
| `src/modules/writing/webDocumentBuiltInSkills.ts` | git mv |
| `src/modules/writing/webDocumentPatchTypes.ts` | git mv |
| `src/modules/writing/webDocumentSession.ts` | git mv |
| `src/modules/writing/useWebDocumentSkills.ts` | git mv |
| `src/modules/writing/index.ts` | keep as re-export |
| `src/contexts/DocumentContext.tsx` | git mv → features/document/contexts/ |
| `src/contexts/DocumentWorkspaceContext.tsx` | git mv → features/document/contexts/ |
| `src/contexts/EditorSessionContext.tsx` | git mv → features/document/contexts/ |

**Server → `server/src/features/document/`**

| Source (old path) | Action |
|---|---|
| `server/src/modules/document-generation/*` | git mv → features/document/services/ |
| `server/src/skills/document/*` | git mv → features/document/skills/ |
| `server/src/skills/docx/createDocxSkill.ts` | git mv → features/document/skills/ |
| `server/src/skills/docx/exportDocxSkill.ts` | git mv → features/document/skills/ |
| `server/src/skills/docx/documentSessionBuilder.ts` | git mv → features/document/skills/ |

Old paths → re-export stubs.

---

### 2. ppt

**Frontend → `src/features/ppt/`**

| Source | Action |
|---|---|
| `src/modules/generation/components/GenerationWorkbenchPanel.tsx` | git mv |
| `src/modules/generation/components/PptWorkbenchPanel.tsx` | git mv |
| `src/modules/generation/components/GenerationPromptComposer.tsx` | git mv |
| `src/modules/generation/components/ResultPreviewPanel.tsx` | git mv |
| `src/modules/generation/components/PptSkillDrawer.tsx` | git mv |
| `src/modules/generation/components/PptSlideNavigator.tsx` | git mv |
| `src/modules/generation/components/PptSlidePreviewCanvas.tsx` | git mv |
| `src/modules/generation/components/GenerationComposer.tsx` | git mv |
| `src/modules/generation/components/GenerationKnowledgeSidebar.tsx` | git mv |
| `src/modules/generation/components/GenerationModeSwitcher.tsx` | git mv |
| `src/modules/generation/ppt/*` | git mv → features/ppt/ppt/ |
| `src/modules/generation/services/pptWebGeneration.ts` | git mv |
| `src/modules/ppt/components/WebPptGenerationPanel.tsx` | git mv (temporary) |
| `src/modules/generation/index.ts` | keep as re-export |
| `src/contexts/GenerationWorkbenchContext.tsx` | git mv → features/ppt/contexts/ |

**Server → `server/src/features/ppt/`**

| Source | Action |
|---|---|
| `server/src/modules/ppt/*` | git mv → features/ppt/services/ |
| `server/src/skills/ppt/*` | git mv → features/ppt/skills/ |

---

### 3. data-analysis

**Frontend → `src/features/data-analysis/`**

| Source | Action |
|---|---|
| `src/modules/excel-analysis/components/ExcelAnalysisWorkbench.tsx` | git mv |
| `src/modules/excel-analysis/components/WebExcelAnalysisPanel.tsx` | git mv (temporary) |

**Server → `server/src/features/data-analysis/`**

| Source | Action |
|---|---|
| `server/src/modules/excel/*` | git mv → features/data-analysis/services/ |
| `server/src/skills/excel/*` | git mv → features/data-analysis/skills/ |

---

### 4. email

**Frontend → `src/features/email/`**

| Source | Action |
|---|---|
| `src/modules/email/components/*` | git mv |
| `src/modules/email/contexts/EmailContext.tsx` | git mv |
| `src/modules/email/contexts/MailTriageContext.tsx` | git mv |
| `src/modules/email/services/*` | git mv |
| `src/modules/email/utils/*` | git mv |
| `src/communication/CommunicationWorkbench.tsx` | git mv |
| `src/communication/CommunicationContext.tsx` | git mv |
| `src/communication/components/*` | git mv |
| `src/communication/providers/*` | git mv |
| `src/communication/services/*` | git mv |
| `src/communication/types.ts` | git mv |
| `src/communication/types/*` | git mv |
| `src/modules/email/index.ts` | keep as re-export |

**Server → `server/src/features/email/`**

| Source | Action |
|---|---|
| `server/src/modules/email/*` | git mv → features/email/services/ |
| `server/src/routes/email.ts` | keep thin route, delegates to features/email |

---

### 5. image

**Frontend → `src/features/image/`**

| Source | Action |
|---|---|
| `src/modules/image/components/*` | git mv |
| `src/modules/image/services/*` | git mv |
| `src/modules/image/index.ts` | keep as re-export |

**Server → `server/src/features/image/`**

| Source | Action |
|---|---|
| `server/src/modules/image-generation/*` | git mv → features/image/services/ |
| `server/src/skills/image/*` | git mv → features/image/skills/ |

---

### 6. calendar

**Frontend → `src/features/calendar/`**

| Source | Action |
|---|---|
| `src/calendar/*` | git mv |
| `src/modules/calendar/components/*` | git mv |

**Server → `server/src/features/calendar/`**

| Source | Action |
|---|---|
| `server/src/modules/calendar/*` | git mv → features/calendar/services/ |
| `server/src/routes/calendar.ts` | keep thin route |

---

### 7. report

**Frontend → `src/features/report/`**

| Source | Action |
|---|---|
| `src/modules/report/components/WebDailyReportPanel.tsx` | git mv (temporary) |

**Server → `server/src/features/report/`**

| Source | Action |
|---|---|
| `server/src/skills/report/*` | git mv → features/report/skills/ |

---

### 8. resource-center

**Frontend → `src/features/resource-center/`**

| Source | Action |
|---|---|
| `src/pages/ResourceWorkspace.tsx` | keep in pages/, add re-export from features |
| `src/components/resource/*` | git mv |

**Server → `server/src/features/resource-center/`**

| Source | Action |
|---|---|
| `server/src/routes/files.ts` | keep thin route |
| `server/src/routes/artifacts.ts` | keep thin route |
| `server/src/lib/userFiles.ts` | keep in lib/ (shared infra) |
| `server/src/lib/skillArtifact.ts` | keep in lib/ (shared infra) |
| `server/src/lib/workspaceStore.ts` | keep in lib/ (shared infra) |

Note: `server/src/lib/` is shared infrastructure — files that provide low-level services
to multiple modules. Do not move these; instead, `resource-center` feature services
should call lib functions directly.

---

### 9. knowledge

**Frontend → `src/features/knowledge/`**

| Source | Action |
|---|---|
| `src/contexts/KnowledgeContext.tsx` | git mv → features/knowledge/contexts/ |
| `src/contexts/DepartmentContext.tsx` | git mv → features/knowledge/contexts/ |
| `src/components/DepartmentSelector.tsx` | git mv |
| `src/components/resource/RemoteKnowledgePanel.tsx` | git mv |
| `src/modules/knowledge/*` | git mv |
| `src/components/knowledge/*` | git mv |

**Server → `server/src/features/knowledge/`**

| Source | Action |
|---|---|
| `server/src/modules/knowledge/*` | git mv → features/knowledge/services/ |
| `server/src/routes/knowledge.ts` | keep thin route |
| `server/src/routes/departments.ts` | keep thin route |

---

### 10. settings

**Frontend → `src/features/settings/`**

| Source | Action |
|---|---|
| `src/modules/settings/components/WebSettingsPanel.tsx` | git mv |

**Server → `server/src/features/settings/`**

| Source | Action |
|---|---|
| `server/src/modules/settings/*` | git mv → features/settings/services/ |
| `server/src/routes/settings.ts` | keep thin route |

---

### 11. skill-center

**Frontend → `src/features/skill-center/`**

| Source | Action |
|---|---|
| `src/pages/SkillManagementView.tsx` | keep in pages/, add re-export from features |
| `src/components/skill/*` | git mv |

**Server → `server/src/features/skill-center/`**

| Source | Action |
|---|---|
| `server/src/modules/skill-store/*` | git mv → features/skill-center/services/ |
| `server/src/routes/store.ts` | keep thin route |

---

## Temporary Panel Markers (WebXXXPanel)

These panels are legacy adapters from the Electron migration. They remain functional
but should eventually be replaced by the proper module workbenches:

| File | Status |
|---|---|
| `src/features/document/components/WebWritingPanel.tsx` | temporary |
| `src/features/ppt/components/WebPptGenerationPanel.tsx` | temporary |
| `src/features/data-analysis/components/WebExcelAnalysisPanel.tsx` | temporary |
| `src/features/email/components/WebEmailPanel.tsx` | temporary |
| `src/features/image/components/WebImageGenerationPanel.tsx` | temporary |
| `src/features/calendar/components/WebCalendarPanel.tsx` | temporary |
| `src/features/report/components/WebDailyReportPanel.tsx` | temporary |

---

## Files NOT Moving (Preserved In Place)

| Path | Reason |
|---|---|
| `src/platform/` | Shared infra — cross-module |
| `src/components/WorkspaceViewportHost.tsx` | App shell |
| `src/pages/WorkWorkspace.tsx` | Route entry |
| `src/pages/StudyWorkspace.tsx` | Route entry |
| `src/pages/LifeWorkspace.tsx` | Route entry |
| `src/pages/ResourceWorkspace.tsx` | Route entry (re-export added) |
| `src/pages/SkillManagementView.tsx` | Route entry |
| `server/src/lib/*` | Shared infra |
| `server/src/middleware/*` | Shared infra |
| `server/src/modules/ai-gateway/*` | Shared infra |
| `server/src/modules/auth/*` | Auth infra |
| `server/src/modules/quotas/*` | Billing infra |
| `server/src/modules/jobs/*` | Job queue infra |
| `server/src/modules/workspaces/*` | Workspace infra |
| `server/src/modules/audit/*` | Audit log infra |
| `server/src/modules/files/*` | File storage infra |
| `server/src/modules/artifacts/*` | Artifact infra |
| `server/src/modules/skills/*` | Skill registry (shared) |
| `server/src/routes/auth.ts` | Auth route |
| `server/src/routes/workspaces.ts` | Workspace route |
| `server/src/routes/skills.ts` | Skill registry route |

---

## Old Paths: Re-export Compatibility Stubs

All moved files must keep their old path as a compatibility re-export:

```ts
// Old path: src/modules/writing/components/WordLikeDocumentEditor.tsx
export { default } from '../../../features/document/components/WordLikeDocumentEditor'
```

This prevents mass-import breakage across the codebase during incremental migration.

---

## Module Migration Status

| Module | Frontend | Server | Notes |
|---|---|---|---|
| document | ✅ Phase B | ✅ Phase C | Sample module — highest priority |
| ppt | ✅ Phase B | ✅ Phase C | Preserve DeckDocument direction |
| data-analysis | ✅ Phase B | ✅ Phase C | ExcelAnalysisWorkbench is canonical |
| email | ✅ Phase B | ✅ Phase C | Keep CommunicationWorkbench 2-panel |
| image | ✅ Phase B | ✅ Phase C | |
| calendar | ✅ Phase B | ✅ Phase C | |
| report | ✅ Phase B | ✅ Phase C | |
| resource-center | ✅ Phase B | partial | lib/ stays in place |
| knowledge | ✅ Phase B | ✅ Phase C | |
| settings | ✅ Phase B | ✅ Phase C | |
| skill-center | ✅ Phase B | ✅ Phase C | |

---

## Boundary Rules (enforced after refactor)

1. UI components must NOT call `fetch('/api/*')` directly.
2. UI components must NOT call `window.electronAPI` without `isWeb` guard.
3. Web UI calls must go through: `platformApi` → `feature service` → server.
4. Server routes: parameter validation only, delegate to feature service.
5. Server feature services: no React/frontend dependencies.
6. Skills: no UI dependencies.
7. Cross-module imports: `document` may use `knowledge` services; `ppt` must NOT import `document` components.
8. Shared code: `src/platform/`, `src/shared/`, `server/src/lib/`, `server/src/shared/`.

---

## Verification Checks

Run after each phase:

```bash
# Frontend build
npm run build

# Server typecheck
cd server && npx tsc --noEmit && cd ..

# Check for direct API calls in UI
grep -R "fetch('/api" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules || true

# Check for unguarded electronAPI in feature/page/component code
grep -R "window.electronAPI" src/features src/pages src/components --include="*.ts" --include="*.tsx" --exclude-dir=node_modules || true
```

---

## Verification Results

> Updated after each phase

### Phase A
- Directory skeleton created: ✅
- Docs created: ✅

### Phase B
_TBD after Phase B completes._

### Phase C
_TBD after Phase C completes._
