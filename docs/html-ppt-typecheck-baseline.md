# HTML PPT Phase 1 TypeCheck Baseline

**Date:** 2026-05-25  
**Scope:** `npm run typecheck` (root `tsconfig.json`, covers `electron/`, `src/`, server is separate)  
**Total errors:** 97  
**Errors in Phase-1 changed files:** 0

## Changed files (Phase 1 — all clean)

| File | Errors |
|------|--------|
| `server/src/features/artifact-jobs/routes.ts` | 0 |
| `server/src/features/artifact-jobs/services/artifactJobStore.ts` | 0 |
| `server/src/features/artifact-jobs/services/htmlArtifactStore.ts` | 0 |
| `server/src/features/artifact-jobs/services/opencodeHtmlArtifactRunner.ts` | 0 |
| `server/src/features/artifact-jobs/services/htmlPresentationTemplates.ts` | 0 |
| `server/src/features/artifact-jobs/services/htmlPresentationPostProcess.ts` | 0 |
| `server/src/features/artifact-jobs/services/htmlPresentationRetemplateService.ts` | 0 |
| `server/src/routes/artifacts.ts` | 0 |
| `src/web/pages/HtmlPptPage.tsx` | 0 |

## Pre-existing baseline errors (not related to Phase 1)

All errors below existed before Phase 1 and are in unrelated modules (Electron main, document editor, old PPT generation, chat, paper, etc.).

    electron/main/index.ts(1665,50): error TS2345: Argument of type 'BrowserWindow | undefined' is not assignable to parameter of type 'BrowserWindow'.
    electron/main/index.ts(1682,50): error TS2345: Argument of type 'BrowserWindow | undefined' is not assignable to parameter of type 'BrowserWindow'.
    electron/main/index.ts(3630,95): error TS2353: Object literal may only specify known properties, and 'downloadPath' does not exist in type '{ skillId: string; packageHash?: string | undefined; }'.
    electron/main/index.ts(84,43): error TS2307: Cannot find module '../../../introduction-remake-app/electron/main/services/introductionRemake/introductionRemakeService' or its corresponding type declarations.
    electron/main/index.ts(85,40): error TS2307: Cannot find module '../../../introduction-remake-app/electron/main/services/introductionRemake/llmClient' or its corresponding type declarations.
    electron/main/index.ts(86,41): error TS2307: Cannot find module '../../../introduction-remake-app/electron/main/services/introductionRemake/types' or its corresponding type declarations.
    electron/main/index.ts(87,107): error TS2307: Cannot find module '../../../introduction-remake-app/electron/main/services/introductionRemake/taskArtifacts' or its corresponding type declarations.
    electron/main/index.ts(976,19): error TS7031: Binding element 'delta' implicitly has an 'any' type.
    electron/main/index.ts(976,26): error TS7031: Binding element 'accumulated' implicitly has an 'any' type.
    electron/main/index.ts(984,20): error TS7006: Parameter 'result' implicitly has an 'any' type.
    electron/main/index.ts(992,17): error TS7006: Parameter 'errorMessage' implicitly has an 'any' type.
    electron/main/services/emailService.ts(14,30): error TS7016: Could not find a declaration file for module 'mailparser'. '/data/darebug/aioffice-server/ai-office-web/node_modules/mailparser/index.js' implicitly has an 'any' type.
    electron/main/services/ppt/templateCloneRenderer.ts(494,18): error TS2352: Conversion of type 'DeckSlide' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
    electron/main/services/ppt/templateCloneRenderer.ts(504,18): error TS2352: Conversion of type 'DeckSlide' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
    src/components/EmbeddedOfficeEnginePanel.tsx(4102,61): error TS2345: Argument of type '{ getSelection: () => DocumentEngineSelection | null; setDocumentContent: (content: string | Record<string, any>) => void; insertTextAtSelection: (text: string) => void; applyTextEdit: (payload: DocumentEngineTextEditPayload) => void; ... 4 more ...; setStatusMessage: (value: string) => void; }' is not assignable to parameter of type 'EmbeddedOfficeAdapterDeps'.
    src/components/nav/PrimaryNav.tsx(25,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(26,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(27,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(28,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(29,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(30,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(31,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(32,62): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/components/nav/PrimaryNav.tsx(33,60): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; }>'.
    src/features/data-analysis/manifest.ts(21,5): error TS2322: Type '() => Promise<{ default: ({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) => JSX.Element; }>' is not assignable to type 'ComponentType | FeaturePageFactory'.
    src/features/document/components/DocumentEditorCanvas.tsx(776,25): error TS2345: Argument of type '{ selectedSectionId: string | null; selectedText: string; selectionRange: { sectionId: string | undefined; sectionTitle: string | undefined; startOffset: number; endOffset: number; text: string; beforeText: string | undefined; afterText: string | undefined; }; }' is not assignable to parameter of type '{ selectedSectionId: string | null; selectedBlockId: string | null; selectedBlockRole?: string | undefined; selectedBlockText?: string | undefined; selectedText: string; selectionRange?: DocumentSelectionRange | undefined; }'.
    src/features/document/components/DocumentEditorCanvas.tsx(936,15): error TS2322: Type 'string | undefined' is not assignable to type '"knowledge_base" | "file" | "policy" | "literature" | "manual_note" | undefined'.
    src/features/document/components/DocumentEditorCanvas.tsx(938,15): error TS2322: Type 'string | undefined' is not assignable to type '"verified" | "partial" | "unverified" | "unknown" | undefined'.
    src/features/document/components/DocumentWorkbench.tsx(1015,9): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
    src/features/document/components/DocumentWorkbench.tsx(1097,39): error TS2345: Argument of type 'FormalTemplateCommitResponse' is not assignable to parameter of type 'DocumentTaskResult'.
    src/features/document/components/DocumentWorkbench.tsx(1624,15): error TS2322: Type 'DocumentDraft | undefined' is not assignable to type 'DocumentDraft'.
    src/features/document/components/DocumentWorkbench.tsx(2214,11): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
    src/features/document/components/DocumentWorkbench.tsx(2268,11): error TS2322: Type '{ sources: KnowledgeSourceListItem[]; selectedIds: string[]; loading: boolean; onApply: (ids: string[]) => void; onClose: () => void; title: string; }' is not assignable to type 'IntrinsicAttributes & DocumentKnowledgeSourcePickerProps'.
    src/features/document/components/EditorPanel.tsx(2988,11): error TS2322: Type '(value: void | PromiseLike<void>) => void' is not assignable to type '(this: GlobalEventHandlers, ev: Event) => any'.
    src/features/document/components/EditorPanel.tsx(4913,47): error TS2339: Property 'exportWithJournalFormat' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/features/document/components/WordLikeDocumentEditor.tsx(804,11): error TS2322: Type '{ departments: Department[]; selectedIds: string[]; loading: boolean; onApply: (ids: string[]) => void; onClose: () => void; title: string; }' is not assignable to type 'IntrinsicAttributes & KnowledgeTreePickerProps'.
    src/features/document/manifest.ts(23,5): error TS2322: Type '() => Promise<{ default: ({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) => JSX.Element; }>' is not assignable to type 'ComponentType | FeaturePageFactory'.
    src/features/document/services/documentArtifactToDocx.ts(149,32): error TS2339: Property 'label' does not exist on type 'DocumentCitation'.
    src/features/document/services/documentDraftTransforms.ts(213,43): error TS2345: Argument of type 'Element' is not assignable to parameter of type 'HTMLElement'.
    src/features/document/services/documentDraftTransforms.ts(214,49): error TS2345: Argument of type 'Element' is not assignable to parameter of type 'HTMLElement'.
    src/features/document/services/documentDraftTransforms.ts(339,7): error TS2322: Type 'string' is not assignable to type '"knowledge_base" | "file" | "policy" | "literature" | "manual_note" | undefined'.
    src/features/document/services/documentDraftTransforms.ts(341,7): error TS2322: Type 'string' is not assignable to type '"verified" | "partial" | "unverified" | "unknown" | undefined'.
    src/features/document/services/documentDraftTransforms.ts(449,29): error TS2677: A type predicate's type must be assignable to its parameter's type.
    src/features/document/services/documentDraftTransforms.ts(450,29): error TS2322: Type '({ id: string; label: string; kind: "knowledge_base" | "file" | "manual_note"; citationStatus: "verified" | "partial" | "unverified"; note: string | undefined; } | null)[]' is not assignable to type 'DocumentDraftCitation[]'.
    src/features/document/services/documentWorkbenchApi.ts(445,18): error TS2430: Interface 'FormalTemplateCommitResponse' incorrectly extends interface 'DocumentTaskResult'.
    src/features/document/services/paperWorkflowAdapter.ts(331,28): error TS2352: Conversion of type 'PaperWorkflowGenerateResult & { success?: boolean | undefined; }' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
    src/features/image/manifest.ts(21,5): error TS2322: Type '() => Promise<{ default: ({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) => JSX.Element; }>' is not assignable to type 'ComponentType | FeaturePageFactory'.
    src/features/image/services/ImageService.ts(451,5): error TS2322: Type '{ documentId: string; order: number; isPrimary: boolean; role: ImageReferenceRole; weight: number; filePath: string | undefined; fileName: string | undefined; contentType: string | undefined; dataUrl: string | undefined; url: string; origin: ImageReferenceOrigin | undefined; }[]' is not assignable to type 'ImageReferenceItem[] & Record<string, unknown>[]'.
    src/features/ppt/components/GenerationComposer.tsx(1768,51): error TS2339: Property 'title' does not exist on type 'never'.
    src/features/ppt/components/GenerationComposer.tsx(1779,13): error TS2353: Object literal may only specify known properties, and 'query' does not exist in type 'PreviewKnowledgeTaskContextInput'.
    src/features/ppt/components/GenerationPromptComposer.tsx(1460,39): error TS2345: Argument of type '(session: GenerationModeSession) => { pptLiveSlides: { index: number; type: string; heading: string; isGenerating: boolean; imageLoading: boolean; }[]; pptTotalSlides: number; ... 63 more ...; selectedKnowledgeBaseIds: string[]; }' is not assignable to parameter of type 'Partial<GenerationModeSession> | ((session: GenerationModeSession) => GenerationModeSession)'.
    src/features/ppt/components/GenerationPromptComposer.tsx(1479,13): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/GenerationPromptComposer.tsx(1595,15): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/GenerationPromptComposer.tsx(1621,15): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/GenerationPromptComposer.tsx(2071,39): error TS2345: Argument of type '(session: GenerationModeSession) => { pptTaskStatus: "generating_slide"; pptLiveSlides: (PptSlidePreview | { index: number; type: string; heading: string; isGenerating: boolean; imageLoading: boolean; })[]; ... 63 more ...; selectedKnowledgeBaseIds: string[]; }' is not assignable to parameter of type 'Partial<GenerationModeSession> | ((session: GenerationModeSession) => GenerationModeSession)'.
    src/features/ppt/components/GenerationPromptComposer.tsx(2183,13): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/GenerationPromptComposer.tsx(2205,13): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/GenerationPromptComposer.tsx(2373,11): error TS2353: Object literal may only specify known properties, and 'outlinePlan' does not exist in type '{ id?: string | undefined; title: string; sourcePrompt: string; slides: Record<string, unknown>[]; assets: { slideIndex: number; imagePath: string; }[]; createdAt?: string | undefined; }'.
    src/features/ppt/components/PptFloatingEditPanel.tsx(121,13): error TS2769: No overload matches this call.
    src/features/ppt/components/PptWorkbenchPanel.tsx(495,41): error TS2339: Property 'tagName' does not exist on type 'never'.
    src/features/ppt/components/PptWorkbenchPanel.tsx(495,74): error TS2339: Property 'textPreview' does not exist on type 'never'.
    src/features/ppt/components/PptWorkbenchPanel.tsx(630,51): error TS2339: Property 'tagName' does not exist on type 'never'.
    src/features/ppt/components/PptWorkbenchPanel.tsx(630,78): error TS2339: Property 'textPreview' does not exist on type 'never'.
    src/features/ppt/components/ResultPreviewPanel.tsx(1391,43): error TS2352: Conversion of type '{ id: string; title: {}; exports: { url: string; format: string; }[]; }' to type 'undefined' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
    src/features/ppt/components/ResultPreviewPanel.tsx(1406,12): error TS18048: 'artifact' is possibly 'undefined'.
    src/features/ppt/components/ResultPreviewPanel.tsx(1418,40): error TS18048: 'artifact' is possibly 'undefined'.
    src/features/ppt/components/ResultPreviewPanel.tsx(1469,37): error TS2345: Argument of type '(session: GenerationModeSession) => { pptPreviewUrl: string | undefined; pptOutputMode: "web_deck"; pptEngine: "slidev"; selectedAssetIds: string[]; primaryAssetId: string | null; ... 60 more ...; selectedKnowledgeBaseIds: string[]; }' is not assignable to parameter of type 'Partial<GenerationModeSession> | ((session: GenerationModeSession) => GenerationModeSession)'.
    src/features/ppt/components/ResultPreviewPanel.tsx(1674,68): error TS2345: Argument of type '".slidev.zip"' is not assignable to parameter of type '".png" | ".slidev.md" | ".slidev.html" | ".pdf"'.
    src/features/ppt/components/ResultPreviewPanel.tsx(1723,9): error TS2345: Argument of type '".pptx" | ".png" | ".pdf"' is not assignable to parameter of type '".png" | ".slidev.md" | ".slidev.html" | ".pdf"'.
    src/features/ppt/manifest.ts(22,5): error TS2322: Type '() => Promise<{ default: ({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) => JSX.Element; }>' is not assignable to type 'ComponentType | FeaturePageFactory'.
    src/features/ppt/ppt/retemplate/slotBinder.ts(291,9): error TS18048: 'bs.adaptation' is possibly 'undefined'.
    src/features/ppt/ppt/retemplate/slotBinder.ts(292,50): error TS18048: 'bs.adaptation' is possibly 'undefined'.
    src/features/ppt/ppt/retemplate/slotBinder.ts(292,75): error TS18048: 'bs.adaptation' is possibly 'undefined'.
    src/features/ppt/services/pptWebGeneration.ts(228,3): error TS2322: Type '({ slideId: string | undefined; index: number; previewImageUrl: string | undefined; previewHtmlUrl: string | undefined; } | null)[]' is not assignable to type 'WebPptPreviewImagePayload[]'.
    src/features/ppt/services/pptWebGeneration.ts(242,31): error TS2677: A type predicate's type must be assignable to its parameter's type.
    src/features/ppt/services/pptWebGeneration.ts(286,18): error TS2430: Interface 'WebPptCreateResult' incorrectly extends interface 'SkillResult'.
    src/features/ppt/services/webDeckSlides.ts(33,29): error TS2677: A type predicate's type must be assignable to its parameter's type.
    src/features/ppt/services/webDeckSlides.ts(34,32): error TS2322: Type '({ title: string; detail: string | undefined; } | null)[]' is not assignable to type '{ title: string; detail?: string | undefined; }[]'.
    src/features/ppt/services/webDeckSlides.ts(39,3): error TS2322: Type '({ slideId: string | undefined; index: number; previewImageUrl: string | undefined; previewHtmlUrl: string | undefined; } | null)[]' is not assignable to type '{ slideId?: string | undefined; index: number; previewImageUrl?: string | undefined; previewHtmlUrl?: string | undefined; }[]'.
    src/features/ppt/services/webDeckSlides.ts(53,29): error TS2677: A type predicate's type must be assignable to its parameter's type.
    src/features/report/manifest.ts(21,5): error TS2322: Type '() => Promise<{ default: ({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) => JSX.Element; }>' is not assignable to type 'ComponentType | FeaturePageFactory'.
    src/modules/chat/ChatWindow.tsx(1419,60): error TS2345: Argument of type 'ChatContact' is not assignable to parameter of type 'ChatContact & Record<string, unknown>'.
    src/modules/chat/ChatWindow.tsx(580,33): error TS2345: Argument of type 'ChatContact' is not assignable to parameter of type 'ChatContact & Record<string, unknown>'.
    src/modules/chat/ChatWindow.tsx(852,44): error TS2345: Argument of type 'ChatContact' is not assignable to parameter of type 'ChatContact & Record<string, unknown>'.
    src/modules/feed/components/DailyMagazineDrawer.tsx(4,63): error TS2307: Cannot find module '../data/builtinMagazineArticles' or its corresponding type declarations.
    src/modules/formal/hooks/useFormalTemplateGeneration.ts(395,16): error TS2345: Argument of type '"running"' is not assignable to parameter of type 'FormalTemplateSessionPhase'.
    src/modules/homework/components/HomeworkWorkbench.tsx(426,49): error TS2339: Property 'homeworkExtractQuestions' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/homework/components/HomeworkWorkbench.tsx(445,49): error TS2339: Property 'homeworkExtractQuestions' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/homework/components/HomeworkWorkbench.tsx(499,47): error TS2339: Property 'homeworkGenerateAnswer' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/homework/components/HomeworkWorkbench.tsx(526,43): error TS2339: Property 'homeworkExportMarkdown' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(732,43): error TS2339: Property 'paperInitProject' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(748,43): error TS2339: Property 'paperRunSection' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(754,43): error TS2339: Property 'paperRunConclusion' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(760,43): error TS2339: Property 'paperFinalizeProject' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(767,43): error TS2339: Property 'paperGetProject' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/modules/paper/services/PaperService.ts(774,28): error TS2339: Property 'paperDeleteProject' does not exist on type '{ getAppInfo: () => Promise<Record<string, unknown>>; resolveAppCloseRequest: (resolution: "close" | "cancel") => Promise<{ success: boolean; canceled?: boolean | undefined; }>; ... 209 more ...; onExcelAnalysisEnvStatus: (callback: (payload: { ...; }) => void) => () => void; }'.
    src/services/workspaceBootstrapClient.ts(359,3): error TS2322: Type 'WorkspaceBootstrapPayload | MeContextPayload' is not assignable to type 'WorkspaceBootstrapPayload | CurrentWorkspaceState | null'.

## Affected baseline files (33 total)

- electron/main/index.ts
- electron/main/services/emailService.ts
- electron/main/services/ppt/templateCloneRenderer.ts
- src/components/EmbeddedOfficeEnginePanel.tsx
- src/components/nav/PrimaryNav.tsx
- src/features/data-analysis/manifest.ts
- src/features/document/components/DocumentEditorCanvas.tsx
- src/features/document/components/DocumentWorkbench.tsx
- src/features/document/components/EditorPanel.tsx
- src/features/document/components/WordLikeDocumentEditor.tsx
- src/features/document/manifest.ts
- src/features/document/services/documentArtifactToDocx.ts
- src/features/document/services/documentDraftTransforms.ts
- src/features/document/services/documentWorkbenchApi.ts
- src/features/document/services/paperWorkflowAdapter.ts
- src/features/image/manifest.ts
- src/features/image/services/ImageService.ts
- src/features/ppt/components/GenerationComposer.tsx
- src/features/ppt/components/GenerationPromptComposer.tsx
- src/features/ppt/components/PptFloatingEditPanel.tsx
- src/features/ppt/components/PptWorkbenchPanel.tsx
- src/features/ppt/components/ResultPreviewPanel.tsx
- src/features/ppt/manifest.ts
- src/features/ppt/ppt/retemplate/slotBinder.ts
- src/features/ppt/services/pptWebGeneration.ts
- src/features/ppt/services/webDeckSlides.ts
- src/features/report/manifest.ts
- src/modules/chat/ChatWindow.tsx
- src/modules/feed/components/DailyMagazineDrawer.tsx
- src/modules/formal/hooks/useFormalTemplateGeneration.ts
- src/modules/homework/components/HomeworkWorkbench.tsx
- src/modules/paper/services/PaperService.ts
- src/services/workspaceBootstrapClient.ts
