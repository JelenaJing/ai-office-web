import type { DocumentCapabilityDef, CapabilityRunInput, CapabilityRunResult } from '../capability.types'

export async function runPipelineCapability(
  cap: DocumentCapabilityDef,
  _input: CapabilityRunInput,
): Promise<CapabilityRunResult> {
  return {
    success: false,
    resultType: 'error',
    pending: true,
    error: `${cap.label}：论文多阶段 pipeline（academic-research-skills）待接入。当前仅完成 Skill 注册与 UI 占位，请选择「通用文稿」或使用选区级能力。`,
    source: 'pipeline',
  }
}
