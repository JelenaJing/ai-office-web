export type AnalysisModelId = 'battery_life_prediction_a' | string

export interface AnalysisModelDefinition {
  id: AnalysisModelId
  name: string
  description: string
  supportedExtensions: string[]
  excelFormatHint: string
  csvFormatHint: string
  templateFilename: string
}

export const BATTERY_LIFE_MODEL_ID = 'battery_life_prediction_a' as const

export const ANALYSIS_MODEL_REGISTRY: AnalysisModelDefinition[] = [
  {
    id: BATTERY_LIFE_MODEL_ID,
    name: '模型A：电池寿命预测',
    description:
      '基于 25℃ / 45℃ 循环容量数据拟合衰减模型，预测 N80（容量衰减至 80% 时的循环次数）并生成交互式预测曲线。',
    supportedExtensions: ['csv', 'xlsx', 'xls'],
    excelFormatHint:
      'Excel 需包含 **25℃** 与 **45℃** 两个工作表；第一列为 Cycle（循环次数），后续列为 E0039、E0040 等样本容量（mAh 或归一化容量）。',
    csvFormatHint:
      'CSV 需包含四列：**temperature**（25 或 45）、**cycle**、**sample_id**（如 E0039）、**capacity**（容量数值）。',
    templateFilename: 'battery_life_template',
  },
]

export function getAnalysisModel(modelId: string): AnalysisModelDefinition | undefined {
  const key = String(modelId || '').trim()
  return ANALYSIS_MODEL_REGISTRY.find((m) => m.id === key)
}

export function isBatteryLifeModel(modelId: string): boolean {
  return String(modelId || '').trim() === BATTERY_LIFE_MODEL_ID
}

export function assertSupportedExtension(modelId: string, ext: string): void {
  const model = getAnalysisModel(modelId)
  if (!model) return
  const normalized = String(ext || '').toLowerCase().replace(/^\./, '')
  if (!model.supportedExtensions.includes(normalized)) {
    throw new Error(
      `文件格式不支持：模型「${model.name}」仅支持 ${model.supportedExtensions.map((e) => `.${e}`).join('、')}`,
    )
  }
}
