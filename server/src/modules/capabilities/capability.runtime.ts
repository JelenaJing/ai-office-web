import { assertCapabilityEnabled, getCapabilityById } from './capability.registry'
import type { CapabilityRunInput, CapabilityRunResult } from './capability.types'
import { runDirectLlmCapability } from './executors/directLlm.executor'
import { runNodeCapability } from './executors/node.executor'
import { runOpencodeCapability } from './executors/opencode.executor'
import { runPipelineCapability } from './executors/pipeline.executor'

export async function runCapability(input: CapabilityRunInput): Promise<CapabilityRunResult> {
  const cap = getCapabilityById(input.capabilityId)
  if (!cap) {
    return { success: false, resultType: 'error', error: `未知能力：${input.capabilityId}` }
  }
  try {
    assertCapabilityEnabled(cap)
  } catch (error) {
    return {
      success: false,
      resultType: 'error',
      pending: cap.status === 'pending',
      error: error instanceof Error ? error.message : String(error),
    }
  }

  switch (cap.runner) {
    case 'direct-llm':
      return runDirectLlmCapability(cap, input)
    case 'opencode':
      return runOpencodeCapability(cap, input)
    case 'node':
      return runNodeCapability(cap, input)
    case 'pipeline':
      return runPipelineCapability(cap, input)
    case 'legacy':
      return {
        success: false,
        resultType: 'error',
        error: '该能力为 legacy 兼容项，不作为 Document Studio 正式入口。',
      }
    default:
      return { success: false, resultType: 'error', error: `不支持的 runner：${cap.runner}` }
  }
}
