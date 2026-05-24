/**
 * web.xlsx.analyze — Analyze uploaded xlsx/csv → Markdown artifact (excel_analysis).
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { resolveUserFile } from '../../../lib/userFiles'
import { parseWorkspacePath } from '../../../artifacts/ArtifactStore'
import {
  createArtifactDir,
  saveArtifactMetadata,
  type Artifact,
} from '../../../artifacts/ArtifactStore'
import { analyzeSpreadsheetWithChart, isSpreadsheetExt } from '../../../modules/excel'

export interface AnalyzeXlsxInput {
  userId: string
  fileId: string
  workspacePath: string
  prompt?: string
  options?: Record<string, unknown>
}

export type AnalyzeXlsxResult =
  | { success: true; artifactId: string; artifact: Artifact; summary: string; imageUrls: string[] }
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
    const analysis = await analyzeSpreadsheetWithChart({
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
    const chartFilename = 'chart.svg'
    const resultFilename = 'result.json'
    fs.writeFileSync(path.join(dir, mdFilename), analysis.markdown, 'utf-8')
    fs.writeFileSync(path.join(dir, chartFilename), analysis.chartSvg, 'utf-8')
    const imageUrls = [`/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(chartFilename)}`]
    fs.writeFileSync(path.join(dir, resultFilename), JSON.stringify({
      summary: analysis.summary,
      imageUrls,
      chartTitle: analysis.chartTitle,
      sourceFileId: fileId,
      sourceFileName: resolved.entry.name,
    }, null, 2), 'utf-8')

    const artifact: Artifact = {
      id: artifactId,
      userId: input.userId,
      workspaceId: parsed.wsId,
      workspacePath: input.workspacePath,
      type: 'data_analysis',
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
        {
          format: 'image/svg+xml',
          filename: chartFilename,
          url: imageUrls[0],
        },
        {
          format: 'json',
          filename: resultFilename,
          url: `/api/artifacts/${artifactId}/download?filename=${encodeURIComponent(resultFilename)}`,
        },
      ],
      sourceRefs: [{ type: 'document', id: fileId, label: resolved.entry.name }],
      documentId: fileId,
      metadata: {
        summary: analysis.summary,
        imageUrls,
        chartTitle: analysis.chartTitle,
        artifactKind: 'data_analysis',
        sourceRefs: [{ type: 'spreadsheet', id: fileId, label: resolved.entry.name }],
      },
    }

    saveArtifactMetadata(artifact)
    return { success: true, artifactId, artifact, summary: analysis.summary, imageUrls }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg, status: 500 }
  }
}
