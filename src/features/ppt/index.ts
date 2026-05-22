// ppt module — Web feature boundary
// Public API for the PPT office capability module.

// Components
export { default as GenerationWorkbenchPanel } from './components/GenerationWorkbenchPanel'
export { default as GenerationComposer } from './components/GenerationComposer'
export { default as GenerationPromptComposer } from './components/GenerationPromptComposer'
export { default as GenerationKnowledgeSidebar } from './components/GenerationKnowledgeSidebar'
export { default as ResultPreviewPanel } from './components/ResultPreviewPanel'
export { default as GenerationModeSwitcher } from './components/GenerationModeSwitcher'
export { default as WebPptGenerationPanel } from './components/WebPptGenerationPanel' // temporary
export { getGenerationModeOption, GENERATION_MODE_OPTIONS } from './components/generationWorkbenchConfig'
export { getFileName, normalizeFileLikePath, toDisplayUrl, buildTimestampStamp, sanitizeFileStem, getParentPath } from './components/generationWorkbenchUtils'

// Contexts
export * from './contexts/GenerationWorkbenchContext'

// Services
export * from './services/pptWebGeneration'
