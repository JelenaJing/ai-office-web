import type { DocumentCapabilityDef, CapabilityRunInput, CapabilityRunResult } from '../capability.types'
import { exportStudioDocument } from '../../document-studio/documentArtifact.service'

export async function runNodeCapability(
  cap: DocumentCapabilityDef,
  input: CapabilityRunInput,
): Promise<CapabilityRunResult> {
  const formatMap: Record<string, string> = {
    'export-markdown': 'markdown',
    'export-html': 'html',
    'export-docx': 'docx',
    'export-pdf': 'pdf',
  }
  const format = formatMap[cap.id] || 'markdown'

  if (cap.id === 'export-pdf') {
    return {
      success: false,
      resultType: 'error',
      pending: true,
      error: `${cap.label} 待接入（当前请使用 Markdown / HTML / Word）。`,
    }
  }

  try {
    const exported = await exportStudioDocument(input.documentId, input.userId, format)
    return {
      success: true,
      resultType: 'export',
      source: 'node',
      exportUrl: exported.exportUrl,
      filename: exported.filename,
      mimeType: exported.mimeType,
    }
  } catch (error) {
    return {
      success: false,
      resultType: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
