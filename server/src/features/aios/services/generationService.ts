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
} from '../../../modules/ai-gateway'
import { buildSlidePlanFromPrompt, writePptxFile } from '../../../modules/ppt'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { parseWorkspacePath, type Artifact } from '../../../artifacts/ArtifactStore'
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

  const content = await generateDocumentContent({ title: matter.title, prompt })

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

  const plan = await buildSlidePlanFromPrompt(matter.title, prompt)

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
    })

    appendArtifactToMatter(userId, matterId, artifact.id)
    logAudit(userId, matterId, 'generate_ppt_artifact', { artifactId: artifact.id })

    return { success: true, artifact }
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { /* best effort */ }
  }
}
