/**
 * generationService.ts — Generate artifacts from Matter context
 * Supports: email reply draft, document (Markdown), PPT presentation
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  invokeLlmText,
  isLlmConfigured,
  generateDocumentContent,
  type GeneratedDocxContent,
} from '../../../modules/ai-gateway'
import { buildSlidePlanFromPrompt, writePptxFile, type GeneratedSlidePlan } from '../../../modules/ppt'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { parseWorkspacePath, type Artifact, type ArtifactKnowledgeRef, type ArtifactSourceRef } from '../../../artifacts/ArtifactStore'
import { getMatter, getEvidence } from './matterService'
import { readMatters, writeMatters } from './matterStore'
import { logAudit } from './auditTrailService'

export type GenerationResult =
  | { success: true; artifact: Artifact }
  | { success: false; error: string }

// ── Internal helpers ──────────────────────────────────────────────────────────

function appendArtifactToMatter(userId: string, matterId: string, artifactId: string): void {
  const index = readMatters(userId)
  const idx = index.matters.findIndex(m => m.id === matterId)
  if (idx === -1) return
  if (!index.matters[idx].artifactIds.includes(artifactId)) {
    index.matters[idx].artifactIds.push(artifactId)
    index.matters[idx].updatedAt = new Date().toISOString()
    writeMatters(userId, index)
  }
}

function buildEvidenceSummary(evidence: ReturnType<typeof getEvidence>): string {
  return evidence
    .slice(0, 8)
    .map(e => `- [${e.type}] ${e.title}${e.content ? '：' + e.content.slice(0, 150) : ''}`)
    .join('\n')
}

function buildArtifactSourceRefs(matterId: string, evidence: ReturnType<typeof getEvidence>): ArtifactSourceRef[] {
  return [
    { type: 'matter', id: matterId, label: 'AIOS Matter' },
    ...evidence.map((item) => ({
      type: item.type,
      id: item.artifactId || item.sourceRef || item.id,
      label: item.title,
    })),
  ]
}

function buildKnowledgeRefs(evidence: ReturnType<typeof getEvidence>): ArtifactKnowledgeRef[] {
  return evidence
    .filter((item) => item.type === 'knowledge')
    .map((item) => ({
      documentId: item.sourceRef || item.id,
      title: item.title,
      citationStatus: item.knowledgeVerificationStatus ?? 'partial',
    }))
}

function buildMatterDocumentFallback(input: {
  title: string
  goal?: string
  evidenceSummary: string
}): GeneratedDocxContent {
  return {
    title: input.title || '事项处理文稿',
    sections: [
      {
        heading: '事项背景',
        paragraphs: [
          `本事项围绕「${input.title}」展开，目标是${input.goal || '明确处理目标、梳理相关材料并形成可执行输出'}。`,
        ],
      },
      {
        heading: '相关材料',
        paragraphs: [
          input.evidenceSummary || '当前暂无外部证据材料，后续可继续补充邮件、附件、知识库记录或人工说明。',
        ],
      },
      {
        heading: '处理建议',
        paragraphs: [
          '建议先确认事项边界与责任人，再按材料收集、方案整理、输出确认的顺序推进，避免遗漏关键依据。',
        ],
      },
      {
        heading: '后续安排',
        paragraphs: [
          '下一步可根据该 Matter 继续生成 PPT、回复草稿或决策包，并在 Artifact 中保留来源关系以便追溯。',
        ],
      },
    ],
  }
}

async function generateMatterDocumentContent(input: {
  title: string
  goal?: string
  prompt: string
  evidenceSummary: string
}): Promise<GeneratedDocxContent> {
  let timeout: NodeJS.Timeout | undefined
  const fallback = buildMatterDocumentFallback(input)
  try {
    return await Promise.race([
      generateDocumentContent({ title: input.title, prompt: input.prompt }),
      new Promise<GeneratedDocxContent>((resolve) => {
        timeout = setTimeout(() => {
          console.warn('[aios] Matter document generation timed out; using deterministic fallback')
          resolve(fallback)
        }, Number(process.env.AIOS_MATTER_DOCUMENT_TIMEOUT_MS ?? 20_000))
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

function buildMatterPptFallback(input: {
  title: string
  prompt: string
}): GeneratedSlidePlan {
  return {
    title: input.title || 'Matter 汇报',
    slides: [
      { type: 'cover', title: input.title || 'Matter 汇报', subtitle: 'AIOS Matter 自动生成' },
      { type: 'toc', title: '目录', items: ['事项背景', '材料依据', '处理建议', '后续安排'] },
      { type: 'content', title: '事项背景', items: ['围绕当前 Matter 目标整理汇报内容。', input.prompt.slice(0, 120)] },
      { type: 'content', title: '材料依据', items: ['已关联的邮件、附件、知识库或人工材料将作为来源关系保留。'] },
      { type: 'content', title: '处理建议', items: ['明确责任人和时间节点。', '持续补充证据材料。', '输出文稿、PPT 或回复草稿。'] },
      { type: 'summary', title: '后续安排', items: ['继续完善 Matter 决策包并跟踪处理结果。'] },
    ],
  }
}

async function buildMatterSlidePlan(input: {
  title: string
  prompt: string
}): Promise<GeneratedSlidePlan> {
  let timeout: NodeJS.Timeout | undefined
  const fallback = buildMatterPptFallback(input)
  try {
    return await Promise.race([
      buildSlidePlanFromPrompt(input.title, input.prompt),
      new Promise<GeneratedSlidePlan>((resolve) => {
        timeout = setTimeout(() => {
          console.warn('[aios] Matter PPT plan generation timed out; using deterministic fallback')
          resolve(fallback)
        }, Number(process.env.AIOS_MATTER_PPT_TIMEOUT_MS ?? 18_000))
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

// ── Reply Draft ───────────────────────────────────────────────────────────────

export async function generateReplyDraft(
  userId: string,
  matterId: string,
): Promise<GenerationResult> {
  const matter = getMatter(userId, matterId)
  if (!matter) return { success: false, error: '事项不存在' }

  const evidence = getEvidence(userId, matterId)
  const emailEv = evidence.find(e => e.type === 'email')

  let draftText: string

  if (isLlmConfigured() && emailEv) {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      {
        role: 'system',
        content:
          '你是一名专业的商务助手，请根据邮件内容草拟一封简洁、专业的中文回复。' +
          '回复应礼貌、简洁，包含对邮件的确认、处理说明或所需信息的请求。',
      },
      {
        role: 'user',
        content:
          `邮件主题：${emailEv.title}\n\n` +
          `邮件内容：\n${emailEv.content}\n\n` +
          '请草拟一封回复邮件。',
      },
    ]
    draftText = await invokeLlmText(messages)
  } else {
    const sourceInfo = emailEv ? `关于「${emailEv.title}」` : `关于「${matter.title}」`
    draftText =
      `您好，\n\n感谢您的来信。\n\n${sourceInfo}，我已收到您的邮件，正在处理中。` +
      `如有进展将尽快与您联系。\n\n如需补充材料或信息，请告知。\n\n此致\n敬礼`
  }

  const artifact = saveSkillArtifact({
    userId,
    workspacePath: matter.workspacePath,
    skillId: 'aios.generate_reply',
    type: 'email_draft',
    title: `回复草稿 — ${matter.title}`,
    filename: 'reply-draft.txt',
    format: 'text',
    content: draftText,
    matterId,
    emailId: emailEv?.sourceRef,
    sourceRefs: buildArtifactSourceRefs(matterId, evidence),
    knowledgeRefs: buildKnowledgeRefs(evidence),
  })

  appendArtifactToMatter(userId, matterId, artifact.id)
  logAudit(userId, matterId, 'generate_reply_draft', { artifactId: artifact.id })

  return { success: true, artifact }
}

// ── Document Artifact ─────────────────────────────────────────────────────────

export async function generateDocumentArtifact(
  userId: string,
  matterId: string,
): Promise<GenerationResult> {
  const matter = getMatter(userId, matterId)
  if (!matter) return { success: false, error: '事项不存在' }

  const evidence = getEvidence(userId, matterId)
  const evidenceSummary = buildEvidenceSummary(evidence)

  const prompt =
    `基于以下事项信息，生成一份工作文档：\n\n` +
    `事项：${matter.title}\n目标：${matter.goal || '（未填写）'}\n\n` +
    `相关材料：\n${evidenceSummary || '（暂无证据材料）'}`

  const content = await generateMatterDocumentContent({
    title: matter.title,
    goal: matter.goal,
    prompt,
    evidenceSummary,
  })

  let markdown = `# ${content.title}\n\n`
  for (const section of content.sections) {
    markdown += `## ${section.heading}\n\n`
    for (const para of section.paragraphs) {
      markdown += `${para}\n\n`
    }
  }

  const artifact = saveSkillArtifact({
    userId,
    workspacePath: matter.workspacePath,
    skillId: 'aios.generate_document',
    type: 'document',
    title: matter.title,
    filename: 'document.md',
    format: 'md',
    content: markdown,
    matterId,
    documentId: matterId,
    sourceRefs: buildArtifactSourceRefs(matterId, evidence),
    knowledgeRefs: buildKnowledgeRefs(evidence),
  })

  appendArtifactToMatter(userId, matterId, artifact.id)
  logAudit(userId, matterId, 'generate_document_artifact', { artifactId: artifact.id })

  return { success: true, artifact }
}

// ── PPT Artifact ──────────────────────────────────────────────────────────────

export async function generatePptArtifact(
  userId: string,
  matterId: string,
): Promise<GenerationResult> {
  const matter = getMatter(userId, matterId)
  if (!matter) return { success: false, error: '事项不存在' }

  const parsed = parseWorkspacePath(matter.workspacePath)
  if (!parsed) return { success: false, error: 'workspacePath 无效' }

  const evidence = getEvidence(userId, matterId)
  const evidenceSummary = buildEvidenceSummary(evidence.slice(0, 5))

  const prompt =
    `事项：${matter.title}\n目标：${matter.goal || '（未填写）'}\n\n` +
    `相关材料：\n${evidenceSummary || '（暂无）'}`

  const plan = await buildMatterSlidePlan({ title: matter.title, prompt })

  const safeName = matter.title.replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'
  const filename = `${safeName}.pptx`

  // Write PPTX to a temp path, then pass buffer to saveSkillArtifact
  const tmpPath = path.join(os.tmpdir(), `${randomUUID()}-${filename}`)
  try {
    await writePptxFile(plan, tmpPath)
    const buffer = fs.readFileSync(tmpPath)

    const artifact = saveSkillArtifact({
      userId,
      workspacePath: matter.workspacePath,
      skillId: 'aios.generate_ppt',
      type: 'presentation',
      title: plan.title,
      filename,
      format: 'pptx',
      content: buffer,
      matterId,
      deckId: matterId,
      sourceRefs: buildArtifactSourceRefs(matterId, evidence),
      knowledgeRefs: buildKnowledgeRefs(evidence),
    })

    appendArtifactToMatter(userId, matterId, artifact.id)
    logAudit(userId, matterId, 'generate_ppt_artifact', { artifactId: artifact.id })

    return { success: true, artifact }
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { /* best effort */ }
  }
}
