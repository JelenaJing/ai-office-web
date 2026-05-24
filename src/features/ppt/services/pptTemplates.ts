export interface PptTemplateOption {
  id: string
  name: string
  description?: string
}

const STATIC_TEMPLATE_OPTIONS: PptTemplateOption[] = [
  {
    id: 'business_report',
    name: '商务汇报',
    description: '蓝色商务风，适合通用项目汇报与管理层演示。',
  },
  {
    id: 'academic_defense',
    name: '学术答辩',
    description: '深蓝学术风，适合论文答辩与研究汇报。',
  },
  {
    id: 'chinese_season',
    name: '中国风节气',
    description: '暖色中国风，适合文化传播与节气主题展示。',
  },
]

function normalizeTemplateId(templateId?: string | null): string {
  const value = String(templateId || '').trim()
  return value === 'web-default' ? 'business_report' : value
}

export function buildPptTemplateOptions(extraOptions: Array<PptTemplateOption> = []): PptTemplateOption[] {
  const merged = new Map<string, PptTemplateOption>()
  ;[...STATIC_TEMPLATE_OPTIONS, ...extraOptions].forEach((option) => {
    const id = normalizeTemplateId(option.id)
    if (!id) return
    merged.set(id, {
      id,
      name: option.name || id,
      description: option.description,
    })
  })
  return Array.from(merged.values())
}

export function resolvePptTemplateLabel(templateId?: string | null, options?: Array<PptTemplateOption>): string {
  const normalizedId = normalizeTemplateId(templateId)
  if (!normalizedId) return '未选择模板'
  const option = (options || STATIC_TEMPLATE_OPTIONS).find((item) => normalizeTemplateId(item.id) === normalizedId)
  return option?.name || normalizedId
}

export function resolvePptTemplateId(templateId?: string | null): string | null {
  const normalizedId = normalizeTemplateId(templateId)
  return normalizedId || null
}
