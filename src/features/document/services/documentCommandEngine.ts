/**
 * DocumentCommandEngine
 *
 * Parses natural-language instructions from the bottom AI prompt into a
 * structured `ParsedDocumentCommand`, resolves the target block(s) from the
 * editor's canonical data, and classifies whether the operation needs an AI
 * call or can be applied deterministically (format ops).
 *
 * The engine does NOT perform I/O.  Callers (DocumentWorkbench) are responsible
 * for invoking the appropriate AI API or DOM patch after receiving the result.
 */

import type { DocumentArtifact, DocumentCanonicalBlock, DocumentCanonicalData } from './documentWorkbenchApi'

// ──────────────────────────────────────────────────────────────────────────────
// Intent types
// ──────────────────────────────────────────────────────────────────────────────

/** Semantic AI operations — require an LLM call */
export type SemanticIntent =
  | 'translate'
  | 'rewrite'
  | 'shorten'
  | 'expand'
  | 'formalize'
  | 'add_citation'
  | 'summarize'
  | 'continue_writing'

/** Format operations — no LLM needed, applied directly via DOM */
export type FormatIntent =
  | 'highlight'
  | 'bold'
  | 'italic'
  | 'center'
  | 'add_divider'
  | 'clear_formatting'

export type CommandIntent = SemanticIntent | FormatIntent | 'unknown'

export type OperationClass = 'format' | 'semantic' | 'unknown'

// ──────────────────────────────────────────────────────────────────────────────
// Target descriptor
// ──────────────────────────────────────────────────────────────────────────────

export type TargetDescriptor =
  | { kind: 'nth_paragraph'; n: number }        // "第一段" → n=1
  | { kind: 'nth_heading'; n: number }           // "第二个标题" → n=2
  | { kind: 'nth_list_item'; n: number }         // "第三个列表项" → n=3
  | { kind: 'current_block' }                    // cursor block
  | { kind: 'current_selection' }                // text selection
  | { kind: 'title' }                            // document title
  | { kind: 'section_by_name'; name: string }   // "政策依据部分"
  | { kind: 'section_current' }                  // currently selected section
  | { kind: 'all' }                              // whole document
  | { kind: 'ambiguous' }                        // could not determine

// ──────────────────────────────────────────────────────────────────────────────
// Parsed command
// ──────────────────────────────────────────────────────────────────────────────

export interface ParsedDocumentCommand {
  /** Original user instruction text */
  raw: string
  /** Resolved intent */
  intent: CommandIntent
  /** Whether this is a format (no-AI) or semantic (AI) operation */
  operationClass: OperationClass
  /** Resolved target descriptor */
  target: TargetDescriptor
  /**
   * Optional instruction override to send to the AI.
   * For semantic ops, this is the re-phrased prompt after stripping the
   * target selector phrase, so the AI receives a clean instruction.
   */
  aiInstruction?: string
  /** Confidence 0-1 */
  confidence: number
}

// ──────────────────────────────────────────────────────────────────────────────
// Resolved target blocks
// ──────────────────────────────────────────────────────────────────────────────

