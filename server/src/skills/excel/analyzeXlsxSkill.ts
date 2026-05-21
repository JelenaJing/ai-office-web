/**
 * web.xlsx.analyze — Analyze uploaded xlsx/csv → Markdown artifact (excel_analysis).
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { resolveUserFile } from '../../lib/userFiles'
import { parseWorkspacePath } from '../../artifacts/ArtifactStore'
import {
  createArtifactDir,
  saveArtifactMetadata,
  type Artifact,
} from '../../artifacts/ArtifactStore'
import { analyzeSpreadsheet, isSpreadsheetExt } from '../../modules/excel'

export interface AnalyzeXlsxInput {
  userId: string
  fileId: string
  workspacePath: string
  prompt?: string
  options?: Record<string, unknown>
}

export type AnalyzeXlsxResult =
  | { success: true; artifactId: string; artifact: Artifact }
  | { success: false; error: string; status?: number }

export async function runAnalyzeXlsxSkill(
  input: AnalyzeXlsxInput,
): Promise<AnalyzeXlsxResult> {
  const fileId = String(input.fileId || '').trim()
  if (!fileId) {
    return { success: false, error: '请选择要分析的表格文件（fileId 不能为空）', status: 400 }
  }

  const parsed = parseWorkspacePath(input.workspacePath)
  if (!parsed) {
    return {
      success: false,
      error: `workspacePath 格式无效：${input.workspacePath}`,
      status: 400,
    }
  }

  if (parsed.userId !== input.userId) {
    return { success: false, error: '无权访问该工作区', status: 403 }
  }

  const resolved = resolveUserFile(input.userId, fileId)
  if (!resolved) {
    return { success: false, error: '文件不存在或无权访问', status: 404 }
  }

  if (resolved.workspacePath !== input.workspacePath) {
    return { success: false, error: '文件不属于当前工作区', status: 403 }
  }

  const ext = resolved.entry.ext.toLowerCase()
  if (!isSpreadsheetExt(ext)) {
    return {
      success: false,
      error: `仅支持 xlsx / csv 文件，当前为 .${ext}`,
      status: 400,
    }
  }

  try {
    const markdown = await analyzeSpreadsheet({
      absolutePath: resolved.absolutePath,
      fileName: resolved.entry.name,
      ext,
      prompt: input.prompt,
    })

    const artifactId = randomUUID()
    const titleBase = path.basename(resolved.entry.name, path.extname(resolved.entry.name))
    const title = `${titleBase} 表格分析`
    const now = new Date().toISOString()

    const dir = createArtifactDir(input.userId, parsed.wsId, artifactId)
    const mdFilename = 'analysis.md'
    fs.writeFileSync(path.join(dir, mdFilename), markdown, 'utf-8')

    const artifact: Artifact = {
      id: artifactId,
      userId: input.userId,
      workspaceId: parsed.wsId,
      workspacePath: input.workspacePath,
      type: 'excel_analysis',
      title,
      editable: false,
      createdBySkillId: 'web.xlsx.analyze',
      createdAt: now,
      exports: [
        {
          format: 'md',
          filename: mdFilename,
          url: `/api/artifacts/${artifactId}/download`,
        },
      ],
    }

    saveArtifactMetadata(artifact)
    return { success: true, artifactId, artifact }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg, status: 500 }
  }
}
