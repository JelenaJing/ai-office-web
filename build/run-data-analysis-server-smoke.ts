import fs from 'fs'
import os from 'os'
import path from 'path'
import { analyzeSpreadsheetWithChart } from '../server/src/features/data-analysis/services/excelAnalyzer'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aios-data-analysis-'))
  const csvPath = path.join(dir, 'sales.csv')
  const svgPath = path.join(dir, 'chart.svg')
  try {
    fs.writeFileSync(csvPath, [
      'region,sales,cost',
      'North,120,80',
      'South,180,95',
      'East,160,90',
      'West,140,88',
    ].join('\n'), 'utf-8')

    const result = await analyzeSpreadsheetWithChart({
      absolutePath: csvPath,
      fileName: 'sales.csv',
      ext: 'csv',
      prompt: '按地区汇总销售额并生成图表',
    })
    fs.writeFileSync(svgPath, result.chartSvg, 'utf-8')

    const stat = fs.statSync(svgPath)
    assert(result.markdown.includes('表格分析报告'), 'markdown report should be generated')
    assert(result.summary.includes('工作表'), 'summary should describe parsed sheets')
    assert(result.chartSvg.includes('<svg'), 'chart SVG should be generated on server')
    assert(stat.size > 0, 'chart image file should be non-empty')
    assert(!result.markdown.includes('python'), 'frontend Python execution should not be required by server smoke')

    console.log('data analysis server smoke passed')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
