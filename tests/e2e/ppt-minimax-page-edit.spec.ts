import { createHmac } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { test, expect, type Page } from '@playwright/test'

const APP_URL = 'http://127.0.0.1:5173/index.web.html'
const SERVER_URL = 'http://127.0.0.1:3001'
const GENERATED_SCREENSHOT = '/tmp/aioffice-ppt-minimax-generated.png'
const EDIT_SCREENSHOT = '/tmp/aioffice-ppt-minimax-page-edit.png'
const DOWNLOAD_SCREENSHOT = '/tmp/aioffice-ppt-minimax-download.png'
const DOWNLOAD_PATH = '/tmp/aioffice-ppt-minimax-download.pptx'

function createDevAuthToken(): string {
  const user = {
    id: 'web-demo-user',
    username: 'web-demo-user',
    displayName: 'web-demo-user',
    email: 'web-demo-user@example.com',
    roles: ['tester'],
    status: 'active',
    mustChangePassword: false,
  }
  const payload = {
    typ: 'web-email-fallback',
    user,
    iat: Date.now(),
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')
  const signature = createHmac('sha256', 'dev-web-email-fallback-token-secret').update(encoded).digest('base64url')
  return `web-email.${encoded}.${signature}`
}

async function openPptWorkbench(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    window.localStorage.setItem('aios_auth_token', token)
  }, createDevAuthToken())
  await page.goto(APP_URL, { waitUntil: 'networkidle' })
  await page.locator('button').filter({ hasText: '工作文稿、PPT、邮件、图片与办公资料' }).click()
  await page.locator('button').filter({ hasText: 'PPT 生成根据主题、资料和模板生成演示文稿，支持 Skill 模板进入' }).click()
  await expect(page.getByText('准备生成 PPT')).toBeVisible()
}

async function readNavigatorCards(page: Page): Promise<string[]> {
  return page.locator('button').filter({ hasText: /^第 [1-5] 页/ }).evaluateAll(
    (nodes) => nodes.map((node) => node.textContent?.replace(/\s+/g, '') || ''),
  )
}

test('MiniMax page edit stays page-scoped', async ({ page, request }) => {
  test.setTimeout(180_000)

  const frontendResp = await request.get(APP_URL)
  expect(frontendResp.ok()).toBeTruthy()
  expect(frontendResp.headers()['content-type'] || '').toContain('text/html')

  const serverResp = await request.get(`${SERVER_URL}/api/ppt/decks/non-existent`)
  expect(serverResp.status()).toBe(404)
  expect(await serverResp.text()).toContain('DeckDocument 不存在或已过期')

  await openPptWorkbench(page)

  await page.getByPlaceholder('请输入 PPT 生成需求，例如：生成一份 8 页以内的管理层汇报 PPT。').fill('生成一份 5 页的 AI Office 产品介绍 PPT。')
  await page.getByRole('button', { name: '生成PPT', exact: true }).click()

  await page.waitForFunction(
    () => document.body.innerText.includes('当前页：1 / 5') && document.body.innerText.includes('MiniMax PPTX Generator Skill'),
    { timeout: 120_000 },
  )
  expect(await page.locator('img').count()).toBeGreaterThan(1)
  await expect(page.getByText('当前页修改引擎：MiniMax PPTX Generator Skill').first()).toBeVisible()
  await page.screenshot({ path: GENERATED_SCREENSHOT, fullPage: true })

  const beforeCards = await readNavigatorCards(page)
  await page.locator('button').filter({ hasText: /^第 [1-5] 页/ }).evaluateAll((nodes) => {
    const target = nodes[2] as HTMLButtonElement | undefined
    target?.click()
  })
  await page.waitForFunction(() => document.body.innerText.includes('当前页：3 / 5'))
  await expect(page.getByText('当前正在修改：第 3 页').first()).toBeVisible()

  const editRequestPromise = page.waitForRequest((req) => (
    req.method() === 'POST'
    && req.url().includes('/api/ppt/decks/')
    && req.url().includes('/slides/')
    && req.url().includes('/edit')
  ))
  const editResponsePromise = page.waitForResponse((resp) => (
    resp.request().method() === 'POST'
    && resp.url().includes('/api/ppt/decks/')
    && resp.url().includes('/slides/')
    && resp.url().includes('/edit')
  ))

  await page.getByPlaceholder('告诉 AI 如何修改当前页，例如：把这一页改成三点式总结').fill('把当前页改成三点式总结，增强商务感。')
  await page.getByRole('button', { name: '发送', exact: true }).click()

  const [editRequest, editResponse] = await Promise.all([editRequestPromise, editResponsePromise])
  const requestBody = editRequest.postDataJSON() as {
    engine?: string
    allowFallback?: boolean
  }
  const responseBody = await editResponse.json() as {
    success?: boolean
    engine?: string
    skillId?: string
    slideId?: string
    changedSlideIds?: string[]
    unchangedSlideIds?: string[]
    exportUrl?: string
    artifact?: { id?: string }
    message?: string
  }

  expect(requestBody.engine).toBe('minimax_pptx_generator')
  expect(requestBody.allowFallback).toBe(false)
  expect(responseBody.success).toBe(true)
  expect(responseBody.engine).toBe('minimax_pptx_generator')
  expect(responseBody.skillId).toBe('minimax.pptx-generator')
  expect(responseBody.changedSlideIds).toEqual([responseBody.slideId])
  expect(responseBody.unchangedSlideIds).toEqual(expect.arrayContaining(['slide-1', 'slide-2', 'slide-4', 'slide-5']))

  await expect(page.getByText('已使用 MiniMax PPTX Generator 修改第 3 页。只修改当前页，其他页面未变更。')).toBeVisible({ timeout: 120_000 })
  await page.screenshot({ path: EDIT_SCREENSHOT, fullPage: true })

  const afterCards = await readNavigatorCards(page)
  expect(afterCards[0]).toBe(beforeCards[0])
  expect(afterCards[1]).toBe(beforeCards[1])
  expect(afterCards[3]).toBe(beforeCards[3])
  expect(afterCards[4]).toBe(beforeCards[4])
  expect(afterCards[2]).toContain('双栏')
  expect(afterCards[2]).toContain('现状分析方案概览')

  const downloadRequestPromise = page.waitForRequest((req) => (
    req.url().includes(responseBody.exportUrl || '')
    && req.method() === 'GET'
  ))
  await page.getByRole('button', { name: '下载 PPTX', exact: true }).click()
  const downloadRequest = await downloadRequestPromise
  expect(downloadRequest.url()).toContain(responseBody.artifact?.id || '')
  const artifactDownload = await request.get(new URL(responseBody.exportUrl || '', SERVER_URL).toString(), {
    headers: {
      Authorization: `Bearer ${createDevAuthToken()}`,
    },
  })
  expect(artifactDownload.ok()).toBeTruthy()
  await writeFile(DOWNLOAD_PATH, Buffer.from(await artifactDownload.body()))
  await page.screenshot({ path: DOWNLOAD_SCREENSHOT, fullPage: true })
})
