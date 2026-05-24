import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const WEB_URL = process.env.WEB_E2E_URL || 'http://127.0.0.1:5173/index.web.html'
const API_ORIGIN = process.env.DOCUMENT_E2E_API_ORIGIN || 'http://127.0.0.1:3001'
const TEST_USER_LOGIN = process.env.TEST_USER_LOGIN || 'yifeichen'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

interface AuthSession {
  token: string
  user: Record<string, unknown>
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

async function browserPostJson<T>(page: Page, pathname: string, body: unknown): Promise<T> {
  const result = await page.evaluate(async ({ pathname, body }) => {
    const token = localStorage.getItem('aios_auth_token') || ''
    const response = await fetch(pathname, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    let json: unknown = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }
    return { ok: response.ok, status: response.status, json }
  }, { pathname, body })
  expect(result.ok, `${pathname} failed: HTTP ${result.status} ${JSON.stringify(result.json)}`).toBeTruthy()
  return result.json as T
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

async function openDocumentWorkbench(page: Page, session: AuthSession, workspacePath: string): Promise<void> {
  const handoff = await page.request.post(`${API_ORIGIN}/api/integrations/content-handoff`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: {
      targetPage: 'word',
      title: 'DocumentWorkbench Browser Acceptance',
      content: '# 临时引导文稿\n\n用于打开 Web DocumentWorkbench。',
      contentFormat: 'markdown',
      workspacePath,
      webOrigin: new URL(WEB_URL).origin,
      sourceApp: 'document-browser-spec',
      externalId: `document-browser-spec-${Date.now()}`,
    },
  })
  expect(handoff.ok(), `content handoff create failed: HTTP ${handoff.status()} ${await handoff.text()}`).toBeTruthy()
  const payload = await handoff.json() as { data?: { openUrl?: string } }
  expect(payload.data?.openUrl).toBeTruthy()
  await page.goto(String(payload.data?.openUrl), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-testid="document-workbench"]:visible')).toBeVisible()
}

async function waitForSection(page: Page, sectionTitle: string): Promise<void> {
  await expect(page.locator(`section[data-section-title="${sectionTitle}"]`).first()).toBeVisible()
}

async function selectSectionText(page: Page, sectionTitle: string, targetText: string): Promise<void> {
  await page.evaluate(({ sectionTitle, targetText }) => {
    const section = document.querySelector<HTMLElement>(`section[data-section-title="${sectionTitle}"]`)
    if (!section) throw new Error(`section not found: ${sectionTitle}`)
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT)
    let targetNode: Text | null = null
    let start = -1
    while (walker.nextNode()) {
      const current = walker.currentNode
      if (!(current instanceof Text)) continue
      const index = current.textContent?.indexOf(targetText) ?? -1
      if (index >= 0) {
        targetNode = current
        start = index
        break
      }
    }
    if (!targetNode || start < 0) {
      throw new Error(`target text not found: ${targetText}`)
    }
    const range = document.createRange()
    range.setStart(targetNode, start)
    range.setEnd(targetNode, start + targetText.length)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    section.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  }, { sectionTitle, targetText })
}

async function placeCursorAtSectionEnd(page: Page, sectionTitle: string): Promise<void> {
  await page.evaluate(({ sectionTitle }) => {
    const section = document.querySelector<HTMLElement>(`section[data-section-title="${sectionTitle}"]`)
    if (!section) throw new Error(`section not found: ${sectionTitle}`)
    const paragraph = section.querySelector('p:last-of-type') || section
    const range = document.createRange()
    range.selectNodeContents(paragraph)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    paragraph.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  }, { sectionTitle })
}

async function sectionText(page: Page, sectionTitle: string): Promise<string> {
  return page.locator(`section[data-section-title="${sectionTitle}"]`).innerText()
}

function normalizeAssertionText(value: string): string {
  return value.replace(/\s+/g, '').replace(/[·]/g, '').trim()
}

test.beforeAll(() => {
  assertAcceptanceProcesses()
})

