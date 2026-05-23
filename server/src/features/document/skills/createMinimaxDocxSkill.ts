import { resolveDocumentKnowledgeRefs } from '../services/documentKnowledgeRefs'
import { runMinimaxDocxWithFallback } from '../services/minimaxDocxRunner'
import type { DocumentKnowledgeRefInput, DocumentLanguage, DocumentTaskResult, DocumentType } from '../types'

export interface CreateMinimaxDocxSkillInput {
  prompt: string
  title?: string
  workspacePath: string
  templateId?: string
  knowledgeRefs?: DocumentKnowledgeRefInput[]
  documentType?: DocumentType
  language?: DocumentLanguage
  userId: string
  fallback?: 'builtin' | 'none'
}

export type CreateMinimaxDocxSkillResult =
  | ({ success: true } & DocumentTaskResult)
  | { success: false; error: string; status?: number }

export async function runCreateMinimaxDocxSkill(
  input: CreateMinimaxDocxSkillInput,
): Promise<CreateMinimaxDocxSkillResult> {
  try {
    const knowledgeRefs = await resolveDocumentKnowledgeRefs({
      workspacePath: input.workspacePath,
      knowledgeRefs: input.knowledgeRefs,
    })
    const { result } = await runMinimaxDocxWithFallback({
      userId: input.userId,
      prompt: input.prompt,
      title: input.title,
      workspacePath: input.workspacePath,
      templateId: input.templateId,
      knowledgeRefs,
      documentType: input.documentType || 'report',
      language: input.language,
      fallback: input.fallback || 'builtin',
    })
    return {
      success: true,
      ...result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    }
  }
}
