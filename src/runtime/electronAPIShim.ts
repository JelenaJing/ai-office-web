/**
 * electronAPIShim.ts — Web 模式下的 window.electronAPI 替代层
 *
 * 在浏览器（非 Electron）运行时，将 window.electronAPI 安装为
 * 包含所有接口方法的 mock 对象，使业务代码无需修改即可加载。
 *
 * 策略：
 * - 如果已有真实 electronAPI（Electron 桌面）则跳过
 * - 数组型返回值 → []，对象型 → {}，布尔 → false，null → null
 * - 事件订阅方法返回清理函数 () => {}
 * - 关键启动方法（listWorkspaces、listDepartments 等）返回类型安全的空值
 *
 * Phase 1：全部为 mock；后续可逐步替换为真实 /api/* 调用。
 */

/* ---- 辅助工厂 ---- */

const noop = (): void => {}
/** 返回"取消订阅"函数的工厂（符合 Electron IPC 事件模式） */
const listener = (): (() => void) => noop

/** 返回 { success: true, ... } 的通用 stub */
function okResult<T extends Record<string, unknown>>(extra: T = {} as T) {
  return (): Promise<{ success: true } & T> =>
    Promise.resolve({ success: true as const, ...extra })
}

/**
 * 安装 web 版 electronAPI shim。
 * 在 ReactDOM.render 之前调用一次即可。
 */
