import type { DocumentLanguage } from '../types'

const TASK_TYPE_LABELS: Record<string, string> = {
  'work-report': '工作汇报',
  'meeting-minutes': '会议纪要',
  'project-proposal': '项目方案',
  'official-notice': '通知公告',
  'press-release': '新闻稿',
  'research-report': '调研报告',
  'application-letter': '申请书',
  'course-material': '课程材料',
}

export function resolveTaskTypeLabel(taskType?: string): string | undefined {
  if (!taskType) return undefined
  const key = String(taskType).trim()
  return TASK_TYPE_LABELS[key] || key
}

export function buildStructuredWritingPromptBlock(input: {
  taskType?: string
  outline?: string[]
  tone?: string
  language?: DocumentLanguage
}): string {
  const languageLine = input.language === 'en-US'
    ? '语言：English (en-US)'
    : '语言：中文（zh-CN）'
  const taskLine = input.taskType
    ? `写作任务类型：${resolveTaskTypeLabel(input.taskType) || input.taskType}（${input.taskType}）`
    : ''
  const outlineLine = input.outline?.length
    ? `推荐结构：\n${input.outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
    : ''
  const toneLine = input.tone ? `写作语气：${input.tone}` : ''
  return [languageLine, taskLine, toneLine, outlineLine].filter(Boolean).join('\n\n')
}
