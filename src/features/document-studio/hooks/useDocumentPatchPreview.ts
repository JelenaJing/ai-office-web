import { useCallback, useState } from 'react'
import type { DocumentPatch } from '../services/documentStudioApi'
import { applyDocumentPatch, runDocumentCapability } from '../services/documentStudioApi'
import { runFreeformDocumentInstruction } from '../services/freeformInstruction'

export function useDocumentPatchPreview(documentId: string | null) {
  const [pendingPatch, setPendingPatch] = useState<DocumentPatch | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSource, setLastSource] = useState<string | undefined>()
  const [lastFallback, setLastFallback] = useState(false)
  const [lastTextResult, setLastTextResult] = useState<string | null>(null)
  const [lastInstruction, setLastInstruction] = useState<string | null>(null)

  const applyCapabilityResult = useCallback(
    (result: {
      resultType: string
      patch?: DocumentPatch
      comments?: Array<{ text: string }>
      text?: string
      exportUrl?: string
      source?: string
      fallback?: boolean
    }) => {
      setLastSource(result.source)
      setLastFallback(Boolean(result.fallback))

      if (result.resultType === 'patch' && result.patch) {
        setPendingPatch(result.patch)
        setLastTextResult(null)
        return
      }

      const textFromComments = result.comments?.map(c => c.text).join('\n').trim()
      const textResult = (result.text || textFromComments || '').trim()

      if (textResult && (result.resultType === 'text' || result.resultType === 'comments')) {
        setLastTextResult(textResult)
        setPendingPatch(null)
        return
      }

      if (result.resultType === 'export' && result.exportUrl) {
        window.open(
          result.exportUrl.startsWith('http') ? result.exportUrl : `${window.location.origin}${result.exportUrl}`,
          '_blank',
        )
      }
    },
    [],
  )

  const runCapability = useCallback(
    async (
      capabilityId: string,
      body: { scope?: string; selection?: DocumentPatch['selection']; instruction?: string },
    ) => {
      if (!documentId) return
      setLoading(true)
      setError(null)
      try {
        const result = await runDocumentCapability(documentId, capabilityId, body)
        if (capabilityId === 'summarize-document' && result.resultType === 'comments') {
          applyCapabilityResult({ ...result, resultType: 'text' })
        } else {
          applyCapabilityResult(result)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [applyCapabilityResult, documentId],
  )

  const runFreeformInstruction = useCallback(
    async (input: {
      instruction: string
      scope: 'selection' | 'document'
      selection?: DocumentPatch['selection']
      documentContext?: { title: string; documentType: string }
      fullText: string
    }) => {
      if (!documentId) return
      const instruction = input.instruction.trim()
      if (!instruction) return

      setLoading(true)
      setError(null)
      setLastInstruction(instruction)
      try {
        const result = await runFreeformDocumentInstruction({
          documentId,
          instruction,
          scope: input.scope,
          selection: input.selection,
          documentContext: input.documentContext,
          fullText: input.fullText,
        })
        applyCapabilityResult(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [applyCapabilityResult, documentId],
  )

  const acceptPatch = useCallback(
    async (editorJson?: Record<string, unknown>) => {
      if (!documentId || !pendingPatch || pendingPatch.type === 'comments') {
        setPendingPatch(null)
        return null
      }
      const applied = await applyDocumentPatch(documentId, pendingPatch, editorJson)
      setPendingPatch(null)
      return applied.editorJson
    },
    [documentId, pendingPatch],
  )

  const dismissPatch = useCallback(() => setPendingPatch(null), [])

  const clearTextResult = useCallback(() => setLastTextResult(null), [])

  return {
    pendingPatch,
    loading,
    error,
    lastSource,
    lastFallback,
    lastTextResult,
    lastInstruction,
    runCapability,
    runFreeformInstruction,
    acceptPatch,
    dismissPatch,
    clearTextResult,
  }
}
