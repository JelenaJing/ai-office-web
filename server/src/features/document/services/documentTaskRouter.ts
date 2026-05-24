import type { DocumentTaskIntent, DocumentTaskRouterResult } from '../../../contracts/core-features/document.contract'
import type { DocumentKnowledgeRefInput, DocumentType } from '../types'

interface RouteDocumentTaskInput {
  prompt?: string
  currentDocument?: { title?: string; type?: string } | null
  selectedText?: string
  selectedSectionId?: string
  attachments?: Array<{ id?: string; name?: string }> | string[]
  templateId?: string
  knowledgeRefs?: DocumentKnowledgeRefInput[]
}

interface NextActionShape {
  type: 'generate' | 'ask' | 'upload_template' | 'selection_edit' | 'section_edit'
  message: string
  question?: string
}

export interface RouteDocumentTaskOutput extends DocumentTaskRouterResult {
  nextAction: NextActionShape
}

function normalizePrompt(value: unknown): string {
  return String(value || '').trim()
}

function hasEditVerb(text: string): boolean {
  return /改|改写|润色|压缩|扩写|精简|补充|调整|优化|重写|formal|rewrite/i.test(text)
}

function hasExplicitWorkflowIntent(text: string): boolean {
  return /综述|文献综述|literature review|论文|paper|学术|拜访函|贺信|正式模板|公文模板|套打模板|填表|填这个表|表单|form|通知|安排通知|培训安排|会议纪要|纪要|年度总结|年终总结|年度工作总结|年报/.test(text)
}

function resolveDocumentType(intent: DocumentTaskIntent, fallback: DocumentType = 'report'): DocumentType {
  switch (intent) {
    case 'official_notice':
      return 'notice'
    case 'formal_letter':
    case 'formal_template':
      return 'official_letter'
    case 'meeting_minutes':
      return 'memo'
    case 'work_summary':
      return 'summary'
    case 'annual_report':
      return 'report'
    default:
      return fallback
  }
}

function buildResult(input: {
  intent: DocumentTaskIntent
  confidence: number
  workflowId: string
  documentType: DocumentType
  requiredInputs?: string[]
  missingInputs?: string[]
  nextAction: NextActionShape
}): RouteDocumentTaskOutput {
  return {
    intent: input.intent,
    confidence: Number(input.confidence.toFixed(2)),
    workflowId: input.workflowId,
    documentType: input.documentType,
    requiredInputs: input.requiredInputs ?? [],
    missingInputs: input.missingInputs ?? [],
    targetEditor: 'DocumentWorkbench',
    nextAction: input.nextAction,
  }
}

