// document module — Web feature boundary
// Public API for the document office capability module.

// Components
export { default as EditorPanel } from './components/EditorPanel'
export { default as DocumentEngineHost } from './components/DocumentEngineHost'
export { default as ReadonlyDocumentPreview } from './components/ReadonlyDocumentPreview'
export { default as DocumentPreviewPane } from './components/DocumentPreviewPane'
export { default as WordLikeDocumentEditor } from './components/WordLikeDocumentEditor'
export { default as WebDocumentWorkbench } from './components/WebDocumentWorkbench'
export { default as WebWritingPanel } from './components/WebWritingPanel' // temporary

// Hooks
export * from './hooks/useDocumentPatchActions'

// Services
export { runWritingAssistant } from './services/WritingAssistantService'
export { continueWriting } from './services/ContinueWritingService'
export type { StructuredRemakeContext } from './services/sectionAwareRemake'

// Types
export * from './webDocumentTypes'
export * from './webDocumentSkillTypes'
export * from './webDocumentPatchTypes'
