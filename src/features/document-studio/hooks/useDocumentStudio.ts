import { useCallback, useEffect, useState } from 'react'
import { fetchDocument, fetchDocumentTypes, type DocumentTypeDef } from '../services/documentStudioApi'
import { DOCUMENT_TYPE_CARDS } from '../services/documentCapabilities'
import { clearActiveDocumentSession, persistActiveDocumentId } from '../services/documentStudioSession'
import { rememberRecentDocument } from '../services/documentStudioRecent'
import {
  editorJsonContentVersion,
  isEditorJsonRenderable,
  logDocumentLoadSummary,
  resolveEditorJsonForStudio,
} from '../services/editorContentBridge'

export type StudioStep = 'home' | 'recent' | 'humanize' | 'type' | 'form' | 'generating' | 'editor'

export function useDocumentStudio() {
  const [step, setStep] = useState<StudioStep>('home')
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDef[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [editorJson, setEditorJson] = useState<Record<string, unknown> | null>(null)
  const [contentModel, setContentModel] = useState<Record<string, unknown> | null>(null)
  const [contentVersion, setContentVersion] = useState('empty')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingDocument, setLoadingDocument] = useState(false)

  useEffect(() => {
    void fetchDocumentTypes()
      .then(res => setDocumentTypes(res.documentTypes))
      .catch(() => {
        setDocumentTypes(
          DOCUMENT_TYPE_CARDS.map(card => ({
            id: card.id,
            label: card.label,
            description: '',
            generateCapabilityId: card.generateCapabilityId,
            fields: [],
          })),
        )
      })
  }, [])

  const selectedType = documentTypes.find(t => t.id === selectedTypeId)

  const loadDocument = useCallback(async (id: string) => {
    setLoadingDocument(true)
    setLoadError(null)
    setStep('editor')
    try {
      const doc = await fetchDocument(id)
      const resolved = resolveEditorJsonForStudio({
        editorJson: doc.editorJson,
        contentModel: doc.contentModel,
        documentMarkdown: doc.documentMarkdown,
        title: doc.title,
      })

      logDocumentLoadSummary({
        documentId: doc.documentId,
        title: doc.title,
        editorJson: doc.editorJson,
        contentModel: doc.contentModel,
        documentMarkdown: doc.documentMarkdown,
        resolved,
      })

      if (!resolved || !isEditorJsonRenderable(resolved)) {
        setEditorJson(null)
        setContentVersion('empty')
        setLoadError(null)
      } else {
        setEditorJson(resolved)
        setContentVersion(editorJsonContentVersion(resolved))
        setLoadError(null)
      }
      setDocumentId(doc.documentId)
      setTitle(doc.title)
      setContentModel(doc.contentModel)
      setSelectedTypeId(doc.documentType)
      persistActiveDocumentId(id)
      rememberRecentDocument({ documentId: doc.documentId, title: doc.title })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err))
      setEditorJson(null)
      setContentVersion('empty')
    } finally {
      setLoadingDocument(false)
    }
  }, [])

  const goHome = useCallback(() => {
    setStep('home')
    setSelectedTypeId(null)
    setFields({})
    setDocumentId(null)
    setTitle('')
    setEditorJson(null)
    setContentModel(null)
    setLoadError(null)
    setLoadingDocument(false)
    setContentVersion('empty')
  }, [])

  const resetToTypeSelection = useCallback(() => {
    setStep('type')
    setSelectedTypeId(null)
    setFields({})
    setDocumentId(null)
    setTitle('')
    setEditorJson(null)
    setContentModel(null)
    setLoadError(null)
    setLoadingDocument(false)
    setContentVersion('empty')
  }, [])

  const startNewDocument = useCallback(() => {
    clearActiveDocumentSession()
    resetToTypeSelection()
  }, [resetToTypeSelection])

  return {
    step,
    setStep,
    documentTypes,
    selectedTypeId,
    setSelectedTypeId,
    selectedType,
    fields,
    setFields,
    documentId,
    setDocumentId,
    title,
    setTitle,
    editorJson,
    setEditorJson,
    contentModel,
    setContentModel,
    contentVersion,
    setContentVersion,
    loadError,
    setLoadError,
    loadingDocument,
    loadDocument,
    goHome,
    resetToTypeSelection,
    startNewDocument,
  }
}
