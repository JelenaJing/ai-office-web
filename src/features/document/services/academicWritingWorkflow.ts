import {
  generateAcademicWritingDocument,
  generateAcademicWritingOutline,
  type AcademicWritingGenerateResponse,
  type AcademicWritingOutlineResponse,
  type AcademicWritingPaperType,
  type DocumentKnowledgeRefInput,
} from './documentWorkbenchApi'

export type { AcademicWritingPaperType, AcademicWritingGenerateResponse, AcademicWritingOutlineResponse }

export interface AcademicWritingWorkflowInput {
  workspacePath: string
  topic: string
  paperType: AcademicWritingPaperType
  researchGoal?: string
  lengthHint?: string
  language?: 'zh-CN' | 'en-US'
  style?: 'academic' | 'formal' | 'report'
  outline?: string[]
  knowledgeRefs?: DocumentKnowledgeRefInput[]
}

export function parseAcademicOutlineText(value: string): string[] {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[.)、]\s*/, '').trim())
    .filter(Boolean)
}

export function formatAcademicOutlineText(outline: string[]): string {
  return outline.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

export async function previewAcademicWritingOutline(input: Omit<AcademicWritingWorkflowInput, 'workspacePath' | 'outline' | 'knowledgeRefs'>): Promise<AcademicWritingOutlineResponse> {
  return generateAcademicWritingOutline(input)
}

export async function runAcademicWritingWorkflow(input: AcademicWritingWorkflowInput): Promise<AcademicWritingGenerateResponse> {
  return generateAcademicWritingDocument(input)
}
