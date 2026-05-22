import type { DocumentEditMode } from '../webDocumentPatchTypes'

export type DocumentWorkflowId =
  | 'general'
  | 'formal_notice'
  | 'work_summary'
  | 'request_application'
  | 'research_report'
  | 'meeting_minutes'
  | 'news_article'
  | 'academic_paper'
  | 'literature_review'
  | 'formal_template'

export type DocumentWorkflowCategory = 'general' | 'official' | 'academic' | 'report' | 'template'

export interface DocumentWorkflowField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select'
  required?: boolean
  options?: string[]
}

export interface DocumentWorkflow {
  id: DocumentWorkflowId
  label: string
  description: string
  category: DocumentWorkflowCategory
  defaultTitle: string
  requiredFields: DocumentWorkflowField[]
  defaultPrompt: string
  outlineSections: string[]
  supportsKnowledge: boolean
  supportsReferences: boolean
  supportsTemplateShell: boolean
}

export interface WorkflowQuickAction {
  label: string
  action: 'generate' | 'edit'
  prompt: string
  mode?: DocumentEditMode
  paperMode?: string
  formalTemplatePresetId?: string
  successTitle?: string
  successBody?: string
  requiresContent?: boolean
}

export const DOCUMENT_WORKFLOWS: DocumentWorkflow[] = [
  {
    id: 'general',
    label: '普通文稿',
    description: '通用写作，适合各类内容',
    category: 'general',
    defaultTitle: '新建文稿',
    requiredFields: [],
    defaultPrompt: '请生成一篇完整的文稿。',
    outlineSections: ['标题', '正文', '结语'],
    supportsKnowledge: true,
    supportsReferences: false,
    supportsTemplateShell: false,
  },
  {
    id: 'formal_notice',
    label: '正式通知',
    description: '行政通知、公告、会议通知',
    category: 'official',
    defaultTitle: '关于…的通知',
    requiredFields: [
      { key: 'subject', label: '通知主题', type: 'text', required: true },
      { key: 'issuer', label: '发文单位', type: 'text' },
    ],
    defaultPrompt: '请生成一份正式通知，包含标题、背景说明、工作要求、时间安排和落款。',
    outlineSections: ['标题', '背景说明', '工作要求', '时间安排', '联系方式', '落款'],
    supportsKnowledge: false,
    supportsReferences: false,
    supportsTemplateShell: true,
  },
  {
    id: 'work_summary',
    label: '工作总结',
    description: '年度/季度/月度工作总结',
    category: 'report',
    defaultTitle: '工作总结',
    requiredFields: [
      { key: 'period', label: '总结周期', type: 'text', required: true },
      { key: 'department', label: '部门/个人', type: 'text' },
    ],
    defaultPrompt: '请生成一份工作总结，包含主要工作、取得成果、存在问题和下一步建议。',
    outlineSections: ['主要工作内容', '取得成果', '存在问题与不足', '下一步工作建议'],
    supportsKnowledge: true,
    supportsReferences: false,
    supportsTemplateShell: false,
  },
  {
    id: 'request_application',
    label: '请示/申请',
    description: '请示报告、申请书、汇报材料',
    category: 'official',
    defaultTitle: '关于…的请示',
    requiredFields: [
      { key: 'subject', label: '请示事项', type: 'text', required: true },
      { key: 'reason', label: '申请原因', type: 'textarea' },
    ],
    defaultPrompt: '请生成一份正式请示，包含请示事由、理由依据、具体请求和结尾。',
    outlineSections: ['请示事由', '理由依据', '具体申请事项', '妥否，请批示'],
    supportsKnowledge: false,
    supportsReferences: false,
    supportsTemplateShell: true,
  },
  {
    id: 'research_report',
    label: '调研报告',
    description: '调查研究、分析报告、可行性研究',
    category: 'report',
    defaultTitle: '调研报告',
    requiredFields: [
      { key: 'topic', label: '调研主题', type: 'text', required: true },
      { key: 'scope', label: '调研范围', type: 'text' },
    ],
    defaultPrompt: '请生成一份调研报告，包含调研背景、调研方法、主要发现、分析和建议。',
    outlineSections: ['调研背景与目的', '调研方法', '主要发现', '数据分析', '结论与建议'],
    supportsKnowledge: true,
    supportsReferences: true,
    supportsTemplateShell: false,
  },
  {
    id: 'meeting_minutes',
    label: '会议纪要',
    description: '会议记录、决议事项、行动清单',
    category: 'official',
    defaultTitle: '会议纪要',
    requiredFields: [
      { key: 'meetingName', label: '会议名称', type: 'text', required: true },
      { key: 'date', label: '会议日期', type: 'text' },
      { key: 'attendees', label: '与会人员', type: 'text' },
    ],
    defaultPrompt: '请生成一份会议纪要，包含会议基本信息、讨论事项、决议内容和行动事项。',
    outlineSections: ['会议基本信息', '主要讨论事项', '决议事项', '行动事项与责任人', '下次会议安排'],
    supportsKnowledge: false,
    supportsReferences: false,
    supportsTemplateShell: false,
  },
  {
    id: 'news_article',
    label: '新闻稿/公众号稿',
    description: '新闻稿、公众号文章、宣传材料',
    category: 'general',
    defaultTitle: '新闻稿',
    requiredFields: [
      { key: 'event', label: '事件/主题', type: 'text', required: true },
    ],
    defaultPrompt: '请生成一篇新闻稿，包含导语、事件经过、背景介绍和结语。',
    outlineSections: ['导语（5W1H）', '事件经过', '背景与意义', '相关方声音', '结语'],
    supportsKnowledge: false,
    supportsReferences: false,
    supportsTemplateShell: false,
  },
  {
    id: 'academic_paper',
    label: '论文/学术文章',
    description: '学术论文、研究报告、学位论文',
    category: 'academic',
    defaultTitle: '学术论文',
    requiredFields: [
      { key: 'topic', label: '研究主题', type: 'text', required: true },
      { key: 'field', label: '研究领域', type: 'text' },
      { key: 'keywords', label: '关键词', type: 'text' },
    ],
    defaultPrompt: '请生成一篇学术论文初稿，包含标题、摘要、关键词、引言、文献综述、研究方法、分析讨论、结论和参考文献占位。',
    outlineSections: [
      '标题',
      '摘要（Abstract）',
      '关键词（Keywords）',
      '1. 引言',
      '2. 相关研究/文献综述',
      '3. 研究方法',
      '4. 实验/数据分析',
      '5. 讨论',
      '6. 结论',
      '参考文献（占位）',
    ],
    supportsKnowledge: true,
    supportsReferences: true,
    supportsTemplateShell: false,
  },
  {
    id: 'literature_review',
    label: '文献综述',
    description: '研究综述、文献回顾、理论梳理',
    category: 'academic',
    defaultTitle: '文献综述',
    requiredFields: [
      { key: 'topic', label: '综述主题', type: 'text', required: true },
      { key: 'scope', label: '文献范围', type: 'text' },
    ],
    defaultPrompt: '请生成一篇文献综述，包含研究背景、国内外研究现状、研究脉络、争议焦点、评述和参考文献占位。',
    outlineSections: [
      '1. 研究背景与意义',
      '2. 国内外研究现状',
      '3. 研究脉络与演进',
      '4. 主要争议与分歧',
      '5. 评述与研究展望',
      '参考文献（占位）',
    ],
    supportsKnowledge: true,
    supportsReferences: true,
    supportsTemplateShell: false,
  },
  {
    id: 'formal_template',
    label: '正式模板',
    description: '套用预设模板生成标准格式文稿',
    category: 'template',
    defaultTitle: '正式模板文稿',
    requiredFields: [],
    defaultPrompt: '请按照正式模板结构生成文稿，使用标准格式和规范化语言。',
    outlineSections: ['文稿头部', '正文内容', '结语落款'],
    supportsKnowledge: false,
    supportsReferences: false,
    supportsTemplateShell: true,
  },
]

