import { invokeLlmText, isLlmConfigured, type LlmMessage } from '../ai-gateway'

export interface BatteryAnalysisInput {
  n80_25: number | null
  n80_45: number | null
  knee25: number | null
  knee45: number | null
  capAtKnee25: number | null
  capAtKnee45: number | null
  critical25: number | null
  critical45: number | null
  maxCycle: number | null
  capAtMax25: number | null
  capAtMax45: number | null
  formulation: Record<string, number>
  extraAdditiveName: string
  extraAdditiveAmount: number
  experimentRows: Array<{
    fileName: string
    tempC: number
    kneeCycle: number | null
    capAtKnee: number | null
    criticalCycle: number | null
  }>
  userEntryCount: number
}

function buildAnalysisMessages(input: BatteryAnalysisInput): LlmMessage[] {
  const expLines =
    input.experimentRows.length > 0
      ? input.experimentRows
          .map(
            (r) =>
              `- ${r.fileName}（${r.tempC}℃）：knee cycle ${r.kneeCycle ?? '—'}，knee 容量 ${r.capAtKnee ?? '—'}，80% 临界 cycle ${r.criticalCycle ?? '—'}`
          )
          .join('\n')
      : '- 暂无上传实验数据'

  const formulationLines = Object.entries(input.formulation)
    .filter(([, v]) => Number.isFinite(v) && Math.abs(v) > 1e-9)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const user = `你是电化学与电池寿命分析专家。请根据以下模型预测与实验数据，撰写一份中文 Markdown 分析报告（面向研发人员）。

## 预测结果（25℃ / 45℃）
- 预测 N80（循环数）：25℃ = ${input.n80_25 ?? 'N/A'}，45℃ = ${input.n80_45 ?? 'N/A'}
- 25℃ knee cycle：${input.knee25 ?? '—'}，knee 处容量：${input.capAtKnee25 ?? '—'}
- 45℃ knee cycle：${input.knee45 ?? '—'}，knee 处容量：${input.capAtKnee45 ?? '—'}
- 25℃ 80% 临界 cycle：${input.critical25 ?? '—'}
- 45℃ 80% 临界 cycle：${input.critical45 ?? '—'}
- 预测最大 cycle：${input.maxCycle ?? '—'}；终点容量 25℃ = ${input.capAtMax25 ?? '—'}，45℃ = ${input.capAtMax45 ?? '—'}

## 当前配方与添加剂
- 添加剂：${input.extraAdditiveName}，用量：${input.extraAdditiveAmount}
- 配方组分：${formulationLines || '（默认）'}

## 实验上传（${input.userEntryCount} 组）
${expLines}

## 写作要求
1. 用 Markdown，包含：摘要、关键指标解读、配方影响、实验对比、风险与建议实验。
2. 不要编造未给出的数值；对缺失项写“数据 unavailable”。
3. 语言专业、简洁，每条建议可执行（下一步实验或配方调整）。
4. 不要输出 JSON。`

  return [
    {
      role: 'system',
      content:
        'You are a battery degradation analyst. Write professional Markdown reports in Chinese based only on provided numbers.',
    },
    { role: 'user', content: user },
  ]
}

export async function generateBatteryLifeMarkdownReport(
  input: BatteryAnalysisInput,
): Promise<{ markdown: string; configured: boolean }> {
  if (!isLlmConfigured()) {
    return {
      configured: false,
      markdown: buildFallbackMarkdown(input),
    }
  }

  const messages = buildAnalysisMessages(input)
  const markdown = await invokeLlmText(messages, {
    temperature: 0.35,
    maxTokens: 2800,
    timeoutMs: 90_000,
  })

  return { markdown: markdown.trim(), configured: true }
}

function buildFallbackMarkdown(input: BatteryAnalysisInput): string {
  const lines: string[] = [
    '## 摘要',
    '',
    `- 25℃ 预测 N80：${input.n80_25 ?? 'N/A'} cycles；45℃：${input.n80_45 ?? 'N/A'} cycles。`,
    `- 25℃ knee：${input.knee25 ?? '—'}；45℃ knee：${input.knee45 ?? '—'}。`,
    '',
    '## 关键指标',
    '',
    '| 温度 | N80 (cycle) | knee cycle | knee 容量 | 80% 临界 (cycle) |',
    '|------|------------|------------|-------------|---------------------|',
    `| 25℃ | ${input.n80_25 ?? '—'} | ${input.knee25 ?? '—'} | ${input.capAtKnee25 ?? '—'} | ${input.critical25 ?? '—'} |`,
    `| 45℃ | ${input.n80_45 ?? '—'} | ${input.knee45 ?? '—'} | ${input.capAtKnee45 ?? '—'} | ${input.critical45 ?? '—'} |`,
    '',
    '## 实验数据',
    '',
  ]

  if (input.experimentRows.length === 0) {
    lines.push('当前无上传实验曲线，建议上传 Cycle·Capacity 数据后再做 knee / 80% 对比。')
  } else {
    for (const r of input.experimentRows) {
      lines.push(
        `- **${r.fileName}**（${r.tempC}℃）：knee ${r.kneeCycle ?? '—'}，80% @ cycle ${r.criticalCycle ?? '—'}`
      )
    }
  }

  lines.push(
    '',
    '## 建议',
    '',
    '1. 在 25℃ 与 45℃ 分别验证 knee 与 80% 临界是否与预测一致。',
    '2. 根据配方与添加剂微调，观察预测曲线在 knee 区间的斜率变化。',
    '3. 若实验与预测偏差大，优先检查测试温度标注与容量归一化方式是否一致。',
    '',
    '> 说明：当前为规则化摘要。配置 LLM 后可在服务端生成更完整的机理分析。'
  )
  return lines.join('\n')
}