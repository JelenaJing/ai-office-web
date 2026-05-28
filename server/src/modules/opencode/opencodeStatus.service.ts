import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import {
  AIOS_SKILLS_ROOT,
  isSkillInstalledAtAios,
  readSkillMetadata,
  resolveBundledSkillsRoot,
} from './skillMaterializer'

export const DEFAULT_OPENCODE_BIN = '/data/darebug/tools/bin/opencode'

export function resolveOpencodeBin(): string {
  return (process.env.OPENCODE_BIN || DEFAULT_OPENCODE_BIN).trim()
}

export interface SkillInstallStatus {
  skillId: string
  label: string
  installed: boolean
  source: 'aios-skills' | 'bundled' | 'missing'
  status: 'connected' | 'pending' | 'missing'
  metadataPath?: string
  skillMdPath?: string
}

export interface OpenCodeStatusReport {
  opencodeBin: string
  opencodeBinExists: boolean
  opencodeAvailable: boolean
  opencodeVersion: string | null
  opencodeVersionError?: string
  aiosSkillsRoot: string
  aiosSkillsRootExists: boolean
  jobRuntimeRoot: string
  skills: {
    humanizer: SkillInstallStatus
    newsWriter: SkillInstallStatus
    academicResearchSkills: SkillInstallStatus
  }
}

function skillStatus(skillId: string, label: string, options?: { pending?: boolean }): SkillInstallStatus {
  const aiosDir = path.join(AIOS_SKILLS_ROOT, skillId)
  const aiosMd = path.join(aiosDir, 'SKILL.md')
  if (fs.existsSync(aiosMd)) {
    return {
      skillId,
      label,
      installed: true,
      source: 'aios-skills',
      status: options?.pending ? 'pending' : 'connected',
      metadataPath: fs.existsSync(path.join(aiosDir, 'metadata.json')) ? path.join(aiosDir, 'metadata.json') : undefined,
      skillMdPath: aiosMd,
    }
  }
  const bundled = path.join(resolveBundledSkillsRoot(), skillId, 'SKILL.md')
  if (fs.existsSync(bundled)) {
    return {
      skillId,
      label,
      installed: true,
      source: 'bundled',
      status: options?.pending ? 'pending' : 'connected',
      skillMdPath: bundled,
    }
  }
  return {
    skillId,
    label,
    installed: false,
    source: 'missing',
    status: options?.pending ? 'pending' : 'missing',
  }
}

export function probeOpencodeVersion(bin: string): Promise<{ version: string | null; error?: string }> {
  return new Promise(resolve => {
    if (!fs.existsSync(bin)) {
      resolve({ version: null, error: '可执行文件不存在' })
      return
    }
    const child = spawn(bin, ['--version'], { cwd: '/tmp', env: { ...process.env } })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', c => {
      stdout += String(c)
    })
    child.stderr?.on('data', c => {
      stderr += String(c)
    })
    child.on('close', code => {
      const combined = `${stdout}${stderr}`.trim()
      if (code === 0 && combined) {
        const firstLine = combined.split(/\r?\n/)[0]?.trim() || combined
        resolve({ version: firstLine })
      } else {
        resolve({ version: null, error: combined || `退出码 ${code}` })
      }
    })
    child.on('error', err => resolve({ version: null, error: err.message }))
  })
}

export async function getOpenCodeStatusReport(): Promise<OpenCodeStatusReport> {
  const opencodeBin = resolveOpencodeBin()
  const opencodeBinExists = fs.existsSync(opencodeBin)
  const versionProbe = opencodeBinExists ? await probeOpencodeVersion(opencodeBin) : { version: null, error: '可执行文件不存在' }

  const jobRuntimeRoot = path.resolve(__dirname, '../../../runtime/opencode-jobs')
  fs.mkdirSync(jobRuntimeRoot, { recursive: true })

  return {
    opencodeBin,
    opencodeBinExists,
    opencodeAvailable: opencodeBinExists && Boolean(versionProbe.version),
    opencodeVersion: versionProbe.version,
    opencodeVersionError: versionProbe.error,
    aiosSkillsRoot: AIOS_SKILLS_ROOT,
    aiosSkillsRootExists: fs.existsSync(AIOS_SKILLS_ROOT),
    jobRuntimeRoot,
    skills: {
      humanizer: skillStatus('humanizer', 'AI降重'),
      newsWriter: skillStatus('news-writer', '新闻稿生成'),
      academicResearchSkills: skillStatus('academic-research-skills', '论文写作', { pending: true }),
    },
  }
}

export function isRealAiosSkillReady(skillId: string): boolean {
  return isSkillInstalledAtAios(skillId)
}

export function getSkillMaterializeInclude(skillId: string): string[] {
  const meta = readSkillMetadata(skillId)
  const materialize = meta?.materialize as { include?: string[] } | undefined
  if (Array.isArray(materialize?.include) && materialize.include.length) {
    return materialize.include
  }
  return ['SKILL.md']
}
