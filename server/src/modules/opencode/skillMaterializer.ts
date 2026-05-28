import fs from 'fs'
import path from 'path'

export const AIOS_SKILLS_ROOT = process.env.AIOS_SKILLS_ROOT || '/data/darebug/aios-skills'

/** Document Studio 深度降重必须引用的原始 humanizer Skill 文件（与 TUI 一致）。 */
export const HUMANIZER_SKILL_SOURCE_PATH = path.join(AIOS_SKILLS_ROOT, 'humanizer', 'SKILL.md')

export function resolveHumanizerSkillSourcePath(): string {
  return HUMANIZER_SKILL_SOURCE_PATH
}

export function assertHumanizerSkillSourceInstalled(): void {
  if (!fs.existsSync(HUMANIZER_SKILL_SOURCE_PATH)) {
    throw new Error('humanizer Skill 未安装。')
  }
}

export class SkillNotInstalledError extends Error {
  readonly skillId: string
  readonly code = 'SKILL_NOT_INSTALLED'

  constructor(skillId: string, message?: string) {
    super(message || `Skill「${skillId}」未在 ${AIOS_SKILLS_ROOT} 安装。`)
    this.name = 'SkillNotInstalledError'
    this.skillId = skillId
  }
}

/** 内置 Skill 源码目录（tsc 不会复制 .md，运行 dist 时需回退到 src）。 */
export function resolveBundledSkillsRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../document-studio/skills'),
    path.resolve(__dirname, '../../../src/modules/document-studio/skills'),
  ]
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, 'general-document-writer', 'SKILL.md'))) {
      return root
    }
  }
  return candidates[0]
}

export interface SkillMaterializeOptions {
  skillId: string
  jobDir: string
  include?: string[]
  permissions?: Record<string, unknown>
  /** 为 true 时仅使用 aios-skills，不使用内置占位 */
  requireAiosSkills?: boolean
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath)
    else if (entry.isFile()) fs.copyFileSync(srcPath, destPath)
  }
}

export function isSkillInstalledAtAios(skillId: string): boolean {
  return fs.existsSync(path.join(AIOS_SKILLS_ROOT, skillId, 'SKILL.md'))
}

export function resolveSkillSourceDir(skillId: string, options?: { requireAios?: boolean }): string {
  const fromAios = path.join(AIOS_SKILLS_ROOT, skillId)
  if (fs.existsSync(path.join(fromAios, 'SKILL.md'))) return fromAios
  if (options?.requireAios) {
    throw new SkillNotInstalledError(
      skillId,
      `未在 ${AIOS_SKILLS_ROOT}/${skillId} 找到 SKILL.md。请先安装该 OpenCode Skill。`,
    )
  }
  const bundledRoot = resolveBundledSkillsRoot()
  const bundled = path.join(bundledRoot, skillId)
  if (fs.existsSync(path.join(bundled, 'SKILL.md'))) return bundled
  throw new SkillNotInstalledError(
    skillId,
    `未找到 Skill「${skillId}」：请在 ${AIOS_SKILLS_ROOT} 安装或检查内置占位。`,
  )
}

/** humanizer 深度降重 job：放宽 job 内读写权限，避免 /.opencode 误路径被拒。 */
export function buildHumanizerJobPermissions(skillId: string): Record<string, unknown> {
  return {
    $schema: 'https://opencode.ai/config.json',
    permission: {
      skill: { [skillId]: 'allow', '*': 'deny' },
      read: { '*': 'allow' },
      write: { '*': 'allow' },
      edit: { '*': 'allow' },
      glob: { '*': 'allow' },
      grep: { '*': 'allow' },
      list: { '*': 'allow' },
      bash: { '*': 'allow' },
      external_directory: { '*': 'allow' },
    },
  }
}

function copyHumanizerReference(sourceDir: string, targetSkillDir: string): void {
  const refDir = path.join(targetSkillDir, 'reference')
  fs.mkdirSync(refDir, { recursive: true })
  const refSkill = path.join(sourceDir, 'SKILL.md')
  if (fs.existsSync(refSkill)) {
    fs.copyFileSync(refSkill, path.join(refDir, 'SKILL.md'))
  }
}

export function materializeSkillForJob(options: SkillMaterializeOptions): {
  skillDir: string
  opencodeConfigPath: string
  sourceDir: string
} {
  const sourceDir = resolveSkillSourceDir(options.skillId, {
    requireAios: options.requireAiosSkills,
  })
  const opencodeRoot = path.join(options.jobDir, '.opencode')
  const targetSkillDir = path.join(opencodeRoot, 'skills', options.skillId)
  fs.mkdirSync(targetSkillDir, { recursive: true })

  const meta = readSkillMetadataFromDir(sourceDir)
  const include =
    options.include ??
    (Array.isArray((meta?.materialize as { include?: string[] })?.include)
      ? ((meta?.materialize as { include: string[] }).include)
      : ['SKILL.md'])

  let copied = false
  for (const pattern of include) {
    if (pattern.includes('*')) {
      copyDirRecursive(sourceDir, targetSkillDir)
      copied = true
      break
    }
    const src = path.join(sourceDir, pattern)
    const dest = path.join(targetSkillDir, pattern)
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) copyDirRecursive(src, dest)
      else {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
      }
      copied = true
    }
  }
  if (!fs.existsSync(path.join(targetSkillDir, 'SKILL.md'))) {
    copyDirRecursive(sourceDir, targetSkillDir)
    copied = true
  }
  if (options.skillId === 'humanizer' && options.requireAiosSkills) {
    const bundledHumanizer = path.join(resolveBundledSkillsRoot(), 'humanizer', 'SKILL.md')
    if (fs.existsSync(bundledHumanizer)) {
      fs.copyFileSync(bundledHumanizer, path.join(targetSkillDir, 'SKILL.md'))
      copied = true
    }
    copyHumanizerReference(sourceDir, targetSkillDir)
  }

  if (!copied || !fs.existsSync(path.join(targetSkillDir, 'SKILL.md'))) {
    throw new Error(`Skill materialize 失败：${options.skillId} 未生成 SKILL.md`)
  }

  const opencodeBlock = meta?.opencode as { permissions?: Record<string, unknown> } | undefined
  const useHumanizerPerms = options.skillId === 'humanizer' && options.requireAiosSkills
  const opencodeConfig = useHumanizerPerms
    ? buildHumanizerJobPermissions(options.skillId)
    : {
        $schema: 'https://opencode.ai/config.json',
        permission:
          options.permissions ??
          opencodeBlock?.permissions ??
          ({
            skill: {
              [options.skillId]: 'allow',
              '*': 'deny',
            },
          } as Record<string, unknown>),
      }
  const opencodeConfigPath = path.join(opencodeRoot, 'opencode.json')
  fs.writeFileSync(opencodeConfigPath, JSON.stringify(opencodeConfig, null, 2), 'utf-8')

  return { skillDir: targetSkillDir, opencodeConfigPath, sourceDir }
}

function readSkillMetadataFromDir(skillDir: string): Record<string, unknown> | null {
  const metaPath = path.join(skillDir, 'metadata.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}

export function readSkillMetadata(skillId: string): Record<string, unknown> | null {
  if (isSkillInstalledAtAios(skillId)) {
    return readSkillMetadataFromDir(path.join(AIOS_SKILLS_ROOT, skillId))
  }
  return readSkillMetadataFromDir(path.join(resolveBundledSkillsRoot(), skillId))
}
