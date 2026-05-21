/**
 * createDocxSkill.ts — web.docx.create skill implementation
 *
 * Generates a real .docx file using AI Gateway (or fallback template).
 * Artifact is stored inside the workspace:
 *   server/data/workspaces/{userId}/{workspaceId}/artifacts/{artifactId}/
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx'
import {
  createArtifactDir,
  saveArtifactMetadata,
  parseWorkspacePath,
  type Artifact,
} from '../../artifacts/ArtifactStore'
import {
  generateDocumentContentDetailed,
  appendAiInvocationLog,
  hashPrompt,
  type GeneratedDocxContent,
} from '../../modules/ai-gateway'

const HEADING_COLOR = '2E74B5'

export interface CreateDocxInput {
  prompt?: string
  title?: string
  workspacePath: string
}

export type CreateDocxResult =
  | { success: true; artifact: Artifact }
  | { success: false; error: string }

function buildDocxParagraphs(
  content: GeneratedDocxContent,
  generatedAt: Date,
): Paragraph[] {
  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: content.title, bold: true, size: 32 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ]

  if (content.subtitle?.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: content.subtitle.trim(),
            color: '666666',
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    )
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `生成时间：${generatedAt.toLocaleString('zh-CN')}`,
          color: '888888',
          size: 20,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  )

  for (const section of content.sections) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            color: HEADING_COLOR,
            size: 26,
          }),
        ],
        spacing: { before: 280, after: 160 },
      }),
    )
    for (const para of section.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 24 })],
          spacing: { after: 200 },
        }),
      )
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '— 由 AI Office Web 自动生成 —',
          italics: true,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
    }),
  )

  return children
}

export async function runCreateDocxSkill(
  input: CreateDocxInput,
): Promise<CreateDocxResult> {
  if (!input.workspacePath) {
    return { success: false, error: '请先选择工作区（workspacePath 不能为空）' }
  }

  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return { success: false, error: `workspacePath 格式无效：${input.workspacePath}` }
  }

  const { userId, wsId: workspaceId } = parsed

  try {
    const artifactId = randomUUID()
    const title = input.title?.trim() || 'AI Office 文稿'
    const prompt = input.prompt?.trim() || ''
    const now = new Date()

    if (!prompt) {
      return { success: false, error: '请输入生成提示词' }
    }

    const { content, meta } = await generateDocumentContentDetailed({
      title,
      prompt,
    })

    if (meta.fallback) {
      console.warn(
        `[web.docx.create] fallback=true userId=${userId} workspaceId=${workspaceId} model=${meta.model}`,
      )
    }

    const outputJson = JSON.stringify(content)
    appendAiInvocationLog({
      userId,
      workspaceId,
      skillId: 'web.docx.create',
      model: meta.model,
      promptHash: hashPrompt(prompt),
      promptLength: prompt.length,
      outputLength: outputJson.length,
      fallback: meta.fallback,
    })

    const dir = createArtifactDir(userId, workspaceId, artifactId)

    const doc = new Document({
      sections: [
        {
          children: buildDocxParagraphs(content, now),
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const docxPath = path.join(dir, 'output.docx')
    fs.writeFileSync(docxPath, buffer)

    const artifact: Artifact = {
      id: artifactId,
      userId,
      workspaceId,
      workspacePath: input.workspacePath,
      type: 'document',
      title: content.title,
      editable: false,
      createdBySkillId: 'web.docx.create',
      createdAt: now.toISOString(),
      exports: [
        {
          format: 'docx',
          filename: 'output.docx',
          url: `/api/artifacts/${artifactId}/download`,
        },
      ],
    }

    saveArtifactMetadata(artifact)
    return { success: true, artifact }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
