export type DocumentTone = 'formal' | 'concise' | 'academic' | 'business'

export type DocumentTaskTemplate = {
  id: string
  name: string
  category: string
  description: string
  examplePrompt: string
  defaultTone: DocumentTone
  outline: string[]
}

export const DOCUMENT_TASK_TEMPLATES: DocumentTaskTemplate[] = [
  {
    id: 'work-report',
    name: '工作汇报',
    category: '行政办公',
    description: '梳理阶段性工作进展、成绩、问题与下一步计划，适合周报、月报和专项汇报。',
    examplePrompt: '帮我写一份面向学校领导的 AI Office 项目阶段工作汇报。',
    defaultTone: 'formal',
    outline: ['工作概况', '主要进展与成绩', '存在问题与风险', '下一步计划', '需协调事项'],
  },
  {
    id: 'meeting-minutes',
    name: '会议纪要',
    category: '行政办公',
    description: '根据会议记录生成正式会议纪要，并提取决议和行动事项。',
    examplePrompt: '根据这份会议记录生成会议纪要，并提取行动事项。',
    defaultTone: 'formal',
    outline: ['会议概况', '讨论要点', '会议决议', '行动事项', '风险与待确认事项'],
  },
  {
    id: 'project-proposal',
    name: '项目方案',
    category: '规划方案',
    description: '围绕项目背景、目标、实施路径和保障措施形成完整方案文稿。',
    examplePrompt: '请撰写一份高校 AI 办公平台建设项目方案，突出建设目标与实施步骤。',
    defaultTone: 'business',
    outline: ['项目背景', '目标与范围', '实施路径', '时间计划', '资源需求', '风险控制', '预期成果'],
  },
  {
    id: 'official-notice',
    name: '通知公告',
    category: '行政办公',
    description: '发布事项明确、语气庄重的通知或公告，适合校内行政场景。',
    examplePrompt: '请起草一份关于期末考试安排调整的通知公告。',
    defaultTone: 'formal',
    outline: ['发文背景', '主要事项', '时间安排', '工作要求', '联系方式'],
  },
  {
    id: 'press-release',
    name: '新闻稿',
    category: '宣传发布',
    description: '根据活动或成果信息撰写结构完整、表达规范的新闻稿。',
    examplePrompt: '请根据以下活动信息撰写一篇校园新闻稿。',
    defaultTone: 'business',
    outline: ['导语', '活动背景', '主要内容', '亮点成效', '结语'],
  },
  {
    id: 'research-report',
    name: '调研报告',
    category: '研究分析',
    description: '汇总调研发现、问题分析与建议，形成可汇报的调研报告。',
    examplePrompt: '请根据调研材料撰写一份关于教师数字化办公现状的调研报告。',
    defaultTone: 'academic',
    outline: ['调研背景', '调研方法', '主要发现', '问题分析', '对策建议', '结语'],
  },
  {
    id: 'application-letter',
    name: '申请书',
    category: '行政办公',
    description: '围绕申请事项、依据与请求内容撰写正式申请或请示文稿。',
    examplePrompt: '请撰写一份关于增设 AI 教学实验条件的申请书。',
    defaultTone: 'formal',
    outline: ['申请事项', '背景依据', '具体请求', '实施安排', '有关说明'],
  },
  {
    id: 'course-material',
    name: '课程材料',
    category: '教学教研',
    description: '整理课程说明、教学目标、内容安排与考核要求等教学材料。',
    examplePrompt: '请为《人工智能导论》课程撰写一份课程说明与教学安排材料。',
    defaultTone: 'academic',
    outline: ['课程简介', '教学目标', '内容安排', '教学方式', '考核要求', '参考资料'],
  },
]

export function getDocumentTaskTemplate(id: string | null | undefined): DocumentTaskTemplate | undefined {
  if (!id) return undefined
  return DOCUMENT_TASK_TEMPLATES.find((item) => item.id === id)
}

const TONE_HINT: Record<DocumentTone, string> = {
  formal: '语气正式、庄重，适合行政公文与汇报。',
  concise: '表达简洁凝练，避免冗余铺陈。',
  academic: '语气学术规范，逻辑清晰，术语准确。',
  business: '语气专业务实，突出结论与可执行性。',
}

export function buildToneInstruction(tone: DocumentTone): string {
  return TONE_HINT[tone] || TONE_HINT.formal
}

/** 映射到 Workbench `/api/documents/start` 参数 */
export function resolveTaskTemplateGenerationParams(template: DocumentTaskTemplate): {
  documentType: 'report' | 'notice' | 'memo' | 'proposal' | 'summary' | 'official_letter'
  templateId?: string
  title: string
} {
  switch (template.id) {
    case 'meeting-minutes':
      return { documentType: 'memo', templateId: 'meeting_minutes', title: '会议纪要' }
    case 'official-notice':
      return { documentType: 'notice', templateId: 'official_notice', title: '通知公告' }
    case 'project-proposal':
      return { documentType: 'proposal', templateId: undefined, title: '项目方案' }
    case 'press-release':
      return { documentType: 'report', templateId: undefined, title: '新闻稿' }
    case 'research-report':
      return { documentType: 'summary', templateId: undefined, title: '调研报告' }
    case 'application-letter':
      return { documentType: 'official_letter', templateId: 'request_report', title: '申请书' }
    case 'course-material':
      return { documentType: 'report', templateId: undefined, title: '课程材料' }
    case 'work-report':
    default:
      return { documentType: 'report', templateId: 'annual_report', title: '工作汇报' }
  }
}
