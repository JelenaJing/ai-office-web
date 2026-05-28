import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { prepareArtifactJobWorkspace, ARTIFACT_JOB_ROOT } from '../src/features/artifact-jobs/services/opencodeHtmlArtifactRunner'
import { registerArtifactJob, getArtifactJob } from '../src/features/artifact-jobs/services/artifactJobStore'
import { enqueueArtifactJob } from '../src/features/artifact-jobs/services/artifactJobQueue'
import { validateFinalHtmlSlides } from '../src/features/artifact-jobs/services/htmlPresentationSlideValidation'
import { exportHtmlPresentationToPptx } from '../src/features/artifact-jobs/services/htmlPresentationPptxExport'

type QualityMode = 'fast' | 'high'

type CaseInput = {
  caseName: string
  templateSlug: string
  qualityMode: QualityMode
  enableImages: boolean
  maxImages: number
  prompt: string
  inputMarkdown: string
}

type CaseResult = Record<string, unknown>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}

function firstMatchLine(text: string, keyword: string): string {
  return text.split(/\r?\n/).find((line) => line.includes(keyword)) || ''
}

async function runCase(input: CaseInput): Promise<CaseResult> {
  const jobId = randomUUID()
  const workspace = prepareArtifactJobWorkspace({
    jobId,
    inputMarkdown: input.inputMarkdown,
    prompt: input.prompt,
    skillId: 'html-ppt-beautiful',
    htmlPresentationOptions: {
      templateSlug: input.templateSlug,
      qualityMode: input.qualityMode,
      enableImages: input.enableImages,
      maxImages: input.maxImages,
    },
  })

  registerArtifactJob({
    id: jobId,
    userId: 'verify-user',
    type: 'html_presentation',
    skillId: 'html-ppt-beautiful',
    prompt: input.prompt,
    htmlPresentationOptions: {
      templateSlug: input.templateSlug,
      qualityMode: input.qualityMode,
      enableImages: input.enableImages,
      maxImages: input.maxImages,
    },
    jobDir: workspace.jobDir,
    inputPath: workspace.inputPath,
    skillPath: workspace.skillPath,
    outputPath: workspace.outputPath,
    logPath: workspace.logPath,
    errorPath: workspace.errorPath,
  })

  enqueueArtifactJob(jobId)
  const startedAt = Date.now()

  while (true) {
    const job = getArtifactJob(jobId)
    if (!job) throw new Error(`job not found: ${jobId}`)
    if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'canceled') break
    await sleep(2000)
  }

  const job = getArtifactJob(jobId)
  if (!job) throw new Error(`job disappeared: ${jobId}`)

  const logText = readText(path.join(workspace.jobDir, 'logs', 'opencode.log'))
  const outputPath = path.join(workspace.jobDir, 'output', 'index.html')
  const outputExists = fs.existsSync(outputPath)
  const outputStat = outputExists ? fs.statSync(outputPath) : null
  const timeToFirstOutputSeconds = outputStat ? Math.max(0, Math.round((outputStat.mtimeMs - startedAt) / 1000)) : null

  const html = outputExists ? fs.readFileSync(outputPath, 'utf-8') : ''
  const validation = html ? validateFinalHtmlSlides(html, { minSlides: 2 }) : {
    ok: false,
    slideCount: 0,
    blankSlideCount: 0,
    hasDemoText: false,
    hasImagePromptText: false,
    hasNextSuggestionText: false,
  }

  const contentModel = readJson(path.join(workspace.jobDir, 'output', 'content-model.json')) as { slides?: unknown[] } | null
  const contentModelSlides = Array.isArray(contentModel?.slides) ? contentModel!.slides!.length : 0

  const artifactDir = job.artifactId ? path.join('/data/darebug/aios-artifacts', job.artifactId) : ''
  const htmlZipOk = Boolean(job.artifactId && fs.existsSync(artifactDir) && fs.existsSync(path.join(artifactDir, 'index.html')))

  let pptxOk = false
  if (job.artifactId && job.status === 'succeeded') {
    try {
      const exported = await exportHtmlPresentationToPptx({ htmlArtifactId: job.artifactId, userId: 'verify-user' })
      pptxOk = Boolean(exported.success && exported.artifact?.id)
    } catch {
      pptxOk = false
    }
  }

  const rendererMode = job.rendererMode || ''
  const fallbackUsed = Boolean(job.fallbackUsed)
  const frontendTemplateDisplay = fallbackUsed && rendererMode === 'safe-fast-renderer'
    ? '快速草稿'
    : (job.appliedTemplateSlug || job.selectedTemplateSlug || job.requestedTemplateSlug || '自动')

  return {
    caseName: input.caseName,
    jobId,
    artifactId: job.artifactId || null,
    qualityMode: input.qualityMode,
    requestedTemplateSlug: job.requestedTemplateSlug || null,
    appliedTemplateSlug: job.appliedTemplateSlug ?? null,
    rendererMode: job.rendererMode || null,
    fallbackUsed,
    fallbackReason: job.fallbackReason || null,
    templateStyleApplied: job.templateStyleApplied || null,
    opencodeStarted: logText.includes('Starting OpenCode'),
    outputIndexHtmlCreatedAt: outputStat ? new Date(outputStat.mtimeMs).toISOString() : null,
    timeToFirstOutputSeconds,
    noOutputSoftTimeoutTriggered: Boolean(job.noOutputSoftTimeoutTriggered || logText.includes('fastNoOutputSoftTimeout=true')),
    validationOk: Boolean(validation.ok),
    repairAttempted: Boolean(job.repairAttempted),
    repairSucceeded: Boolean(job.repairSucceeded),
    contentModelSlides,
    finalHtmlSlides: validation.slideCount,
    blankSlideCount: validation.blankSlideCount,
    hasNextSuggestionText: validation.hasNextSuggestionText,
    hasImagePromptText: validation.hasImagePromptText,
    hasDemoText: validation.hasDemoText,
    htmlZipOk,
    pptxOk,
    frontendTemplateDisplay,
    opencodeLastLine: firstMatchLine(logText.split(/\r?\n/).slice(-1)[0] || logText, ''),
  }
}

