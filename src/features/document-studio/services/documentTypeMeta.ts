export const DOCUMENT_TYPE_DESCRIPTIONS: Record<
  string,
  { summary: string; pending?: boolean }
> = {
  general: { summary: '说明、方案、材料等通用写作场景' },
  news: { summary: '活动报道、会议新闻、发布会通稿' },
  report: { summary: '工作汇报、专题汇报、阶段总结' },
  notice: { summary: '通知、公告、公示类文稿' },
  minutes: { summary: '会议记录、决议与待办' },
  summary: { summary: '年度、季度或项目工作总结' },
  research: { summary: '调研背景、发现与建议' },
  proposal: { summary: '项目方案、实施计划' },
  paper: { summary: '学术论文多阶段写作', pending: true },
}

/** 前端展示用字段标签覆盖（API 字段名不变） */
export const FIELD_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  news: {
    topic: '主题 / 标题',
    coreEvent: '核心信息',
    highlights: '希望突出',
    wordCount: '字数',
    tone: '语气',
  },
  general: {
    requirements: '写作需求',
    extra: '用途',
    wordCount: '字数',
    tone: '语气',
  },
}

export type FormFieldSpec =
  | { kind: 'field'; name: string }
  | {
      kind: 'composite'
      label: string
      placeholder?: string
      /** 虚拟字段名，提交时写入 mapTo 各字段 */
      valueKey: string
      mapTo: string[]
    }
  | { kind: 'materials' }

/** 按文稿类型定制表单字段顺序与组合（未配置则使用 API 返回的全部 fields） */
export const FORM_FIELD_LAYOUTS: Record<string, FormFieldSpec[]> = {
  news: [
    { kind: 'field', name: 'topic' },
    { kind: 'field', name: 'coreEvent' },
    {
      kind: 'composite',
      label: '时间地点人物',
      placeholder: '例如：2026年5月26日 · 深圳 · 张三、李四',
      valueKey: 'whenWhereWho',
      mapTo: ['eventTime', 'location', 'participants'],
    },
    { kind: 'field', name: 'highlights' },
    { kind: 'field', name: 'wordCount' },
    { kind: 'field', name: 'tone' },
    { kind: 'materials' },
  ],
  general: [
    { kind: 'field', name: 'requirements' },
    { kind: 'field', name: 'extra' },
    { kind: 'field', name: 'tone' },
    { kind: 'field', name: 'wordCount' },
    { kind: 'materials' },
  ],
}

/** 提交前将虚拟 composite 字段写回 API 字段 */
export function mergeCompositeFields(
  documentTypeId: string,
  fields: Record<string, string>,
): Record<string, string> {
  const layout = FORM_FIELD_LAYOUTS[documentTypeId]
  if (!layout) return fields
  const next = { ...fields }
  for (const spec of layout) {
    if (spec.kind !== 'composite') continue
    const raw = next[spec.valueKey]?.trim()
    if (!raw) continue
    const parts = raw.split(/[·|｜|\n]/).map(s => s.trim()).filter(Boolean)
    spec.mapTo.forEach((name, i) => {
      next[name] = parts[i] ?? raw
    })
  }
  return next
}

export function readCompositeValue(
  spec: Extract<FormFieldSpec, { kind: 'composite' }>,
  values: Record<string, string>,
): string {
  if (values[spec.valueKey]?.trim()) return values[spec.valueKey]
  const joined = spec.mapTo.map(n => values[n]?.trim()).filter(Boolean).join(' · ')
  return joined
}
