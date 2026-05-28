import { invokeLlmJson, invokeLlmText, isLlmConfigured } from '../../../modules/ai-gateway'
import type { DocumentCapabilityDef, CapabilityRunInput, CapabilityRunResult } from '../capability.types'
import { getDocumentPlainText, loadStudioDocument } from '../../document-studio/documentArtifact.service'

const CAPABILITY_PROMPTS: Record<string, string> = {
  'rewrite-selection': '保持原意，重新组织表达，输出仅替换后的文本。',
  'polish-selection': '润色表达，保持原意与事实，不扩写无关内容。',
  'rephrase-selection': '用不同表述重写，保持原意。',
  'translate-selection': '将选中文本翻译为通顺的中文（若已是中文则译为英文），只输出译文。',
  'humanize-selection':
    '减少重复表达、优化句式、降低模板化痕迹，保留原意。不要添加不存在的事实。只输出改写后的文本。',
  'continue-writing': '根据上下文自然续写 1-3 段，风格与全文一致，不要重复已有内容。',
  'summarize-document': '为全文生成 3-5 条要点摘要。',
}

export async function runDirectLlmCapability(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
): Promise<CapabilityRunResult> {
  const record = loadStudioDocument(input.documentId, input.userId)
  if (!record) {
    return { success: false, resultType: 'error', error: '文稿不存在或无权限访问' }
  }

  const selectionText = String(input.selection?.text || '').trim()
  const fullText = getDocumentPlainText(record)

  if (cap.actionType === 'transform_document' && cap.id === 'summarize-document') {
    if (!isLlmConfigured()) {
      return {
        success: true,
        resultType: 'comments',
        source: 'llm-fallback',
        fallback: true,
        comments: [{ text: fullText.slice(0, 200) + (fullText.length > 200 ? '…' : '') }],
      }
    }
    const summary = await invokeLlmText(
      [
        { role: 'system', content: '你是文稿摘要助手，输出简洁要点列表。' },
        { role: 'user', content: `${CAPABILITY_PROMPTS['summarize-document']}\n\n全文：\n${fullText}` },
      ],
      { temperature: 0.3, maxTokens: 800 },
    )
    return {
      success: true,
      resultType: 'comments',
      source: 'direct-llm',
      comments: summary.split(/\n+/).filter(Boolean).map(text => ({ text })),
    }
  }

  if (cap.actionType === 'continue_writing') {
    const context = fullText.slice(-2000)
    if (!isLlmConfigured()) {
      return {
        success: true,
        resultType: 'patch',
        source: 'llm-fallback',
        fallback: true,
        patch: {
          type: 'insert_after_block',
          text: '\n\n（续写需要配置 LLM；此处为占位内容。）',
          summary: ['LLM 未配置，返回占位续写'],
          warnings: ['请配置 LLM_API_KEY 后使用真实续写。'],
        },
      }
    }
    const continued = await invokeLlmText(
      [
        { role: 'system', content: CAPABILITY_PROMPTS['continue-writing'] },
        {
          role: 'user',
          content: [
            `标题：${record.title}`,
            input.instruction ? `用户指令：${input.instruction}` : '',
            `上下文：\n${context}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      { temperature: 0.5, maxTokens: 1200 },
    )
    return {
      success: true,
      resultType: 'patch',
      source: 'direct-llm',
      patch: {
        type: 'insert_after_block',
        text: continued.trim(),
        summary: ['已根据上下文续写'],
        selection: input.selection,
      },
    }
  }

  if (!selectionText) {
    return { success: false, resultType: 'error', error: '请先选中需要处理的文本。' }
  }

  const shortHumanize = cap.id === 'humanize-selection' && selectionText.length < 1500

  if (!isLlmConfigured()) {
    return {
      success: true,
      resultType: 'patch',
      source: 'llm-fallback',
      fallback: true,
      patch: {
        type: 'replace_selection',
        text: `${selectionText}（已记录指令：${input.instruction || cap.label}；请配置 LLM 获得真实改写。）`,
        summary: ['LLM 未配置'],
        warnings: ['请在后端配置 LLM_API_KEY 与 LLM_BASE_URL。'],
        selection: input.selection,
      },
    }
  }

  const systemPrompt = [
    '你是 AI Office Document Studio 的选区编辑助手。',
    CAPABILITY_PROMPTS[cap.id] || '按用户指令改写选中文本。',
    '只输出替换后的纯文本，不要解释，不要 Markdown 代码块。',
    '保留事实、数字、人名、机构名，不编造信息。',
  ].join('\n')

  const replacement = await invokeLlmText(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `文稿标题：${record.title}`,
          `能力：${cap.label}`,
          input.instruction ? `用户指令：${input.instruction}` : '',
          `选中文本：\n${selectionText}`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    { temperature: cap.id === 'humanize-selection' ? 0.45 : 0.35, maxTokens: 2000 },
  )

  return {
    success: true,
    resultType: 'patch',
    source: 'direct-llm',
    patch: {
      type: 'replace_selection',
      text: replacement.trim() || selectionText,
      summary: shortHumanize ? ['已完成 AI 降重（快速模式）'] : [`已完成${cap.label}`],
      selection: input.selection,
    },
  }
}

export async function runDirectLlmGeneration(input: {
  documentType: string
  capabilityId: string
  fields: Record<string, unknown>
  language?: string
  tone?: string
}): Promise<{ title: string; blocks: Array<{ type: string; level?: number; role?: string; text: string; items?: string[] }> }> {
  if (!isLlmConfigured()) {
    const topic = String(input.fields.topic || input.fields.researchTopic || '未命名文稿')
    return {
      title: topic,
      blocks: [
        { type: 'heading', level: 1, role: 'title', text: topic },
        {
          type: 'paragraph',
          role: 'body',
          text: '（LLM 未配置：请在服务端设置 LLM_API_KEY。以下为占位结构，接入模型后将生成真实文稿。）',
        },
      ],
    }
  }
  const raw = await invokeLlmJson<{
    title?: string
    blocks?: Array<{ type?: string; level?: number; role?: string; text?: string; items?: string[] }>
  }>(
    [
      {
        role: 'system',
        content: [
          '你是 AI Office 文稿生成器。输出 JSON：{ "title": string, "blocks": [{ "type": "heading"|"paragraph"|"blockquote"|"list", "level"?: number, "role"?: string, "text": string, "items"?: string[] }] }',
          '不编造不存在的事实；语言：' + (input.language || 'zh-CN'),
          '语气：' + (input.tone || '正式'),
        ].join('\n'),
      },
      {
        role: 'user',
        content: `文稿类型：${input.documentType}\n需求字段：\n${JSON.stringify(input.fields, null, 2)}`,
      },
    ],
    { temperature: 0.45, maxTokens: 4000 },
  )
  return {
    title: String(raw.title || '未命名文稿'),
    blocks: (raw.blocks || []).map(b => ({
      type: String(b.type || 'paragraph'),
      level: b.level,
      role: b.role,
      text: String(b.text || ''),
      items: b.items,
    })),
  }
}