test('document workbench acceptance flow is stable in browser', async ({ page }, testInfo) => {
  test.setTimeout(240_000)

  const session = await loginViaApi(page)
  await installSession(page, session)
  const workspacePath = await fetchDefaultWorkspace(page, session)
  await openDocumentWorkbench(page, session, workspacePath)
  const workbench = page.locator('[data-testid="document-workbench"]:visible')

  const seenPosts = new Set<string>()
  page.on('request', (request) => {
    if (request.method() !== 'POST') return
    const url = request.url()
    if (!url.includes('/api/')) return
    seenPosts.add(url)
  })

  const noticeRoute = await browserPostJson<{
    intent: string
    confidence: number
  }>(page, '/api/documents/task-router', {
    prompt: '帮我写一份关于下周培训安排的通知。',
  })
  expect(noticeRoute.intent).toBe('official_notice')
  expect(noticeRoute.confidence).toBeGreaterThanOrEqual(0.75)

  const paperRoute = await browserPostJson<{
    intent: string
    confidence: number
  }>(page, '/api/documents/task-router', {
    prompt: '帮我写一篇关于 AI Office 的论文。',
  })
  expect(paperRoute.intent).toBe('academic_paper')
  expect(paperRoute.confidence).toBeGreaterThanOrEqual(0.75)

  const formFillRoute = await browserPostJson<{
    intent: string
    nextAction?: { question?: string; message?: string }
  }>(page, '/api/documents/task-router', {
    prompt: '帮我填这个表。',
  })
  expect(formFillRoute.intent).toBe('form_fill')
  expect(`${formFillRoute.nextAction?.question || ''}${formFillRoute.nextAction?.message || ''}`).toMatch(/上传|模板|表格/)

  await workbench.getByTestId('document-toolbar-template').click()
  await expect(workbench.getByTestId('document-template-panel')).toBeVisible()
  await workbench.getByTestId('document-template-annual_report').click()
  await workbench.getByTestId('document-toolbar-knowledge').click()
  await expect(workbench.getByTestId('document-knowledge-panel')).toBeVisible()
  await expect(workbench.getByRole('button', { name: '选择知识库' })).toBeVisible()
  // close knowledge overlay
  await page.keyboard.press('Escape')
  await workbench.getByTestId('document-ai-edit-input').fill('生成一篇年度总结。')
  await workbench.getByTestId('document-ai-edit-submit').click()

  await waitForSection(page, '主要成绩')
  await waitForSection(page, '问题分析')
  await waitForSection(page, '下一年度计划')
  await expect(page.getByTestId('document-outline-panel')).toBeVisible()
  await expect(page.getByTestId('document-ai-edit-panel')).toBeVisible()
  await expect(page.getByText(/生成引擎：MiniMax DOCX Skill|生成引擎：MiniMax DOCX/).first()).toBeVisible()

  const achievementsBefore = await sectionText(page, '主要成绩')
  const problemsBefore = await sectionText(page, '问题分析')
  const nextPlanBefore = await sectionText(page, '下一年度计划')
  const selectionTarget = '部分业务数据沉淀与共享机制尚未完全打通'

  // Open outline drawer to click section item
  await workbench.getByTestId('document-toolbar-outline').click()
  await expect(page.getByTestId('document-outline-panel')).toBeVisible()
  await workbench.getByTestId('document-outline-item-section-problems').click()
  await selectSectionText(page, '问题分析', selectionTarget)
  await expect(page.getByText(/已选中文字：\d+ 字/)).toBeVisible()
  await workbench.getByTestId('document-ai-edit-input').fill('改得更正式，压缩成两句话。')
  await workbench.getByTestId('document-ai-edit-submit').click()
  await expect.poll(async () => sectionText(page, '问题分析')).not.toBe(problemsBefore)
  const problemsAfterSelectionEdit = await sectionText(page, '问题分析')
  expect(problemsAfterSelectionEdit).not.toContain(selectionTarget)
  expect(await sectionText(page, '主要成绩')).toBe(achievementsBefore)
  expect(await sectionText(page, '下一年度计划')).toBe(nextPlanBefore)

  await placeCursorAtSectionEnd(page, '下一年度计划')
  await expect(page.getByText('未选中文字：发送后将修改当前章节')).toBeVisible()
  // 续写下文 is in the "更多指令" dropdown
  await page.getByRole('button', { name: '更多指令' }).click()
  await page.getByRole('button', { name: '续写下文' }).click()
  await expect.poll(async () => sectionText(page, '下一年度计划')).not.toBe(nextPlanBefore)
  const nextPlanAfterContinue = await sectionText(page, '下一年度计划')
  expect(nextPlanAfterContinue.length).toBeGreaterThan(nextPlanBefore.length)
  expect(nextPlanAfterContinue).toContain('下一年度将围绕重点任务清单推进落实')
  const continueInsertedSnippet = nextPlanAfterContinue
    .split('对涉及政策、制度与数据依据的内容继续坚持人工确认依据后再正式发布。')
    .pop()
    ?.trim()
    .slice(0, 24) || ''

  const downloadPath = testInfo.outputPath('document-workbench-latest.docx')
  const exportResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && /\/api\/documents\/.+\/export$/.test(response.url()),
  )
  await workbench.getByTestId('document-download-docx').click()
  const exportResponse = await exportResponsePromise
  const exportPayload = await exportResponse.json() as { artifactId?: string; exportUrl?: string; filename?: string }
  expect(exportPayload.artifactId).toBeTruthy()
  expect(exportPayload.exportUrl).toBeTruthy()
  const exportDownloadUrl = String(exportPayload.exportUrl).startsWith('http')
    ? String(exportPayload.exportUrl)
    : `${API_ORIGIN}${exportPayload.exportUrl}`
  const downloadedDocx = await page.request.get(exportDownloadUrl, {
    headers: { Authorization: `Bearer ${session.token}` },
  })
  expect(downloadedDocx.ok(), `artifact download failed: HTTP ${downloadedDocx.status()} ${await downloadedDocx.text()}`).toBeTruthy()
  mkdirSync(dirname(downloadPath), { recursive: true })
  writeFileSync(downloadPath, Buffer.from(await downloadedDocx.body()))

  // Formal template via AI panel
  await workbench.getByTestId('document-ai-edit-input').fill('请按正式模板生成一份邀请某高校教授来校交流访问的正式模板访问函，称谓写尊敬的教授，落款写AIOS高校行政办公室。')
  await workbench.getByTestId('document-ai-edit-submit').click()
  await expect.poll(
    async () => page.locator('[data-testid="document-editor-canvas"]').innerText(),
    { timeout: 90_000 },
  ).toContain('拜访函')
  await expect(page.getByText(/正式模板已进入 DocumentWorkbench/)).toBeVisible({ timeout: 90_000 })

  const importResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && response.url().includes('/api/documents/import-docx'),
  )
  // Import DOCX is now in the More dropdown
  await workbench.getByTestId('document-more-menu').click()
  await workbench.getByTestId('document-import-docx').click()
  const importFileBytes = Array.from(readFileSync(downloadPath))
  await page.evaluate(({ bytes }) => {
    const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="document-workbench"]'))
    const visibleRoot = roots.find((root) => root.offsetParent !== null)
    const input = visibleRoot?.querySelector<HTMLInputElement>('[data-testid="document-import-docx-input"]')
    if (!input) {
      throw new Error('visible import input not found')
    }
    const data = new DataTransfer()
    data.items.add(new File([new Uint8Array(bytes)], 'document-workbench-latest.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }))
    input.files = data.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, { bytes: importFileBytes })
  const importResponse = await importResponsePromise
  expect(importResponse.ok(), `import-docx failed: HTTP ${importResponse.status()} ${await importResponse.text()}`).toBeTruthy()
  await expect.poll(async () => page.locator('[data-testid="document-editor-canvas"]').innerText()).toContain('主要成绩')
  await expect(page.locator('[data-testid="document-editor-canvas"]')).toContainText('主要成绩')
  await expect(page.locator('[data-testid="document-editor-canvas"]')).not.toContainText(selectionTarget)
  if (continueInsertedSnippet) {
    await expect.poll(
      async () => normalizeAssertionText(await page.locator('[data-testid="document-editor-canvas"]').innerText()),
    ).toContain(normalizeAssertionText(continueInsertedSnippet))
  }

  const expectedPostPaths = [
    '/api/documents/task-router',
    '/api/documents/start',
    '/edit-selection',
    '/continue',
    '/api/document/formal-template/analyze',
    '/api/document/formal-template/confirm-fields',
    '/api/document/formal-template/preview',
    '/api/document/formal-template/commit',
    '/api/documents/import-docx',
    '/export',
  ]
  for (const path of expectedPostPaths) {
    expect(Array.from(seenPosts).some((url) => url.includes(path)), `missing browser POST ${path}\n${Array.from(seenPosts).join('\n')}`).toBeTruthy()
  }

  expect(workspacePath).toBeTruthy()

  await page.screenshot({ path: testInfo.outputPath('document-workbench-final.png'), fullPage: true })
})
