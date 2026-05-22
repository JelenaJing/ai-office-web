/**
 * excelAnalyzer.ts — MVP table analysis (xlsx / csv) → Markdown report.
 */

import fs from 'fs'
import * as XLSX from 'xlsx'
import { isLlmConfigured, invokeLlmJson } from '../../../modules/ai-gateway'

const SPREADSHEET_EXTS = new Set(['xlsx', 'csv'])

export function isSpreadsheetExt(ext: string): boolean {
  return SPREADSHEET_EXTS.has(ext.toLowerCase())
}

type ColumnKind = 'number' | 'text' | 'mixed' | 'empty'

interface ColumnProfile {
  name: string
  kind: ColumnKind
  missing: number
  missingPct: number
  numeric?: { min: number; max: number; mean: number; sampleCount: number }
  textTop?: Array<{ value: string; count: number }>
}

interface SheetProfile {
  name: string
  rowCount: number
  colCount: number
  columns: ColumnProfile[]
}

function isNumericCell(v: unknown): boolean {
  if (v == null || v === '') return false
  if (typeof v === 'number' && !Number.isNaN(v)) return true
  const s = String(v).trim()
  if (!s) return false
  const n = Number(s.replace(/,/g, ''))
  return !Number.isNaN(n)
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  return Number(String(v).trim().replace(/,/g, ''))
}

function profileSheet(name: string, rows: unknown[][]): SheetProfile {
  if (rows.length === 0) {
    return { name, rowCount: 0, colCount: 0, columns: [] }
  }

  const headerRow = rows[0] ?? []
  const colCount = Math.max(...rows.map((r) => r.length), headerRow.length)
  const dataRows = rows.slice(1)
  const rowCount = dataRows.length

  const columns: ColumnProfile[] = []

  for (let c = 0; c < colCount; c++) {
    const rawName = headerRow[c]
    const name = rawName != null && String(rawName).trim()
      ? String(rawName).trim()
      : `列${c + 1}`

    let missing = 0
    const numbers: number[] = []
    const textFreq = new Map<string, number>()

    for (const row of dataRows) {
      const cell = row[c]
      if (cell == null || String(cell).trim() === '') {
        missing++
        continue
      }
      if (isNumericCell(cell)) {
        numbers.push(toNumber(cell))
      } else {
        const key = String(cell).trim().slice(0, 80)
        textFreq.set(key, (textFreq.get(key) ?? 0) + 1)
      }
    }

    const total = dataRows.length || 1
    const missingPct = Math.round((missing / total) * 1000) / 10

    let kind: ColumnKind = 'empty'
    if (numbers.length > 0 && textFreq.size === 0) kind = 'number'
    else if (numbers.length === 0 && textFreq.size > 0) kind = 'text'
    else if (numbers.length > 0 && textFreq.size > 0) kind = 'mixed'
    else if (missing === total) kind = 'empty'

    const col: ColumnProfile = { name, kind, missing, missingPct }

    if (numbers.length > 0) {
      const sorted = [...numbers].sort((a, b) => a - b)
      const sum = numbers.reduce((a, b) => a + b, 0)
      col.numeric = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: Math.round((sum / numbers.length) * 100) / 100,
        sampleCount: numbers.length,
      }
    }

    if (textFreq.size > 0) {
      col.textTop = [...textFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }))
    }

    columns.push(col)
  }

  return { name, rowCount, colCount, columns }
}

function loadWorkbook(filePath: string, ext: string): XLSX.WorkBook {
  const buf = fs.readFileSync(filePath)
  if (ext === 'csv') {
    const text = buf.toString('utf-8')
    return XLSX.read(text, { type: 'string' })
  }
  return XLSX.read(buf, { type: 'buffer' })
}

