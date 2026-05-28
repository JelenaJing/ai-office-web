import fs from 'fs'
import path from 'path'
import type { DocumentCapabilityDef, CapabilityRunInput, CapabilityRunResult } from '../capability.types'
import {
  createFromLlmJson,
  createStudioArtifactFromOpenCodeOutputs,
  getDocumentPlainText,
  loadStudioDocument,
} from '../../document-studio/documentArtifact.service'
import {
  readOpenCodeOutputJson,
  runOpenCodeJob,
  validateGenerationOutputs,
} from '../../opencode/opencodeJobRunner'
import {
  humanizerPatchPath,
  repairHumanizerPatchFromJobArtifacts,
  writeHumanizerJobDebug,
  type HumanizerJobDebugInfo,
} from '../../opencode/humanizerPatchOutput'
import { isRealAiosSkillReady } from '../../opencode/opencodeStatus.service'
import { isSkillInstalledAtAios, SkillNotInstalledError } from '../../opencode/skillMaterializer'
import { runDirectLlmCapability } from './directLlm.executor'
import { runDirectLlmGeneration } from './directLlm.executor'
import { isLlmConfigured } from '../../../modules/ai-gateway'

const GENERATION_PROMPT = `你是 AI Office 的文稿生成执行器。

请使用 OpenCode skill：{skillName}。

输入文件：
- input/document-request.json
- input/materials/（如有）

输出要求（必须全部写入 job 目录的 output/）：
- output/document.json
- output/editor.json（TipTap 可加载的 ProseMirror JSON，每个 block 带 blockId）
- output/document.md
- output/index.html
- output/result.json（含 artifactTitle、documentType、warnings）

约束：保留输入事实；不编造数据。`

const HUMANIZER_PROMPT = `你是 AI Office Document Studio 的文稿局部修改执行器。当前工作目录即 job 根目录。

【必须】通过 OpenCode skill「humanizer」完成改写（技能入口：.opencode/skills/humanizer/SKILL.md，详细规则见 reference/SKILL.md）。
【禁止】在 shell 中执行 opencode humanizer 等子命令（不存在）。
【禁止】访问 /.opencode 等根目录绝对路径。

步骤：
1. Read input/selection.json 与 input/document-context.json
2. 按 humanizer 规则改写 selection.text（保留事实与人名）
3. 用 Write 工具写入 output/patch.json（唯一交付物），JSON 格式：
{"type":"replace_selection","text":"改写后全文","summary":["已完成深度降重"],"warnings":[]}

不要输出 Markdown 说明，不要生成完整文稿。`

function requiresAiosSkill(skillId: string): boolean {
  return skillId === 'humanizer' || skillId === 'news-writer'
}

