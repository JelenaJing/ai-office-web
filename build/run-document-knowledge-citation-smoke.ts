import { runAcademicWritingWorkflow } from '../server/src/features/document/services/academicWritingService'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main() {
  const userId = `knowledge-citation-smoke-${Date.now()}`
  const workspacePath = `web-workspace:${userId}:knowledge-citation-smoke`
  const result = await runAcademicWritingWorkflow({
    userId,
    workspacePath,
    topic: '城市更新中的政策依据引用',
    paperType: 'policy_research_report',
    researchGoal: '验证政策依据章节能绑定知识库来源并写入文稿 Artifact。',
    language: 'zh-CN',
    style: 'formal',
    outline: ['摘要', '问题背景', '政策依据', '政策建议'],
    knowledgeRefs: [
      {
        kind: 'knowledge_base',
        id: 'kb-city-policy',
        label: '城市更新政策文件',
        excerpt: '政策依据要求明确引用来源、适用范围和执行主体。',
        sourceType: 'policy',
        sourceId: 'kb-city-policy',
        chunkId: 'policy-chunk-2026-001',
        trustLevel: 'verified',
        citationStatus: 'verified',
      },
    ],
  })

  const artifact = result.result.documentArtifact
  assert(/<span class="doc-citation"/.test(artifact.html), 'inline span.doc-citation should exist')
  assert(artifact.html.includes('data-chunk-id="policy-chunk-2026-001"'), 'inline citation should carry chunkId')
  assert(artifact.html.includes('data-trust-level="verified"'), 'inline citation should carry trustLevel')
  assert(artifact.citations.length >= 2, 'structured citations should be generated')
  assert(artifact.references.length >= 1, 'structured references should be generated')
  assert(artifact.knowledgeRefs.length === 1, 'knowledgeRefs should be generated')
  assert(artifact.sourceRefs.some((ref) => ref.id === 'kb-city-policy'), 'sourceRefs should include knowledge source')
  assert(artifact.references[0].sourceId === 'kb-city-policy', 'reference should expose sourceId')
  assert(artifact.references[0].chunkId === 'policy-chunk-2026-001', 'reference should expose chunkId')
  assert(artifact.references[0].trustLevel === 'verified', 'reference should expose trustLevel')
  assert(artifact.citations.every((citation) => Boolean(citation.blockId)), 'each citation should bind a blockId')

  const restored = JSON.parse(JSON.stringify({ editorState: { documentArtifact: artifact } }))
  assert(restored.editorState.documentArtifact.references[0].chunkId === 'policy-chunk-2026-001', 'persisted editor state should retain chunkId')
  assert(restored.editorState.documentArtifact.html.includes('doc-citation'), 'persisted editor state should retain citation span')

  console.log('document knowledge citation smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
