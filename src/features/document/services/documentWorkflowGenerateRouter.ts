import type { DocumentGenerateInput } from './documentEditSkills'
import {
  runPaperWorkflowGenerate,
  type PaperWorkflowGenerateResult,
  type PaperWorkflowMode,
} from './paperWorkflowAdapter'
import { runFormalTemplateGenerate, type FormalTemplateGenerateResult } from './formalTemplateAdapter'
import { runDocumentSkill } from './documentSkillAdapter'

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
  patch?: unknown
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

  const result = await runDocumentSkill({
    instruction: input.instruction,
    currentHtml: '',
    currentText: input.currentDocumentText ?? input.documentText ?? '',
    selectedText: input.selectedText,
    workflowId: input.workflowId ?? 'general',
    knowledgeBaseIds: input.knowledgeBaseIds ?? [],
    fileIds: input.fileIds ?? [],
    workspacePath: input.workspacePath,
  }, {
    operation: 'generate',
    title: input.title,
    language: input.language,
    outputLanguage: input.outputLanguage,
    extraContext: input.extraContext,
    generationMode: input.generationMode,
    templateDocument: input.templateDocument ?? undefined,
    documentTypePreset: input.documentTypePreset ?? undefined,
    templateSkillId: input.templateSkillId,
    templateManifest: input.templateManifest,
    workflowLabel: input.workflowLabel,
    workflowFields: input.workflowFields,
    outlineSections: input.outlineSections,
    documentKind: input.documentKind,
  })

  return {
    mode: 'document',
    html: result.html,
    markdown: result.markdown,
    message: result.message || '初稿已生成',
    patch: result.patch,
  }
}
