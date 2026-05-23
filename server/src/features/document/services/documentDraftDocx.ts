import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { DocumentDraft } from '../types'

function createBodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, font: 'FangSong' })],
    spacing: { after: 220, line: 420 },
    indent: { firstLine: 480 },
  })
}

function createCitationParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `依据：${text}`, italics: true, size: 20, color: '5B6B7F' })],
    spacing: { after: 160 },
  })
}

function createTable(table: NonNullable<DocumentDraft['sections'][number]['tables']>[number]): Table {
  const headerCells = table.headers.length > 0
    ? [
        new TableRow({
          children: table.headers.map((header) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 22 })] })],
          })),
        }),
      ]
    : []
  const rows = table.rows.map((row) => new TableRow({
    children: row.map((cell) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 22 })] })],
    })),
  }))
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerCells, ...rows],
  })
}

export async function buildDocumentDraftDocxBuffer(draft: DocumentDraft): Promise<Buffer> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      children: [new TextRun({ text: draft.title, bold: true, size: 32, font: 'SimHei' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
    }),
  ]

  draft.sections.forEach((section) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: section.title, bold: true, size: 28, font: 'SimHei', color: '1E3A5F' })],
      spacing: { before: 220, after: 180 },
    }))
    section.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        children.push(createBodyParagraph(paragraph))
      })
    section.tables?.forEach((table) => {
      if (table.title?.trim()) {
        children.push(new Paragraph({
          children: [new TextRun({ text: table.title.trim(), bold: true, size: 22 })],
          spacing: { before: 120, after: 120 },
          alignment: AlignmentType.CENTER,
        }))
      }
      children.push(createTable(table))
    })
    section.citations?.forEach((citation) => {
      children.push(createCitationParagraph(`${citation.label}${citation.note ? `（${citation.note}）` : ''}`))
    })
  })

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: draft.title, size: 18, color: '6B7280' })],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: '第 1 页', size: 18, color: '6B7280' }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
