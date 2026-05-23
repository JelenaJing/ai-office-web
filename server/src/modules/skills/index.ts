export interface BuiltInSkillDescriptor {
  id: string
  name: string
  description: string
  category: string
  outputArtifactType?: string
  version: string
  enabled: boolean
}

export const MINIMAX_PPTX_GENERATOR_SKILL: BuiltInSkillDescriptor = {
  id: 'minimax.pptx-generator',
  name: 'MiniMax PPTX Generator',
  description: 'Vendored MiniMax pptx-generator skill spec runner that creates slide JS files and compiles a pptx artifact.',
  category: 'presentation',
  outputArtifactType: 'presentation',
  version: '1.0.0',
  enabled: true,
}

export const MINIMAX_DOCX_SKILL: BuiltInSkillDescriptor = {
  id: 'minimax.docx',
  name: 'MiniMax DOCX Skill',
  description: 'Vendored MiniMax minimax-docx skill runner for structured office document generation, editing, and DOCX export.',
  category: 'document',
  outputArtifactType: 'document',
  version: '1.0.0',
  enabled: true,
}
