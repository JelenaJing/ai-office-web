import fs from 'fs'
import path from 'path'

const AIOS_SKILLS_ROOT = '/data/darebug/aios-skills'

export interface SkillMetadata {
  id: string
  name: string
  description: string
  type: string
  runner: string
  inputTypes: string[]
  outputTypes: string[]
  entryFile: string
  outputFile: string
  uiPlacement?: string[]
}

export function listSkills(): SkillMetadata[] {
  if (!fs.existsSync(AIOS_SKILLS_ROOT)) return []
  const skills: SkillMetadata[] = []
  try {
    for (const entry of fs.readdirSync(AIOS_SKILLS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const metaPath = path.join(AIOS_SKILLS_ROOT, entry.name, 'metadata.json')
      if (!fs.existsSync(metaPath)) continue
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as SkillMetadata
        if (meta.id) skills.push(meta)
      } catch {
        // skip malformed metadata
      }
    }
  } catch {
    // skip unreadable directory
  }
  return skills
}

export function getSkill(id: string): SkillMetadata | null {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_')
  const metaPath = path.join(AIOS_SKILLS_ROOT, safe, 'metadata.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as SkillMetadata
    return meta.id ? meta : null
  } catch {
    return null
  }
}