function buildStructuralMarkdown(fileName: string, sheets: SheetProfile[]): string {
  const lines: string[] = [
    `# 表格分析报告`,
    ``,
    `**文件名：** ${fileName}`,
    ``,
    `**生成时间：** ${new Date().toLocaleString('zh-CN')}`,
    ``,
  ]

  for (const sheet of sheets) {
    lines.push(`## Sheet：${sheet.name}`)
    lines.push(``)
    lines.push(`- **行数（不含表头）：** ${sheet.rowCount}`)
    lines.push(`- **列数：** ${sheet.colCount}`)
    lines.push(``)

    if (sheet.columns.length === 0) {
      lines.push(`> 该工作表无数据行。`)
      lines.push(``)
      continue
    }

    lines.push(`### 字段列表`)
    lines.push(``)
    for (const col of sheet.columns) {
      lines.push(`- **${col.name}**（${col.kind === 'number' ? '数值' : col.kind === 'text' ? '文本' : col.kind === 'mixed' ? '混合' : '空'}）`)
    }
    lines.push(``)

    lines.push(`### 缺失值概览`)
    lines.push(``)
    lines.push(`| 字段 | 缺失行数 | 缺失比例 |`)
    lines.push(`| --- | ---: | ---: |`)
    for (const col of sheet.columns) {
      lines.push(`| ${col.name} | ${col.missing} | ${col.missingPct}% |`)
    }
    lines.push(``)

    const numericCols = sheet.columns.filter((c) => c.numeric)
    if (numericCols.length > 0) {
      lines.push(`### 数值列基础统计`)
      lines.push(``)
      lines.push(`| 字段 | 样本数 | 最小值 | 最大值 | 均值 |`)
      lines.push(`| --- | ---: | ---: | ---: | ---: |`)
      for (const col of numericCols) {
        const n = col.numeric!
        lines.push(`| ${col.name} | ${n.sampleCount} | ${n.min} | ${n.max} | ${n.mean} |`)
      }
      lines.push(``)
    }

    const textCols = sheet.columns.filter((c) => c.textTop && c.textTop.length > 0)
    if (textCols.length > 0) {
      lines.push(`### 文本列高频值概览`)
      lines.push(``)
      for (const col of textCols) {
        lines.push(`**${col.name}**`)
        for (const t of col.textTop!) {
          lines.push(`- \`${t.value}\`（${t.count} 次）`)
        }
        lines.push(``)
      }
    }
  }

  return lines.join('\n')
}

async function buildSuggestionsMarkdown(
  prompt: string,
  fileName: string,
  sheets: SheetProfile[],
): Promise<string> {
  const summary = sheets.map((s) => ({
    sheet: s.name,
    rows: s.rowCount,
    cols: s.colCount,
    fields: s.columns.map((c) => ({
      name: c.name,
      kind: c.kind,
      missingPct: c.missingPct,
    })),
  }))

  if (isLlmConfigured() && prompt.trim()) {
    try {
      const out = await invokeLlmJson<{ suggestions: string }>(
        [
          {
            role: 'system',
            content:
              '你是数据分析助手。根据表格结构摘要和用户分析需求，用中文 Markdown 输出「分析建议」小节（3-6 条要点），不要编造未提供的具体数值。',
          },
          {
            role: 'user',
            content: JSON.stringify({ fileName, userPrompt: prompt.trim(), summary }, null, 2),
          },
        ],
        { temperature: 0.3, maxTokens: 1200 },
      )
      if (out?.suggestions?.trim()) {
        return `## 分析建议（结合你的需求）\n\n${out.suggestions.trim()}\n`
      }
    } catch {
      // fall through to rule-based
    }
  }

  const lines: string[] = ['## 分析建议', '']
  if (prompt.trim()) {
    lines.push(`针对你的需求「${prompt.trim().slice(0, 200)}」，建议：`)
    lines.push('')
  }

  for (const sheet of sheets) {
    const highMissing = sheet.columns.filter((c) => c.missingPct >= 20)
    if (highMissing.length > 0) {
      lines.push(
        `- **${sheet.name}**：字段 ${highMissing.map((c) => c.name).join('、')} 缺失率较高，分析前建议补全或剔除空行。`,
      )
    }
    const numericCols = sheet.columns.filter((c) => c.kind === 'number')
    if (numericCols.length > 0) {
      lines.push(
        `- **${sheet.name}**：可对数值列 ${numericCols.map((c) => c.name).join('、')} 做分布、异常值（如超出均值±3σ）与趋势对比。`,
      )
    }
  }

  if (lines.length === 2) {
    lines.push('- 表格结构完整，可进一步按业务维度做分组汇总或时间序列分析。')
  }

  lines.push('')
  return lines.join('\n')
}

export interface AnalyzeSpreadsheetInput {
  absolutePath: string
  fileName: string
  ext: string
  prompt?: string
}

export async function analyzeSpreadsheet(
  input: AnalyzeSpreadsheetInput,
): Promise<string> {
  const ext = input.ext.toLowerCase()
  if (!isSpreadsheetExt(ext)) {
    throw new Error(`仅支持 xlsx / csv，当前为 .${ext}`)
  }

  const wb = loadWorkbook(input.absolutePath, ext)
  const sheetNames = wb.SheetNames.length > 0 ? wb.SheetNames : ['Sheet1']
  const profiles: SheetProfile[] = []

  for (const name of sheetNames) {
    const ws = wb.Sheets[name]
    if (!ws) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][]
    profiles.push(profileSheet(name, rows))
  }

  const structural = buildStructuralMarkdown(input.fileName, profiles)
  const suggestions = await buildSuggestionsMarkdown(
    input.prompt ?? '',
    input.fileName,
    profiles,
  )

  return `${structural}\n${suggestions}`
}
