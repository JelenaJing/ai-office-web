import { runMinimaxPptxGenerator, type RunMinimaxPptxGeneratorInput } from '../services/minimaxPptxGeneratorRunner'

export interface CreateMinimaxPptxGeneratorInput extends Omit<RunMinimaxPptxGeneratorInput, 'taskId' | 'onStep' | 'isCancelled'> {}

export type CreateMinimaxPptxGeneratorResult =
  | {
      success: true
      engine: 'minimax_pptx_generator'
      artifactId: string
      exportUrl: string
      deckId: string
      deck: Awaited<ReturnType<typeof runMinimaxPptxGenerator>>['deck']
      slides: Awaited<ReturnType<typeof runMinimaxPptxGenerator>>['slides']
      artifact: Awaited<ReturnType<typeof runMinimaxPptxGenerator>>['artifact']
      result: Awaited<ReturnType<typeof runMinimaxPptxGenerator>>
    }
  | { success: false; error: string; status?: number }

export async function runCreateMinimaxPptxGeneratorSkill(
  input: CreateMinimaxPptxGeneratorInput,
): Promise<CreateMinimaxPptxGeneratorResult> {
  try {
    const result = await runMinimaxPptxGenerator({
      ...input,
      taskId: `direct-skill-${Date.now()}`,
    })
    return {
      success: true,
      engine: 'minimax_pptx_generator',
      artifactId: result.artifact.id,
      exportUrl: result.exportUrl,
      deckId: result.deckId,
      deck: result.deck,
      slides: result.slides,
      artifact: result.artifact,
      result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message, status: 500 }
  }
}
