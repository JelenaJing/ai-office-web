import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { createArtifactDir, parseWorkspacePath } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import { buildSlidePlanFromPrompt, writePptxFile } from '../../../modules/ppt'

export interface CreatePptxInput {
  userId: string
  workspacePath: string
  title?: string
  prompt?: string
  templateId?: string
}

export type CreatePptxResult =
  | { success: true; artifactId: string; artifact: ReturnType<typeof saveSkillArtifact> }
  | { success: false; error: string; status?: number }

export async function runCreatePptxSkill(input: CreatePptxInput): Promise<CreatePptxResult> {
  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return { success: false, error: 'workspacePath 无效', status: 400 }
  }
  const title = (input.title || '演示文稿').trim()
  const prompt = (input.prompt || title).trim()

  try {
    const plan = await buildSlidePlanFromPrompt(title, prompt)
    const safeName = title.replace(/[^\w\u4e00-\u9fa5\-]+/g, '_').slice(0, 60) || 'presentation'
    const filename = `${safeName}.pptx`

    const artifactId = randomUUID()
    const dir = createArtifactDir(input.userId, parsed.wsId, artifactId)
    const outPath = path.join(dir, filename)
    await writePptxFile(plan, outPath)

    const buffer = fs.readFileSync(outPath)
    const artifact = saveSkillArtifact({
      userId: input.userId,
      workspacePath: input.workspacePath,
      skillId: 'web.pptx.create',
      type: 'presentation',
      title: plan.title,
      filename,
      format: 'pptx',
      content: buffer,
    })

    return { success: true, artifactId: artifact.id, artifact }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg, status: 500 }
  }
}
