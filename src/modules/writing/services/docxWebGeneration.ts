import { platformApi } from '../../../platform'
import type { Artifact, SkillInput, SkillResult } from '../../../platform'
import { getBuiltinDocumentSkill } from '../webDocumentBuiltInSkills'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import {
  applyTemplateToSession,
  createEmptyWebDocumentSession,
  normalizeWebDocumentSession,
  recordExportArtifact,
  toExportDocumentSessionPayload,
} from '../webDocumentTypes'

export async function runWebDocumentSkill(
  skillId: string,
  input: SkillInput,
): Promise<SkillResult & { data?: Record<string, unknown> }> {
  return platformApi.skills.run(skillId, input) as Promise<SkillResult & { data?: Record<string, unknown> }>
}

export async function runWebDocxCreate(
  prompt: string,
  workspacePath: string,
  params?: Record<string, unknown>,
): Promise<SkillResult & { data?: Record<string, unknown> }> {
  return runWebDocumentSkill('web.docx.create', {
    prompt: prompt.trim(),
    workspacePath,
    params,
  })
}

export function resolveMapsToSkillId(manifest: WebDocumentSkillManifest): string {
  return manifest.mapsToSkillId || manifest.id
}

export function applyTemplateManifestToSession(
  session: WebDocumentSession,
  template: WebDocumentSkillManifest,
): WebDocumentSession {
  return applyTemplateToSession(
    session,
    template.id,
    template.pageSpec,
    template.headerFooter,
  )
}

export function sessionFromSkillResult(
  result: SkillResult & { data?: Record<string, unknown> },
  template: WebDocumentSkillManifest,
  knowledgeBaseIds: string[],
  fileIds: string[],
): WebDocumentSession | null {
  const raw = result.data?.documentSession
  let session = raw ? normalizeWebDocumentSession(raw) : null

  if (!session && result.data?.html && typeof result.data.html === 'string') {
    session = {
      ...createEmptyWebDocumentSession(),
      title: (result.artifact?.title as string) || '文稿',
      html: result.data.html as string,
      markdown: (result.data.markdown as string) || '',
    }
  }

  if (!session) return null

  session = applyTemplateManifestToSession(session, template)
  session.knowledgeBaseIds = knowledgeBaseIds.length ? knowledgeBaseIds : session.knowledgeBaseIds
  session.fileIds = fileIds.length ? fileIds : session.fileIds

  if (result.data?.html && typeof result.data.html === 'string') {
    session.html = result.data.html
  }
  if (result.data?.markdown && typeof result.data.markdown === 'string') {
    session.markdown = result.data.markdown
  }
  if (result.artifact?.id) {
    session = recordExportArtifact(session, 'docx', result.artifact.id)
  }
  return session
}

export async function runWebDocumentExport(
  exporter: WebDocumentSkillManifest,
  workspacePath: string,
  session: WebDocumentSession,
  bodyHtml: string,
): Promise<SkillResult> {
  const skillId = resolveMapsToSkillId(exporter)
  const format = exporter.outputFormats?.[0]
  return runWebDocumentSkill(skillId, {
    workspacePath,
    params: {
      title: session.title,
      documentSession: toExportDocumentSessionPayload(session, bodyHtml),
      html: bodyHtml,
      markdown: session.markdown,
      pageSpec: session.pageSpec,
      headerFooter: session.headerFooter,
      format,
    },
  })
}

export function exportFormatFromManifest(exporter: WebDocumentSkillManifest): 'docx' | 'pdf' | 'markdown' {
  const f = exporter.outputFormats?.[0]
  if (f === 'pdf') return 'pdf'
  if (f === 'md' || f === 'markdown') return 'markdown'
  return 'docx'
}

export function webDocxSuccessMessage(artifact: Artifact): string {
  const name = artifact.exports?.[0]?.filename || artifact.title || '文稿'
  return `已保存到资源中心 › 生成记录（${name}）`
}

export function getDefaultGeneratorSkill(): WebDocumentSkillManifest {
  return getBuiltinDocumentSkill('document.generator.office_draft')!
}

export function getDefaultTemplateSkill(): WebDocumentSkillManifest {
  return getBuiltinDocumentSkill('document.template.general')!
}

/** @deprecated 使用 applyTemplateManifestToSession */
export const applyTemplateToSession = applyTemplateManifestToSession
