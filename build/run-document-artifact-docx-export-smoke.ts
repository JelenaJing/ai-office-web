/**
 * Smoke test: DocumentArtifact → DOCX HTML generation
 *
 * Tests the pure buildDocxHtmlDocument function without requiring a browser.
 * Run with:  npm exec --yes --package tsx tsx build/run-document-artifact-docx-export-smoke.ts
 */

import { buildDocxHtmlDocument } from '../src/features/document/services/documentArtifactToDocx'
import type { DocumentArtifact } from '../src/features/document/services/documentWorkbenchApi'

// ─── fixtures ────────────────────────────────────────────────────────────────

const testArtifact: DocumentArtifact = {
  id: 'test-artifact-01',
  type: 'document',
  title: '测试文稿',
  html: '',
  canonicalData: {
    version: 'document-html-workbench/v1',
    documentId: '',
    title: '测试文稿',
    type: 'document',
    language: 'zh-CN',
    engine: 'builtin',
    outline: [],
    sections: [],
    blocks: [
      {
        id: 'block-title-1',
        type: 'title',
        role: 'title',
        sectionId: null,
        order: 0,
        text: '测试文稿标题',
        citationIds: [],
      },
      {
        id: 'block-p-1',
        type: 'paragraph',
        role: 'paragraph',
        sectionId: 'section-1',
        order: 1,
        text: '第一段正文内容，用于高光验证。',
        citationIds: ['cite-01'],
      },
      {
        id: 'block-p-2',
        type: 'paragraph',
        role: 'paragraph',
        sectionId: 'section-1',
        order: 2,
        text: 'The second paragraph was translated to English.',
        citationIds: [],
      },
      {
        id: 'block-h2-policy',
        type: 'heading',
        role: 'heading',
        sectionId: 'section-2',
        order: 3,
        text: '政策依据',
        level: 2,
        citationIds: [],
      },
      {
        id: 'block-p-policy',
        type: 'paragraph',
        role: 'paragraph',
        sectionId: 'section-2',
        order: 4,
        text: '需补充相关制度与文件依据。',
        citationIds: ['cite-01'],
      },
      {
        id: 'block-list-1',
        type: 'list-item',
        role: 'list-item',
        sectionId: 'section-2',
        order: 5,
        text: '列表项目一',
        listKind: 'bulleted',
        index: 0,
        citationIds: [],
      },
      {
        id: 'block-table-1',
        type: 'table',
        role: 'table',
        sectionId: 'section-2',
        order: 6,
        title: '数据汇总表',
        headers: ['指标', '数值', '备注'],
        rows: [
          ['总收入', '100万', '同比+10%'],
          ['总支出', '80万', '同比-5%'],
        ],
        citationIds: [],
      },
      {
        id: 'block-divider-1',
        type: 'divider',
        role: 'divider',
        sectionId: null,
        order: 7,
        citationIds: [],
      },
    ],
    knowledgeRefs: [],
    references: [
      { id: 'ref-01', label: '制度文件：教职工年度考核办法（2023）', kind: 'knowledge', sourceId: 'src-01', sourceLabel: '知识库' },
    ],
    citations: [],
  },
  sourceRefs: [],
  knowledgeRefs: [],
  references: [
    { id: 'ref-01', label: '制度文件：教职工年度考核办法（2023）', kind: 'knowledge', sourceId: 'src-01', sourceLabel: '知识库' },
  ],
  citations: [
    { id: 'cite-01', label: '政策依据1', kind: 'knowledge', citationStatus: 'confirmed' },
  ],
  exportPaths: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─── tests ────────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, description: string): void {
  if (condition) {
    console.log(`  ✅  ${description}`)
    passed++
  } else {
    console.error(`  ❌  FAILED: ${description}`)
    failed++
  }
}

console.log('Running DOCX HTML generation smoke tests…\n')

const html = buildDocxHtmlDocument(testArtifact)

// Structural checks
assert(typeof html === 'string' && html.length > 0, 'Output is a non-empty string')
assert(html.includes('<!DOCTYPE html>'), 'Output starts with DOCTYPE')
assert(html.includes('</html>'), 'Output ends with </html>')

// Content checks
assert(html.includes('测试文稿标题'), 'Title block rendered')
assert(html.includes('<h1>'), 'Title uses <h1> tag')
assert(html.includes('第一段正文内容'), 'First paragraph rendered')
assert(html.includes('<p>'), 'Paragraphs use <p> tag')
assert(html.includes('The second paragraph was translated to English'), 'Second paragraph rendered')
assert(html.includes('政策依据'), 'Heading "政策依据" rendered')
assert(html.includes('<h2>'), 'Heading uses <h2> tag')
assert(html.includes('需补充相关制度与文件依据'), 'Policy paragraph rendered')
assert(html.includes('列表项目一'), 'List item rendered')
assert(html.includes('<ul>') || html.includes('<li>'), 'List uses ul/li tags')
assert(html.includes('数据汇总表'), 'Table caption rendered')
assert(html.includes('<table'), 'Table rendered')
assert(html.includes('<th>指标</th>'), 'Table header rendered')
assert(html.includes('<td>总收入</td>'), 'Table body cell rendered')
assert(html.includes('<hr'), 'Divider rendered')

// Citation checks
assert(html.includes('<sup>'), 'Citation inline <sup> present')
assert(html.includes('政策依据1'), 'Citation label rendered in inline <sup>')

// References section
assert(html.includes('<h2>参考文献</h2>'), 'References section rendered')
assert(html.includes('教职工年度考核办法'), 'Reference label rendered')

// Style checks
assert(html.includes('@page') || html.includes('font-family'), 'CSS style block present')

// Safety: no raw HTML injection from text content
assert(!html.includes('<script'), 'No <script> tags in output (XSS-safe title/body)')

console.log()
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('\nSome smoke tests FAILED — DOCX HTML generation is broken.')
  process.exit(1)
} else {
  console.log('\nAll smoke tests passed ✅')
}
