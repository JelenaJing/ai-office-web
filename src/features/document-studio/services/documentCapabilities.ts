export type CapabilityRunner = 'direct-llm' | 'opencode' | 'node' | 'pipeline' | 'legacy'

export type CapabilityScope = 'selection' | 'block' | 'document' | 'pipeline'

export type CapabilityOutputMode = 'patch' | 'new_artifact' | 'comments' | 'export' | 'patch_or_text'

export type CapabilityStatus = 'connected' | 'pending' | 'legacy-hidden'

export interface DocumentCapability {
  id: string
  label: string
  description: string
  runner: CapabilityRunner
  skillId?: string
  actionType:
    | 'generate_document'
    | 'transform_selection'
    | 'transform_block'
    | 'transform_document'
    | 'continue_writing'
    | 'review_document'
    | 'export_document'
  scope: CapabilityScope
  outputMode: CapabilityOutputMode
  documentTypes: string[]
  enabled: boolean
  status?: CapabilityStatus
}

export const DOCUMENT_TYPE_CARDS = [
  { id: 'general', label: '通用文稿', generateCapabilityId: 'generate-general-document' },
  { id: 'news', label: '新闻稿', generateCapabilityId: 'generate-news' },
  { id: 'report', label: '汇报材料', generateCapabilityId: 'generate-report' },
  { id: 'notice', label: '通知公告', generateCapabilityId: 'generate-notice' },
  { id: 'minutes', label: '会议纪要', generateCapabilityId: 'generate-minutes' },
  { id: 'summary', label: '工作总结', generateCapabilityId: 'generate-general-document' },
  { id: 'research', label: '调研报告', generateCapabilityId: 'generate-general-document' },
  { id: 'proposal', label: '方案文档', generateCapabilityId: 'generate-general-document' },
  { id: 'paper', label: '论文', generateCapabilityId: 'academic-paper-pipeline', pending: true },
] as const

export const DOCUMENT_CAPABILITIES: DocumentCapability[] = [
  {
    id: 'generate-general-document',
    label: '通用文稿生成',
    description: '根据需求生成通用文稿初稿',
    runner: 'opencode',
    skillId: 'general-document-writer',
    actionType: 'generate_document',
    scope: 'document',
    outputMode: 'new_artifact',
    documentTypes: ['general', 'summary', 'research', 'proposal'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'generate-news',
    label: '新闻稿生成',
    description: '根据活动信息和材料生成正式新闻稿',
    runner: 'opencode',
    skillId: 'news-writer',
    actionType: 'generate_document',
    scope: 'document',
    outputMode: 'new_artifact',
    documentTypes: ['news'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'rewrite-selection',
    label: '改写',
    description: '保持原意，重新组织选中文本表达',
    runner: 'direct-llm',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'continue-writing',
    label: '续写',
    description: '根据上下文继续写作',
    runner: 'direct-llm',
    actionType: 'continue_writing',
    scope: 'block',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'polish-selection',
    label: '润色',
    description: '优化表达，保持原意',
    runner: 'direct-llm',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'rephrase-selection',
    label: '重写',
    description: '用不同表述重写选中文本',
    runner: 'direct-llm',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'translate-selection',
    label: '翻译',
    description: '翻译选中文本',
    runner: 'direct-llm',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'humanize-selection',
    label: '快速改写',
    description: '内置模型快速改写选区（direct-llm），保留原意',
    runner: 'direct-llm',
    skillId: 'humanizer',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'humanize-document-advanced',
    label: '深度改写',
    description: 'OpenCode + humanizer Skill 对全文深度自然化改写',
    runner: 'opencode',
    skillId: 'humanizer',
    actionType: 'transform_document',
    scope: 'document',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'summarize-document',
    label: '生成摘要',
    description: '为全文生成摘要要点',
    runner: 'direct-llm',
    actionType: 'transform_document',
    scope: 'document',
    outputMode: 'comments',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'freeform-document-instruction',
    label: '自由指令',
    description: '基于选区或全文执行用户自定义 AI 指令',
    runner: 'direct-llm',
    actionType: 'transform_document',
    scope: 'document',
    outputMode: 'patch_or_text',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'academic-paper-pipeline',
    label: '论文写作',
    description: '论文 pipeline 待接入 academic-research-skills',
    runner: 'pipeline',
    skillId: 'academic-research-skills',
    actionType: 'generate_document',
    scope: 'pipeline',
    outputMode: 'new_artifact',
    documentTypes: ['paper'],
    enabled: false,
    status: 'pending',
  },
  {
    id: 'export-markdown',
    label: '导出 Markdown',
    description: '导出 Markdown 文件',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'export-html',
    label: '导出 HTML',
    description: '导出 HTML 文件',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'export-docx',
    label: '导出 Word',
    description: '从 editorJson 导出 DOCX',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'export-pdf',
    label: '导出 PDF',
    description: 'PDF 导出待接入',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'summary', 'research', 'proposal', 'paper'],
    enabled: false,
    status: 'pending',
  },
]

export function getCapabilitiesForContext(input: {
  documentType: string
  hasSelection: boolean
}): DocumentCapability[] {
  const base = DOCUMENT_CAPABILITIES.filter(
    c => c.documentTypes.includes(input.documentType) && c.status !== 'legacy-hidden' && c.actionType !== 'generate_document',
  )
  if (input.hasSelection) {
    return base.filter(c => c.scope === 'selection' || c.scope === 'block' || c.id === 'humanize-document-advanced')
  }
  return base.filter(c => c.scope === 'document' || c.scope === 'pipeline')
}

export const NEWS_EXTRA_CAPABILITIES: DocumentCapability[] = [
  { id: 'news-title', label: '优化标题', description: '优化新闻标题', runner: 'direct-llm', actionType: 'transform_selection', scope: 'selection', outputMode: 'patch', documentTypes: ['news'], enabled: true, status: 'connected' },
  { id: 'news-lead', label: '改导语', description: '改写导语段落', runner: 'direct-llm', actionType: 'transform_selection', scope: 'selection', outputMode: 'patch', documentTypes: ['news'], enabled: true, status: 'connected' },
]

export const PAPER_EXTRA_CAPABILITIES: DocumentCapability[] = [
  { id: 'paper-outline', label: '生成大纲', description: '生成论文大纲', runner: 'direct-llm', actionType: 'transform_document', scope: 'document', outputMode: 'comments', documentTypes: ['paper'], enabled: false, status: 'pending' },
  { id: 'academic-review', label: '学术审阅', description: '学术审阅（待接入）', runner: 'opencode', skillId: 'academic-research-skills', actionType: 'review_document', scope: 'document', outputMode: 'comments', documentTypes: ['paper'], enabled: false, status: 'pending' },
]
