import type { DocumentTemplateDefinition } from '../types'

export const DOCUMENT_TEMPLATE_DEFINITIONS: DocumentTemplateDefinition[] = [
  {
    id: 'official_notice',
    label: '正式通知',
    description: '适用于行政通知、工作部署、事项公告。',
    documentType: 'notice',
    defaultTitle: '关于相关工作的通知',
    outline: ['发文背景', '主要事项', '工作要求', '时间安排', '落款'],
    promptHint: '行文要庄重规范，结构清晰，适合单位正式通知。',
  },
  {
    id: 'work_summary',
    label: '工作总结',
    description: '适用于部门/个人阶段性工作总结。',
    documentType: 'summary',
    defaultTitle: '工作总结',
    outline: ['主要工作', '主要成绩', '问题分析', '下一步计划'],
    promptHint: '突出成绩、问题和改进方向，表达务实。',
  },
  {
    id: 'annual_report',
    label: '年度报告',
    description: '适用于学院、部门、单位年度工作报告。',
    documentType: 'report',
    defaultTitle: '年度工作报告',
    outline: ['总体概况', '主要成绩', '问题分析', '下一年度计划'],
    promptHint: '适合年度总结汇报，强调正式、完整、具有依据。',
  },
  {
    id: 'meeting_minutes',
    label: '会议纪要',
    description: '适用于会议讨论、决议事项、责任分工。',
    documentType: 'memo',
    defaultTitle: '会议纪要',
    outline: ['会议基本情况', '讨论事项', '议定事项', '后续分工'],
    promptHint: '按会议纪要体例撰写，强调客观记录和后续执行。',
  },
  {
    id: 'request_report',
    label: '请示报告',
    description: '适用于向上级请示、汇报、申请事项。',
    documentType: 'official_letter',
    defaultTitle: '关于相关事项的请示',
    outline: ['请示事项', '背景依据', '具体请求', '有关说明'],
    promptHint: '采用正式请示语气，突出依据、事由和请求事项。',
  },
  {
    id: 'recruitment_announcement',
    label: '招聘公告',
    description: '适用于岗位招聘、公告发布。',
    documentType: 'notice',
    defaultTitle: '招聘公告',
    outline: ['招聘岗位', '资格条件', '报名方式', '有关说明'],
    promptHint: '公告体例，信息清楚、条件明确、表达规范。',
  },
]

export function listDocumentTemplates(): DocumentTemplateDefinition[] {
  return DOCUMENT_TEMPLATE_DEFINITIONS
}

export function getDocumentTemplateDefinition(templateId?: string): DocumentTemplateDefinition | undefined {
  if (!templateId) return undefined
  return DOCUMENT_TEMPLATE_DEFINITIONS.find((item) => item.id === templateId)
}
