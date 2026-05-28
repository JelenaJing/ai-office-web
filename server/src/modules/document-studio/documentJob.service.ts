import fs from 'fs'
import path from 'path'
import type { DocumentGenerationJobInput, DocumentGenerationJobRecord } from '../capabilities/capability.types'
import { getCapabilityById } from '../capabilities/capability.registry'
import { runOpencodeCapability } from '../capabilities/executors/opencode.executor'
import { runDirectLlmGeneration } from '../capabilities/executors/directLlm.executor'
import { runPipelineCapability } from '../capabilities/executors/pipeline.executor'
import { createFromLlmJson } from './documentArtifact.service'
import { newStudioJobId } from './editorJsonUtils'
import { getDocumentTypeById } from './documentTypes'
import { isLlmConfigured } from '../../modules/ai-gateway'

const JOBS_DIR = path.resolve(__dirname, '../../../data/document-studio/jobs')

const STAGES = [
  '正在分析文稿类型',
  '正在整理材料',
  '正在调用写作能力',
  '正在生成初稿',
  '正在整理编辑结构',
  '即将完成',
]

function saveJob(job: DocumentGenerationJobRecord): void {
  fs.mkdirSync(JOBS_DIR, { recursive: true })
  fs.writeFileSync(path.join(JOBS_DIR, `${job.jobId}.json`), JSON.stringify(job, null, 2), 'utf-8')
}

export function getDocumentJob(jobId: string, userId?: string): DocumentGenerationJobRecord | null {
  const file = path.join(JOBS_DIR, `${jobId}.json`)
  if (!fs.existsSync(file)) return null
  const job = JSON.parse(fs.readFileSync(file, 'utf-8')) as DocumentGenerationJobRecord
  if (userId && job.userId !== userId) return null
  return job
}

export function createDocumentGenerationJob(input: DocumentGenerationJobInput): DocumentGenerationJobRecord {
  const docType = getDocumentTypeById(input.documentType)
  if (!docType) throw new Error(`未知文稿类型：${input.documentType}`)
  const cap = getCapabilityById(input.capabilityId)
  if (!cap) throw new Error(`未知能力：${input.capabilityId}`)

  const now = new Date().toISOString()
  const job: DocumentGenerationJobRecord = {
    jobId: newStudioJobId(),
    userId: input.userId,
    documentType: input.documentType,
    capabilityId: input.capabilityId,
    status: 'queued',
    progressStage: STAGES[0],
    createdAt: now,
    updatedAt: now,
  }
  saveJob(job)
  void processJobAsync(job, input, cap.runner)
  return job
}

async function processJobAsync(
  job: DocumentGenerationJobRecord,
  input: DocumentGenerationJobInput,
  runner: string,
): Promise<void> {
  const update = (patch: Partial<DocumentGenerationJobRecord>) => {
    Object.assign(job, patch, { updatedAt: new Date().toISOString() })
    saveJob(job)
  }

  try {
    update({ status: 'running', progressStage: STAGES[1] })

    if (runner === 'pipeline') {
      const result = await runPipelineCapability(
        getCapabilityById(input.capabilityId)!,
        {
          capabilityId: input.capabilityId,
          documentId: '',
          documentType: input.documentType,
          userId: input.userId,
          fields: input.fields,
        },
      )
      update({
        status: 'pending',
        pending: true,
        error: result.error,
        progressStage: STAGES[2],
      })
      return
    }

    update({ progressStage: STAGES[2] })

    if (runner === 'opencode') {
      update({ progressStage: STAGES[3] })
      const result = await runOpencodeCapability(getCapabilityById(input.capabilityId)!, {
        capabilityId: input.capabilityId,
        documentId: '',
        documentType: input.documentType,
        userId: input.userId,
        fields: input.fields,
        language: input.language,
        tone: input.tone,
        materials: input.materials,
      })
      if (!result.success || !result.documentId) {
        update({ status: 'failed', error: result.error || '生成失败' })
        return
      }
      update({
        status: 'succeeded',
        artifactId: result.artifactId,
        documentId: result.documentId,
        progressStage: STAGES[5],
        source: result.source,
        fallback: result.fallback,
        fallbackReason: result.fallbackReason,
      })
      return
    }

    update({ progressStage: STAGES[3] })
    const llmDoc = await runDirectLlmGeneration({
      documentType: input.documentType,
      capabilityId: input.capabilityId,
      fields: input.fields,
      language: input.language,
      tone: input.tone,
    })
    const record = createFromLlmJson({
      userId: input.userId,
      documentType: input.documentType,
      capabilityId: input.capabilityId,
      raw: llmDoc,
      source: isLlmConfigured() ? 'direct-llm' : 'llm-fallback',
      warnings: isLlmConfigured() ? [] : ['LLM 未配置，返回占位文稿结构'],
    })
    update({
      status: 'succeeded',
      artifactId: record.artifactId,
      documentId: record.documentId,
      progressStage: STAGES[5],
      source: isLlmConfigured() ? 'direct-llm' : 'llm-fallback',
      fallback: !isLlmConfigured(),
    })
  } catch (error) {
    update({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export function listJobProgressStages(): string[] {
  return [...STAGES]
}
