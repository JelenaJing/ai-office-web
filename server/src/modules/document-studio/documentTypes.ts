export interface DocumentTypeField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

export interface DocumentTypeDef {
  id: string
  label: string
  description: string
  generateCapabilityId: string
  generateSkillId?: string
  fields: DocumentTypeField[]
}

export const DOCUMENT_STUDIO_TYPES: DocumentTypeDef[] = [
  {
    id: 'general',
    label: '通用文稿',
    description: '适用于一般说明、方案、材料等通用文稿',
    generateCapabilityId: 'generate-general-document',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '主题', type: 'text', required: true },
      { name: 'requirements', label: '具体需求', type: 'textarea', required: true },
      { name: 'wordCount', label: '字数', type: 'text' },
      { name: 'tone', label: '语气', type: 'text', placeholder: '正式 / 简洁 / 亲和' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'news',
    label: '新闻稿',
    description: '适合活动报道、会议报道、发布会报道',
    generateCapabilityId: 'generate-news',
    generateSkillId: 'news-writer',
    fields: [
      { name: 'topic', label: '主题', type: 'text', required: true },
      { name: 'eventTime', label: '活动时间', type: 'text' },
      { name: 'location', label: '活动地点', type: 'text' },
      { name: 'participants', label: '参与人员', type: 'textarea' },
      { name: 'coreEvent', label: '核心事件', type: 'textarea', required: true },
      { name: 'highlights', label: '希望突出什么', type: 'textarea' },
      { name: 'wordCount', label: '字数', type: 'text' },
      { name: 'tone', label: '语气', type: 'text', placeholder: '正式' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'report',
    label: '汇报材料',
    description: '工作汇报、专题汇报、阶段总结',
    generateCapabilityId: 'generate-report',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '汇报主题', type: 'text', required: true },
      { name: 'audience', label: '汇报对象', type: 'text' },
      { name: 'keyPoints', label: '核心要点', type: 'textarea', required: true },
      { name: 'wordCount', label: '字数', type: 'text' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'notice',
    label: '通知公告',
    description: '校内通知、部门公告、活动通知',
    generateCapabilityId: 'generate-notice',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '通知主题', type: 'text', required: true },
      { name: 'effectiveDate', label: '生效时间', type: 'text' },
      { name: 'content', label: '主要内容', type: 'textarea', required: true },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'minutes',
    label: '会议纪要',
    description: '会议记录、决议事项、待办跟进',
    generateCapabilityId: 'generate-minutes',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'meetingTitle', label: '会议名称', type: 'text', required: true },
      { name: 'meetingTime', label: '会议时间', type: 'text' },
      { name: 'attendees', label: '参会人员', type: 'textarea' },
      { name: 'agenda', label: '议题与讨论', type: 'textarea', required: true },
      { name: 'decisions', label: '决议事项', type: 'textarea' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'summary',
    label: '工作总结',
    description: '年度/季度/项目工作总结',
    generateCapabilityId: 'generate-general-document',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '总结主题', type: 'text', required: true },
      { name: 'period', label: '时间范围', type: 'text' },
      { name: 'achievements', label: '主要成果', type: 'textarea', required: true },
      { name: 'challenges', label: '问题与改进', type: 'textarea' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'research',
    label: '调研报告',
    description: '调研背景、发现与建议',
    generateCapabilityId: 'generate-general-document',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '调研主题', type: 'text', required: true },
      { name: 'background', label: '背景', type: 'textarea' },
      { name: 'findings', label: '主要发现', type: 'textarea', required: true },
      { name: 'recommendations', label: '建议', type: 'textarea' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'proposal',
    label: '方案文档',
    description: '项目方案、实施方案、工作计划',
    generateCapabilityId: 'generate-general-document',
    generateSkillId: 'general-document-writer',
    fields: [
      { name: 'topic', label: '方案名称', type: 'text', required: true },
      { name: 'objective', label: '目标', type: 'textarea', required: true },
      { name: 'plan', label: '实施计划', type: 'textarea' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
  {
    id: 'paper',
    label: '论文',
    description: '学术论文初稿（部分能力待接入）',
    generateCapabilityId: 'academic-paper-pipeline',
    generateSkillId: 'academic-research-skills',
    fields: [
      { name: 'researchTopic', label: '研究主题', type: 'text', required: true },
      { name: 'discipline', label: '学科方向', type: 'text' },
      { name: 'researchQuestion', label: '研究问题', type: 'textarea' },
      {
        name: 'paperType',
        label: '论文类型',
        type: 'select',
        options: [
          { value: 'thesis', label: '学位论文' },
          { value: 'journal', label: '期刊论文' },
          { value: 'conference', label: '会议论文' },
        ],
      },
      { name: 'wordCount', label: '字数', type: 'text' },
      { name: 'citationStyle', label: '引用格式', type: 'text', placeholder: 'APA / GB/T 7714' },
      {
        name: 'scope',
        label: '生成范围',
        type: 'select',
        options: [
          { value: 'outline', label: '大纲' },
          { value: 'abstract', label: '摘要' },
          { value: 'introduction', label: '引言' },
          { value: 'literature', label: '文献综述' },
          { value: 'full', label: '完整初稿' },
        ],
      },
      { name: 'materials', label: '已有材料说明', type: 'textarea' },
      { name: 'extra', label: '其他要求', type: 'textarea' },
    ],
  },
]

export function getDocumentTypeById(id: string): DocumentTypeDef | undefined {
  return DOCUMENT_STUDIO_TYPES.find(t => t.id === id)
}
