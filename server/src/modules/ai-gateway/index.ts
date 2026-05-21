/**
 * modules/ai-gateway — Server-side LLM integration for skills.
 */

export type { LlmMessage, LlmInvokeOptions } from './llmClient'
export {
  invokeLlmJson,
  invokeLlmText,
  getLlmModel,
  isLlmConfigured,
  resolveBaseUrl,
  resolveModel,
  resolveProvider,
} from './llmClient'

export type {
  GeneratedDocxContent,
  DocumentGenerationMeta,
} from './documentGenerator'
export {
  generateDocumentContent,
  generateDocumentContentDetailed,
  buildFallbackContent,
} from './documentGenerator'

export { appendAiInvocationLog, hashPrompt } from './aiInvocationLog'
export type { AiInvocationRecord } from './aiInvocationLog'
