import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import {
  TEST_USER_EMAIL,
  TEST_USER_LOGIN,
  WEB_E2E_URL,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ensureDefaultWorkspace,
  installSession,
  loginViaApi,
  loginViaUi,
  type AuthSession,
} from './helpers/auth'
import { downloadArtifactViaApi, downloadFromButton } from './helpers/download'
import { artifactExists, asRecord, pollApiTask } from './helpers/waitForArtifact'

type FlowStatus = 'pending' | 'passed' | 'failed' | 'skipped' | 'partial'
type CheckMap = Record<string, { status: FlowStatus; details: string }>

interface AcceptanceResult {
  generatedAt: string
  baseURL: string
  login: CheckMap
  document: CheckMap
  ppt: CheckMap
  image: CheckMap
  email: CheckMap
  report: CheckMap
  artifact: CheckMap
  conclusion: {
    demoReady: string[]
    notDemoReady: string[]
    mustFixNext: string[]
    recommendRealUserTest: boolean
  }
}

const result: AcceptanceResult = {
  generatedAt: new Date().toISOString(),
  baseURL: WEB_E2E_URL,
  login: {},
  document: {},
  ppt: {},
  image: {},
  email: {},
  report: {},
  artifact: {},
  conclusion: {
    demoReady: [],
    notDemoReady: [],
    mustFixNext: [],
    recommendRealUserTest: false,
  },
}

let session: AuthSession | undefined
let workspacePath = ''
let lastMatterId = ''
let generatedArtifactIds: string[] = []
let imageArtifactId = ''

function setCheck(section: keyof Omit<AcceptanceResult, 'generatedAt' | 'baseURL' | 'conclusion'>, key: string, status: FlowStatus, details: string): void {
  result[section][key] = { status, details }
}

async function ensureSession(request: APIRequestContext): Promise<AuthSession> {
  if (!session) session = await loginViaApi(request, TEST_USER_LOGIN)
  if (!workspacePath) workspacePath = await ensureDefaultWorkspace(request, session)
  return session
}

async function ensurePage(page: Page, request: APIRequestContext): Promise<AuthSession> {
  const current = await ensureSession(request)
  await installSession(page, current)
  await page.goto(WEB_E2E_URL)
  await expect(page.getByText(/文稿编辑|选择工作区|工作台|AI Office/i).first()).toBeVisible()
  return current
}

async function openWorkFeature(page: Page, featureName: RegExp): Promise<void> {
  let row = page.getByRole('button', { name: featureName }).first()
  if (await row.count() === 0) {
    const workNav = page.getByRole('button', { name: /^工作$/ }).first()
    if (await workNav.count()) {
      await workNav.click()
    } else {
      await page.getByRole('button', { name: /^工作\s/ }).first().click()
    }
    row = page.getByRole('button', { name: featureName }).first()
  }
  await expect(row).toBeVisible()
  await row.click()
}

async function createArtifact(
  request: APIRequestContext,
  auth: AuthSession,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const created = await apiPost<{ artifact?: Record<string, unknown> }>(request, auth, '/api/artifacts', {
    workspacePath,
    ...input,
  })
  expect(created.ok, `artifact create failed: HTTP ${created.status} ${created.text}`).toBeTruthy()
  const artifact = asRecord(created.body.artifact)
  expect(artifact.id).toBeTruthy()
  generatedArtifactIds.push(String(artifact.id))
  return artifact
}