export function installWebElectronAPIShim(): void {
  if (typeof window === 'undefined') return
  // 已有真实 electronAPI（Electron 桌面），不覆盖
  if ((window as unknown as { electronAPI?: unknown }).electronAPI !== undefined) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any

  /**
   * localStorage key used by the shim for internal account token persistence.
   * Intentionally different from LEGACY_TOKEN_KEY ('ai_office_internal_token')
   * to avoid colliding with the migration logic in InternalAccountContext which
   * reads LEGACY_TOKEN_KEY, writes it to "main process", then removes it.
   * The shim acts as the "main process": it stores the token under this key.
   */
  const _SHIM_TOKEN_KEY = 'aios_itoken'

  w.electronAPI = {
    /** Marker so getAccountCenterBaseUrl() can identify the shim at runtime. */
    __isWebShim: true,

    /* ── App 信息 ── */
    getAppInfo: () => Promise.resolve({ version: 'web', platform: 'web' }),
    resolveAppCloseRequest: () => Promise.resolve({ success: true }),
    onAppCloseRequest: listener,
    getSettings: () => Promise.resolve({}),
    saveSettings: () => Promise.resolve({}),
    returnToSuiteLauncher: () => Promise.resolve({ success: true, message: '' }),
    testLlmConnection: () => Promise.resolve('web mode'),
    testImageConnection: () => Promise.resolve('web mode'),
    launchCompanionApp: () => Promise.resolve({ success: true, mode: 'launched', message: '' }),
    onSuiteNavigate: listener,

    /* ── Introduction Remake ── */
    getIntroductionRemakeServiceInfo: () => Promise.resolve({}),
    getIntroductionAllowedJournals: () => Promise.resolve([]),
    getIntroductionRecentTasks: () => Promise.resolve([]),
    saveIntroductionTaskSnapshot: () => Promise.resolve({ task: {}, tasks: [] }),
    exportIntroductionBundle: () => Promise.resolve({ success: true, canceled: false }),
    testIntroductionLlmSettings: () => Promise.resolve('ok'),
    inferIntroductionTopicMeta: () => Promise.resolve({}),
    buildIntroductionAllowlistedPool: () => Promise.resolve({}),
    generateIntroductionDraft: () => Promise.resolve({}),
    startGenerateIntroductionDraftStream: () => Promise.resolve({ streamId: '' }),
    cancelGenerateIntroductionDraftStream: () => Promise.resolve({ success: true }),
    onGenerateIntroductionDraftStreamEvent: listener,
    remapIntroductionDraft: () => Promise.resolve({}),

    /* ── Plot Agent ── */
    getPlotAgentStatus: () => Promise.resolve({ ready: false, running: false, baseUrl: '', port: 0, pythonCommand: null, agentRoot: null }),
    getPlotChartTypes: () => Promise.resolve({}),
    recommendPlot: () => Promise.resolve({}),
    generatePlot: () => Promise.resolve({}),
    createRealtimePlotSession: () => Promise.resolve({}),
    addRealtimePlotPoint: () => Promise.resolve({}),
    addRealtimePlotBatch: () => Promise.resolve({}),
    getRealtimePlot: () => Promise.resolve({}),
    getRealtimePlotStatus: () => Promise.resolve({}),
    deleteRealtimePlotSession: () => Promise.resolve({}),

    /* ── Document Engine ── */
    getActiveDocumentEngine: () =>
      Promise.resolve({ engineId: 'legacy-tiptap-bridge', availableEngineIds: ['legacy-tiptap-bridge'] }),
    setPreferredDocumentEngine: () =>
      Promise.resolve({ engineId: 'legacy-tiptap-bridge', availableEngineIds: ['legacy-tiptap-bridge'] }),

    /* ── Knowledge Base ── */
    getKnowledgeBaseInfo: () => Promise.resolve({ departmentId: '', documentCount: 0, totalChunks: 0 }),
    listKnowledgeDocuments: () => Promise.resolve([]),
    getKnowledgeDocument: () => Promise.resolve(null),
    getKnowledgeDocumentVersion: () => Promise.resolve(null),
    listKnowledgeDocumentChunks: () => Promise.resolve([]),
    retrieveKnowledgeChunks: () => Promise.resolve({ chunks: [], total: 0 }),
    previewKnowledgeTaskContext: () => Promise.resolve({ context: '', tokenCount: 0 }),
    importKnowledgeDocuments: () => Promise.resolve({ imported: 0, skipped: 0, errors: [] }),
    importKnowledgeDocumentFromPath: () => Promise.resolve({ imported: 0, skipped: 0, errors: [] }),
    ensureReadingSeedDocuments: () => Promise.resolve({ imported: 0, skipped: 0, errors: [] }),
    materializeKnowledgeWorkspace: () => Promise.resolve({ success: true }),
    deleteKnowledgeDocument: () => Promise.resolve({ success: true }),
    setKnowledgeCurrentVersion: () => Promise.resolve({ document: {}, version: {} }),
    submitKnowledgeRemakeTask: () => Promise.resolve(''),
    saveKnowledgeTaskRecord: () => Promise.resolve({ task: {} }),
    createKnowledgeRemakeVersion: () => Promise.resolve({ document: {}, version: {}, task: {} }),
    classifyKnowledgeDocument: () => Promise.resolve(null),
    updateKnowledgeDocumentCategory: () => Promise.resolve(),

    /* ── Departments ── */
    listDepartments: () => Promise.resolve([]),
    createDepartment: () => Promise.resolve({}),
    renameDepartment: () => Promise.resolve({}),
    deleteDepartment: () => Promise.resolve(),
    getDefaultDepartmentId: () => Promise.resolve(''),

    /* ── OOXML ── */
    readOoxmlPackage: () => Promise.resolve({}),
    writeOoxmlPackage: () => Promise.resolve({ success: true }),

    /* ── Workspaces ── */
    listWorkspaces: async () => {
      try {
        const res = await fetch('/api/workspaces')
        const data = await res.json() as { workspaces: unknown[] }
        return data.workspaces ?? []
      } catch {
        return []
      }
    },
    createWorkspace: async (name: string, _parentDir?: string) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json() as { success: boolean; path: string; name: string; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? '创建工作区失败')
      return { success: true as const, path: data.path, name: data.name }
    },
    renameWorkspace: async (wsPath: string, nextName: string) => {
      const res = await fetch('/api/workspaces/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: wsPath, name: nextName }),
      })
      const data = await res.json() as { success: boolean; path: string; name: string; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? '重命名失败')
      return { success: true as const, path: data.path, name: data.name }
    },
    registerWorkspace: async (wsPath: string) => {
      const res = await fetch('/api/workspaces/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: wsPath }),
      })
      const data = await res.json() as { success: boolean; path: string; name: string; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? '注册工作区失败')
      return { success: true as const, path: data.path, name: data.name }
    },
    getWorkspaceTree: async (wsPath: string) => {
      try {
        const res = await fetch(`/api/workspaces/tree?path=${encodeURIComponent(wsPath)}`)
        return await res.json() as unknown[]
      } catch {
        return []
      }
    },
    readWorkspaceDocumentSchema: () =>
      Promise.resolve({ success: true, source: 'empty', jsonPath: '', legacySourcePath: null, document: {}, compatHtml: '', displayName: '' }),
    saveWorkspaceDocumentSchema: () =>
      Promise.resolve({ success: true, jsonPath: '', document: {}, compatHtml: '', displayName: '', resourceCount: 0 }),
    saveGeneratedPaperJsonArtifact: () =>
      Promise.resolve({ success: true, jsonPath: '', relativePath: '', document: {} }),
    deleteWorkspace: async (wsPath: string) => {
      try {
        await fetch('/api/workspaces', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: wsPath }),
        })
      } catch { /* best-effort */ }
      return { success: true as const }
    },
    detectProjectStructure: () => Promise.resolve({ isProject: false }),
    createWorkspaceFolder: () => Promise.resolve({ success: true, path: '' }),
    createWorkspaceFile: () => Promise.resolve({ success: true, path: '' }),
    createBlankDocument: () => Promise.resolve({ success: true, path: '' }),
    renameWorkspacePath: () => Promise.resolve({ success: true, path: '' }),
    copyWorkspacePath: () => Promise.resolve({ success: true, path: '' }),
    moveWorkspacePath: () => Promise.resolve({ success: true, path: '' }),
    deleteWorkspacePath: okResult(),
    readReferences: () => Promise.resolve({ references: [] }),
    readTaskHistory: () => Promise.resolve({ tasks: [] }),
    appendTaskHistory: () => Promise.resolve({ success: true, total: 0 }),
    saveReferences: () => Promise.resolve({ success: true, total: 0 }),
    appendReferences: () => Promise.resolve({ success: true, total: 0 }),
    cropImageFile: () => Promise.resolve({ success: true, path: '', relativePath: '', filename: '', dataUrl: '' }),
    saveImageToWorkspace: () => Promise.resolve({ success: true, path: '', relativePath: '', filename: '' }),
    saveImageToFiguresBase64: () => Promise.resolve({ success: true, path: '', relativePath: '', filename: '' }),
    saveImageFromUrl: () => Promise.resolve({ success: true, path: '', relativePath: '', filename: '' }),
    saveImageToFigures: () => Promise.resolve({ success: true, path: '', relativePath: '', filename: '' }),
    writeWorkspaceFile: () => Promise.resolve({ success: true, path: '' }),
    saveManuscript: () => Promise.resolve({ success: true, path: '' }),
    saveExperimentPlan: () => Promise.resolve({ success: true, path: '' }),
    importFilesToWorkspace: () => Promise.resolve({ imported: [] }),

    /* ── 文件对话框 / 本地文件 IO ── */
    openFileDialog: () => Promise.resolve(null),
    openDirectoryDialog: () => Promise.resolve(null),
    saveFileDialog: () => Promise.resolve(null),
    readFile: () => Promise.reject(new Error('[web] readFile 不支持，请通过后端 API 访问文件')),
    listDirectoryImages: () => Promise.resolve([]),
    importImageFile: () => Promise.resolve(null),
    getFileInfo: () => Promise.resolve({ exists: false, fileSize: 0, path: '' }),
    readImageAsDataUrl: () => Promise.reject(new Error('[web] readImageAsDataUrl 不支持')),
    openExternalFile: () => Promise.resolve({ success: false, filePath: '' }),
    openFolderSafe: () => Promise.resolve({ ok: false, error: 'not supported in web mode' }),
    openExternalUrl: (url: string) => { window.open(url, '_blank'); return Promise.resolve({ success: true }) },
    copyFileToPath: () => Promise.resolve({ success: true, path: '' }),
    writeFile: () => Promise.resolve({ success: true, filePath: '' }),
    writeDocxFile: () => Promise.resolve({ success: true, filePath: '' }),

    /* ── Internal Account IPC ── */
    internalAccountGetToken: () => {
      const token = localStorage.getItem(_SHIM_TOKEN_KEY) || null
      return Promise.resolve({ token })
    },
    internalAccountSetToken: (token: string) => {
      try { localStorage.setItem(_SHIM_TOKEN_KEY, token) } catch { /* ignore */ }
      return Promise.resolve({ ok: true })
    },
    internalAccountClearToken: () => {
      try { localStorage.removeItem(_SHIM_TOKEN_KEY) } catch { /* ignore */ }
      return Promise.resolve({ ok: true })
    },
    internalAccountApplyEmailConfig: () => Promise.resolve({ ok: true }),

    /* ── Matrix IPC ── */
    matrixGetSession: () => Promise.resolve({ session: null }),
    matrixSetSession: () => Promise.resolve({ ok: true }),
    matrixClearSession: () => Promise.resolve({ ok: true }),

    /* ── AI 写作任务 ── */
    continueWriting: () => Promise.resolve(''),
    rewriteParagraph: () => Promise.resolve(''),
    writingAssistant: () => Promise.resolve(''),
    aiCancelTask: () => Promise.resolve(),
    organizeReferences: () => Promise.resolve({}),
    generateOutline: () => Promise.resolve(''),
    analyzeTopic: () => Promise.resolve(''),
    generateExperimentPlan: () => Promise.resolve(''),
    generateImage: () => Promise.resolve({ error: 'not supported in web mode' }),
    generatePaper: () => Promise.resolve({}),
    compatSubmitTask: () => Promise.resolve({}),
    compatGetTaskStatus: () => Promise.resolve({}),
    compatGetTaskResult: () => Promise.resolve({}),
    compatGetActiveTasks: () => Promise.resolve({}),
    compatGetRecentTasks: () => Promise.resolve({}),
    compatPauseTask: () => Promise.resolve({}),
    compatResumeTask: () => Promise.resolve({}),
    compatStopTask: () => Promise.resolve({}),
    compatFindCitationForText: () => Promise.resolve({}),
    getBackendStatus: () => Promise.resolve(null),
    onBackendStatus: noop,
    exportPdf: () => Promise.resolve(null),
    exportPdfFromEditor: () => Promise.resolve(null),
    generatePptx: () => Promise.resolve({ success: false, outputPath: '', slideCount: 0, error: 'not supported in web mode' }),

    /* ── PPT Content Package ── */
    pptxSaveContentPackage: () => Promise.resolve({ success: true }),
    pptxLoadContentPackage: () => Promise.resolve({ success: true }),
    pptxListContentPackages: () => Promise.resolve({ success: true, packages: [] }),
    pptxRenderWithSkill: () => Promise.resolve({ success: true }),
    pptxListSkills: () => Promise.resolve({ success: true, skills: [] }),
    pptxImportFromDialog: () => Promise.resolve({ success: false, previewSlides: [], extractionWarnings: [] }),
    pptxImportFromFile: () => Promise.resolve({ success: false, previewSlides: [], extractionWarnings: [] }),

    /* ── DeckDocument ── */
    deckSave: () => Promise.resolve({ success: true }),
    deckLoad: () => Promise.resolve({ success: true }),
    deckRender: () => Promise.resolve({ success: true, llmCalls: 0, imageCalls: 0, tokenCost: 0 }),
    deckUpdateSlide: () => Promise.resolve({ success: true }),
    deckUpdateDeckDocument: () => Promise.resolve({ success: true }),
    deckOptimizeStructure: () => Promise.resolve({ success: true, deckId: '' }),
    deckBuildFromPrompt: () => Promise.resolve({ success: true, warnings: [] }),
    deckBuildFromManuscript: () => Promise.resolve({ success: true, warnings: [] }),
    deckBuildFromImportedPptx: () => Promise.resolve({ success: true, warnings: [] }),
    deckExtractPptx: () => Promise.resolve({ success: true }),
    deckPreview: () => Promise.resolve({ success: true }),

    /* ── 全局 AI 事件 ── */
    onAiEvent: listener,

    /* ── Voice ── */
    voiceStart: () => Promise.resolve({ sessionId: '' }),
    voiceSend: noop,
    voiceStop: () => Promise.resolve(),
    onVoiceEvent: listener,

    /* ── 正式模板 ── */
    analyzeFormalTemplate: () => Promise.resolve({}),
    confirmFormalTemplateFields: () => Promise.resolve({}),
    previewFormalTemplateTask: () => Promise.resolve({}),
    commitFormalTemplateTask: () => Promise.resolve({}),

    /* ── Email IPC ── */
    emailGetAccount: () => Promise.resolve(null),
    emailSaveAccount: () => Promise.resolve(),
    emailClearAccount: () => Promise.resolve(),
    emailTestConnection: () => Promise.resolve({ ok: false, message: 'not supported in web mode' }),
    emailTestSmtp: () => Promise.resolve({ ok: false, message: 'not supported in web mode' }),
    emailFetchInbox: () => Promise.resolve([]),
    emailFetchSent: () => Promise.resolve([]),
    emailFetchTrash: () => Promise.resolve([]),
    emailDeleteMessage: () => Promise.resolve({ ok: true }),
    emailRestoreMessage: () => Promise.resolve({ ok: true }),
    emailSend: () => Promise.resolve(),
    emailDownloadAttachment: () => Promise.resolve({ ok: false, error: { message: 'not supported in web mode' } }),
    mailOpenAttachmentInWorkspace: () => Promise.resolve({}),
    emailSelectAttachments: () => Promise.resolve({ ok: false }),

    /* ── Workspace Activity ── */
    activityTakeSnapshot: () => Promise.resolve({}),
    activityGetActivity: () => Promise.resolve({}),
    activityAnalyzeFiles: () => Promise.resolve({}),
    activityGenerateReport: () => Promise.resolve({}),
    activityGetReport: () => Promise.resolve({}),
    activitySyncStatus: () => Promise.resolve({ ok: true }),
    activityFlushSync: () => Promise.resolve({ ok: true }),
    activityAdminFetch: () => Promise.resolve({ ok: false }),
    activityAdminPost: () => Promise.resolve({ ok: false }),
    activityLogUserAction: () => Promise.resolve({ ok: true }),
    activityGetUserActions: () => Promise.resolve({ ok: true, actions: [] }),
    activitySetIdentity: () => Promise.resolve({ ok: true }),

    /* ── AI Delegation ── */
    delegationEnable: () => Promise.resolve({}),
    delegationDisable: () => Promise.resolve({}),
    delegationGetStatus: () => Promise.resolve({}),
    delegationGetAuditLog: () => Promise.resolve({}),
    delegationGetPendingReplies: () => Promise.resolve({ ok: true, replies: [] }),
    delegationReviewReply: () => Promise.resolve({}),
    delegationUploadWorkReport: () => Promise.resolve({}),
    delegationGenerateAutoReply: () => Promise.resolve({}),

    /* ── Skill Store ── */
    openSkillStore: () => Promise.resolve({ ok: true }),
    getSkillSyncPlan: () => Promise.resolve({ ok: true }),
    listMySkins: () => Promise.resolve({ ok: true, skins: [] }),
    downloadSkillPackage: () => Promise.resolve({ ok: false, error: 'not supported in web mode' }),
    getSkillStoreEmbedUrl: () => Promise.resolve({ ok: false }),
    recognizeSkillPackage: () => Promise.resolve({ ok: false }),
    listSkillTemplates: () => Promise.resolve({ ok: true, templates: [] }),

    /* ── Excel Analysis ── */
    excelAnalysisRun: () => Promise.resolve({}),
    excelListDataModels: () => Promise.resolve([]),
    excelCheckEnvStatus: () => Promise.resolve({ status: 'unavailable', message: 'not supported in web mode' }),
    excelRebuildEnv: () => Promise.resolve({ ok: false, message: 'not supported in web mode' }),
    excelPythonDiagnostics: () => Promise.resolve({}),
    onExcelAnalysisProgress: listener,
    onExcelAnalysisEnvLog: listener,
    onExcelAnalysisEnvStatus: listener,
  }

  /* ── personalLibraryAPI shim ── */
  if (!w.personalLibraryAPI) {
    w.personalLibraryAPI = {
      listFolders: () => Promise.resolve([]),
      createFolder: () => Promise.resolve({}),
      renameFolder: () => Promise.resolve({}),
      deleteFolder: () => Promise.resolve(),
      listFiles: () => Promise.resolve([]),
      getFile: () => Promise.resolve(null),
      getFileContent: () => Promise.resolve({ text: '', truncated: false, sourceType: 'text' }),
      deleteFile: () => Promise.resolve(),
      moveFile: () => Promise.resolve({}),
      importFiles: () => Promise.resolve({}),
    }
  }

  /* ── window.aiOffice shim（邮件附件集成） ── */
  if (!w.aiOffice) {
    w.aiOffice = {
      mail: {
        openAttachmentInWorkspace: () => Promise.resolve({}),
      },
    }
  }
}
