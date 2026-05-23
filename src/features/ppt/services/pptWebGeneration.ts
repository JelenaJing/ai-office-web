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

  try {
    console.log('[ppt-web] start request', {
      title: input.title.trim() || '演示文稿',
      workspacePath: input.workspacePath,
      promptLength: input.prompt.trim().length,
      templateId: input.templateId ?? null,
    })

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
      message?: string
    }
    if (!startResp.ok || !startBody.success || !startBody.taskId) {
      const message = startBody.error || startBody.message || `PPT 任务启动失败 (${startResp.status})`
      console.error('[ppt-web] error', { stage: 'start', status: startResp.status, message })
      return { success: false, error: message }
    }

    console.log('[ppt-web] task created', { taskId: startBody.taskId })

    for (let i = 0; i < 200; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const pollResp = await fetch(`/api/ppt/decks/tasks/${startBody.taskId}`, { headers })
      const pollBody = await pollResp.json().catch(() => ({ error: `HTTP ${pollResp.status}` })) as {
        success?: boolean
        status?: string
        progress?: number
        message?: string
        error?: string
        result?: {
          deckId?: string
          deck?: unknown
          artifact?: SkillResult['artifact']
          diagnostics?: unknown
        }
      }
      console.log('[ppt-web] polling task', {
        taskId: startBody.taskId,
        attempt: i + 1,
        status: pollBody.status ?? `http-${pollResp.status}`,
        progress: pollBody.progress ?? null,
      })
      if (!pollResp.ok || !pollBody.success) {
        const message = pollBody.error || pollBody.message || `PPT 任务查询失败 (${pollResp.status})`
        console.error('[ppt-web] error', { stage: 'poll', taskId: startBody.taskId, status: pollResp.status, message })
        return { success: false, taskId: startBody.taskId, error: message }
      }
      if (pollBody.status === 'failed') {
        const message = pollBody.error || pollBody.message || 'PPT 生成失败'
        console.error('[ppt-web] error', { stage: 'task', taskId: startBody.taskId, status: pollBody.status, message })
        return { success: false, taskId: startBody.taskId, error: message }
      }
      if (pollBody.status === 'cancelled') {
        const message = pollBody.message || 'PPT 任务已取消'
        console.error('[ppt-web] error', { stage: 'task', taskId: startBody.taskId, status: pollBody.status, message })
        return { success: false, taskId: startBody.taskId, status: 'cancelled', error: message }
      }
      if (pollBody.status === 'completed' && pollBody.result?.artifact) {
        const slideCount = Array.isArray((pollBody.result.deck as { slides?: unknown[] } | undefined)?.slides)
          ? ((pollBody.result.deck as { slides: unknown[] }).slides.length)
          : 0
        console.log('[ppt-web] task completed', {
          taskId: startBody.taskId,
          deckId: pollBody.result.deckId ?? null,
          artifactId: pollBody.result.artifact.id,
        })
        console.log('[ppt-web] deck slides count', slideCount)
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

    const message = 'PPT 任务超时：生成时间过长，请重试。'
    console.error('[ppt-web] error', { stage: 'timeout', message })
    return { success: false, taskId: startBody.taskId, error: message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PPT 生成失败'
    console.error('[ppt-web] error', { stage: 'exception', message })
    return { success: false, error: message }
  }
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
