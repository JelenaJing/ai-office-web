import type { SkillResult } from '../../../platform'

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem('aios_auth_token')
    ?? window.localStorage.getItem('aios_itoken')
    ?? window.localStorage.getItem('ai_office_internal_token')
  )
}

export async function runWebPptxCreate(input: {
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
}): Promise<SkillResult> {
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const startResp = await fetch('/api/ppt/decks/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      workspacePath: input.workspacePath,
      title: input.title.trim() || '演示文稿',
      prompt: input.prompt.trim() || input.title,
      templateId: input.templateId,
      source: 'topic',
    }),
  })
  const startBody = await startResp.json().catch(() => ({ error: `HTTP ${startResp.status}` })) as {
    success?: boolean
    taskId?: string
    error?: string
  }
  if (!startResp.ok || !startBody.success || !startBody.taskId) {
    return { success: false, error: startBody.error || `PPT 任务启动失败 (${startResp.status})` }
  }

  for (let i = 0; i < 200; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const pollResp = await fetch(`/api/ppt/decks/tasks/${startBody.taskId}`, { headers })
    const pollBody = await pollResp.json().catch(() => ({ error: `HTTP ${pollResp.status}` })) as {
      success?: boolean
      status?: string
      message?: string
      error?: string
      result?: {
        deckId?: string
        deck?: unknown
        artifact?: SkillResult['artifact']
        diagnostics?: unknown
      }
    }
    if (!pollResp.ok || !pollBody.success) {
      return { success: false, taskId: startBody.taskId, error: pollBody.error || `PPT 任务查询失败 (${pollResp.status})` }
    }
    if (pollBody.status === 'failed') {
      return { success: false, taskId: startBody.taskId, error: pollBody.error || pollBody.message || 'PPT 生成失败' }
    }
    if (pollBody.status === 'cancelled') {
      return { success: false, taskId: startBody.taskId, status: 'cancelled', error: pollBody.message || 'PPT 任务已取消' }
    }
    if (pollBody.status === 'completed' && pollBody.result?.artifact) {
      return {
        success: true,
        taskId: startBody.taskId,
        status: 'completed',
        artifact: pollBody.result.artifact,
        data: {
          deckId: pollBody.result.deckId,
          deck: pollBody.result.deck,
          diagnostics: pollBody.result.diagnostics,
        },
      }
    }
  }

  return { success: false, taskId: startBody.taskId, error: 'PPT 任务超时：生成时间过长，请重试。' }
}

export async function runWebPptxCreateViaSkill(input: {
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
}): Promise<SkillResult> {
  const { platformApi } = await import('../../../platform')
  return platformApi.skills.run('web.pptx.create', {
    prompt: input.prompt.trim() || input.title,
    workspacePath: input.workspacePath,
    params: {
      title: input.title.trim() || '演示文稿',
      templateId: input.templateId,
    },
  })
}