async function runGenerationWithFallback(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
  skillId: string,
): Promise<CapabilityRunResult> {
  if (skillId === 'news-writer' && !isSkillInstalledAtAios('news-writer')) {
    return generationLlmFallback(cap, input, skillId, 'news-writer 未安装在 aios-skills，已使用 LLM 回退。')
  }

  const jobId = `oc_${Date.now()}`
  let run
  try {
    run = await runOpenCodeJob({
      jobId,
      skillId,
      taskPrompt: GENERATION_PROMPT.replace('{skillName}', skillId),
      inputFiles: {
        documentType: input.documentType,
        fields: input.fields,
        language: input.language || 'zh-CN',
        tone: input.tone || 'formal',
      },
      timeoutMs: 300_000,
      requireAiosSkills: requiresAiosSkill(skillId),
    })
  } catch (error) {
    if (error instanceof SkillNotInstalledError) {
      return generationLlmFallback(cap, input, skillId, error.message)
    }
    throw error
  }

  if (run.skillNotInstalled) {
    return generationLlmFallback(cap, input, skillId, run.error || 'Skill 未安装')
  }

  const validation = validateGenerationOutputs(run.jobDir)
  const documentJson = readOpenCodeOutputJson<{
    title?: string
    blocks?: Array<{ type?: string; level?: number; role?: string; text?: string; items?: string[] }>
  }>(run.jobDir, 'output/document.json')
  const editorJson = readOpenCodeOutputJson<Record<string, unknown>>(run.jobDir, 'output/editor.json')
  const resultJson = readOpenCodeOutputJson<{ warnings?: string[] }>(run.jobDir, 'output/result.json')

  if (run.success && validation.ok && editorJson && documentJson) {
    try {
      const record = createStudioArtifactFromOpenCodeOutputs({
        userId: input.userId,
        documentType: input.documentType,
        capabilityId: cap.id,
        jobDir: run.jobDir,
        documentJson: {
          title: documentJson.title,
          blocks: documentJson.blocks as Array<{
            type?: string
            level?: number
            role?: string
            text?: string
            items?: string[]
          }>,
        },
        editorJson,
        warnings: resultJson?.warnings,
      })
      return {
        success: true,
        resultType: 'new_artifact',
        source: 'opencode',
        artifactId: record.artifactId,
        documentId: record.documentId,
        fallback: false,
      }
    } catch (err) {
      return generationLlmFallback(
        cap,
        input,
        skillId,
        `OpenCode 输出解析失败：${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  const reasons: string[] = []
  if (!run.success) reasons.push(run.error || 'OpenCode 执行失败')
  if (!validation.ok) reasons.push(`缺少输出文件：${validation.missing.join(', ')}`)
  if (!editorJson) reasons.push('缺少 output/editor.json')
  if (!documentJson) reasons.push('缺少 output/document.json')

  return generationLlmFallback(cap, input, skillId, reasons.join('；'))
}

async function generationLlmFallback(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
  skillId: string,
  fallbackReason: string,
): Promise<CapabilityRunResult> {
  const llmDoc = await runDirectLlmGeneration({
    documentType: input.documentType,
    capabilityId: cap.id,
    fields: input.fields || {},
    language: input.language,
    tone: input.tone,
  })
  const record = createFromLlmJson({
    userId: input.userId,
    documentType: input.documentType,
    capabilityId: cap.id,
    raw: llmDoc,
    source: 'llm-fallback',
    warnings: [fallbackReason, isLlmConfigured() ? '已使用 direct-llm 回退。' : 'LLM 未配置，占位结构。'],
  })
  return {
    success: true,
    resultType: 'new_artifact',
    source: 'llm-fallback',
    fallback: true,
    fallbackReason,
    artifactId: record.artifactId,
    documentId: record.documentId,
  }
}

export async function runOpencodeCapability(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
): Promise<CapabilityRunResult> {
  const skillId = cap.skillId || cap.id

  if (cap.actionType === 'generate_document') {
    return runGenerationWithFallback(cap, input, skillId)
  }

  if (cap.id === 'humanize-document-advanced' || (cap.skillId === 'humanizer' && cap.runner === 'opencode')) {
    return runHumanizerOpencode(cap, input)
  }

  return {
    success: false,
    resultType: 'error',
    error: `未支持的 OpenCode 能力：${cap.id}`,
  }
}

async function runHumanizerOpencode(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
): Promise<CapabilityRunResult> {
  if (!isRealAiosSkillReady('humanizer')) {
    return {
      success: false,
      resultType: 'error',
      error: `AI降重（humanizer）未安装。请在 ${process.env.AIOS_SKILLS_ROOT || '/data/darebug/aios-skills'}/humanizer 安装 SKILL.md 与 metadata.json，或使用选区「AI降重」快速模式。`,
    }
  }

  const record = loadStudioDocument(input.documentId, input.userId)
  if (!record) {
    return { success: false, resultType: 'error', error: '文稿不存在或无权限访问' }
  }

  const selectionText = String(input.selection?.text || '').trim()
  if (!selectionText) {
    return { success: false, resultType: 'error', error: '高级 AI 降重需要先选中要处理的文本。' }
  }

  const jobId = `oc_${Date.now()}`
  const run = await runOpenCodeJob({
    jobId,
    skillId: 'humanizer',
    taskPrompt: HUMANIZER_PROMPT,
    selectionJson: {
      text: selectionText,
      blockIds: input.selection?.blockIds,
      from: input.selection?.from,
      to: input.selection?.to,
      instruction: input.instruction,
    },
    documentContextJson: {
      documentId: record.documentId,
      title: record.title,
      documentType: record.documentType,
      language: input.language || 'zh-CN',
    },
    attachedFiles: [
      'input/selection.json',
      'input/document-context.json',
      '.opencode/skills/humanizer/SKILL.md',
    ],
    timeoutMs: 180_000,
    requireAiosSkills: true,
  })

  const materializedSkillMd = path.join(run.jobDir, '.opencode/skills/humanizer/SKILL.md')
  const selectionPath = path.join(run.jobDir, 'input', 'selection.json')
  const documentContextPath = path.join(run.jobDir, 'input', 'document-context.json')
  const stdoutLogPath = path.join(run.jobDir, 'logs', 'stdout.log')
  const stderrLogPath = path.join(run.jobDir, 'logs', 'stderr.log')
  const patchJsonPath = humanizerPatchPath(run.jobDir)

  let patchJson = readOpenCodeOutputJson<{
    type?: string
    text?: string
    summary?: string[]
    warnings?: string[]
  }>(run.jobDir, 'output/patch.json')

  let repairWarnings: string[] = []
  let repaired = false

  if (!patchJson?.text?.trim()) {
    const repair = await repairHumanizerPatchFromJobArtifacts({
      jobDir: run.jobDir,
      selectionText,
    })
    if (repair.patch) {
      patchJson = repair.patch
      repairWarnings = repair.warnings
      repaired = true
    }
  }

  const debugInfo: HumanizerJobDebugInfo = {
    jobDir: run.jobDir,
    materializedSkillPath: materializedSkillMd,
    selectionPath,
    documentContextPath,
    stdoutLogPath,
    stderrLogPath,
    patchJsonPath,
    patchJsonExists: fs.existsSync(patchJsonPath),
    opencodeExitOk: run.success,
    fallbackReason: run.error,
    repaired,
    repairWarnings: repairWarnings.length ? repairWarnings : undefined,
  }
  const debugPath = writeHumanizerJobDebug(run.jobDir, debugInfo)
  console.info('[document-studio][humanizer]', JSON.stringify({ ...debugInfo, debugPath }))

  if (run.skillNotInstalled) {
    return {
      success: false,
      resultType: 'error',
      error: run.error || 'humanizer Skill 未安装',
    }
  }

  if (patchJson?.text?.trim() && fs.existsSync(materializedSkillMd)) {
    const warnings = [...(patchJson.warnings ?? []), ...repairWarnings]
    return {
      success: true,
      resultType: 'patch',
      source: 'opencode',
      patch: {
        type: 'replace_selection',
        text: patchJson.text.trim(),
        summary: patchJson.summary ?? ['已完成深度降重'],
        warnings: warnings.length ? warnings : undefined,
        selection: input.selection,
      },
    }
  }

  if (!run.success) {
    const llmFallback = await runDirectLlmCapability(
      { ...cap, id: 'humanize-selection', runner: 'direct-llm', skillId: 'humanizer' },
      input,
    )
    if (llmFallback.success && llmFallback.patch) {
      return {
        ...llmFallback,
        fallback: true,
        fallbackReason: run.error || 'OpenCode humanizer 未完成',
        source: 'llm-fallback',
      }
    }
    return {
      success: false,
      resultType: 'error',
      error:
        run.error ||
        '高级 AI 降重（OpenCode + humanizer）未能完成。请检查 opencode 日志或改用选区「AI降重」。',
      source: 'opencode',
    }
  }

  return {
    success: false,
    resultType: 'error',
    error: `OpenCode 未生成有效的 output/patch.json。调试：${debugPath}`,
    source: 'opencode',
  }
}