export interface ResolvedCommandTarget {
  /** IDs of all target blocks */
  blockIds: string[]
  /** Human-readable description of what was resolved */
  label: string
  /** Whether the target is ambiguous and the user should be prompted */
  ambiguous: boolean
  /** The block objects themselves (for reading text) */
  blocks: DocumentCanonicalBlock[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Operation result emitted after execution
// ──────────────────────────────────────────────────────────────────────────────

export type FormatOp =
  | { type: 'highlight'; blockIds: string[] }
  | { type: 'bold'; blockIds: string[] }
  | { type: 'italic'; blockIds: string[] }
  | { type: 'center'; blockIds: string[] }
  | { type: 'clear_formatting'; blockIds: string[] }

export interface DocumentPatchOperation {
  id: string
  timestamp: number
  operationClass: OperationClass
  intent: CommandIntent
  /** Original natural-language instruction */
  instruction?: string
  /** Block IDs that were affected */
  blockIds: string[]
  /** Human-readable summary for the AI panel */
  summary: string
  /** Whether an AI call was made */
  aiCalled: boolean
  /** The text of the patch (for undo) */
  previousTexts?: Record<string, string>
  /**
   * Full document artifact snapshot before this operation.
   * When present, undo restores this artifact directly instead of
   * reconstructing it from innerHTML, which correctly restores
   * citations, references, and canonicalData in one step.
   */
  previousArtifact?: DocumentArtifact
}

// ──────────────────────────────────────────────────────────────────────────────
// Intent pattern table
// ──────────────────────────────────────────────────────────────────────────────

interface IntentRule {
  intent: CommandIntent
  operationClass: OperationClass
  patterns: RegExp[]
  /** Optional prompt rewriter: given the full instruction, return a cleaner AI prompt */
  rewritePrompt?: (raw: string) => string
}

const INTENT_RULES: IntentRule[] = [
  // ── Format ops ──
  {
    intent: 'highlight',
    operationClass: 'format',
    patterns: [/高[亮光]/, /标[记注]/, /mark/i, /highlight/i],
  },
  {
    intent: 'bold',
    operationClass: 'format',
    patterns: [/加粗/, /粗体/, /bold/i],
  },
  {
    intent: 'italic',
    operationClass: 'format',
    patterns: [/斜体/, /斜字/, /italic/i],
  },
  {
    intent: 'center',
    operationClass: 'format',
    patterns: [/居中/, /center/i],
  },
  {
    intent: 'clear_formatting',
    operationClass: 'format',
    patterns: [/清[除空]格式/, /去掉格式/, /clear.*format/i],
  },
  {
    intent: 'add_divider',
    operationClass: 'format',
    patterns: [/加分隔线/, /插入分隔/, /divider/i, /分割线/],
  },

  // ── Semantic ops ──
  {
    intent: 'translate',
    operationClass: 'semantic',
    patterns: [/翻译/, /translate/i, /译成/, /改成英文/, /改成中文/],
    rewritePrompt: (raw) => {
      if (/英文|英语|english/i.test(raw)) return '请将以下内容翻译成英文，保持原意。'
      if (/中文|中语|chinese/i.test(raw)) return '请将以下内容翻译成中文，保持原意。'
      return '请将以下内容翻译成英文，保持原意。'
    },
  },
  {
    intent: 'formalize',
    operationClass: 'semantic',
    patterns: [/正式/, /formali[sz]e/i, /专业/, /书面/],
    rewritePrompt: () => '请改得更正式，符合中文办公文稿风格。',
  },
  {
    intent: 'shorten',
    operationClass: 'semantic',
    patterns: [/压缩/, /缩短/, /精简/, /shorten/i, /compress/i, /简化/],
    rewritePrompt: () => '请压缩成三段以内，保留核心信息。',
  },
  {
    intent: 'expand',
    operationClass: 'semantic',
    patterns: [/扩写/, /扩充/, /详细/, /expand/i, /elaborate/i],
    rewritePrompt: () => '请扩写，补充更多细节和依据。',
  },
  {
    intent: 'rewrite',
    operationClass: 'semantic',
    patterns: [/重写/, /改写/, /rewrite/i, /改成/, /改一下/, /改得/],
    rewritePrompt: (raw) => raw,
  },
  {
    intent: 'summarize',
    operationClass: 'semantic',
    patterns: [/摘要/, /总结/, /归纳/, /summari[sz]e/i, /概括/],
    rewritePrompt: () => '请生成一段简洁摘要。',
  },
  {
    intent: 'add_citation',
    operationClass: 'semantic',
    patterns: [/加引用/, /添加引用/, /引用/, /citation/i, /政策依据/, /法规依据/],
    rewritePrompt: () => '请补充相关政策引用；如果依据不足，请明确写"需要人工确认依据"。',
  },
  {
    intent: 'continue_writing',
    operationClass: 'semantic',
    patterns: [/续写/, /继续写/, /往下写/, /continue/i, /补充内容/],
    rewritePrompt: (raw) => raw,
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// Target pattern table
// ──────────────────────────────────────────────────────────────────────────────

interface TargetRule {
  descriptor: TargetDescriptor | ((raw: string) => TargetDescriptor)
  patterns: RegExp[]
}

const ZH_ORDINALS: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '第一': 1, '第二': 2, '第三': 3, '第四': 4, '第五': 5,
  '第六': 6, '第七': 7, '第八': 8, '第九': 9, '第十': 10,
}

function zhOrdinalToN(raw: string): number | null {
  for (const [token, n] of Object.entries(ZH_ORDINALS)) {
    if (raw.includes(token)) return n
  }
  const match = raw.match(/第\s*(\d+)|(\d+)\s*[段行个]/)
  if (match) return Number(match[1] ?? match[2])
  return null
}

function extractNamedSection(raw: string): string {
  const normalized = raw
    .replace(/^(帮我|请|给我|给|把)/u, '')
    .replace(/(加引用|添加引用|插入引用|引用|改写|翻译|高光|正式|压缩|扩写|总结|摘要).*$/u, '')
    .trim()
  const match = normalized.match(/([\u4e00-\u9fa5A-Za-z0-9_-]{1,24}?)(?:部分|章节|一节|节)/u)
  return (match?.[1] || normalized)
    .replace(/^(当前|这一|这|该)/u, '')
    .trim()
}

const TARGET_RULES: TargetRule[] = [
  { patterns: [/标题/], descriptor: { kind: 'title' } },
  {
    patterns: [/第[一二三四五六七八九十\d]+段/, /第\s*\d+\s*段/],
    descriptor: (raw) => ({ kind: 'nth_paragraph', n: zhOrdinalToN(raw) ?? 1 }),
  },
  {
    patterns: [/第[一二三四五六七八九十\d]+个?标题/, /第\s*\d+\s*个?标题/],
    descriptor: (raw) => ({ kind: 'nth_heading', n: zhOrdinalToN(raw) ?? 1 }),
  },
  {
    patterns: [/第[一二三四五六七八九十\d]+个?列表项/, /第[一二三四五六七八九十\d]+条/],
    descriptor: (raw) => ({ kind: 'nth_list_item', n: zhOrdinalToN(raw) ?? 1 }),
  },
  { patterns: [/当前选中/, /选中[的内]?/, /选区/], descriptor: { kind: 'current_selection' } },
  { patterns: [/当前段落/, /这一段/, /这段/, /光标所在/, /当前位置/, /这里/], descriptor: { kind: 'current_block' } },
  { patterns: [/当前章节/, /这一节/, /这节/, /该章节/], descriptor: { kind: 'section_current' } },
  { patterns: [/全文/, /整篇/, /所有/, /全部/], descriptor: { kind: 'all' } },
  {
    // section by name: e.g. "政策依据部分" / "给政策依据部分加引用"
    patterns: [/[\u4e00-\u9fa5A-Za-z0-9_-]{1,24}(部分|章节|一节|节)/u],
    descriptor: (raw) => {
      const name = extractNamedSection(raw)
      return { kind: 'section_by_name', name: name || raw }
    },
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// parse()
// ──────────────────────────────────────────────────────────────────────────────

export function parseDocumentCommand(instruction: string): ParsedDocumentCommand {
  const raw = instruction.trim()

  // 1. Resolve intent
  let matchedRule: IntentRule | null = null
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(raw))) {
      matchedRule = rule
      break
    }
  }

  const intent: CommandIntent = matchedRule?.intent ?? 'unknown'
  const operationClass: OperationClass = matchedRule?.operationClass ?? 'unknown'

  // 2. Resolve target
  let matchedTarget: TargetDescriptor | null = null
  for (const rule of TARGET_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(raw))) {
      matchedTarget = typeof rule.descriptor === 'function' ? rule.descriptor(raw) : rule.descriptor
      break
    }
  }

