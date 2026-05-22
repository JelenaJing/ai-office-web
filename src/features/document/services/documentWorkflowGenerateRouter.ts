import { runDocumentGenerate, type DocumentGenerateInput, type DocumentSkillResult } from './documentEditSkills'
import {
  runPaperWorkflowGenerate,
  type PaperWorkflowGenerateResult,
  type PaperWorkflowMode,
} from './paperWorkflowAdapter'

export interface WorkflowGenerateInput extends DocumentGenerateInput {
  signal?: AbortSignal
  paperMode?: PaperWorkflowMode
  onStatus?: (message: string) => void
  onProgress?: (progress: { step: string; message: string }) => void
  onContent?: (payload: { html?: string; markdown?: string }) => void
}

export interface WorkflowGenerateResult {
  mode: 'document' | 'paper'
  html?: string
  markdown?: string
  title?: string
  taskId?: string
  artifact?: unknown
  message?: string
  diagnostics?: {
    chain: string
    steps: string[]
  }
  documentResult?: DocumentSkillResult
}

function isPaperWorkflow(workflowId?: string): workflowId is 'academic_paper' | 'literature_review' {
  return workflowId === 'academic_paper' || workflowId === 'literature_review'
}

function resolvePaperType(workflowId: 'academic_paper' | 'literature_review'): 'research' | 'review' {
  return workflowId === 'academic_paper' ? 'research' : 'review'
}

export async function runWorkflowGenerate(input: WorkflowGenerateInput): Promise<WorkflowGenerateResult> {
  if (isPaperWorkflow(input.workflowId)) {
    const paperResult: PaperWorkflowGenerateResult = await runPaperWorkflowGenerate({
      topic: input.instruction.trim(),
      paperType: resolvePaperType(input.workflowId),
      language: input.language ?? 'zh',
      workspacePath: input.workspacePath,
      extraContext: input.extraContext,
      onStatus: input.onStatus,
      onProgress: input.onProgress,
      onContent: input.onContent,
      signal: input.signal,
      mode: input.paperMode ?? 'full',
    })

    return {
      mode: 'paper',
      html: paperResult.html,
      markdown: paperResult.markdown,
      title: paperResult.title,
      taskId: paperResult.taskId,
      artifact: paperResult.artifact,
      message: paperResult.message,
      diagnostics: paperResult.diagnostics,
    }
  }

  if (input.workflowId === 'formal_template') {
    throw new Error('正式模板链路尚未接入 Web，当前不能作为普通文稿生成。')
  }

  const result = await runDocumentGenerate(input)
  if (!result.success) {
    throw new Error(result.error || '生成失败')
  }

  return {
    mode: 'document',
    html: result.data?.html,
    markdown: result.data?.markdown,
    artifact: result.artifact,
    message: '初稿已生成',
    documentResult: result,
  }
}
