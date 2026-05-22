/**
 * bridges/document-to-ppt/index.ts
 *
 * Public API for the document-to-ppt bridge.
 *
 * Consumers (app shell, AIOS workflows) should import from this file only.
 * Do NOT import bridge internals directly.
 *
 * Usage:
 *   import { convertDocumentToDeckInput, buildDeckInputFromDocumentArtifact } from '@/bridges/document-to-ppt'
 */

export { convertDocumentToDeckInput, buildDeckInputFromDocumentArtifact } from './convertDocumentToDeckInput'
export type { DocumentToDeckBridgeInput, DocumentToDeckBridgeResult } from './types'

/**
 * Bridge metadata — consumed by featureRegistry for documentation.
 */
export const BRIDGE_ID = 'document-to-ppt'
export const BRIDGE_VERSION = '1.0.0'
export const BRIDGE_DESCRIPTION =
  '将文稿模块输出的 DocumentOutline 转换为 PPT 模块接受的 DeckGenerationInput。' +
  '文稿模块和 PPT 模块之间的唯一允许连接点。'
