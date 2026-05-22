/**
 * formalTemplatePresets.ts — Web formal-template preset registry
 *
 * Source of truth:
 * - Electron schema-first route: electron/main/services/formalTemplate/*
 * - Electron generic rewrite fallback: src/skills/builtins/templateDocumentGenerateLegacySkill.ts
 *
 * Web currently supports only the template kinds that have a real Electron
 * routing concept behind them. Everything else is listed explicitly as
 * unavailable instead of pretending it is already migrated.
 */

export type FormalTemplatePresetCategory = 'letter' | 'general' | 'notice' | 'report'
export type FormalTemplateTemplateKind = 'generic' | 'visit-letter' | 'congratulation-letter'
export type FormalTemplateRuntimeKind = 'schema-first' | 'template-document-rewrite'

export interface FormalTemplatePreset {
  id: string
  label: string
  description: string
  category: FormalTemplatePresetCategory
  templateKind: FormalTemplateTemplateKind
  runtimeKind: FormalTemplateRuntimeKind
  supported: boolean
  unavailableReason?: string
  runtimeLabel: string
  sourceFiles: string[]
  templateText: string
  defaultSections: string[]
}

export interface FormalTemplatePresetSummary {
  id: string
  label: string
  description: string
  category: FormalTemplatePresetCategory
  templateKind: FormalTemplateTemplateKind
  runtimeKind: FormalTemplateRuntimeKind
  supported: boolean
  unavailableReason?: string
  runtimeLabel: string
}

export const FORMAL_TEMPLATE_PRESETS: FormalTemplatePreset[] = [
  {
    id: 'visit_letter',
    label: '拜访函',
    description: '对应 Electron visit-letter schema-first 路由。',
    category: 'letter',
    templateKind: 'visit-letter',
    runtimeKind: 'schema-first',
    supported: true,
    runtimeLabel: 'schema-first / visit-letter / base-replace',
    sourceFiles: [
      'electron/main/services/formalTemplate/formalTemplateTaskService.ts',
      'electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts',
      'electron/main/services/formalTemplate/sampleAdapters/visitLetterTemplateSampleAdapter.ts',
    ],
    templateText: `拜访函

{{收函单位}}：

您好！

{{正文}}

联系人：{{联系人}}    电话：{{联系电话}}
{{发信单位}}
{{发函日期}}`,
    defaultSections: ['正文'],
  },
  {
    id: 'congratulation_letter',
    label: '贺信',
    description: '对应 Electron congratulation-letter schema-first 路由。',
    category: 'letter',
    templateKind: 'congratulation-letter',
    runtimeKind: 'schema-first',
    supported: true,
    runtimeLabel: 'schema-first / congratulation-letter / base-replace',
    sourceFiles: [
      'electron/main/services/formalTemplate/formalTemplateTaskService.ts',
      'electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts',
    ],
    templateText: `贺信

{{收件人}}：

{{正文}}

{{发信单位}}
{{日期}}`,
    defaultSections: ['正文'],
  },
  {
    id: 'generic_template_rewrite',
    label: '通用模板改写',
    description: '对应 Electron templateDocument.generate.legacy / template document rewrite 链路。',
    category: 'general',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: true,
    runtimeLabel: 'template-document-rewrite / generic',
    sourceFiles: [
      'src/skills/builtins/templateDocumentGenerateLegacySkill.ts',
      'src/modules/formal/hooks/useFormalTemplateGeneration.ts',
    ],
    templateText: `{{标题}}

{{正文}}

{{落款单位}}
{{日期}}`,
    defaultSections: ['正文'],
  },
  {
    id: 'official_notice',
    label: '正式通知',
    description: '目前仅展示，不在本轮 Web formal_template 迁移范围内。',
    category: 'notice',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: false,
    unavailableReason: '当前 Web formal_template 仅接入 Electron 已有 visit-letter / congratulation-letter / template document rewrite 链路；正式通知尚无对应 DOCX schema contract。',
    runtimeLabel: 'not-migrated',
    sourceFiles: [],
    templateText: '',
    defaultSections: [],
  },
  {
    id: 'work_report',
    label: '工作报告',
    description: '目前仅展示，不在本轮 Web formal_template 迁移范围内。',
    category: 'report',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: false,
    unavailableReason: '当前 Web formal_template 还没有对应的 Electron 正式模板样例与 schema contract。',
    runtimeLabel: 'not-migrated',
    sourceFiles: [],
    templateText: '',
    defaultSections: [],
  },
  {
    id: 'investigation_report',
    label: '调查报告',
    description: '目前仅展示，不在本轮 Web formal_template 迁移范围内。',
    category: 'report',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: false,
    unavailableReason: '当前 Web formal_template 还没有对应的 Electron 正式模板样例与 schema contract。',
    runtimeLabel: 'not-migrated',
    sourceFiles: [],
    templateText: '',
    defaultSections: [],
  },
  {
    id: 'meeting_minutes',
    label: '会议纪要',
    description: '目前仅展示，不在本轮 Web formal_template 迁移范围内。',
    category: 'general',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: false,
    unavailableReason: '当前 Web formal_template 还没有对应的 Electron 正式模板样例与 schema contract。',
    runtimeLabel: 'not-migrated',
    sourceFiles: [],
    templateText: '',
    defaultSections: [],
  },
  {
    id: 'custom',
    label: '自定义模板文本',
    description: '需要提供实际模板正文后才可接入；当前 AICommandBox 未提供模板文本输入区。',
    category: 'general',
    templateKind: 'generic',
    runtimeKind: 'template-document-rewrite',
    supported: false,
    unavailableReason: '当前 Web formal_template 没有接入“粘贴模板正文 → 结构抽取 → rewrite”输入面板，请改用 FormalTemplatePanel 或后续专用入口。',
    runtimeLabel: 'not-migrated',
    sourceFiles: [
      'src/modules/formal/components/FormalTemplateGeneratePanel.tsx',
      'src/modules/formal/hooks/useFormalTemplateGeneration.ts',
    ],
    templateText: '',
    defaultSections: [],
  },
]

export function getPreset(id: string): FormalTemplatePreset | undefined {
  return FORMAL_TEMPLATE_PRESETS.find((preset) => preset.id === id)
}

export function getDefaultSupportedPreset(): FormalTemplatePreset {
  return FORMAL_TEMPLATE_PRESETS.find((preset) => preset.supported) ?? FORMAL_TEMPLATE_PRESETS[0]
}

export function listPresetSummaries(): FormalTemplatePresetSummary[] {
  return FORMAL_TEMPLATE_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    category: preset.category,
    templateKind: preset.templateKind,
    runtimeKind: preset.runtimeKind,
    supported: preset.supported,
    unavailableReason: preset.unavailableReason,
    runtimeLabel: preset.runtimeLabel,
  }))
}
