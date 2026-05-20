/**
 * createDocxSkill.ts — web.docx.create skill implementation
 *
 * Generates a real .docx file using the `docx` npm package.
 * Artifact is stored inside the workspace:
 *   server/data/workspaces/{userId}/{workspaceId}/artifacts/{artifactId}/
 *
 * workspacePath is required; pass "web-workspace:{userId}:{wsId}".
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import {
  createArtifactDir,
  saveArtifactMetadata,
  parseWorkspacePath,
  type Artifact,
} from '../../artifacts/ArtifactStore'

export interface CreateDocxInput {
  prompt?: string
  title?: string
  workspacePath: string
}

export type CreateDocxResult =
  | { success: true; artifact: Artifact }
  | { success: false; error: string }

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
    const prompt = input.prompt?.trim() || '（未填写提示词）'
    const now = new Date()

    const dir = createArtifactDir(userId, workspaceId, artifactId)

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `生成时间：${now.toLocaleString('zh-CN')}`,
                  color: '888888',
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '提示词：', bold: true }),
                new TextRun({ text: prompt }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: '一、背景',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: '本文档由 AI Office Web 版 web.docx.create Skill 自动生成。后续版本将根据提示词接入大模型，自动补全正文内容。',
              spacing: { after: 240 },
            }),
            new Paragraph({
              text: '二、目标',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: '（此处将根据提示词内容自动生成目标说明。）',
              spacing: { after: 240 },
            }),
            new Paragraph({
              text: '三、方案',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: '（此处将根据提示词内容自动生成方案说明。）',
              spacing: { after: 240 },
            }),
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
          ],
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
      title,
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
