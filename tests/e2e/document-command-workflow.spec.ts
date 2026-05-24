import { execFileSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'

const WEB_BASE = process.env.WEB_E2E_BASE || 'http://127.0.0.1:5173'
const HOME_URL = `${WEB_BASE}/home`
const API_ORIGIN = process.env.DOCUMENT_E2E_API_ORIGIN || 'http://127.0.0.1:3001'
const TEST_USER_LOGIN = process.env.TEST_USER_LOGIN || 'yifeichen'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

interface AuthSession {
  token: string
  user: Record<string, unknown>
}

interface PersistedBlock {
  id: string
  role: string
  text?: string
  html?: string
}

interface PersistedArtifact {
  html: string
  references: Array<{ id: string; label: string; sourceId: string }>
  citations: Array<{ id: string; refId: string; blockId: string; text: string }>
  canonicalData: {
    blocks: PersistedBlock[]
    references: Array<{ id: string; label: string; sourceId: string }>
    citations: Array<{ id: string; refId: string; blockId: string; text: string }>
  }
}

interface PersistedEditorState {
  documentId: string | null
  html: string
  lastSavedAt?: string
  documentArtifact: PersistedArtifact
}

function portProcessCommand(port: number): string {
  const output = execFileSync('bash', ['-lc', `ss -ltnp 'sport = :${port}' || true`], { encoding: 'utf-8' }).trim()
  const match = output.match(/pid=(\d+)/)
  if (!match) {
    throw new Error(`端口 ${port} 未监听，请先启动所需服务。`)
  }
  const pid = match[1]
  return execFileSync('ps', ['-p', pid, '-o', 'args='], { encoding: 'utf-8' }).trim()
}

function assertAcceptanceProcesses(): void {
  const serverCommand = portProcessCommand(3001)
  if (/ts-node-dev|src\/index\.ts/.test(serverCommand)) {
    throw new Error(`端口 3001 仍由旧开发服务占用：${serverCommand}`)
  }
  if (!/dist\/index\.js/.test(serverCommand)) {
    throw new Error(`端口 3001 当前不是 dist server：${serverCommand}`)
  }
  portProcessCommand(5173)
}

async function loginViaApi(page: Page): Promise<AuthSession> {
  const response = await page.request.post(`${API_ORIGIN}/api/auth/login`, {
    data: {
      username: TEST_USER_LOGIN,
      password: TEST_USER_PASSWORD,
    },
  })
  expect(response.ok(), `login failed: HTTP ${response.status()} ${await response.text()}`).toBeTruthy()
  const payload = await response.json() as { token?: string; user?: Record<string, unknown> }
  expect(payload.token).toBeTruthy()
  return {
    token: String(payload.token),
    user: payload.user || {},
  }
}

async function fetchDefaultWorkspace(page: Page, session: AuthSession): Promise<string> {
  const response = await page.request.get(`${API_ORIGIN}/api/workspaces/default`, {
    headers: { Authorization: `Bearer ${session.token}` },
  })
  expect(response.ok(), `default workspace failed: HTTP ${response.status()} ${await response.text()}`).toBeTruthy()
  const payload = await response.json() as { workspace?: { path?: string } }
  expect(payload.workspace?.path).toBeTruthy()
  return String(payload.workspace?.path)
}

async function installSession(page: Page, session: AuthSession): Promise<void> {
  await page.addInitScript(({ nextToken, user }) => {
    localStorage.setItem('AIOFFICE_SKIP_LOGIN', '1')
    localStorage.setItem('aios_auth_token', nextToken)
    localStorage.setItem('aios_itoken', nextToken)
    localStorage.setItem('ai_office_internal_token', nextToken)
    localStorage.setItem('ai_office_internal_user', JSON.stringify(user))
  }, { nextToken: session.token, user: session.user })
}

async function clearPersistedDocumentState(page: Page, workspacePath: string): Promise<void> {
  const storageKey = `document-workbench:${workspacePath}`
  await page.evaluate(({ key }) => {
    localStorage.removeItem(key)
    localStorage.removeItem('aios_document_editor_draft')
    localStorage.setItem('aioffice.workspaceMode', 'free')
  }, { key: storageKey })
}

async function openDocumentWorkbenchFromHome(page: Page): Promise<void> {
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '行政', exact: true }).first().click()
  await expect(page).toHaveURL(/\/work$/)
  await page.getByText('文稿编辑', { exact: true }).first().click()
  await expect(page.locator('[data-testid="document-workbench"]:visible')).toBeVisible()
}

