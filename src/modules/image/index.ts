// Compatibility re-export — module moved to src/features/image/
export { default as ImageWorkspace } from '../../features/image/components/ImageWorkspace'
export { generateImage, generateSelectionImage, getDefaultInsertedGeneratedImageWidthPx } from '../../features/image/services/ImageService'
export { runSharedImageGeneration, resolveActiveImageStyleProfile, orderSelectedKnowledgeDocuments, isExplicitImageGenerationRequest } from '../../features/image/services/sharedImageGeneration'
export { getPrimaryStyleReferenceId, DEFAULT_IMAGE_STYLE_OPTIONS, DEFAULT_IMAGE_GENERATION_MODE } from '../../features/image/services/imageGenerationPrompt'
