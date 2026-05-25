import fs from 'fs'
import path from 'path'
import { getArtifact, getArtifactFilePath, listArtifactsByUser } from '../../../artifacts/ArtifactStore'
import { generateSlidevHtmlPreview } from './slidevHtmlPreview'
import { buildOfficialSlidevApp } from './slidevOfficialRunner'
import { saveDeckRuntimeMeta } from './deckTaskStore'
import type { WebDeckRuntimeMeta } from '../types'

export function loadSlidevMarkdownFromArtifacts(deckId: string, userId: string): string | null {
  const artifacts = listArtifactsByUser(userId).filter((artifact) => artifact.deckId === deckId)
  const markdownArtifact = artifacts.find((artifact) => (
    artifact.exports.some((entry) => entry.format === 'md' || /\.slidev\.md$/i.test(entry.filename))
  ))
  if (!markdownArtifact) return null
  const exportEntry = markdownArtifact.exports.find((entry) => entry.format === 'md' || /\.slidev\.md$/i.test(entry.filename))
  if (!exportEntry) return null
  const filePath = getArtifactFilePath(markdownArtifact.id, exportEntry.filename)
  if (!filePath || !fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8').trim()
  return content || null
}

export function renderFallbackSlidevHtmlFromMarkdown(input: {
  deckId: string
  title?: string
  slidevMarkdown: string
}): string {
  return generateSlidevHtmlPreview({
    title: input.title || '演示文稿',
    slidevMarkdown: input.slidevMarkdown,
  })
}

export function rebuildOfficialSlidevPreview(input: {
  deckId: string
  userId: string
  workspacePath: string
  title?: string
  slidevMarkdown: string
  previousMeta?: WebDeckRuntimeMeta | null
}): {
  previewUrl: string
  slidevAppUrl: string
  slidevPreviewAccessToken: string
  slidevPreviewMode: 'official' | 'fallback'
} {
  const official = buildOfficialSlidevApp({
    deckId: input.deckId,
    slidevMarkdown: input.slidevMarkdown,
    accessToken: input.previousMeta?.slidevPreviewAccessToken || undefined,
  })
  if (official.success) {
    const meta: WebDeckRuntimeMeta = {
      deckId: input.deckId,
      userId: input.userId,
      workspacePath: input.workspacePath,
      engine: 'slidev',
      outputMode: 'web_deck',
      skillId: 'web.ppt.slidev',
      artifactId: input.previousMeta?.artifactId || null,
      exportUrl: input.previousMeta?.exportUrl || `/api/ppt/decks/${input.deckId}/download`,
      previewUrl: official.appUrl,
      slidevAppUrl: official.appUrl,
      slidevPreviewAccessToken: official.accessToken,
      slidevPreviewMode: 'official',
      htmlArtifactId: input.previousMeta?.htmlArtifactId || null,
      updatedAt: new Date().toISOString(),
    }
    saveDeckRuntimeMeta(meta)
    return {
      previewUrl: official.appUrl,
      slidevAppUrl: official.appUrl,
      slidevPreviewAccessToken: official.accessToken,
      slidevPreviewMode: 'official',
    }
  }

  const html = renderFallbackSlidevHtmlFromMarkdown({
    deckId: input.deckId,
    title: input.title,
    slidevMarkdown: input.slidevMarkdown,
  })
  const htmlArtifactId = input.previousMeta?.htmlArtifactId || null
  if (htmlArtifactId) {
    const artifact = getArtifact(htmlArtifactId)
    const htmlExport = artifact?.exports.find((entry) => entry.format === 'html') || artifact?.exports[0]
    const filePath = htmlExport ? getArtifactFilePath(htmlArtifactId, htmlExport.filename) : ''
    if (filePath) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, html, 'utf-8')
    }
  }

  const previewUrl = `/api/ppt/decks/${encodeURIComponent(input.deckId)}/slidev-preview`
  saveDeckRuntimeMeta({
    deckId: input.deckId,
    userId: input.userId,
    workspacePath: input.workspacePath,
    engine: 'slidev',
    outputMode: 'web_deck',
    skillId: 'web.ppt.slidev',
    artifactId: input.previousMeta?.artifactId || null,
    exportUrl: input.previousMeta?.exportUrl || `/api/ppt/decks/${input.deckId}/download`,
    previewUrl,
    slidevAppUrl: null,
    slidevPreviewAccessToken: null,
    slidevPreviewMode: 'fallback',
    htmlArtifactId,
    updatedAt: new Date().toISOString(),
  })

  return {
    previewUrl,
    slidevAppUrl: '',
    slidevPreviewAccessToken: '',
    slidevPreviewMode: 'fallback',
  }
}