async function writeAcceptanceReports(): Promise<void> {
  const sections = ['login', 'document', 'ppt', 'image', 'email', 'report', 'artifact'] as const
  const demoReady: string[] = []
  const notDemoReady: string[] = []
  const mustFixNext: string[] = []

  for (const section of sections) {
    const checks = Object.entries(result[section])
    if (checks.length > 0 && checks.every(([, check]) => check.status === 'passed' || check.status === 'skipped')) {
      demoReady.push(section)
    }
    for (const [name, check] of checks) {
      if (check.status === 'failed' || check.status === 'partial') {
        notDemoReady.push(`${section}.${name}: ${check.details}`)
        if (check.status === 'failed') mustFixNext.push(`${section}.${name}`)
      }
    }
  }
  result.generatedAt = new Date().toISOString()
  result.conclusion = {
    demoReady,
    notDemoReady,
    mustFixNext,
    recommendRealUserTest: mustFixNext.length === 0,
  }

  const docsDir = path.resolve(process.cwd(), 'docs/self-acceptance')
  fs.mkdirSync(docsDir, { recursive: true })
  fs.writeFileSync(path.join(docsDir, 'user-flow-acceptance-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf-8')

  const line = (section: keyof Omit<AcceptanceResult, 'generatedAt' | 'baseURL' | 'conclusion'>, key: string) => {
    const check = result[section][key] || { status: 'pending', details: 'not executed' }
    return `| ${key} | ${check.status} | ${check.details.replace(/\n/g, ' ')} |`
  }
  const report = [
    '# Web User-Flow Self-Acceptance Report',
    '',
    `- Base URL: ${result.baseURL}`,
    `- Generated at: ${result.generatedAt}`,
    '',
    '## Login',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('login', 'usernameLogin'),
    line('login', 'emailLogin'),
    line('login', 'tokenPersisted'),
    line('login', 'authMe'),
    '',
    '## Document',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('document', 'generalGenerate'),
    line('document', 'downloadWord'),
    line('document', 'downloadMarkdown'),
    line('document', 'downloadHtml'),
    line('document', 'paperWorkflow'),
    line('document', 'reviewWorkflow'),
    line('document', 'formalTemplateWorkflow'),
    '',
    '## PPT',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('ppt', 'generate'),
    line('ppt', 'download'),
    line('ppt', 'retemplateZeroToken'),
    '',
    '## Image',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('image', 'generateOrExplicitPartial'),
    line('image', 'providerConfig'),
    '',
    '## Email',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('email', 'accounts'),
    line('email', 'inbox'),
    line('email', 'unreadTriage'),
    line('email', 'replyDraft'),
    line('email', 'attachmentArtifact'),
    line('email', 'emailToMatter'),
    line('email', 'matterGenerateOutputs'),
    '',
    '## Report',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('report', 'eventsWritten'),
    line('report', 'dailyGenerated'),
    line('report', 'containsCoreModules'),
    line('report', 'reportArtifact'),
    '',
    '## Artifact',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    line('artifact', 'typeCoverage'),
    line('artifact', 'preview'),
    line('artifact', 'download'),
    line('artifact', 'rename'),
    line('artifact', 'delete'),
    line('artifact', 'relationships'),
    '',
    '## Conclusion',
    '',
    `- Can demo: ${result.conclusion.demoReady.length ? result.conclusion.demoReady.join(', ') : 'none'}`,
    `- Cannot demo: ${result.conclusion.notDemoReady.length ? result.conclusion.notDemoReady.join('; ') : 'none'}`,
    `- Must fix next: ${result.conclusion.mustFixNext.length ? result.conclusion.mustFixNext.join(', ') : 'none'}`,
    `- Recommend real-user testing: ${result.conclusion.recommendRealUserTest ? 'yes' : 'no'}`,
    '',
  ].join('\n')
  fs.writeFileSync(path.join(docsDir, 'user-flow-acceptance-report.md'), report, 'utf-8')

  const checklist = [
    '# Manual Web User-Flow Test Checklist',
    '',
    '- [ ] 登录：用户名 yifeichen / 密码 12345678 可以进入工作台，localStorage 存在 aios_auth_token。',
    '- [ ] 登录：邮箱 yifeichen@ai.cuhk.edu.cn / 密码 12345678 可以进入工作台。',
    '- [ ] 文稿：普通文稿生成后编辑器有中文正文，Word / Markdown / HTML 可直接下载。',
    '- [ ] 文稿：论文调用 paper workflow，包含摘要、关键词、引言、相关研究、方法/框架、结论、参考文献。',
    '- [ ] 文稿：文献综述调用 review workflow，包含检索筛选、研究脉络、主题分类、代表性研究、争议不足、未来方向、参考文献。',
    '- [ ] 文稿：正式模板调用 formal-template workflow，阶段包含 analyze / confirm / preview / commit，partial 状态不伪装 full。',
    '- [ ] PPT：生成得到 DeckDocument，可预览 slide，可下载 PPTX。',
    '- [ ] PPT：切换模板调用 retemplate，tokenUsed=false，内容不丢失。',
    '- [ ] 图片：provider 可用时生成图片 Artifact；provider 未配置或 404 时显示“图片服务未配置或不可用”。',
    '- [ ] 邮件：有账号时可拉取收件箱、AI 整理未读、生成回复草稿、附件入 Artifact、邮件转 Matter。',
    '- [ ] 日报：写入 document_exported / email_sent / matter_created / ppt_generated 后，日报包含核心模块并保存为 Artifact。',
    '- [ ] Artifact：资源中心可预览、下载、重命名、删除；关系元数据包含 sourceRefs / matterId / knowledgeRefs 或 partialMissing。',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(docsDir, 'manual-test-checklist.md'), checklist, 'utf-8')
}

test.describe.configure({ mode: 'serial' })

test.afterAll(async () => {
  await writeAcceptanceReports()
})

test('login accepts username and email credentials', async ({ page }) => {
  const usernameSession = await loginViaUi(page, TEST_USER_LOGIN)
  setCheck('login', 'usernameLogin', 'passed', 'username credential reached the Web workbench')
  setCheck('login', 'tokenPersisted', 'passed', 'aios_auth_token persisted after username login')
  setCheck('login', 'authMe', 'passed', '/api/auth/me returned 200 after username login')

  const emailSession = await loginViaUi(page, TEST_USER_EMAIL)
  setCheck('login', 'emailLogin', 'passed', 'email credential reached the Web workbench')
  session = emailSession.token ? emailSession : usernameSession
})

test('document generation and direct downloads work in the browser', async ({ page, request }) => {
  await ensurePage(page, request)
  await openWorkFeature(page, /文稿编辑/)
  const editorShell = page.getByTestId('word-like-document-editor')
  await expect(editorShell).toBeVisible()
  await editorShell.locator('select').first().selectOption('general')

  const prompt = '请写一份关于高校行政办公中使用生成式AI提升效率的中文说明材料。'
  await page.getByPlaceholder(/告诉我你想怎么改这篇文稿/).fill(prompt)
  const generateCall = page.waitForRequest((req) =>
    req.url().includes('/api/skills/web.document.generate/run'),
  )
  await editorShell.getByRole('button', { name: /^生成初稿$/ }).last().click()
  await generateCall

  const editorText = editorShell.locator('.ProseMirror').first()
  await expect.poll(async () => (await editorText.innerText().catch(() => '')).trim(), {
    timeout: 150_000,
  }).toMatch(/高校|行政|生成式AI|效率/)
  await expect.poll(async () => (await editorText.innerText().catch(() => '')).trim().length, {
    timeout: 150_000,
  }).toBeGreaterThan(80)
  await expect(editorShell.getByRole('button', { name: /^生成初稿$/ }).last()).toBeEnabled({ timeout: 150_000 })
  await expect(editorShell.getByText(/初稿已生成|可继续修改或下载/).first()).toBeVisible({ timeout: 30_000 })
  const generatedText = await editorText.innerText()
  setCheck('document', 'generalGenerate', 'passed', `generated ${generatedText.length} chars in A4 editor`)

  const word = await downloadFromButton(page, page.getByRole('button', { name: /下载 Word/ }).first(), {
    extension: '.docx',
    minBytes: 5 * 1024,
  })
  setCheck('document', 'downloadWord', 'passed', `${word.filename}, ${word.bytes} bytes`)

  const markdown = await downloadFromButton(page, page.getByRole('button', { name: /下载 Markdown/ }).first(), {
    extension: '.md',
    minBytes: 100,
    contains: /高校|行政|生成式AI|效率/,
  })
  setCheck('document', 'downloadMarkdown', 'passed', `${markdown.filename}, ${markdown.bytes} bytes`)

  const html = await downloadFromButton(page, page.getByRole('button', { name: /下载 HTML/ }).first(), {
    extension: '.html',
    minBytes: 100,
    contains: /高校|行政|生成式AI|效率/,
  })
  setCheck('document', 'downloadHtml', 'passed', `${html.filename}, ${html.bytes} bytes`)
})

test('paper, review, and formal-template workflows use dedicated APIs', async ({ request }) => {
  const auth = await ensureSession(request)

  async function runPaper(paperType: 'research' | 'review') {
    const start = await apiPost<{ taskId?: string }>(request, auth, '/api/document/paper-workflow/start', {
      topic: paperType === 'research'
        ? '生成式AI在高校行政办公中的应用研究'
        : '生成式AI在高校行政办公中的应用研究综述',
      paperType,
      mode: 'outline',
      language: 'zh',
    })
    expect(start.ok, `${paperType} workflow start failed: HTTP ${start.status} ${start.text}`).toBeTruthy()
    expect(start.body.taskId).toBeTruthy()
    const task = await pollApiTask(request, auth, `/api/document/paper-workflow/tasks/${start.body.taskId}`, { timeoutMs: 150_000 })
    expect(task.status).toBe('completed')
    const output = asRecord(task.result)
    const markdown = String(output.markdown || '')
    const outlineText = JSON.stringify(output.outline || [])
    expect(output.paperType).toBe(paperType)
    const baseSections = ['摘要', '关键词', '引言', '结论', '参考文献']
    const researchSections = ['相关研究', '研究方法']
    const reviewSections = ['文献检索与筛选说明', '研究脉络', '主题分类', '代表性研究', '争议与不足', '未来研究方向']
    const expectedSections = paperType === 'research' ? baseSections.concat(researchSections) : reviewSections.concat(['参考文献'])
    for (const section of expectedSections) {
      expect(`${markdown}\n${outlineText}`).toContain(section)
    }
    const workflowArtifactId = String(asRecord(output.artifact).artifactId || '')
    expect(workflowArtifactId).toBeTruthy()
    const exportResult = await apiPost<{ artifact?: Record<string, unknown> }>(
      request,
      auth,
      '/api/skills/web.docx.export/run',
      {
        workspacePath,
        title: String(output.title || (paperType === 'research' ? '研究文章' : '文献综述')),
        markdown,
        html: String(output.html || ''),
      },
    )
    expect(exportResult.ok, `paper Word export failed: HTTP ${exportResult.status} ${exportResult.text}`).toBeTruthy()
    const artifactId = String(asRecord(exportResult.body.artifact).id || '')
    expect(artifactId).toBeTruthy()
    await downloadArtifactViaApi(request, auth, artifactId, { minBytes: 5 * 1024 })
    generatedArtifactIds.push(artifactId)
    return { artifactId, workflowArtifactId, markdownLength: markdown.length }
  }

  const research = await runPaper('research')
  setCheck('document', 'paperWorkflow', 'passed', `paper workflow produced ${research.workflowArtifactId} and Word artifact ${research.artifactId}; ordinary generate API not used by this flow`)
  const review = await runPaper('review')
  setCheck('document', 'reviewWorkflow', 'passed', `review workflow produced ${review.workflowArtifactId} and Word artifact ${review.artifactId}; ordinary generate API not used by this flow`)

  const formalStart = await apiPost<{ taskId?: string }>(request, auth, '/api/document/formal-template/start', {
    workspacePath,
    customTemplateText: '访问函\n\n{{称谓}}：\n\n{{正文}}\n\n{{落款}}',
    instruction: '请生成一份邀请某高校教授来校交流访问的正式访问函。',
    fieldOverrides: {
      称谓: '尊敬的教授',
      落款: 'AIOS 高校行政办公室',
    },
  })
  expect(formalStart.ok, `formal template start failed: HTTP ${formalStart.status} ${formalStart.text}`).toBeTruthy()
  expect(formalStart.body.taskId).toBeTruthy()
  const formalTask = await pollApiTask(request, auth, `/api/document/formal-template/tasks/${formalStart.body.taskId}`, { timeoutMs: 150_000 })
  expect(formalTask.status).toBe('completed')
  const formalResult = asRecord(formalTask.result)
  const diagnostics = asRecord(formalResult.diagnostics)
  const steps = Array.isArray(diagnostics.steps) ? diagnostics.steps.map(String) : []
  for (const phase of ['analyze', 'confirm', 'preview', 'commit']) {
    expect(steps.join(',')).toContain(phase)
  }
  const formalWorkflowArtifactId = String(asRecord(formalResult.artifact).artifactId || '')
  expect(formalWorkflowArtifactId).toBeTruthy()
  const formalExport = await apiPost<{ artifact?: Record<string, unknown> }>(
    request,
    auth,
    '/api/skills/web.docx.export/run',
    {
      workspacePath,
      title: String(formalResult.title || '正式访问函'),
      markdown: String(formalResult.markdown || ''),
      html: String(formalResult.html || ''),
    },
  )
  expect(formalExport.ok, `formal Word export failed: HTTP ${formalExport.status} ${formalExport.text}`).toBeTruthy()
  const formalArtifactId = String(asRecord(formalExport.body.artifact).id || '')
  expect(formalArtifactId).toBeTruthy()
  await downloadArtifactViaApi(request, auth, formalArtifactId, { minBytes: 5 * 1024 })
  generatedArtifactIds.push(formalArtifactId)
  setCheck('document', 'formalTemplateWorkflow', 'passed', `formal-template produced ${formalWorkflowArtifactId} and Word artifact ${formalArtifactId} with phases ${steps.join(', ')}`)
})

test('PPT generation, download, and zero-token retemplate work', async ({ request }) => {
  const auth = await ensureSession(request)
  const start = await apiPost<{ taskId?: string }>(request, auth, '/api/ppt/decks/start', {
    workspacePath,
    title: 'AIOS 高校行政办公系统汇报',
    prompt: '生成一个关于 AIOS 高校行政办公系统的 8 页汇报 PPT',
    templateId: 'web-default',
  })
  expect(start.ok, `PPT start failed: HTTP ${start.status} ${start.text}`).toBeTruthy()
  expect(start.body.taskId).toBeTruthy()
  const task = await pollApiTask(request, auth, `/api/ppt/decks/tasks/${start.body.taskId}`, { timeoutMs: 150_000 })
  expect(task.status).toBe('completed')
  const pptResult = asRecord(task.result)
  const deckId = String(pptResult.deckId || '')
  const artifactId = String(asRecord(pptResult.artifact).id || '')
  expect(deckId).toBeTruthy()
  if (artifactId) generatedArtifactIds.push(artifactId)

  const deckDetail = await apiGet<{ deck?: Record<string, unknown> }>(request, auth, `/api/ppt/decks/${deckId}`)
  expect(deckDetail.ok, `deck detail failed: HTTP ${deckDetail.status} ${deckDetail.text}`).toBeTruthy()
  const deck = asRecord(deckDetail.body.deck)
  const slides = Array.isArray(deck.slides) ? deck.slides : []
  expect(slides.length).toBeGreaterThan(0)
  setCheck('ppt', 'generate', 'passed', `deckId=${deckId}, slides=${slides.length}, artifact=${artifactId || 'missing'}`)

  const pptx = await request.get(`${new URL(WEB_E2E_URL).origin}/api/ppt/decks/${deckId}/download`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
  const pptxBody = await pptx.body()
  expect(pptx.ok(), `PPTX download failed: HTTP ${pptx.status()}`).toBeTruthy()
  expect(pptxBody.length).toBeGreaterThan(10 * 1024)
  setCheck('ppt', 'download', 'passed', `${pptxBody.length} bytes`)

  const slideTextBefore = JSON.stringify(slides)
  const retemplate = await apiPost<{ deck?: Record<string, unknown>; tokenUsed?: boolean; diagnostics?: Record<string, unknown> }>(
    request,
    auth,
    `/api/ppt/decks/${deckId}/retemplate`,
    { templateId: 'web-default-alt' },
  )
  expect(retemplate.ok, `retemplate failed: HTTP ${retemplate.status} ${retemplate.text}`).toBeTruthy()
  expect(retemplate.body.tokenUsed).toBe(false)
  const nextDeck = asRecord(retemplate.body.deck)
  const nextSlides = Array.isArray(nextDeck.slides) ? nextDeck.slides : []
  expect(nextSlides.length).toBe(slides.length)
  expect(JSON.stringify(nextSlides)).toContain(JSON.parse(slideTextBefore)[0]?.title || '')
  expect(nextDeck.templateId).toBe('web-default-alt')
  setCheck('ppt', 'retemplateZeroToken', 'passed', `templateId=${nextDeck.templateId}, tokenUsed=false, slides preserved=${nextSlides.length}`)
})

test('image browser flow produces an artifact or explicit provider partial', async ({ page, request }) => {
  await ensurePage(page, request)
  await openWorkFeature(page, /图片生成/)
  await expect(page.getByText('图片工作区')).toBeVisible()
  await page.locator('textarea:visible').first().fill('生成一张 AIOS 高校行政办公系统宣传海报，简洁现代风格。')
  const startRequest = page.waitForRequest((req) =>
    req.url().includes('/api/image/jobs/start') && req.method() === 'POST',
  )
  await page.getByRole('button', { name: '🎨 生成图片' }).click()
  await startRequest
  await expect(page.getByText(/图片生成完成|图片服务未配置或不可用|图片生成失败/).first()).toBeVisible({ timeout: 150_000 })

  const statusText = await page.locator('body').innerText()
  if (statusText.includes('图片服务未配置或不可用')) {
    setCheck('image', 'generateOrExplicitPartial', 'skipped', 'provider unavailable was shown explicitly in UI')
    setCheck('image', 'providerConfig', 'partial', 'IMAGE_PROVIDER / IMAGE_API_BASE_URL / IMAGE_API_KEY or model returned unavailable/404; no fake success shown')
    return
  }

  const artifacts = await apiGet<{ artifacts?: Record<string, unknown>[] }>(request, await ensureSession(request), '/api/artifacts?type=image')
  const imageArtifact = (artifacts.body.artifacts || []).find((artifact) => artifact.type === 'image')
  expect(imageArtifact?.id, 'image generation did not create image artifact').toBeTruthy()
  imageArtifactId = String(imageArtifact?.id)
  generatedArtifactIds.push(imageArtifactId)
  await downloadArtifactViaApi(request, await ensureSession(request), imageArtifactId, { minBytes: 1024 })
  setCheck('image', 'generateOrExplicitPartial', 'passed', `image artifact ${imageArtifactId} created and downloadable`)
  setCheck('image', 'providerConfig', 'passed', 'provider accepted the request')
})

test('email inbox, unread triage, reply draft, attachment artifact, and Matter flow work or report safe partials', async ({ page, request }) => {
  const auth = await ensurePage(page, request)
  await openWorkFeature(page, /邮件收发/)
  await expect(page.getByText(/邮件|收件箱|邮箱|配置邮箱/).first()).toBeVisible()

  const accounts = await apiGet<{ configured?: boolean }>(request, auth, '/api/email/accounts')
  expect(accounts.ok, `email accounts failed: HTTP ${accounts.status} ${accounts.text}`).toBeTruthy()
  setCheck('email', 'accounts', accounts.body.configured ? 'passed' : 'skipped', accounts.body.configured ? 'email account is configured' : 'UI/API reports no configured mailbox; user-facing setup prompt is expected')

  const draft = await apiPost<{ artifact?: Record<string, unknown> }>(request, auth, '/api/email/drafts/artifact', {
    workspacePath,
    emailId: 'e2e-email-001',
    to: 'sender@example.com',
    subject: 'Re: Self acceptance',
    body: '您好：\n\n这是浏览器自验收生成的回复草稿。\n',
  })
  expect(draft.ok, `reply draft failed: HTTP ${draft.status} ${draft.text}`).toBeTruthy()
  const draftArtifactId = String(asRecord(draft.body.artifact).id || '')
  expect(draftArtifactId).toBeTruthy()
  generatedArtifactIds.push(draftArtifactId)
  setCheck('email', 'replyDraft', 'passed', `reply draft artifact ${draftArtifactId}`)

  const attachments = await apiPost<{ artifacts?: Record<string, unknown>[] }>(request, auth, '/api/email/attachments/artifacts', {
    workspacePath,
    emailId: 'e2e-email-001',
    attachments: [{ filename: 'self-acceptance-attachment.txt', textContent: 'email attachment artifact self acceptance', contentType: 'text/plain' }],
  })
  expect(attachments.ok, `attachment artifact failed: HTTP ${attachments.status} ${attachments.text}`).toBeTruthy()
  const attachmentArtifactId = String((attachments.body.artifacts || [])[0]?.id || '')
  expect(attachmentArtifactId).toBeTruthy()
  generatedArtifactIds.push(attachmentArtifactId)
  setCheck('email', 'attachmentArtifact', 'passed', `attachment artifact ${attachmentArtifactId}`)

  if (accounts.body.configured) {
    const inbox = await apiGet<{ messages?: Record<string, unknown>[] }>(request, auth, '/api/email/messages?folder=inbox')
    expect(inbox.ok, `email inbox failed: HTTP ${inbox.status} ${inbox.text}`).toBeTruthy()
    setCheck('email', 'inbox', 'passed', `messages=${inbox.body.messages?.length ?? 0}`)
    const triageStart = await apiPost<{ taskId?: string }>(request, auth, '/api/email/triage/start', { limit: 10, workspacePath })
    expect(triageStart.ok, `triage start failed: HTTP ${triageStart.status} ${triageStart.text}`).toBeTruthy()
    expect(triageStart.body.taskId).toBeTruthy()
    const triageTask = await pollApiTask(request, auth, `/api/email/triage/tasks/${triageStart.body.taskId}`, { timeoutMs: 120_000 })
    expect(triageTask.status).toBe('completed')
    const triageResults = Array.isArray(triageTask.results) ? triageTask.results : []
    if (triageResults.length > 0) {
      const first = asRecord(triageResults[0])
      expect(first.category).toBeTruthy()
      expect(first.summary).toBeTruthy()
      expect(first.priority).toBeTruthy()
      setCheck('email', 'unreadTriage', 'passed', `triaged ${triageResults.length} unread messages with category/summary/priority`)
    } else {
      setCheck('email', 'unreadTriage', 'skipped', 'triage task completed with no unread messages to classify')
    }
  } else {
    setCheck('email', 'inbox', 'skipped', 'no configured mailbox')
    setCheck('email', 'unreadTriage', 'skipped', 'no configured mailbox')
  }

  const matter = await apiPost<{ matterId?: string; matter?: Record<string, unknown> }>(request, auth, '/api/aios/matters/from-email', {
    workspacePath,
    email: {
      id: 'e2e-email-001',
      subject: 'Self Acceptance 邮件转 Matter',
      from: 'sender@example.com',
      body: '请根据这封邮件生成 Matter，并准备文稿、PPT 和回复。',
    },
    priority: 'normal',
  })
  expect(matter.ok, `email to Matter failed: HTTP ${matter.status} ${matter.text}`).toBeTruthy()
  lastMatterId = String(matter.body.matterId || asRecord(matter.body.matter).id || '')
  expect(lastMatterId).toBeTruthy()
  setCheck('email', 'emailToMatter', 'passed', `matter ${lastMatterId}`)

  const outputs = await Promise.all([
    apiPost<{ artifact?: Record<string, unknown> }>(request, auth, `/api/aios/matters/${lastMatterId}/generate-document`),
    apiPost<{ artifact?: Record<string, unknown> }>(request, auth, `/api/aios/matters/${lastMatterId}/generate-ppt`),
    apiPost<{ artifact?: Record<string, unknown> }>(request, auth, `/api/aios/matters/${lastMatterId}/generate-reply`),
  ])
  for (const output of outputs) {
    expect(output.ok, `Matter output failed: HTTP ${output.status} ${output.text}`).toBeTruthy()
    const artifactId = String(asRecord(output.body.artifact).id || '')
    expect(artifactId).toBeTruthy()
    generatedArtifactIds.push(artifactId)
  }
  setCheck('email', 'matterGenerateOutputs', 'passed', `Matter generated document/PPT/reply artifacts`)
})

test('daily report includes document, PPT, email, and Matter events and saves an artifact', async ({ request }) => {
  const auth = await ensureSession(request)
  const events = [
    { type: 'document_exported', title: '文稿生成/下载事件', module: 'document', summary: '文稿已生成并下载 Word/Markdown/HTML' },
    { type: 'email_sent', title: '邮件回复草稿事件', module: 'email', summary: '邮件回复草稿已生成' },
    { type: 'matter_created', title: 'Matter 创建事件', module: 'aios', summary: '邮件已转 Matter', metadata: { matterId: lastMatterId || 'e2e-matter' } },
    { type: 'ppt_generated', title: 'PPT 生成事件', module: 'ppt', summary: 'PPT 已生成并下载' },
  ]
  for (const event of events) {
    const created = await apiPost(request, auth, '/api/work-report/events', event)
    expect(created.ok, `work report event failed: HTTP ${created.status} ${created.text}`).toBeTruthy()
  }
  setCheck('report', 'eventsWritten', 'passed', `${events.length} events written`)

  const date = new Date().toISOString().slice(0, 10)
  const daily = await apiGet<{ artifactId?: string; events?: Record<string, unknown>[] }>(
    request,
    auth,
    `/api/work-report/daily?date=${date}&workspacePath=${encodeURIComponent(workspacePath)}`,
  )
  expect(daily.ok, `daily report failed: HTTP ${daily.status} ${daily.text}`).toBeTruthy()
  const modules = new Set((daily.body.events || []).map((event) => String(event.module)))
  for (const moduleName of ['document', 'ppt', 'email', 'aios']) {
    expect(modules.has(moduleName), `daily report missing module ${moduleName}`).toBeTruthy()
  }
  expect(daily.body.artifactId).toBeTruthy()
  generatedArtifactIds.push(String(daily.body.artifactId))
  setCheck('report', 'dailyGenerated', 'passed', `artifact ${daily.body.artifactId}`)
  setCheck('report', 'containsCoreModules', 'passed', Array.from(modules).join(', '))
  setCheck('report', 'reportArtifact', 'passed', `report artifact ${daily.body.artifactId}`)
})

test('Artifact preview, download, rename, delete, and relationships work', async ({ request }) => {
  const auth = await ensureSession(request)
  const matterId = lastMatterId || 'e2e-matter-manual'
  const fixtures = await Promise.all([
    createArtifact(request, auth, {
      type: 'document',
      title: 'E2E Document Artifact',
      filename: 'e2e-document.md',
      format: 'md',
      content: '# E2E Document Artifact\nrelationship metadata\n',
      matterId,
      sourceRefs: [{ type: 'manual', id: 'e2e-source', label: 'E2E source' }],
      knowledgeRefs: [{ documentId: 'e2e-knowledge', departmentId: 'scientific-papers', title: 'E2E knowledge', citationStatus: 'partial' }],
    }),
    createArtifact(request, auth, {
      type: 'presentation',
      title: 'E2E Presentation Artifact',
      filename: 'e2e-presentation.md',
      format: 'md',
      content: '# E2E Presentation Artifact\npresentation placeholder\n',
      sourceRefs: [{ type: 'deck', id: 'e2e-deck', label: 'E2E deck' }],
      deckId: 'e2e-deck',
    }),
    createArtifact(request, auth, {
      type: 'email_draft',
      title: 'E2E Email Draft Artifact',
      filename: 'e2e-email-draft.txt',
      format: 'txt',
      content: 'E2E email draft artifact',
      sourceRefs: [{ type: 'email', id: 'e2e-email-001', label: 'E2E email' }],
      emailId: 'e2e-email-001',
    }),
    createArtifact(request, auth, {
      type: 'report',
      title: 'E2E Report Artifact',
      filename: 'e2e-report.md',
      format: 'md',
      content: '# E2E Report Artifact\nreport placeholder\n',
      sourceRefs: [{ type: 'manual', id: 'e2e-report-event', label: 'E2E report event' }],
    }),
    createArtifact(request, auth, {
      type: 'decision_package',
      title: 'E2E Decision Package Artifact',
      filename: 'e2e-decision-package.json',
      format: 'json',
      content: JSON.stringify({ decision: 'acceptance', sourceRefs: ['e2e-source'] }),
      matterId,
      sourceRefs: [{ type: 'matter', id: matterId, label: 'E2E matter' }],
    }),
  ])
  if (imageArtifactId) fixtures.push(await artifactExists(request, auth, imageArtifactId))

  const types = new Set(fixtures.map((artifact) => String(artifact.type)))
  for (const expected of ['document', 'presentation', 'email_draft', 'report', 'decision_package']) {
    expect(types.has(expected), `missing artifact type ${expected}`).toBeTruthy()
  }
  setCheck('artifact', 'typeCoverage', imageArtifactId ? 'passed' : 'partial', `types=${Array.from(types).join(', ')}${imageArtifactId ? '' : '; image is provider-dependent partial'}`)

  const target = fixtures[0]
  const targetId = String(target.id)
  const preview = await apiGet(request, auth, `/api/artifacts/${targetId}/preview`)
  expect(preview.ok, `artifact preview failed: HTTP ${preview.status} ${preview.text}`).toBeTruthy()
  expect(preview.text).toContain('relationship metadata')
  setCheck('artifact', 'preview', 'passed', `preview ${targetId}`)

  const downloaded = await downloadArtifactViaApi(request, auth, targetId, { minBytes: 10, contains: /relationship metadata/ })
  setCheck('artifact', 'download', 'passed', `${downloaded.bytes} bytes`)

  const renamed = await apiPatch<{ artifact?: Record<string, unknown> }>(request, auth, `/api/artifacts/${targetId}`, {
    title: 'E2E Document Artifact Renamed',
  })
  expect(renamed.ok, `artifact rename failed: HTTP ${renamed.status} ${renamed.text}`).toBeTruthy()
  expect(renamed.body.artifact?.title).toBe('E2E Document Artifact Renamed')
  setCheck('artifact', 'rename', 'passed', `renamed ${targetId}`)

  const relations = await apiGet<{ sourceRefs?: unknown[]; knowledgeRefs?: unknown[]; graph?: Record<string, unknown> }>(
    request,
    auth,
    `/api/artifacts/${targetId}/relationships`,
  )
  expect(relations.ok, `artifact relationships failed: HTTP ${relations.status} ${relations.text}`).toBeTruthy()
  expect(Array.isArray(relations.body.sourceRefs)).toBeTruthy()
  expect(Array.isArray(relations.body.knowledgeRefs)).toBeTruthy()
  setCheck('artifact', 'relationships', 'passed', `sourceRefs=${relations.body.sourceRefs?.length ?? 0}, knowledgeRefs=${relations.body.knowledgeRefs?.length ?? 0}`)

  const deleteTarget = fixtures[1]
  const deleted = await apiDelete(request, auth, `/api/artifacts/${String(deleteTarget.id)}`)
  expect(deleted.ok, `artifact delete failed: HTTP ${deleted.status} ${deleted.text}`).toBeTruthy()
  setCheck('artifact', 'delete', 'passed', `deleted ${String(deleteTarget.id)}`)
})
