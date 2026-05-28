import type { DocumentPatch } from './documentStudioApi'
import { runDocumentCapability } from './documentStudioApi'

export const FREEFORM_CAPABILITY_ID = 'freeform-document-instruction'

type FreeformRunResult = {
  resultType: string
  patch?: DocumentPatch
  comments?: Array<{ text: string }>
  text?: string
  source?: string
  fallback?: boolean
}

function classifyDocumentInstruction(instruction: string): 'summarize' | 'continue' | 'transform' {
  if (/总结|摘要|概括|要点|提炼|归纳|梳理|提炼/.test(instruction)) return 'summarize'
  if (/续写|继续写|往下写|接着写|扩展下文|继续往下/.test(instruction)) return 'continue'
  return 'transform'
}

function commentsToText(comments?: Array<{ text: string }>): string {
  if (!comments?.length) return ''
  return comments.map(c => c.text).join('\n')
}

export async function runFreeformDocumentInstruction(input: {
  documentId: string
  instruction: string
  scope: 'selection' | 'document'
  selection?: DocumentPatch['selection']
  documentContext?: { title: string; documentType: string }
  fullText: string
}): Promise<FreeformRunResult> {
  const instruction = input.instruction.trim()
  if (!instruction) {
    throw new Error('请输入指令内容')
  }

  if (input.scope === 'selection' && input.selection?.text?.trim()) {
    const result = await runDocumentCapability(input.documentId, 'rewrite-selection', {
      scope: 'selection',
      selection: input.selection,
      instruction,
      documentContext: input.documentContext,
    })
    return result
  }

  const kind = classifyDocumentInstruction(instruction)

  if (kind === 'summarize') {
    const result = await runDocumentCapability(input.documentId, 'summarize-document', {
      scope: 'document',
      instruction,
      documentContext: input.documentContext,
    })
    const text = commentsToText(result.comments) || result.patch?.text || ''
    return {
      ...result,
      resultType: text && result.resultType !== 'patch' ? 'text' : result.resultType,
      text,
    }
  }

  if (kind === 'continue') {
    return runDocumentCapability(input.documentId, 'continue-writing', {
      scope: 'document',
      instruction,
      documentContext: input.documentContext,
    })
  }

  const fullText = input.fullText.trim()
  if (!fullText) {
    throw new Error('文稿正文为空，无法对全文执行指令')
  }

  return runDocumentCapability(input.documentId, 'rewrite-selection', {
    scope: 'selection',
    selection: {
      text: fullText,
      from: 0,
      to: fullText.length,
      blockIds: [],
    },
    instruction,
    documentContext: input.documentContext,
  })
}