async function main() {
  const prompt = '生成一份讲解 skill 的 slides，包括 skill 是什么、如何安装、如何配置、如何调用、常见问题、最佳实践，中文，7 页。'
  const inputMarkdown = '# Skill 介绍\n\n请生成 7 页中文演示文稿。'

  const cases: CaseInput[] = [
    {
      caseName: 'Biennale Yellow fast',
      templateSlug: 'biennale-yellow',
      qualityMode: 'fast',
      enableImages: false,
      maxImages: 0,
      prompt,
      inputMarkdown,
    },
    {
      caseName: 'Coral fast',
      templateSlug: 'coral',
      qualityMode: 'fast',
      enableImages: false,
      maxImages: 0,
      prompt,
      inputMarkdown,
    },
    {
      caseName: 'Bold Poster fast',
      templateSlug: 'bold-poster',
      qualityMode: 'fast',
      enableImages: false,
      maxImages: 0,
      prompt,
      inputMarkdown,
    },
    {
      caseName: 'Cartesian high',
      templateSlug: 'cartesian',
      qualityMode: 'high',
      enableImages: true,
      maxImages: 4,
      prompt,
      inputMarkdown,
    },
  ]

  const results: CaseResult[] = []
  for (const item of cases) {
    // eslint-disable-next-line no-console
    console.log(`running: ${item.caseName}`)
    const result = await runCase(item)
    results.push(result)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2))
  }
  // eslint-disable-next-line no-console
  console.log(`jobRoot=${ARTIFACT_JOB_ROOT}`)
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(results, null, 2))
}

void main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
