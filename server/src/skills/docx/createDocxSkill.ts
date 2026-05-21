/**
 * createDocxSkill.ts — web.docx.create skill implementation
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
  Header,
  Footer,
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
import {
  buildDocumentSessionFromContent,
  contentToHtml,
  contentToMarkdown,
  resolveHeaderFooterFromTemplate,
  resolvePageSpecFromTemplate,
  sanitizeFilename,
  type HeaderFooterSpecJson,
  type PageSpecJson,
} from './documentSessionBuilder'

const HEADING_COLOR = '2E74B5'

export interface CreateDocxInput {
  prompt?: string
  title?: string
  workspacePath: string
  params?: {
    title?: string
    templateSkillId?: string
    templateManifest?: { pageSpec?: PageSpecJson; headerFooter?: HeaderFooterSpecJson }
    knowledgeBaseIds?: string[]
    fileIds?: string[]
    currentDocumentText?: string
  }
}

export type CreateDocxResult =
  | {
      success: true
      artifact: Artifact
      data: {
        documentSession: ReturnType<typeof buildDocumentSessionFromContent>
        html: string
        markdown: string
      }
    }
  | { success: false; error: string }

function buildDocxParagraphs(
  content: GeneratedDocxContent,
  generatedAt: Date,
  headerFooter: HeaderFooterSpecJson,
): Paragraph[] {
  const children: Paragraph[] = []

  if (headerFooter.headerText?.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: headerFooter.headerText, color: '666666', size: 20 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
      }),
    )
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.title, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  )

  if (content.subtitle?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.subtitle.trim(), color: '666666', size: 22 })],
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
          new TextRun({ text: section.heading, bold: true, color: HEADING_COLOR, size: 26 }),
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

  if (headerFooter.footerText?.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: headerFooter.footerText.replace('{page}', '1'),
            color: '888888',
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    )
  }

  return children
}

function augmentPrompt(
  prompt: string,
  params?: CreateDocxInput['params'],
): string {
  const parts = [prompt]
  if (params?.knowledgeBaseIds?.length) {
    parts.push(`\n[知识库 ID: ${params.knowledgeBaseIds.join(', ')}]`)
  }
  if (params?.fileIds?.length) {
    parts.push(`\n[参考资料文件 ID: ${params.fileIds.join(', ')}]`)
  }
  if (params?.currentDocumentText?.trim()) {
    parts.push(`\n[当前文稿摘要]\n${params.currentDocumentText.trim().slice(0, 2000)}`)
  }
  return parts.join('')
}

export async function runCreateDocxFromGeneratedContent(
  input: CreateDocxInput,
  content: GeneratedDocxContent,
  skillId = 'web.docx.create',
): Promise<CreateDocxResult> {
  if (!input.workspacePath) {
    return { success: false, error: '请先选择工作区（workspacePath 不能为空）' }
  }

  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return { success: false, error: `workspacePath 格式无效：${input.workspacePath}` }
  }

  const { userId, wsId: workspaceId } = parsed
  const params = input.params
  const templateManifest = params?.templateManifest
  const pageSpec = resolvePageSpecFromTemplate(templateManifest)
  const headerFooter = resolveHeaderFooterFromTemplate(templateManifest)

  try {
    const artifactId = randomUUID()
    const now = new Date()
    const filename = sanitizeFilename(content.title, 'docx')
    const dir = createArtifactDir(userId, workspaceId, artifactId)

    const doc = new Document({
      sections: [
        {
          headers: headerFooter.headerText?.trim()
            ? {
                default: new Header({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: headerFooter.headerText, size: 18, color: '666666' })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              }
            : undefined,
          footers: headerFooter.footerText?.trim()
            ? {
                default: new Footer({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: headerFooter.footerText.replace('{page}', ''),
                          size: 18,
                          color: '888888',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              }
            : undefined,
          children: buildDocxParagraphs(content, now, headerFooter),
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(path.join(dir, filename), buffer)

    const artifact: Artifact = {
      id: artifactId,
      userId,
      workspaceId,
      workspacePath: input.workspacePath,
      type: 'document',
      title: content.title,
      editable: false,
      createdBySkillId: skillId,
      createdAt: now.toISOString(),
      exports: [
        {
          format: 'docx',
          filename,
          url: `/api/artifacts/${artifactId}/download`,
        },
      ],
    }

    saveArtifactMetadata(artifact)

    const documentSession = buildDocumentSessionFromContent(content, {
      generatorSkillId: 'document.generator.office_draft',
      templateSkillId: params?.templateSkillId ?? 'document.template.general',
      knowledgeBaseIds: params?.knowledgeBaseIds,
      fileIds: params?.fileIds,
      artifactId,
      pageSpec,
      headerFooter,
    })

    const html = contentToHtml(content, headerFooter)
    const markdown = contentToMarkdown(content)

    return {
      success: true,
      artifact,
      data: { documentSession, html, markdown },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function runCreateDocxSkill(
  input: CreateDocxInput,
): Promise<CreateDocxResult> {
  const params = input.params
  const title = params?.title?.trim() || input.title?.trim() || 'AI Office 文稿'
  const rawPrompt = input.prompt?.trim() || ''
  if (!rawPrompt) {
    return { success: false, error: '请输入生成提示词' }
  }
  const prompt = augmentPrompt(rawPrompt, params)

  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return { success: false, error: `workspacePath 格式无效：${input.workspacePath}` }
  }

  const { content, meta } = await generateDocumentContentDetailed({ title, prompt })

  if (meta.fallback) {
    console.warn(
      `[web.docx.create] fallback=true userId=${parsed.userId} workspaceId=${parsed.wsId} model=${meta.model}`,
    )
  }

  appendAiInvocationLog({
    userId: parsed.userId,
    workspaceId: parsed.wsId,
    skillId: 'web.docx.create',
    model: meta.model,
    promptHash: hashPrompt(prompt),
    promptLength: prompt.length,
    outputLength: JSON.stringify(content).length,
    fallback: meta.fallback,
  })

  return runCreateDocxFromGeneratedContent(input, content, 'web.docx.create')
}
