// Compatibility re-exports — module moved to src/features/ppt/
export { default as GenerationWorkbenchPanel } from '../../../features/ppt/components/GenerationWorkbenchPanel'
export { default as GenerationComposer } from '../../../features/ppt/components/GenerationComposer'
export { default as GenerationPromptComposer } from '../../../features/ppt/components/GenerationPromptComposer'
export { default as GenerationKnowledgeSidebar } from '../../../features/ppt/components/GenerationKnowledgeSidebar'
export { default as ResultPreviewPanel } from '../../../features/ppt/components/ResultPreviewPanel'
export { default as GenerationModeSwitcher } from '../../../features/ppt/components/GenerationModeSwitcher'
export { getGenerationModeOption, GENERATION_MODE_OPTIONS } from '../../../features/ppt/components/generationWorkbenchConfig'
export { getFileName, normalizeFileLikePath, toDisplayUrl, buildTimestampStamp, sanitizeFileStem, getParentPath } from '../../../features/ppt/components/generationWorkbenchUtils'
