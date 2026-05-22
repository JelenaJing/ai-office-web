import { useEffect, useMemo, useState } from 'react'
import { platformApi } from '../../platform'
import { WEB_DOCUMENT_BUILTIN_SKILLS } from './webDocumentBuiltInSkills'
import type { WebDocumentSkillManifest, WebDocumentSkillKind } from './webDocumentSkillTypes'

export interface WebDocumentSkillsState {
  loading: boolean
  error: string | null
  all: WebDocumentSkillManifest[]
  generatorSkills: WebDocumentSkillManifest[]
  templateSkills: WebDocumentSkillManifest[]
  importerSkills: WebDocumentSkillManifest[]
  exporterSkills: WebDocumentSkillManifest[]
  transformerSkills: WebDocumentSkillManifest[]
  editorSkills: WebDocumentSkillManifest[]
}

function byKind(skills: WebDocumentSkillManifest[], kind: WebDocumentSkillKind): WebDocumentSkillManifest[] {
  return skills.filter((s) => s.enabled && s.kind === kind)
}

export function useWebDocumentSkills(): WebDocumentSkillsState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serverExtras, setServerExtras] = useState<WebDocumentSkillManifest[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void platformApi.skills.list()
      .then((list) => {
        if (cancelled) return
        const extras: WebDocumentSkillManifest[] = []
        for (const s of list) {
          const meta = s as { kind?: WebDocumentSkillKind; mapsToSkillId?: string }
          if (meta.kind && ['document-generator', 'document-editor', 'document-template', 'document-importer', 'document-exporter', 'document-transformer'].includes(meta.kind)) {
            extras.push({
              id: s.id,
              kind: meta.kind,
              name: s.name,
              description: s.description,
              version: s.version,
              enabled: s.enabled,
              mapsToSkillId: meta.mapsToSkillId ?? s.id,
            })
          }
        }
        setServerExtras(extras)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载 skills 失败')
          setServerExtras([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const all = useMemo(() => {
    const map = new Map<string, WebDocumentSkillManifest>()
    for (const s of WEB_DOCUMENT_BUILTIN_SKILLS) {
      map.set(s.id, s)
    }
    for (const s of serverExtras) {
      if (!map.has(s.id)) map.set(s.id, s)
    }
    return [...map.values()]
  }, [serverExtras])

  return useMemo(() => ({
    loading,
    error,
    all,
    generatorSkills: byKind(all, 'document-generator'),
    templateSkills: byKind(all, 'document-template'),
    importerSkills: byKind(all, 'document-importer'),
    exporterSkills: byKind(all, 'document-exporter'),
    transformerSkills: byKind(all, 'document-transformer'),
    editorSkills: byKind(all, 'document-editor'),
  }), [all, error, loading])
}
