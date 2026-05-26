const HTML_PPT_WORKBENCH_STATE_KEY = 'aios-html-ppt-workbench-state'

export interface PersistedHtmlPptExportState {
  status: 'idle' | 'running' | 'ready' | 'failed'
  artifactId?: string
  exportArtifactId?: string
  filename?: string
  downloadUrl?: string
  error?: string
  updatedAt?: string
}

export interface PersistedHtmlPptChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export interface PersistedHtmlPptWorkbenchState {
  currentPrompt: string
  currentJobId: string
  currentDeckId: string
  currentArtifactId: string
  selectedTemplateId: string
  generationStatus: string
  htmlPreviewUrl: string
  htmlContent: string
  pptxExportUrl: string
  exportStatus: PersistedHtmlPptExportState['status']
  lastGeneratedAt: string
  currentStep: string
  error: string
  logs: string
  qualityMode: 'fast' | 'high'
  enableImages: boolean
  maxImages: number
  retemplateSlug: string
  retemplateWarning: string
  job?: Record<string, unknown> | null
  preview?: { artifactId: string; url: string } | null
  pptxExport?: PersistedHtmlPptExportState | null
  chatMessages?: PersistedHtmlPptChatMessage[]
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadHtmlPptWorkbenchState(): PersistedHtmlPptWorkbenchState | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(HTML_PPT_WORKBENCH_STATE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedHtmlPptWorkbenchState
  } catch {
    return null
  }
}

export function saveHtmlPptWorkbenchState(state: PersistedHtmlPptWorkbenchState): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(HTML_PPT_WORKBENCH_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore persistence failures
  }
}

export function clearHtmlPptWorkbenchState(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(HTML_PPT_WORKBENCH_STATE_KEY)
  } catch {
    // ignore persistence failures
  }
}
