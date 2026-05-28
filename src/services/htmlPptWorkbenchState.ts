const HTML_PPT_WORKBENCH_STATE_KEY = 'aios-html-ppt-workbench-state'
export const HTML_SLIDES_ACTIVE_JOB_KEY = 'html-slides-active-job'

export type HtmlSlidesActiveJob = {
  jobId: string
  artifactId?: string
  startedAt: string
  qualityMode: 'fast' | 'high'
  templateSlug?: string
}

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
    window.localStorage.removeItem(HTML_SLIDES_ACTIVE_JOB_KEY)
  } catch {
    // ignore persistence failures
  }
}

export function loadHtmlSlidesActiveJob(): HtmlSlidesActiveJob | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(HTML_SLIDES_ACTIVE_JOB_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HtmlSlidesActiveJob
    if (!parsed?.jobId || typeof parsed.jobId !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function saveHtmlSlidesActiveJob(active: HtmlSlidesActiveJob): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(HTML_SLIDES_ACTIVE_JOB_KEY, JSON.stringify(active))
  } catch {
    // ignore persistence failures
  }
}

export function clearHtmlSlidesActiveJob(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(HTML_SLIDES_ACTIVE_JOB_KEY)
  } catch {
    // ignore persistence failures
  }
}

/** 清理进行中的任务字段，保留用户输入与已完成预览等状态。 */
export function clearActiveHtmlSlidesJobPersistence(): void {
  clearHtmlSlidesActiveJob()
  if (!canUseStorage()) return
  try {
    const raw = window.localStorage.getItem(HTML_PPT_WORKBENCH_STATE_KEY)
    if (!raw) return
    const state = JSON.parse(raw) as PersistedHtmlPptWorkbenchState
    window.localStorage.setItem(HTML_PPT_WORKBENCH_STATE_KEY, JSON.stringify({
      ...state,
      currentJobId: '',
      generationStatus: '',
      currentStep: '',
      error: '',
      job: null,
    }))
  } catch {
    // ignore persistence failures
  }
}
