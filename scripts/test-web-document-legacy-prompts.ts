/**
 * 校验 Web 文稿 legacy prompt 配方（可无 LLM，仅测 prompt 构建与启发式规则）
 *
 * 运行：npx tsx scripts/test-web-document-legacy-prompts.ts
 */
import {
  buildLegacyWritingAssistantSystemPrompt,
  buildLegacyWritingAssistantUserPrompt,
  buildRewriteSelectionUserPrompt,
  buildTemplateAnalysisUserPrompt,
  detectTaskMismatch,
  findWritingQualityViolations,
  normalizeTemplateDocument,
  resolveOutputLanguage,
} from '../server/src/modules/document-generation/writingPromptRecipes'

let passed = 0
let failed = 0

function assert(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('=== Web Document Legacy Prompt Tests ===\n')

const outputLanguage = resolveOutputLanguage({})
const systemPrompt = buildLegacyWritingAssistantSystemPrompt(outputLanguage)
assert('system prompt 含中文要求', /简体中文/.test(systemPrompt))
assert('system prompt 含质量规则', /销售业绩汇报/.test(systemPrompt))
assert('system prompt 禁止占位符说明', /禁止使用占位符/.test(systemPrompt))

const salesUser = buildLegacyWritingAssistantUserPrompt({
  instruction: '帮我写一份销售业绩汇报',
  documentText: '',
  extraContext: '',
})
assert('销售汇报 user prompt 含 instruction', salesUser.includes('销售业绩汇报'))
assert('空文档时要求生成完整正文', /生成完整正文/.test(salesUser))

const dailyUser = buildLegacyWritingAssistantUserPrompt({
  instruction: '帮我写一份今天的工作日报',
})
assert('日报 instruction 保留', dailyUser.includes('工作日报'))

const rewrite = buildRewriteSelectionUserPrompt({
  instruction: '改得正式一些',
  selectedText: '这段话太口语化了',
})
assert('选区改写 prompt 含选中文字', rewrite.includes('这段话太口语化了'))
assert('选区改写要求只输出选区', rewrite.includes('只输出'))

const template = normalizeTemplateDocument({
  title: '模板函件',
  extractedText: '关于XX项目的进展说明……\n## 一、背景\n……',
  outline: ['背景', '进展'],
})
assert('模板归一化', Boolean(template))
if (template) {
  const analysis = buildTemplateAnalysisUserPrompt(template, '写一份销售汇报', outputLanguage)
  assert('模板分析含模板正文', analysis.includes('模板正文'))
  assert('模板分析含章节线索', analysis.includes('背景'))
}

const badOutput = '# 工作日报\n\n## 今日完成\n- 拜访客户\n[待补充]\nXX'
const violations = findWritingQualityViolations(badOutput)
assert('检测占位符 [待补充]', violations.some((v) => v.includes('[待补充]')))
assert('检测 XX', violations.some((v) => v.includes('XX')))

const mismatch = detectTaskMismatch('帮我写一份销售业绩汇报', '# 工作日报\n\n今日完成事项……')
assert('销售汇报不应像日报', mismatch !== null)

const goodSales = '# 销售业绩汇报\n\n## 业绩概览\n本季度整体收入保持稳健增长。'
const mismatch2 = detectTaskMismatch('帮我写一份销售业绩汇报', goodSales)
assert('正常销售汇报无任务错配', mismatch2 === null)

console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`)
if (failed > 0) process.exit(1)
