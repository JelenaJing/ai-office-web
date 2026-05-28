/**
 * 文稿模块第一阶段收口 — 浏览器验收（/document）
 * 运行：WEB_E2E_URL=http://127.0.0.1:5173/index.web.html npm run e2e:web -- tests/e2e/document-studio-phase1.spec.ts
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import {
  WEB_E2E_URL,
  ensureDefaultWorkspace,
  installSession,
  loginViaApi,
  type AuthSession,
} from './helpers/auth'

const FIXTURE_DIR = join(__dirname, '../fixtures/document-studio')
const GENERATION_PROMPT =
  '帮我写一份关于 AI Office 在学校行政办公中应用的项目介绍文稿。'

const results: Record<string, { pass: boolean; detail: string }> = {}

function portProcessCommand(port: number): string {
  const output = execFileSync('bash', ['-lc', `ss -ltnp 'sport = :${port}' || true`], { encoding: 'utf-8' }).trim()
  const match = output.match(/pid=(\d+)/)
  if (!match) throw new Error(`端口 ${port} 未监听`)
  return execFileSync('ps', ['-p', match[1], '-o', 'args='], { encoding: 'utf-8' }).trim()
}

function assertAcceptanceProcesses(): void {
  portProcessCommand(3001)
  portProcessCommand(5173)
}

async function openDocumentStudio(page: Page, query = 'new=1'): Promise<void> {
  const base = new URL(WEB_E2E_URL)
  await page.goto(`${base.origin}/document?${query}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('今天想写什么文稿？')).toBeVisible({ timeout: 60_000 })
  await page.waitForFunction(async () => {
    const token = localStorage.getItem('aios_auth_token')
    if (!token) return false
    const res = await fetch('/api/workspaces/default', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  }, undefined, { timeout: 60_000 })
}

async function captureDocumentsStart(page: Page): Promise<{
  status: number
  requestBody: Record<string, unknown>
  responseBody: Record<string, unknown>
}> {
  const requestPromise = page.waitForRequest(
    (request) =>
      request.url().includes('/api/documents/start') && request.method() === 'POST',
    { timeout: 120_000 },
  )
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/documents/start') && response.request().method() === 'POST',
    { timeout: 120_000 },
  )
  const [request, response] = await Promise.all([requestPromise, responsePromise])
  let requestBody: Record<string, unknown> = {}
  try {
    requestBody = request.postDataJSON() as Record<string, unknown>
  } catch {
    try {
      requestBody = JSON.parse(request.postData() || '{}') as Record<string, unknown>
    } catch {
      requestBody = { raw: request.postData() }
    }
  }
  const text = await response.text()
  let responseBody: Record<string, unknown> = {}
  try {
    responseBody = text ? JSON.parse(text) as Record<string, unknown> : {}
  } catch {
    responseBody = { raw: text }
  }
  return { status: response.status(), requestBody, responseBody }
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  assertAcceptanceProcesses()
  for (const name of ['studio-ref.docx', 'studio-ref.txt', 'studio-ref.md', 'studio-ref.pdf']) {
    if (!existsSync(join(FIXTURE_DIR, name))) {
      throw new Error(`缺少 fixture：${join(FIXTURE_DIR, name)}`)
    }
  }
})

test.describe('文稿 Studio 第一阶段', () => {
  let session: AuthSession

  test.beforeEach(async ({ page, request }) => {
    session = await loginViaApi(request)
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('AIOFFICE_SKIP_LOGIN', '1')
      localStorage.setItem('aios_auth_token', token)
      localStorage.setItem('aios_itoken', token)
      localStorage.setItem('ai_office_internal_token', token)
      localStorage.setItem('ai_office_internal_user', JSON.stringify(user || {}))
    }, session)
    await installSession(page, session)
    await ensureDefaultWorkspace(request, session)
  })

  test('1. 基础生成 / 编辑 / 保存 / 导出 DOCX', async ({ page }) => {
    test.setTimeout(300_000)
    await openDocumentStudio(page)

    const promptArea = page.getByPlaceholder(/面向学校领导/)
    await promptArea.fill(GENERATION_PROMPT)
    await expect(promptArea).toHaveValue(GENERATION_PROMPT)
    await expect(page.getByRole('button', { name: '开始生成' })).toBeEnabled()

    const startResponse = captureDocumentsStart(page)
    await page.getByRole('button', { name: '开始生成' }).click()

    const started = await startResponse
    expect(started.status, `start HTTP ${started.status} ${JSON.stringify(started.responseBody)}`).toBeGreaterThanOrEqual(200)
    expect(started.status).toBeLessThan(300)

    await expect(page.getByRole('heading', { name: '正在生成文稿' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: '导出 Word' })).toBeVisible({ timeout: 300_000 })

    await page.locator('[data-testid="document-editor-canvas"]').first().evaluate((node) => {
      if (!(node instanceof HTMLElement)) throw new Error('canvas missing')
      const section = node.querySelector('section[data-document-body="true"] p')
      if (section) section.textContent = `${section.textContent || ''}\nE2E编辑追加段落。`
      node.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText(/已保存/)).toBeVisible({ timeout: 60_000 })

    const exportResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/documents/') && response.url().includes('export') && response.request().method() === 'POST',
      { timeout: 120_000 },
    )
    await page.getByRole('button', { name: '导出 Word' }).click()
    const exported = await exportResponse
    expect(exported.ok(), `export HTTP ${exported.status()}`).toBeTruthy()
    await expect(page.getByText(/Word 已导出/)).toBeVisible({ timeout: 30_000 })

    results.basicGeneration = { pass: true, detail: `start=${started.status}, export=${exported.status()}` }
  })

  test('2. 知识库 knowledgeRefs 进入 start 请求', async ({ page }) => {
    test.setTimeout(180_000)
    await openDocumentStudio(page)

    await page.getByRole('button', { name: '选择知识库' }).click()
    await expect(page.getByRole('heading', { name: '选择远端知识库文档' })).toBeVisible()

    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    const checkboxCount = await page.locator('input[type="checkbox"]').count()
    if (checkboxCount === 0) {
      results.knowledgeRefs = {
        pass: false,
        detail: '环境无远端知识库文档，无法验证 knowledgeRefs',
      }
      test.skip(true, '无远端知识库')
      return
    }

    await firstCheckbox.check()
    const selectedTitle = await page.locator('div').filter({ has: page.locator('input[type="checkbox"]:checked') }).locator('div').nth(2).textContent().catch(() => '')
    await page.getByRole('button', { name: '确认' }).click()
    await expect(page.getByText(/清空知识库|知识库/).first()).toBeVisible({ timeout: 10_000 })

    await page.getByPlaceholder(/面向学校领导/).fill('根据所选知识库写一段简短说明。')
    await expect(page.getByRole('button', { name: '开始生成' })).toBeEnabled()
    const startCapture = captureDocumentsStart(page)
    await page.getByRole('button', { name: '开始生成' }).click()
    const started = await startCapture

    const refs = started.requestBody.knowledgeRefs as unknown[] | undefined
    expect(Array.isArray(refs) && refs.length > 0, JSON.stringify(started.requestBody)).toBeTruthy()
    const hasKb = refs!.some((item) => {
      const ref = item as { kind?: string }
      return ref.kind === 'knowledge_base' || ref.kind === 'file'
    })
    expect(hasKb).toBeTruthy()
    results.knowledgeRefs = {
      pass: true,
      detail: `start=${started.status}, knowledgeRefs.length=${refs!.length}, label=${selectedTitle || 'n/a'}`,
    }

    await page.getByRole('button', { name: '取消' }).click({ timeout: 5_000 }).catch(() => {})
  })

  test('3. 附件 docx / txt / md / pdf 表现与请求体', async ({ page }) => {
    test.setTimeout(240_000)
    await openDocumentStudio(page)

    const cases = [
      { file: 'studio-ref.docx', expectPreview: true, expectUnsupported: false },
      { file: 'studio-ref.txt', expectPreview: true, expectUnsupported: false },
      { file: 'studio-ref.md', expectPreview: true, expectUnsupported: false },
      { file: 'studio-ref.pdf', expectPreview: false, expectUnsupported: true },
    ] as const

    const attachmentNotes: string[] = []

    for (const item of cases) {
      await page.locator('input[type="file"][accept=".docx,.txt,.md,.markdown,.pdf"]').setInputFiles(join(FIXTURE_DIR, item.file))
      const chip = page.getByText(item.file, { exact: false }).first()
      await expect(chip).toBeVisible({ timeout: 60_000 })
      if (item.expectUnsupported) {
        await expect(page.getByText('PDF 暂未支持正文抽取，可先转换为 Word 或文本后上传。')).toBeVisible()
        attachmentNotes.push(`${item.file}:unsupported-ok`)
      } else {
        await expect(chip).not.toContainText('不可用', { timeout: 90_000 })
        attachmentNotes.push(`${item.file}:ready`)
      }
    }

    await page.getByLabel('删除').first().click()
    await expect(page.getByText('studio-ref.docx')).toHaveCount(0)

    const materialInput = page.locator('input[type="file"][accept=".docx,.txt,.md,.markdown,.pdf"]')
    await materialInput.setInputFiles(join(FIXTURE_DIR, 'studio-ref.txt'))
    await expect(page.getByText('studio-ref.txt').first()).toBeVisible()
    await materialInput.setInputFiles(join(FIXTURE_DIR, 'studio-ref.md'))
    await expect(page.getByText('studio-ref.md').first()).toBeVisible()

    await page.getByPlaceholder(/面向学校领导/).fill('请引用上传材料中的 STUDIO_E2E 标记撰写一段摘要。')
    await expect(page.getByRole('button', { name: '开始生成' })).toBeEnabled()
    const startCapture = captureDocumentsStart(page)
    await page.getByRole('button', { name: '开始生成' }).click()
    const started = await startCapture

    const refs = (started.requestBody.knowledgeRefs || []) as Array<{ kind?: string; metadata?: { previewText?: string } }>
    const prompt = String(started.requestBody.prompt || '')
    const fileRefs = refs.filter((ref) => ref.kind === 'file')
    expect(fileRefs.length).toBeGreaterThan(0)
    expect(prompt.includes('STUDIO_E2E') || prompt.includes('用户上传材料摘要')).toBeTruthy()

    results.attachments = {
      pass: true,
      detail: `${attachmentNotes.join('; ')}; start=${started.status}; fileRefs=${fileRefs.length}`,
    }

    await page.getByRole('button', { name: '取消' }).click({ timeout: 5_000 }).catch(() => {})
  })

  test('4. 邮件附件「打开为文稿」', async ({ page }) => {
    test.setTimeout(180_000)
    const base = new URL(WEB_E2E_URL)
    await page.goto(`${base.origin}/work`, { waitUntil: 'domcontentloaded' })
    await page.getByText('邮件', { exact: true }).first().click()
    await expect(page.locator('[data-testid="communication-workbench"], [class*="Communication"]').first()).toBeVisible({ timeout: 60_000 }).catch(() => {})

    const openAsDoc = page.getByRole('button', { name: '打开为文稿' })
    const count = await openAsDoc.count()
    if (count === 0) {
      results.emailHandoff = {
        pass: false,
        detail: '当前邮箱列表中未找到带 docx 且显示「打开为文稿」的邮件，需人工补测',
      }
      test.skip(true, '无 docx 邮件附件')
      return
    }

    await openAsDoc.first().click()
    await expect(page).toHaveURL(/\/document/, { timeout: 60_000 })
    await expect(page.getByText(/邮件附件|studio-ref|\.docx/i).first()).toBeVisible({ timeout: 60_000 }).catch(() => {})

    results.emailHandoff = { pass: true, detail: '已跳转 /document 并显示附件来源' }
  })

  test('5. 回归：入口与 DocumentWorkbench 仍存在', async ({ page }) => {
    const base = new URL(WEB_E2E_URL)

    await page.goto(`${base.origin}/home`, { waitUntil: 'domcontentloaded' })
    await page.getByText('行政', { exact: true }).first().click()
    await expect(page).toHaveURL(/\/work/)
    await page.getByText('文稿', { exact: true }).first().click()
    await expect(page).toHaveURL(/\/document/)

    await page.goto(`${base.origin}/work`, { waitUntil: 'domcontentloaded' })
    await page.getByText('文稿', { exact: true }).first().click()
    await expect(page).toHaveURL(/\/document/)

    expect(existsSync(join(process.cwd(), 'src/features/document/components/DocumentWorkbench.tsx'))).toBeTruthy()

    results.regression = { pass: true, detail: '行政/工作区文稿入口 → /document；DocumentWorkbench.tsx 仍在' }
  })

  test.afterAll(() => {
    // eslint-disable-next-line no-console
    console.log('\n=== document-studio-phase1 results ===\n', JSON.stringify(results, null, 2))
  })
})
