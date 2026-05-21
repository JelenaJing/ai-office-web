import { platformApi } from '../../../platform'
import type { Artifact, SkillInput, SkillResult } from '../../../platform'
import { getBuiltinDocumentSkill } from '../webDocumentBuiltInSkills'
import type { WebDocumentSkillManifest } from '../webDocumentSkillTypes'
import type { WebDocumentSession } from '../webDocumentTypes'
import { DEFAULT_PAGE_SPEC, EMPTY_HEADER_FOOTER } from '../webDocumentTypes'

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

export function applyTemplateToSession(
  session: WebDocumentSession,
  template: WebDocumentSkillManifest,
): WebDocumentSession {
  return {
    ...session,
    selectedTemplateSkillId: template.id,
    pageSpec: template.pageSpec ? { ...DEFAULT_PAGE_SPEC, ...template.pageSpec } : session.pageSpec,
    headerFooter: template.headerFooter
      ? { ...EMPTY_HEADER_FOOTER, ...template.headerFooter }
      : session.headerFooter,
    updatedAt: new Date().toISOString(),
  }
}

export function sessionFromSkillResult(
  result: SkillResult & { data?: Record<string, unknown> },
  template: WebDocumentSkillManifest,
  generatorId: string,
  sourceRefs: WebDocumentSession['sourceRefs'],
): WebDocumentSession | null {
  const raw = result.data?.documentSession as WebDocumentSession | undefined
  if (raw?.content) {
    const merged = applyTemplateToSession(
      {
        ...raw,
        selectedGeneratorSkillId: generatorId,
        sourceRefs: {
          knowledgeBaseIds: sourceRefs.knowledgeBaseIds.length
            ? sourceRefs.knowledgeBaseIds
            : raw.sourceRefs?.knowledgeBaseIds ?? [],
          fileIds: sourceRefs.fileIds.length ? sourceRefs.fileIds : raw.sourceRefs?.fileIds ?? [],
        },
        lastArtifactId: result.artifact?.id ?? raw.lastArtifactId,
        artifacts: result.artifact?.id
          ? [...new Set([...(raw.artifacts ?? []), result.artifact.id])]
          : raw.artifacts ?? [],
      },
      template,
    )
    if (result.data?.html && typeof result.data.html === 'string') {
      merged.content.html = result.data.html
    }
    if (result.data?.markdown && typeof result.data.markdown === 'string') {
      merged.content.markdown = result.data.markdown
    }
    return merged
  }
  if (result.data?.html && typeof result.data.html === 'string') {
    const now = new Date().toISOString()
    return applyTemplateToSession(
      {
        id: `doc-${Date.now()}`,
        title: (result.artifact?.title as string) || '文稿',
        selectedGeneratorSkillId: generatorId,
        selectedTemplateSkillId: template.id,
        selectedExporterSkillIds: [
          'document.export.docx',
          'document.export.pdf',
          'document.export.markdown',
        ],
        sourceRefs,
        content: {
          blocks: [],
          html: result.data.html as string,
          markdown: (result.data.markdown as string) || '',
        },
        pageSpec: { ...DEFAULT_PAGE_SPEC },
        headerFooter: { ...EMPTY_HEADER_FOOTER },
        artifacts: result.artifact?.id ? [result.artifact.id] : [],
        lastArtifactId: result.artifact?.id,
        updatedAt: now,
      },
      template,
    )
  }
  return null
}

export async function runWebDocumentExport(
  exporter: WebDocumentSkillManifest,
  workspacePath: string,
  session: WebDocumentSession,
  bodyHtml: string,
): Promise<SkillResult> {
  const skillId = resolveMapsToSkillId(exporter)
  return runWebDocumentSkill(skillId, {
    workspacePath,
    params: {
      title: session.title,
      documentSession: session,
      html: bodyHtml || session.content.html,
      markdown: session.content.markdown,
      pageSpec: session.pageSpec,
      headerFooter: session.headerFooter,
      format: exporter.outputFormats?.[0],
    },
  })
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
