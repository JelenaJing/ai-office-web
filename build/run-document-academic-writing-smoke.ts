import { runAcademicWritingWorkflow } from '../server/src/features/document/services/academicWritingService'
import { getOrCreateDefaultWorkspace } from '../server/src/lib/workspaceStore'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const userId = `academic-smoke-${Date.now()}`
  const workspacePath = getOrCreateDefaultWorkspace(userId).path
  const result = await runAcademicWritingWorkflow({
    userId,
    workspacePath,
    topic: '生成式 AI 对高校行政效率的影响',
    paperType: 'research_report',
    researchGoal: '评估生成式 AI 在高校行政流程中的效率提升、风险与治理建议。',
    lengthHint: '3000 字左右',
    language: 'zh-CN',
    style: 'academic',
    outline: ['摘要', '研究背景', '研究方法', '分析发现', '结论与建议', '参考文献'],
    knowledgeRefs: [
      {
        kind: 'knowledge_base',
        id: 'kb-policy-ai-governance',
        label: '高校人工智能治理政策库',
        excerpt: '高校应建立人工智能应用的审计、透明度和风险控制机制。',
        sourceType: 'policy',
        sourceId: 'kb-policy-ai-governance',
        chunkId: 'kb-policy-ai-governance-chunk-1',
        trustLevel: 'partial',
        citationStatus: 'partial',
      },
    ],
  })

  assert(result.success, 'workflow should succeed')
  assert(result.result.documentArtifact.type === 'document', 'result should be a document artifact')
  assert(result.result.documentArtifact.html.includes('span class="doc-citation"'), 'html should contain inline doc-citation span')
  assert(result.result.documentArtifact.canonicalData.blocks.length >= 12, 'canonicalData should contain heading and paragraph blocks')
  assert(result.result.documentArtifact.canonicalData.blocks.some((block) => block.id === 'academic-section-2-paragraph-1'), 'stable blockId should exist')
  assert(result.result.documentArtifact.references.length >= 1, 'references should be generated')
  assert(result.result.documentArtifact.citations.length >= 2, 'citations should be generated')
  assert(result.result.documentArtifact.knowledgeRefs.length === 1, 'knowledgeRefs should be retained')
  assert(result.result.documentArtifact.sourceRefs.length >= 1, 'sourceRefs should point to source material')
  assert(result.result.documentArtifact.references[0].chunkId === 'kb-policy-ai-governance-chunk-1', 'reference chunkId should be retained')
  assert(result.result.documentArtifact.references[0].trustLevel === 'partial', 'reference trustLevel should be retained')
  assert(result.result.documentArtifact.citations[0].blockId.startsWith('academic-section-'), 'citation should bind to blockId')

  const restored = JSON.parse(JSON.stringify(result.result.documentArtifact)) as typeof result.result.documentArtifact
  assert(restored.citations.length === result.result.documentArtifact.citations.length, 'save/restore JSON should retain citations')
  assert(restored.references[0].chunkId === 'kb-policy-ai-governance-chunk-1', 'save/restore JSON should retain reference metadata')

  console.log('document academic writing smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