export function routeDocumentTask(input: RouteDocumentTaskInput): RouteDocumentTaskOutput {
  const prompt = normalizePrompt(input.prompt)
  const selectedText = normalizePrompt(input.selectedText)
  const selectedSectionId = normalizePrompt(input.selectedSectionId)
  const templateId = normalizePrompt(input.templateId)
  const knowledgeRefs = Array.isArray(input.knowledgeRefs) ? input.knowledgeRefs : []
  const attachments = Array.isArray(input.attachments) ? input.attachments : []
  const lower = prompt.toLowerCase()
  const explicitWorkflowIntent = hasExplicitWorkflowIntent(prompt)

  if (selectedText && hasEditVerb(prompt) && !explicitWorkflowIntent) {
    return buildResult({
      intent: 'edit_selection',
      confidence: 0.96,
      workflowId: 'edit_selection',
      documentType: resolveDocumentType('edit_selection', (input.currentDocument?.type as DocumentType) || 'report'),
      nextAction: { type: 'selection_edit', message: '识别为选中文本改写，将只修改当前选区。' },
    })
  }

  if (!selectedText && selectedSectionId && hasEditVerb(prompt) && !explicitWorkflowIntent) {
    return buildResult({
      intent: 'edit_section',
      confidence: 0.92,
      workflowId: 'edit_section',
      documentType: resolveDocumentType('edit_section', (input.currentDocument?.type as DocumentType) || 'report'),
      nextAction: { type: 'section_edit', message: '识别为章节改写，将只修改当前章节。' },
    })
  }

  if (/综述|文献综述|literature review/i.test(prompt)) {
    return buildResult({
      intent: 'literature_review',
      confidence: 0.95,
      workflowId: 'literature_review',
      documentType: 'report',
      nextAction: { type: 'generate', message: '识别为文献综述，将进入论文工作流并回到 DocumentWorkbench。' },
    })
  }

  if (/论文|paper|学术/i.test(prompt)) {
    return buildResult({
      intent: 'academic_paper',
      confidence: 0.93,
      workflowId: 'academic_paper',
      documentType: 'report',
      nextAction: { type: 'generate', message: '识别为学术论文，将进入论文工作流并回到 DocumentWorkbench。' },
    })
  }

  if (/拜访函|贺信|正式模板|公文模板|套打模板/i.test(prompt)) {
    return buildResult({
      intent: 'formal_template',
      confidence: 0.9,
      workflowId: 'formal_template',
      documentType: 'official_letter',
      nextAction: { type: 'generate', message: '识别为正式模板任务，将先走结构化模板链路。' },
    })
  }

  if (/填表|填这个表|表单|form/i.test(prompt)) {
    const missingInputs: string[] = []
    if (!templateId) missingInputs.push('templateId')
    if (attachments.length === 0) missingInputs.push('templateFile')
    return buildResult({
      intent: 'form_fill',
      confidence: 0.94,
      workflowId: 'form_fill',
      documentType: 'report',
      requiredInputs: ['templateId or templateFile'],
      missingInputs,
      nextAction: missingInputs.length > 0
        ? {
            type: 'upload_template',
            message: '识别为表单填写任务，请先上传或选择表格模板。',
            question: '请先上传或选择表格模板后再生成。',
          }
        : { type: 'generate', message: '识别为表单填写任务，将进入模板填写链路。' },
    })
  }

  if (/通知|安排通知|培训安排/.test(prompt)) {
    return buildResult({
      intent: 'official_notice',
      confidence: 0.96,
      workflowId: 'official_notice',
      documentType: 'notice',
      nextAction: { type: 'generate', message: '识别为通知类文稿，将用中文办公文稿风格生成。' },
    })
  }

  if (/函|来函|回函|复函/.test(prompt)) {
    return buildResult({
      intent: 'formal_letter',
      confidence: 0.9,
      workflowId: 'formal_letter',
      documentType: 'official_letter',
      nextAction: { type: 'generate', message: '识别为正式函件，将进入 DocumentWorkbench。' },
    })
  }

  if (/会议纪要|纪要/.test(prompt)) {
    return buildResult({
      intent: 'meeting_minutes',
      confidence: 0.91,
      workflowId: 'meeting_minutes',
      documentType: 'memo',
      nextAction: { type: 'generate', message: '识别为会议纪要，将进入 DocumentWorkbench。' },
    })
  }

  if (/年度总结|年终总结|年度工作总结|年报/.test(prompt)) {
    return buildResult({
      intent: 'annual_report',
      confidence: 0.94,
      workflowId: 'annual_report',
      documentType: 'report',
      nextAction: { type: 'generate', message: '识别为年度总结 / 年报，将进入 DocumentWorkbench。' },
    })
  }

  if (/工作总结|汇报总结|总结/.test(prompt)) {
    return buildResult({
      intent: 'work_summary',
      confidence: 0.85,
      workflowId: 'work_summary',
      documentType: 'summary',
      nextAction: { type: 'generate', message: '识别为工作总结，将进入 DocumentWorkbench。' },
    })
  }

  if (!prompt) {
    return buildResult({
      intent: 'unknown',
      confidence: 0,
      workflowId: 'general',
      documentType: 'report',
      nextAction: {
        type: 'ask',
        message: '请先输入文稿需求。',
        question: '请说明要写的是通知、总结、纪要、论文还是模板填充。',
      },
    })
  }

  const askMessage = knowledgeRefs.length === 0 && !templateId && !/文稿|文章|报告|总结/.test(lower)
    ? '当前意图不够明确，请补充文稿类型或目标场景。'
    : '默认按通用文稿进入 DocumentWorkbench。'

  return buildResult({
    intent: 'unknown',
    confidence: /文稿|报告|总结|通知|纪要|论文|模板/.test(prompt) ? 0.74 : 0.45,
    workflowId: 'general',
    documentType: 'report',
    nextAction: /文稿|报告|总结|通知|纪要|论文|模板/.test(prompt)
      ? {
          type: 'ask',
          message: askMessage,
          question: '请确认这是通知、正式模板、论文还是普通工作总结。',
        }
      : {
          type: 'ask',
          message: askMessage,
          question: '请补充文稿类型，例如：通知、会议纪要、论文、年度总结或正式模板。',
        },
  })
}
