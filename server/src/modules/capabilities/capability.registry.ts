import {
  DOCUMENT_STUDIO_CAPABILITIES,
  getDocumentStudioCapability,
} from '../document-studio/documentCapabilities'
import type { DocumentCapabilityDef } from './capability.types'

export function listAllCapabilities(): DocumentCapabilityDef[] {
  return [...DOCUMENT_STUDIO_CAPABILITIES]
}

export function getCapabilityById(id: string): DocumentCapabilityDef | undefined {
  return getDocumentStudioCapability(id)
}

export function assertCapabilityEnabled(cap: DocumentCapabilityDef): void {
  if (!cap.enabled) {
    if (cap.status === 'pending') {
      throw new Error(`${cap.label}：该能力待接入外部 Skill，暂不可用。`)
    }
    throw new Error(`${cap.label}：当前未启用。`)
  }
}