  // If no explicit target, fall back to current_block (most common case)
  const target: TargetDescriptor = matchedTarget ?? { kind: 'current_block' }

  // 3. Build AI instruction
  const aiInstruction = matchedRule?.rewritePrompt ? matchedRule.rewritePrompt(raw) : raw

  // 4. Confidence
  const confidence = intent === 'unknown' ? 0.2 : matchedTarget ? 0.85 : 0.65

  return { raw, intent, operationClass, target, aiInstruction, confidence }
}

// ──────────────────────────────────────────────────────────────────────────────
// resolveCommandTarget()
// ──────────────────────────────────────────────────────────────────────────────

interface ResolveTargetInput {
  descriptor: TargetDescriptor
  canonicalData: DocumentCanonicalData | null
  selectedBlockId: string | null
  selectedSectionId: string | null
}

export function resolveCommandTarget(input: ResolveTargetInput): ResolvedCommandTarget {
  const { descriptor, canonicalData, selectedBlockId, selectedSectionId } = input
  const blocks = canonicalData?.blocks ?? []

  function found(matchedBlocks: DocumentCanonicalBlock[], label: string): ResolvedCommandTarget {
    return {
      blockIds: matchedBlocks.map((block) => block.id),
      label,
      ambiguous: false,
      blocks: matchedBlocks,
    }
  }

  function ambiguous(label: string): ResolvedCommandTarget {
    return { blockIds: [], label, ambiguous: true, blocks: [] }
  }

  switch (descriptor.kind) {
    case 'title': {
      const titleBlock = blocks.find((block) => block.role === 'title')
      if (titleBlock) return found([titleBlock], '文档标题')
      return ambiguous('找不到文档标题块')
    }

    case 'nth_paragraph': {
      const paragraphs = blocks.filter((block) => block.role === 'paragraph')
      const block = paragraphs[descriptor.n - 1]
      if (block) return found([block], `第 ${descriptor.n} 段`)
      return ambiguous(`找不到第 ${descriptor.n} 段（共 ${paragraphs.length} 段）`)
    }

    case 'nth_heading': {
      const headings = blocks.filter((block) => block.role === 'heading' || block.role === 'title')
      const block = headings[descriptor.n - 1]
      if (block) return found([block], `第 ${descriptor.n} 个标题`)
      return ambiguous(`找不到第 ${descriptor.n} 个标题（共 ${headings.length} 个）`)
    }

    case 'nth_list_item': {
      const items = blocks.filter((block) => block.role === 'list-item')
      const block = items[descriptor.n - 1]
      if (block) return found([block], `第 ${descriptor.n} 个列表项`)
      return ambiguous(`找不到第 ${descriptor.n} 个列表项（共 ${items.length} 个）`)
    }

    case 'current_block': {
      if (!selectedBlockId) {
        // No cursor position — user must click a paragraph first
        return ambiguous('请先点击要操作的段落')
      }
      const block = blocks.find((block) => block.id === selectedBlockId)
      if (block) return found([block], block.role || '当前 block')
      return ambiguous('当前 block 未在文档结构中找到')
    }

    case 'current_selection': {
      // Selection is handled at the call site — we only confirm it's requested
      return { blockIds: selectedBlockId ? [selectedBlockId] : [], label: '当前选中', ambiguous: false, blocks: [] }
    }

    case 'section_current': {
      if (!selectedSectionId) return ambiguous('请先点击章节')
      const sectionBlocks = blocks.filter((block) => block.sectionId === selectedSectionId)
      if (sectionBlocks.length === 0) return ambiguous(`章节 ${selectedSectionId} 中未找到块`)
      return found(sectionBlocks, `当前章节（${sectionBlocks.length} 个块）`)
    }

    case 'section_by_name': {
      const name = descriptor.name.trim().toLowerCase()
      if (!name) return ambiguous('章节名称为空')
      // Fuzzy match section titles in outline
      const section = canonicalData?.sections.find(
        (section) => section.title.toLowerCase().includes(name) || name.includes(section.title.toLowerCase()),
      )
      if (!section) {
        // Try matching block sectionTitle
        const matchedBlocks = blocks.filter(
          (block) => (block.sectionTitle || '').toLowerCase().includes(name),
        )
        if (matchedBlocks.length > 0) return found(matchedBlocks, `章节"${name}"（模糊匹配）`)
        const textMatchedBlocks = blocks.filter((block) => (
          'text' in block
          && typeof block.text === 'string'
          && block.text.toLowerCase().includes(name)
        ))
        if (textMatchedBlocks.length > 0) {
          return found(textMatchedBlocks, `文本包含"${name}"的块`)
        }
        return ambiguous(`找不到章节或文本"${name}"`)
      }
      const sectionBlocks = blocks.filter((block) => block.sectionId === section.id)
      return found(sectionBlocks, `章节"${section.title}"`)
    }

    case 'all': {
      return found(blocks, `全文（${blocks.length} 个块）`)
    }

    case 'ambiguous':
      return ambiguous('目标不明确，请选中文字或章节后再试')

    default:
      return ambiguous('未知目标类型')
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// buildFormatOp()  —  deterministic DOM mutation spec (no AI needed)
// ──────────────────────────────────────────────────────────────────────────────

export function buildFormatOp(intent: FormatIntent, blockIds: string[]): FormatOp {
  if (intent === 'highlight') return { type: 'highlight', blockIds }
  if (intent === 'bold') return { type: 'bold', blockIds }
  if (intent === 'italic') return { type: 'italic', blockIds }
  if (intent === 'center') return { type: 'center', blockIds }
  return { type: 'clear_formatting', blockIds }
}

// ──────────────────────────────────────────────────────────────────────────────
// buildOperationRecord()  —  for undo stack
// ──────────────────────────────────────────────────────────────────────────────

export function buildOperationRecord(opts: {
  operationClass: OperationClass
  intent: CommandIntent
  instruction?: string
  blockIds: string[]
  aiCalled: boolean
  summary: string
  previousTexts?: Record<string, string>
  previousArtifact?: DocumentArtifact
}): DocumentPatchOperation {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    operationClass: opts.operationClass,
    intent: opts.intent,
    instruction: opts.instruction,
    blockIds: opts.blockIds,
    summary: opts.summary,
    aiCalled: opts.aiCalled,
    previousTexts: opts.previousTexts,
    previousArtifact: opts.previousArtifact,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// isFormatIntent / isSemanticIntent helpers
// ──────────────────────────────────────────────────────────────────────────────

const FORMAT_INTENTS = new Set<CommandIntent>([
  'highlight', 'bold', 'italic', 'center', 'add_divider', 'clear_formatting',
])

export function isFormatIntent(intent: CommandIntent): intent is FormatIntent {
  return FORMAT_INTENTS.has(intent)
}

export function isSemanticIntent(intent: CommandIntent): intent is SemanticIntent {
  return !FORMAT_INTENTS.has(intent) && intent !== 'unknown'
}

export function isUndoInstruction(raw: string): boolean {
  return /撤销(上一次|最近一次|刚才|最后一次)?(操作|修改|命令)?/u.test(String(raw || '').trim())
}
