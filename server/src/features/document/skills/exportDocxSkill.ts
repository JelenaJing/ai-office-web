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
import { parseWorkspacePath, saveArtifactMetadata, createArtifactDir, type Artifact } from '../../../artifacts/ArtifactStore'
import {
  sanitizeFilename,
  type HeaderFooterSpecJson,
  type PageSpecJson,
  type WebDocumentSessionJson,
} from './documentSessionBuilder'

const HEADING_COLOR = '2E74B5'

export interface ExportDocxInput {
  workspacePath: string
  title?: string
  html?: string
  markdown?: string
  documentSession?: WebDocumentSessionJson
  pageSpec?: PageSpecJson
  headerFooter?: HeaderFooterSpecJson
}

export type ExportDocxResult =
  | { success: true; artifact: Artifact }
  | { success: false; error: string }

function htmlToPlainParagraphs(html: string): string[] {
  const stripped = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return stripped
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
}

function buildParagraphsFromSession(session: WebDocumentSessionJson): Paragraph[] {
  const children: Paragraph[] = []
  const hf = session.headerFooter
  if (hf.headerText?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: hf.headerText, color: '666666', size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    )
  }
  const blocks = session.content.blocks.length > 0
    ? session.content.blocks
    : htmlToPlainParagraphs(session.content.html || '').map((text, i) => ({
        id: `p-${i}`,
        type: 'paragraph' as const,
        text,
      }))
  for (const block of blocks) {
    if (block.type === 'heading') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              size: block.level === 1 ? 32 : 26,
              color: block.level === 1 ? undefined : HEADING_COLOR,
            }),
          ],
          spacing: { before: 200, after: 160 },
        }),
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.text, size: 24 })],
          spacing: { after: 200 },
        }),
      )
    }
  }
  if (hf.footerText?.trim()) {
    const footerText = hf.footerText.replace('{page}', '1')
    children.push(
      new Paragraph({
        children: [new TextRun({ text: footerText, color: '888888', size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    )
  }
  return children
}

export async function runExportDocxSkill(input: ExportDocxInput): Promise<ExportDocxResult> {
  if (!input.workspacePath) {
    return { success: false, error: '缺少 workspacePath' }
  }
  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return { success: false, error: 'workspacePath 无效' }
  }

  const session = input.documentSession
  const title = input.title?.trim()
    || session?.title
    || '文稿'
  const filename = sanitizeFilename(title, 'docx')

  try {
    const artifactId = randomUUID()
    const dir = createArtifactDir(parsed.userId, parsed.wsId, artifactId)
    const children = session
      ? buildParagraphsFromSession(session)
      : buildParagraphsFromSession({
          id: 'export',
          title,
          selectedGeneratorSkillId: '',
          selectedTemplateSkillId: '',
          selectedExporterSkillIds: [],
          sourceRefs: { knowledgeBaseIds: [], fileIds: [] },
          content: {
            blocks: htmlToPlainParagraphs(input.html || input.markdown || '').map((text, i) => ({
              id: `p-${i}`,
              type: 'paragraph',
              text,
            })),
            html: input.html,
            markdown: input.markdown,
          },
          pageSpec: input.pageSpec ?? {
            paperSize: 'A4',
            widthMm: 210,
            heightMm: 297,
            marginMm: { top: 25, right: 20, bottom: 25, left: 25 },
          },
          headerFooter: input.headerFooter ?? {},
          artifacts: [],
          updatedAt: new Date().toISOString(),
        })

    const hf = input.headerFooter ?? session?.headerFooter
    const doc = new Document({
      sections: [
        {
          headers: hf?.headerText?.trim()
            ? {
                default: new Header({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: hf.headerText, size: 18, color: '666666' })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              }
            : undefined,
          footers: hf?.footerText?.trim()
            ? {
                default: new Footer({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: hf.footerText.replace('{page}', ''),
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
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const docxPath = path.join(dir, filename)
    fs.writeFileSync(docxPath, buffer)

    const artifact: Artifact = {
      id: artifactId,
      userId: parsed.userId,
      workspaceId: parsed.wsId,
      workspacePath: input.workspacePath,
      type: 'document',
      title,
      editable: false,
      createdBySkillId: 'web.docx.export',
      createdAt: new Date().toISOString(),
      exports: [
        {
          format: 'docx',
          filename,
          url: `/api/artifacts/${artifactId}/download`,
        },
      ],
    }
    saveArtifactMetadata(artifact)
    return { success: true, artifact }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
