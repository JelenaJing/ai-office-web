import { runDocumentGenerate, type DocumentGenerateInput, type DocumentSkillResult } from './documentEditSkills'
import {
  runPaperWorkflowGenerate,
  type PaperWorkflowGenerateResult,
  type PaperWorkflowMode,
} from './paperWorkflowAdapter'
import { runFormalTemplateGenerate, type FormalTemplateGenerateResult } from './formalTemplateAdapter'

export interface WorkflowGenerateInput extends DocumentGenerateInput {
  signal?: AbortSignal
  paperMode?: PaperWorkflowMode
  onStatus?: (message: string) => void
  onProgress?: (progress: { step: string; message: string }) => void
  onContent?: (payload: { html?: string; markdown?: string }) => void
  /** For formal_template: which preset to use */
  formalTemplatePresetId?: string
  formalTemplateCustomText?: string
  formalTemplateFieldOverrides?: Record<string, string>
}

export interface WorkflowGenerateResult {
  mode: 'document' | 'paper' | 'formal_template'
  html?: string
  markdown?: string
  title?: string
  taskId?: string
  artifact?: unknown
  message?: string
  diagnostics?: {
    chain: string
    steps: string[]
    partialMissing?: string[]
  }
  documentResult?: DocumentSkillResult
  formalTemplateResult?: FormalTemplateGenerateResult
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
    input.onStatus?.('正在启动正式模板链路…')
    const ftResult = await runFormalTemplateGenerate({
      instruction: input.instruction.trim(),
      presetId: input.formalTemplatePresetId,
      customTemplateText: input.formalTemplateCustomText,
      fieldOverrides: input.formalTemplateFieldOverrides,
      language: input.language ?? 'zh',
      workspacePath: input.workspacePath,
      extraContext: input.extraContext,
      onStatus: input.onStatus,
      onProgress: input.onProgress,
      onContent: input.onContent,
      signal: input.signal,
    })

    return {
      mode: 'formal_template',
      html: ftResult.html,
      markdown: ftResult.markdown,
      title: ftResult.title,
      taskId: ftResult.taskId,
      artifact: ftResult.artifact,
      message: ftResult.message,
      diagnostics: ftResult.diagnostics,
      formalTemplateResult: ftResult,
    }
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
