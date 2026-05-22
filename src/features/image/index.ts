// image module — Web feature boundary
export { default as ImageWorkspace } from './components/ImageWorkspace'
export { default as WebImageGenerationPanel } from './components/WebImageGenerationPanel' // temporary
export { generateImage, generateSelectionImage, getDefaultInsertedGeneratedImageWidthPx } from './services/ImageService'
export { runSharedImageGeneration } from './services/sharedImageGeneration'
