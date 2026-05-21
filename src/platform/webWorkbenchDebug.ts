import { isWebShim } from './detect'

const isDev =
  typeof import.meta !== 'undefined'
  && Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)

function shouldLog(): boolean {
  return isDev && isWebShim()
}

/** 场景入口点击（Work / Life / Study） */
export function logWebWorkbenchEntry(feature: string, detail: Record<string, unknown>): void {
  if (!shouldLog()) return
  console.debug('[web-workbench:entry]', feature, detail)
}

/** WorkspaceModeContext 模式切换 */
export function logWebWorkbenchModeChange(method: string, mode: string, generationMode: string): void {
  if (!shouldLog()) return
  console.debug('[web-workbench:mode]', { method, mode, generationMode })
}

/** WorkspaceViewportHost 实际挂载的面板 */
export function logWebWorkbenchViewport(detail: Record<string, unknown>): void {
  if (!shouldLog()) return
  console.debug('[web-workbench:viewport]', detail)
}

export const WEB_WORKBENCH_PANEL_COMPONENT: Record<string, string> = {
  freewrite: 'WebDocumentWorkbench|DocumentEngineHost',
  paper: 'DocumentEngineHost',
  workbench: 'GenerationWorkbenchPanel',
  email: 'CommunicationWorkbench',
  data: 'ExcelAnalysisWorkbench',
  image: 'ImageWorkspace',
  homework: 'HomeworkWorkbench',
  'ai-class': 'AiClassWorkbench',
  'ai-forum': 'AiForumWorkbench',
  model: 'WebSettingsPanel|ModelDevPanel',
  'daily-feed': 'DailyFeedWorkbench',
}