export function getWorkflow(id: DocumentWorkflowId): DocumentWorkflow {
  return DOCUMENT_WORKFLOWS.find((w) => w.id === id) ?? DOCUMENT_WORKFLOWS[0]
}

export function getWorkflowQuickActions(id: DocumentWorkflowId): WorkflowQuickAction[] {
  switch (id) {
    case 'formal_notice':
      return [
        {
          label: '生成正式通知',
          action: 'generate',
          prompt: '请生成一份正式通知，包含标题、背景说明、工作要求、时间安排和落款。',
        },
        {
          label: '补充背景说明',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在当前通知中补充背景说明，解释发文原因和依据。',
          requiresContent: true,
          successTitle: '已完成：补充背景',
          successBody: '背景说明已插入，可继续修改或下载。',
        },
        {
          label: '生成落款',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末生成标准公文落款，包含发文单位名称和日期占位。',
          requiresContent: true,
          successTitle: '已完成：生成落款',
          successBody: '落款已插入，请检查并填写实际日期和单位。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文，使其更符合正式公文规范，语气正式、结构清晰。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已按公文规范优化，可继续修改或下载。',
        },
      ]

    case 'work_summary':
      return [
        {
          label: '生成工作总结',
          action: 'generate',
          prompt: '请生成一份工作总结，包含主要工作内容、取得成果、存在问题与不足、下一步工作建议。',
        },
        {
          label: '提取主要成绩',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请提取并整理当前文稿中的主要成绩和亮点，以清晰的要点形式补充到文末。',
          requiresContent: true,
          successTitle: '已完成：提取成绩',
          successBody: '主要成绩已整理，可继续修改或下载。',
        },
        {
          label: '补充问题与建议',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末补充"存在问题与不足"和"下一步工作建议"两个小节，内容要具体实际。',
          requiresContent: true,
          successTitle: '已完成：补充建议',
          successBody: '问题与建议已插入，可继续修改或下载。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文表达，使工作总结更有条理、重点突出、语言得体。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
      ]

    case 'request_application':
      return [
        {
          label: '生成请示',
          action: 'generate',
          prompt: '请生成一份正式请示，包含请示事由、理由依据、具体申请事项，结尾用"妥否，请批示"格式。',
        },
        {
          label: '补充理由依据',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请补充请示的理由依据部分，引用相关政策、规定或实际情况说明必要性。',
          requiresContent: true,
          successTitle: '已完成：补充依据',
          successBody: '理由依据已补充，可继续修改或下载。',
        },
        {
          label: '生成标准结尾',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末生成标准请示结尾格式，包含"妥否，请批示"和落款。',
          requiresContent: true,
          successTitle: '已完成：生成结尾',
          successBody: '标准结尾已插入，请检查落款内容。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文，使请示语言更正式、逻辑更严密。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
      ]

    case 'research_report':
      return [
        {
          label: '生成调研报告',
          action: 'generate',
          prompt: '请生成一份调研报告，包含调研背景与目的、调研方法、主要发现、数据分析、结论与建议。',
        },
        {
          label: '补充数据分析',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在数据分析部分补充更详细的分析内容，指出主要趋势和关键数据点。',
          requiresContent: true,
          successTitle: '已完成：补充数据',
          successBody: '数据分析已补充，可继续修改或下载。',
        },
        {
          label: '生成结论建议',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末生成结论与建议章节，总结主要发现并提出具体可行的建议。',
          requiresContent: true,
          successTitle: '已完成：生成结论',
          successBody: '结论与建议已插入，可继续修改或下载。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文，使调研报告结构更清晰、论点更有力。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
      ]

    case 'meeting_minutes':
      return [
        {
          label: '生成会议纪要',
          action: 'generate',
          prompt: '请生成一份会议纪要，包含会议基本信息、主要讨论事项、决议事项、行动事项与责任人。',
        },
        {
          label: '整理决议事项',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请从当前文稿中整理并归纳决议事项，以编号列表形式补充到文末。',
          requiresContent: true,
          successTitle: '已完成：整理决议',
          successBody: '决议事项已整理，可继续修改或下载。',
        },
        {
          label: '提取行动事项',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请提取文稿中的所有行动事项，整理成表格形式（事项 / 责任人 / 截止时间）补充到文末。',
          requiresContent: true,
          successTitle: '已完成：提取行动项',
          successBody: '行动事项清单已插入，请核对责任人和时间。',
        },
        {
          label: '优化格式',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化会议纪要的格式和语言，使结构更规范、内容更清晰。',
          requiresContent: true,
          successTitle: '已完成：优化格式',
          successBody: '格式已优化，可继续修改或下载。',
        },
      ]

    case 'news_article':
      return [
        {
          label: '生成新闻稿',
          action: 'generate',
          prompt: '请生成一篇新闻稿，包含导语（5W1H）、事件经过、背景与意义、相关方声音和结语。',
        },
        {
          label: '提取重点摘要',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请从当前内容提取 3-5 个核心要点，以简洁的摘要形式补充到文首。',
          requiresContent: true,
          successTitle: '已完成：提取重点',
          successBody: '摘要已插入文首，可继续修改或下载。',
        },
        {
          label: '改成公众号风格',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请把当前文稿改写成适合微信公众号发布的风格：标题吸引眼球、语言生动、有情感共鸣，保留核心事实。',
          requiresContent: true,
          successTitle: '已完成：公众号风格',
          successBody: '文稿已改写为公众号风格，可继续修改或下载。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文结构和表达，提升新闻稿的可读性和传播性。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
      ]

    case 'academic_paper':
      return [
        {
          label: '生成研究文章',
          action: 'generate',
          prompt: '请生成一篇学术论文初稿，包含：标题、摘要（Abstract）、关键词、引言、相关研究/文献综述、研究方法、实验与分析、讨论、结论、参考文献（占位）。',
          paperMode: 'full',
        },
        {
          label: '生成论文大纲',
          action: 'generate',
          prompt: '请生成论文大纲，突出研究背景、相关研究、研究方法、结果分析、讨论与结论。',
          paperMode: 'outline',
        },
        {
          label: '生成摘要',
          action: 'generate',
          prompt: '请生成研究文章的标题、摘要与关键词，突出研究目标、方法与主要发现。',
          paperMode: 'abstract',
        },
        {
          label: '生成引言',
          action: 'generate',
          prompt: '请为当前论文写一段完整的引言（Introduction），包含研究背景、研究意义、国内外现状简述和本文的研究贡献。',
          paperMode: 'introduction',
        },
        {
          label: '生成研究方法',
          action: 'generate',
          prompt: '请生成研究方法 / 分析框架章节，说明研究设计、变量、数据来源与分析步骤。',
          paperMode: 'methodology',
        },
        {
          label: '生成结论',
          action: 'generate',
          prompt: '请为当前论文生成结论章节，总结主要研究发现、贡献、局限性和未来研究方向。',
          paperMode: 'conclusion',
        },
      ]

    case 'literature_review':
      return [
        {
          label: '生成文献综述',
          action: 'generate',
          prompt: '请生成一篇文献综述，包含：研究背景与意义、国内外研究现状、研究脉络与演进、主要争议与分歧、评述与研究展望、参考文献（占位）。',
          paperMode: 'full',
        },
        {
          label: '生成综述大纲',
          action: 'generate',
          prompt: '请生成综述大纲，包含文献检索与筛选说明、研究脉络、主题分类、代表性研究、争议与不足、未来方向。',
          paperMode: 'outline',
        },
        {
          label: '整理研究脉络',
          action: 'generate',
          prompt: '请梳理该研究主题的发展脉络，按时间和主题演进整理关键阶段与趋势。',
          paperMode: 'trajectory',
        },
        {
          label: '提取代表性研究',
          action: 'generate',
          prompt: '请整理该领域的代表性研究，按主题分类概括核心观点、方法与贡献。',
          paperMode: 'representative-studies',
        },
        {
          label: '总结争议点',
          action: 'generate',
          prompt: '请总结该研究领域的主要争议点、分歧和不足，并作出简要评述。',
          paperMode: 'debates',
        },
        {
          label: '生成未来方向',
          action: 'generate',
          prompt: '请生成未来研究方向章节，指出值得继续推进的问题、方法与潜在突破口。',
          paperMode: 'future-directions',
        },
      ]

    case 'formal_template':
      return [
        {
          label: '生成拜访函',
          action: 'generate',
          prompt: '请生成一份正式拜访函，明确拜访目的、拜访安排、请求事项和礼貌结语。',
          formalTemplatePresetId: 'visit_letter',
        },
        {
          label: '生成贺信',
          action: 'generate',
          prompt: '请生成一封正式贺信，突出祝贺主题、成绩意义与真诚祝愿。',
          formalTemplatePresetId: 'congratulation_letter',
        },
        {
          label: '按通用模板改写',
          action: 'generate',
          prompt: '请按通用正式模板改写成可直接发出的正式文稿，包含标题、正文和落款。',
          formalTemplatePresetId: 'generic_template_rewrite',
        },
        {
          label: '按当前模板生成',
          action: 'generate',
          prompt: '请按当前选中的正式模板链路生成最终文稿。',
        },
        {
          label: '优化格式规范',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化文稿使其符合正式模板规范，调整格式、语气和结构。',
          requiresContent: true,
          successTitle: '已完成：格式规范',
          successBody: '格式已按正式模板规范优化，可继续修改或下载。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文，使其更符合正式模板的语言风格和格式规范。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
      ]

    // general and all other cases
    default:
      return [
        {
          label: '生成初稿',
          action: 'generate',
          prompt: '请根据标题和要求生成一篇完整文稿。',
        },
        {
          label: '继续写',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请延续当前文稿的结构和语气继续写下去，补完整体内容。',
          requiresContent: true,
          successTitle: '已完成：继续写',
          successBody: 'AI 已续写当前文稿，可继续修改或下载。',
        },
        {
          label: '优化全文',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请优化全文结构和语言，让表达更清晰、更像正式办公文稿。',
          requiresContent: true,
          successTitle: '已完成：优化全文',
          successBody: '全文已优化，可继续修改或下载。',
        },
        {
          label: '改成正式语气',
          action: 'edit',
          mode: 'polish_document',
          prompt: '请把全文改成正式、稳妥、适合办公场景的语气。',
          requiresContent: true,
          successTitle: '已完成：改成正式语气',
          successBody: '文稿语气已调整为更正式的表达。',
        },
        {
          label: '提取大纲',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末提取这篇文稿的大纲，使用清晰的小标题和要点列表。',
          requiresContent: true,
          successTitle: '已完成：提取大纲',
          successBody: '大纲已插入当前文稿，可继续整理或下载。',
        },
        {
          label: '生成摘要',
          action: 'edit',
          mode: 'insert_at_cursor',
          prompt: '请在文末补充一段简明摘要，概括全文重点和结论。',
          requiresContent: true,
          successTitle: '已完成：生成摘要',
          successBody: '摘要已插入当前文稿，可继续修改或下载。',
        },
      ]
  }
}

/** Build a grouped list for the workflow type selector */
export function getWorkflowsByCategory(): Array<{
  category: DocumentWorkflowCategory
  label: string
  workflows: DocumentWorkflow[]
}> {
  const categoryLabels: Record<DocumentWorkflowCategory, string> = {
    general: '通用',
    official: '公文',
    report: '报告',
    academic: '学术',
    template: '模板',
  }

  const groups: Array<{
    category: DocumentWorkflowCategory
    label: string
    workflows: DocumentWorkflow[]
  }> = []
  const seen = new Set<DocumentWorkflowCategory>()

  for (const workflow of DOCUMENT_WORKFLOWS) {
    if (!seen.has(workflow.category)) {
      seen.add(workflow.category)
      groups.push({ category: workflow.category, label: categoryLabels[workflow.category], workflows: [] })
    }
    groups.find((g) => g.category === workflow.category)!.workflows.push(workflow)
  }

  return groups
}
