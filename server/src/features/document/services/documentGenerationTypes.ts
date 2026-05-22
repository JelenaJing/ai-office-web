export type OutputLanguage = 'zh-CN' | 'en-US'

export type WritingGenerationMode = 'default' | 'knowledge-template-document'

export interface TemplateDocumentInput {
  title?: string
  sourceType?: string
  extractedText?: string
  outline?: string[]
}

export interface DocumentTypePreset {
  id?: string
  label?: string
  promptHint?: string
  /** Recommended outline/section headings passed from frontend workflow registry */
  outlineSections?: string[]
  /** Document kind hint, e.g. 'academic_paper', 'formal_notice' */
  documentKind?: string
}

export interface WritingWorkflowInput {
  instruction: string
  documentText?: string
  language?: 'zh' | 'en'
  outputLanguage?: OutputLanguage
  extraContext?: string
  generationMode?: WritingGenerationMode
  templateDocument?: TemplateDocumentInput | null
  documentTypePreset?: DocumentTypePreset | null
  knowledgeBaseIds?: string[]
  fileIds?: string[]
  workspacePath?: string
  title?: string
}

export interface WritingWorkflowResult {
  markdown: string
  html: string
}
