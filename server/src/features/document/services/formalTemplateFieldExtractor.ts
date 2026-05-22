/**
 * formalTemplateFieldExtractor.ts — Web-side field extractor
 *
 * Extracts {{field}} placeholders from template text.
 * Simplified equivalent of Electron's fieldExtractionService.ts (no OOXML blocks needed).
 */

const PLACEHOLDER_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g

export type FieldDataType = 'short_text' | 'long_text' | 'date' | 'name' | 'organization' | 'number'

export interface WebFieldSchema {
  fieldId: string
  label: string
  required: boolean
  dataType: FieldDataType
  hint?: string
  occurrences: number
}

/** Extract all {{field}} placeholders from template text */
export function extractFieldsFromText(text: string): WebFieldSchema[] {
  const seen = new Map<string, number>()
  PLACEHOLDER_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = PLACEHOLDER_PATTERN.exec(text)) !== null) {
    const label = match[1].trim()
    if (label) {
      seen.set(label, (seen.get(label) ?? 0) + 1)
    }
  }

  return Array.from(seen.entries()).map(([label, count]) => ({
    fieldId: slugifyFieldLabel(label),
    label,
    required: isRequiredField(label),
    dataType: inferDataType(label),
    hint: buildHint(label),
    occurrences: count,
  }))
}

/** Replace {{field}} placeholders with resolved values */
export function applyFieldValues(
  templateText: string,
  values: Record<string, string>,
): string {
  return templateText.replace(PLACEHOLDER_PATTERN, (_, label) => {
    const key = slugifyFieldLabel(label.trim())
    return values[key] ?? values[label.trim()] ?? `[${label.trim()}]`
  })
}

function slugifyFieldLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\u4e00-\u9fff\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function isRequiredField(label: string): boolean {
  return !label.includes('?') &&
    !label.includes('（可选）') &&
    !label.includes('选填') &&
    !label.includes('optional')
}

function inferDataType(label: string): FieldDataType {
  const s = label.toLowerCase()
  if (/日期|时间|年月日|date|年份/.test(s)) return 'date'
  if (/姓名|人名|联系人|负责人|签发人|收件人|发件人|name|起草人/.test(s)) return 'name'
  if (/单位|机构|部门|公司|组织|organization/.test(s)) return 'organization'
  if (/数量|金额|编号|号码|number|count|序号/.test(s)) return 'number'
  if (/内容|说明|描述|摘要|事由|背景|要求|目的/.test(s)) return 'long_text'
  return 'short_text'
}

function buildHint(label: string): string | undefined {
  const type = inferDataType(label)
  if (type === 'date') return '格式：XXXX年XX月XX日'
  if (type === 'organization') return '请填写完整单位名称'
  return undefined
}
