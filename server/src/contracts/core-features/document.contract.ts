export type DocumentTaskIntent =
  | 'official_notice'
  | 'formal_letter'
  | 'meeting_minutes'
  | 'work_summary'
  | 'annual_report'
  | 'form_fill'
  | 'academic_paper'
  | 'literature_review'
  | 'formal_template'
  | 'edit_selection'
  | 'edit_section'
  | 'unknown'

export interface DocumentTaskRouterResult {
  intent: DocumentTaskIntent
  confidence: number
  workflowId: string
  documentType: 'report' | 'notice' | 'memo' | 'proposal' | 'summary' | 'official_letter'
  requiredInputs: string[]
  missingInputs: string[]
  targetEditor: 'DocumentWorkbench'
}

export type DocumentEditPatch =
  | { type: 'replace_selection'; selectedText: string; replacementText: string }
  | { type: 'replace_section'; sectionId: string; html?: string; markdown?: string }
  | { type: 'insert_at_cursor'; html?: string; text?: string }
  | { type: 'append_section'; section: Record<string, unknown> }
  | { type: 'replace_document'; html: string; document?: Record<string, unknown> }