async function capturePersistedEditorState(page: Page, workspacePath: string): Promise<PersistedEditorState | null> {
  const storageKey = `document-workbench:${workspacePath}`
  return page.evaluate((key) => {
    const readEditorState = (raw: string | null): PersistedEditorState | null => {
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as { editorState?: PersistedEditorState }
        return parsed.editorState || (parsed as PersistedEditorState)
      } catch {
        return null
      }
    }

    const primary = readEditorState(localStorage.getItem(key))
    if (primary?.documentArtifact?.canonicalData?.blocks?.length) {
      return primary
    }

    for (let index = 0; index < localStorage.length; index += 1) {
      const currentKey = localStorage.key(index)
      if (!currentKey || !currentKey.startsWith('document-workbench:')) continue
      const candidate = readEditorState(localStorage.getItem(currentKey))
      if (candidate?.documentArtifact?.canonicalData?.blocks?.length) {
        return candidate
      }
    }

    const localDraft = readEditorState(localStorage.getItem('aios_document_editor_draft'))
    if (localDraft?.documentArtifact?.canonicalData?.blocks?.length) {
      return localDraft
    }

    return primary
  }, storageKey)
}

async function seedTestDocument(page: Page): Promise<void> {
  await page.getByRole('button', { name: '清空文档' }).click()
  await page.locator('[data-testid="document-editor-canvas"]').evaluate((node) => {
    if (!(node instanceof HTMLElement)) {
      throw new Error('document editor canvas not found')
    }
    node.innerHTML = [
      '<article data-document-root="true" data-document-mode="draft">',
      '<h1 data-document-title="true" data-role="title">测试文稿</h1>',
      '<section data-section-id="section-main" data-section-title="正文" data-section-level="1" data-document-body="true">',
      '<p>第一段用于高光保留。</p>',
      '<p>第二段内容需要翻译并进一步改得更正式。</p>',
      '<p>第三段保持不变，用于验证不会误改其它段落。</p>',
      '<p>政策依据：需补充相关制度与文件依据。</p>',
      '</section>',
      '</article>',
    ].join('')
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function sendCommand(page: Page, text: string): Promise<void> {
  await page.getByTestId('document-generation-prompt').fill(text)
  await page.getByTestId('document-generate-button').click()
}

function getBlock(state: PersistedEditorState, blockId: string): PersistedBlock {
  const block = state.documentArtifact.canonicalData.blocks.find((item) => item.id === blockId)
  expect(block, `missing block ${blockId}`).toBeTruthy()
  return block!
}

test.beforeAll(() => {
  assertAcceptanceProcesses()
})

test('document command workflow remains stable end-to-end', async ({ page }) => {
  test.setTimeout(240_000)

  const session = await loginViaApi(page)
  await installSession(page, session)
  const workspacePath = await fetchDefaultWorkspace(page, session)
  const seenPosts: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'POST') return
    const url = request.url()
    if (!url.includes('/api/')) return
    seenPosts.push(url)
  })

  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' })
  await clearPersistedDocumentState(page, workspacePath)
  await openDocumentWorkbenchFromHome(page)
  await seedTestDocument(page)

  await expect.poll(
    async () => capturePersistedEditorState(page, workspacePath),
    { timeout: 15_000 },
  ).toBeTruthy()

  const initialEditorState = await capturePersistedEditorState(page, workspacePath)
  expect(initialEditorState).toBeTruthy()
  expect(initialEditorState?.documentId ?? null).toBeNull()
  expect(initialEditorState?.html).toContain('测试文稿')
  expect(initialEditorState?.documentArtifact?.html).toContain('测试文稿')
  expect(initialEditorState?.documentArtifact?.canonicalData).toBeTruthy()
  expect(initialEditorState?.documentArtifact?.canonicalData.blocks.length ?? 0).toBeGreaterThanOrEqual(5)
  const initialBlockIds = (initialEditorState?.documentArtifact?.canonicalData.blocks || []).map((block) => block.id)
  expect(initialBlockIds.every(Boolean)).toBeTruthy()
  expect(new Set(initialBlockIds).size).toBe(initialBlockIds.length)

  const beforeHighlightRequestCount = seenPosts.length
  await sendCommand(page, '帮我给第一段高光')
  await expect.poll(
    async () => getBlock((await capturePersistedEditorState(page, workspacePath))!, 'section-main-paragraph-1').html || '',
    { timeout: 15_000 },
  ).toContain('data-format-highlight="true"')
  const afterHighlight = (await capturePersistedEditorState(page, workspacePath))!
  expect(getBlock(afterHighlight, 'section-main-paragraph-1').html || '').toContain('background-color')
  expect(getBlock(afterHighlight, 'section-main-paragraph-2').text).toBe('第二段内容需要翻译并进一步改得更正式。')
  expect(getBlock(afterHighlight, 'section-main-paragraph-3').text).toBe('第三段保持不变，用于验证不会误改其它段落。')
  const highlightPosts = seenPosts.slice(beforeHighlightRequestCount)
  expect(highlightPosts.some((url) => /\/api\/documents\/edit-text|\/edit-selection|\/sections\/.+\/edit/.test(url))).toBeFalsy()

  const secondParagraphBeforeTranslate = getBlock(afterHighlight, 'section-main-paragraph-2').text || ''
  const beforeTranslateRequestCount = seenPosts.length
  await sendCommand(page, '把第二段翻译成英文')
  await expect.poll(
    async () => getBlock((await capturePersistedEditorState(page, workspacePath))!, 'section-main-paragraph-2').text || '',
    { timeout: 30_000 },
  ).not.toBe(secondParagraphBeforeTranslate)
  const afterTranslate = (await capturePersistedEditorState(page, workspacePath))!
  const secondParagraphAfterTranslate = getBlock(afterTranslate, 'section-main-paragraph-2').text || ''
  expect(secondParagraphAfterTranslate).not.toBe(secondParagraphBeforeTranslate)
  expect(getBlock(afterTranslate, 'section-main-paragraph-3').text).toBe('第三段保持不变，用于验证不会误改其它段落。')
  expect(afterTranslate.documentArtifact.canonicalData.blocks).toHaveLength(initialEditorState!.documentArtifact.canonicalData.blocks.length)
  expect(afterTranslate.documentArtifact.html).toContain('section-main-paragraph-2')
  const translatePosts = seenPosts.slice(beforeTranslateRequestCount)
  expect(translatePosts.some((url) => url.includes('/api/documents/edit-text'))).toBeTruthy()

  const beforeFormalizeRequestCount = seenPosts.length
  await sendCommand(page, '把第二段改得更正式')
  await expect.poll(
    async () => getBlock((await capturePersistedEditorState(page, workspacePath))!, 'section-main-paragraph-2').text || '',
    { timeout: 30_000 },
  ).not.toBe(secondParagraphAfterTranslate)
  const afterFormalize = (await capturePersistedEditorState(page, workspacePath))!
  const secondParagraphAfterFormalize = getBlock(afterFormalize, 'section-main-paragraph-2').text || ''
  expect(getBlock(afterFormalize, 'section-main-paragraph-3').text).toBe('第三段保持不变，用于验证不会误改其它段落。')
  const formalizePosts = seenPosts.slice(beforeFormalizeRequestCount)
  expect(formalizePosts.some((url) => url.includes('/api/documents/edit-text'))).toBeTruthy()
  const lastCommandInspector = page.getByTestId('document-last-command-inspector')
  await expect(lastCommandInspector).toContainText('原始指令：把第二段改得更正式')
  await expect(lastCommandInspector).toContainText('Intent：formalize')
  await expect(lastCommandInspector).toContainText('作用块：section-main-paragraph-2')
  await expect(lastCommandInspector).toContainText('AI 调用：是')
  await expect(lastCommandInspector).toContainText('可撤销：是')
  await expect(page.getByTestId('document-last-command-card')).toContainText('intent：formalize')

  await sendCommand(page, '撤销上一次操作')
  await expect.poll(
    async () => getBlock((await capturePersistedEditorState(page, workspacePath))!, 'section-main-paragraph-2').text || '',
    { timeout: 15_000 },
  ).toBe(secondParagraphAfterTranslate)
  const afterUndo = (await capturePersistedEditorState(page, workspacePath))!
  expect(getBlock(afterUndo, 'section-main-paragraph-2').html).toBe(getBlock(afterTranslate, 'section-main-paragraph-2').html)
  expect(afterUndo.documentArtifact.canonicalData.citations).toEqual(afterTranslate.documentArtifact.canonicalData.citations)
  expect(afterUndo.documentArtifact.canonicalData.references).toEqual(afterTranslate.documentArtifact.canonicalData.references)
  expect(secondParagraphAfterFormalize).not.toBe(secondParagraphAfterTranslate)

  await sendCommand(page, '给政策依据部分加引用')
  await expect.poll(
    async () => ((await capturePersistedEditorState(page, workspacePath))?.documentArtifact.canonicalData.citations.length ?? 0),
    { timeout: 15_000 },
  ).toBeGreaterThan(0)
  const afterCitation = (await capturePersistedEditorState(page, workspacePath))!
  const policyBlock = getBlock(afterCitation, 'section-main-paragraph-4')
  expect(policyBlock.text).toContain('政策依据')
  expect(policyBlock.html || '').toContain('doc-citation')
  expect(afterCitation.documentArtifact.citations.length).toBeGreaterThan(0)
  expect(afterCitation.documentArtifact.references.length).toBeGreaterThan(0)
  await expect(page.getByTestId('document-reference-panel')).toContainText('待补充依据')
  await expect(page.getByTestId('document-reference-panel')).toContainText('section-main-paragraph-4')

  await page.getByTestId('document-save').click()
  await expect.poll(
    async () => (await capturePersistedEditorState(page, workspacePath))?.lastSavedAt || '',
    { timeout: 15_000 },
  ).not.toBe('')
  const afterSave = (await capturePersistedEditorState(page, workspacePath))!
  await expect(page.getByTestId('document-save-status')).toContainText('最近保存')

  const popupPromise = page.waitForEvent('popup')
  await page.getByTestId('document-more-menu').click()
  await page.getByTestId('document-export-pdf').click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  const popupHtml = await popup.content()
  expect(popupHtml).toContain('class="paper"')
  expect(popupHtml).toContain('测试文稿')
  expect(popupHtml).toContain('第一段用于高光保留')
  expect(popupHtml).toContain('政策依据')
  expect(popupHtml).toContain('@page { size: A4;')
  await popup.close().catch(() => {})

  await openDocumentWorkbenchFromHome(page)
  await expect.poll(
    async () => (await capturePersistedEditorState(page, workspacePath))?.documentArtifact?.canonicalData?.blocks?.length ?? 0,
    { timeout: 15_000 },
  ).toBeGreaterThan(0)

  const afterReopen = await capturePersistedEditorState(page, workspacePath)
  expect(afterReopen).toBeTruthy()
  expect(afterReopen?.documentArtifact).toBeTruthy()
  expect(getBlock(afterReopen!, 'section-main-paragraph-1').html || '').toContain('data-format-highlight="true"')
  expect(getBlock(afterReopen!, 'section-main-paragraph-2').text).toBe(secondParagraphAfterTranslate)
  expect(getBlock(afterReopen!, 'section-main-paragraph-4').html || '').toContain('doc-citation')
  expect(afterReopen?.documentArtifact.references.length).toBeGreaterThan(0)
  expect(afterReopen?.documentArtifact.citations.length).toBeGreaterThan(0)
  await expect(page.getByTestId('document-reference-panel')).toContainText('待补充依据')
  await expect(page.getByTestId('document-save-status')).toContainText('最近保存')
  const reopenedBlockIds = (afterReopen?.documentArtifact.canonicalData.blocks || []).map((block) => block.id)
  expect(reopenedBlockIds).toEqual(initialBlockIds)
  expect(afterSave.lastSavedAt).toBe(afterReopen?.lastSavedAt)
})
