// Compatibility re-exports — module moved to src/features/document/
export { default as EditorPanel } from '../../features/document/components/EditorPanel'
export { default as DocumentEngineHost } from '../../features/document/components/DocumentEngineHost'
export { default as ReadonlyDocumentPreview } from '../../features/document/components/ReadonlyDocumentPreview'
export { default as DocumentPreviewPane } from '../../features/document/components/DocumentPreviewPane'
export { runWritingAssistant } from '../../features/document/services/WritingAssistantService'
export { continueWriting } from '../../features/document/services/ContinueWritingService'
export type { StructuredRemakeContext } from '../../features/document/services/sectionAwareRemake'
