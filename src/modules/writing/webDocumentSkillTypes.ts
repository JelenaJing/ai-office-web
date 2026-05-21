import type { HeaderFooterSpec, PageSpec } from './webDocumentTypes'

export type WebDocumentSkillKind =
  | 'document-generator'
  | 'document-editor'
  | 'document-template'
  | 'document-importer'
  | 'document-exporter'
  | 'document-transformer'

export interface WebDocumentSkillManifest {
  id: string
  kind: WebDocumentSkillKind
  name: string
  description?: string
  version?: string
  enabled: boolean
  builtin?: boolean

  /** 执行时调用的 server skill id */
  mapsToSkillId?: string

  pageSpec?: PageSpec
  headerFooter?: HeaderFooterSpec
  bodySlots?: Array<{
    id: string
    label: string
    editable: boolean
  }>

  inputFormats?: string[]
  outputFormats?: string[]

  capability?: string
}
