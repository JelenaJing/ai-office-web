// email module — Web feature boundary
// Public API for the email office capability module.

// Components
export { default as CommunicationWorkbench } from './components/CommunicationWorkbench'
export { default as WebEmailPanel } from './components/WebEmailPanel' // temporary
export { default as ComposeModal } from './components/ComposeModal'

// Contexts
export { EmailProvider, useEmail } from './contexts/EmailContext'

// Services (exported for feature service consumers)
export * from './services/emailRuntime'
