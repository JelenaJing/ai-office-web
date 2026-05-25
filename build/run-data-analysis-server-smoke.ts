import fs from 'fs'
import path from 'path'
import { runAnalyzeXlsxSkill } from '../server/src/features/data-analysis/skills/analyzeXlsxSkill'
import { getOrCreateDefaultWorkspace, userRoot, workspaceDir } from '../server/src/lib/workspaceStore'
import { deleteArtifact, getArtifactFilePath } from '../server/src/artifacts/ArtifactStore'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
  const userId = `data-analysis-smoke-${Date.now()}`
  const workspace = getOrCreateDefaultWorkspace(userId)
  const filesDir = path.join(workspaceDir(userId, workspace.id), 'files')
  const fileId = 'sales-csv'
  const fileDir = path.join(filesDir, fileId)
  const csvPath = path.join(fileDir, 'original')
  let artifactId: string | null = null
  try {
    fs.mkdirSync(fileDir, { recursive: true })
    fs.writeFileSync(csvPath, [
      'region,sales,cost',
      'North,120,80',
      'South,180,95',
      'East,160,90',
      'West,140,88',
    ].join('\n'), 'utf-8')
    fs.writeFileSync(path.join(filesDir, 'files.json'), JSON.stringify({
      files: [{
        id: fileId,
        name: 'sales.csv',
        ext: 'csv',
        mimeType: 'text/csv',
        size: fs.statSync(csvPath).size,
        uploadedAt: new Date().toISOString(),
      }],
    }, null, 2), 'utf-8')

    const result = await runAnalyzeXlsxSkill({
      userId,
      fileId,
      workspacePath: workspace.path,
      prompt: '按地区汇总销售额并生成图表',
    })
    assert(result.success, result.success ? 'analysis should succeed' : result.error)
    artifactId = result.artifactId
    assert(result.artifact.type === 'data_analysis', 'artifact should be data_analysis')
    assert(result.artifact.sourceRefs?.some((ref) => ref.id === fileId), 'artifact should point to source file')
    assert(result.artifact.metadata?.summary === result.summary, 'artifact metadata should persist summary')
    assert(Array.isArray(result.imageUrls) && result.imageUrls.length > 0, 'imageUrl should be returned')
    assert(result.summary.includes('工作表'), 'summary should describe parsed sheets')
    const chartExport = result.artifact.exports.find((item) => item.filename === 'chart.svg')
    assert(Boolean(chartExport), 'chart.svg export should exist')
    const chartPath = getArtifactFilePath(result.artifactId, 'chart.svg')
    const stat = fs.statSync(chartPath)
    assert(stat.size > 0, 'chart image file should be non-empty')
    assert(fs.readFileSync(chartPath, 'utf-8').includes('<svg'), 'chart SVG should be generated on server')
    assert(result.imageUrls[0].includes('filename=chart.svg'), 'frontend should receive a server image URL')

    console.log('data analysis server smoke passed')
  } finally {
    if (artifactId) deleteArtifact(artifactId)
    fs.rmSync(userRoot(userId), { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
