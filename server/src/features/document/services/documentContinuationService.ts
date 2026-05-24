import { invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import { buildKnowledgeRefPromptBlock } from './documentKnowledgeRefs'
import type { DocumentRecord } from '../types'

export async function continueDocumentAtCursor(input: {
  record: DocumentRecord
  instruction?: string
  cursorContext?: {
    sectionId?: string
    sectionTitle?: string
    beforeText?: string
    afterText?: string
  }
}): Promise<string> {
  const beforeText = String(input.cursorContext?.beforeText || '').trim()
  const afterText = String(input.cursorContext?.afterText || '').trim()
  const instruction = String(input.instruction || '').trim() || '请紧接当前光标继续往下写，延续当前语气、结构和办公文稿风格。'

  if (!beforeText && !afterText) {
    throw new Error('cursorContext 不能为空，至少需要 beforeText 或 afterText')
  }

  if (!isLlmConfigured()) {
    return `（续写占位）${instruction.includes('两句') ? '请结合实际内容补充两句。' : '请结合实际内容继续补充。'}`
  }

  const output = await invokeLlmText(
    [
      {
        role: 'system',
        content: [
          '你是 DocumentWorkbench 的续写助手。',
          input.record.language === 'en-US'
            ? 'language: en-US\nstyle: formal_office_english'
            : 'language: zh-CN\nstyle: formal_chinese_office',
          '只输出需要插入到当前光标位置的续写文本，不要重复原文，不要输出解释。',
          '必须与前后文衔接自然；如果依据不足，明确写“需要人工确认依据”。',
        ].join('\n\n'),
      },
      {
        role: 'user',
        content: [
          `文稿标题：${input.record.title}`,
          input.cursorContext?.sectionTitle ? `当前章节：${input.cursorContext.sectionTitle}` : '',
          `续写要求：${instruction}`,
          buildKnowledgeRefPromptBlock(input.record.knowledgeRefs),
          beforeText ? `光标前内容：${beforeText}` : '',
          afterText ? `光标后内容：${afterText}` : '',
        ].filter(Boolean).join('\n\n'),
      },
    ],
    { temperature: 0.45, maxTokens: 1200 },
  )

  return output.trim()
}
