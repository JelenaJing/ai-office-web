import path from 'path'

function trimValue(value: string | undefined): string {
  return String(value || '').trim()
}

export const AIOS_DATA_DIR = trimValue(process.env.AIOS_DATA_DIR) || '/data/darebug/aioffice-serv/ai-office-web2-data'
export const AIOS_ARTIFACTS_DIR = trimValue(process.env.AIOS_ARTIFACTS_DIR) || '/data/darebug/aioffice-serv/ai-office-web2-artifacts'
export const AIOS_JOBS_DIR = trimValue(process.env.AIOS_JOBS_DIR) || '/data/darebug/aioffice-serv/ai-office-web2-agent-jobs'

export const SERVER_DATA_ROOT = path.join(AIOS_DATA_DIR, 'server')
export const WORKSPACES_ROOT = path.join(SERVER_DATA_ROOT, 'workspaces')
export const ARTIFACT_INDEX_PATH = path.join(SERVER_DATA_ROOT, 'artifacts', 'index.json')
export const DOCUMENT_STUDIO_ROOT = path.join(SERVER_DATA_ROOT, 'document-studio')
export const EMAIL_ROOT = path.join(SERVER_DATA_ROOT, 'email')
export const EMAIL_ANALYSIS_CACHE_ROOT = path.join(SERVER_DATA_ROOT, 'email-analysis-cache')
export const CALENDAR_ROOT = path.join(SERVER_DATA_ROOT, 'calendar')
export const AIOS_ROOT = path.join(SERVER_DATA_ROOT, 'aios')
export const AI_INVOCATION_LOG_ROOT = path.join(SERVER_DATA_ROOT, 'ai-invocations')
export const DOCUMENT_STUDIO_JOB_ROOT = path.join(AIOS_JOBS_DIR, 'document-studio-opencode-jobs')
