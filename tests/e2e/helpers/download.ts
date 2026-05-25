import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, type Locator, type Page, type APIRequestContext } from '@playwright/test'
import { apiUrl, type AuthSession } from './auth'

export interface DownloadResult {
  filename: string
  bytes: number
  text?: string
  path: string
}

export async function downloadFromButton(
  page: Page,
  button: Locator,
  expected: { extension: string; minBytes: number; contains?: string | RegExp },
): Promise<DownloadResult> {
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  const protectedDownloadResponse = page.waitForResponse((response) =>
    response.ok() && (
      (response.url().includes('/api/artifacts/') && response.url().includes('/download'))
      || (response.url().includes('/api/ppt/decks/') && (
        response.url().includes('/slidev-preview')
        || response.url().includes('/export')
      ))
    ),
    { timeout: 60_000 },
  ).catch(() => null)
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    button.click(),
  ])
  const filename = download.suggestedFilename()
  expect(filename.toLowerCase()).toContain(expected.extension.toLowerCase())
  const filePath = path.join(os.tmpdir(), `web-e2e-${Date.now()}-${filename}`)
  try {
    await download.saveAs(filePath)
  } catch (error) {
    const response = await protectedDownloadResponse
    if (response) {
      fs.writeFileSync(filePath, await response.body())
    } else if (download.url().startsWith('blob:')) {
      const blobText = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return res.text()
      }, download.url())
      fs.writeFileSync(filePath, blobText, 'utf-8')
    } else {
      throw error
    }
  }
  let bytes = fs.statSync(filePath).size
  if (bytes < expected.minBytes) {
    const response = await protectedDownloadResponse
    if (response) {
      const token = await page.evaluate(() => localStorage.getItem('aios_auth_token') || '')
      const fresh = await page.request.get(response.url(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      fs.writeFileSync(filePath, await fresh.body())
      bytes = fs.statSync(filePath).size
    } else if (download.url().startsWith('blob:')) {
      const blobText = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return res.text()
      }, download.url())
      fs.writeFileSync(filePath, blobText, 'utf-8')
      bytes = fs.statSync(filePath).size
    }
  }
  expect(bytes, `${filename} should be larger than ${expected.minBytes} bytes`).toBeGreaterThan(expected.minBytes)
  const text = expected.extension === '.docx' ? undefined : fs.readFileSync(filePath, 'utf-8')
  if (expected.contains) {
    expect(text || '', `${filename} did not contain expected content`).toMatch(expected.contains)
  }
  return { filename, bytes, text, path: filePath }
}

export async function downloadArtifactViaApi(
  request: APIRequestContext,
  session: AuthSession,
  artifactId: string,
  expected: { minBytes: number; contains?: string | RegExp },
): Promise<DownloadResult> {
  const response = await request.get(apiUrl(`/api/artifacts/${artifactId}/download`), {
    headers: { Authorization: `Bearer ${session.token}` },
  })
  const body = await response.body()
  expect(response.ok(), `artifact download failed for ${artifactId}: HTTP ${response.status()}`).toBeTruthy()
  expect(body.length, `artifact ${artifactId} download too small`).toBeGreaterThan(expected.minBytes)
  const disposition = response.headers()['content-disposition'] || ''
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || `${artifactId}.bin`
  const text = body.toString('utf-8')
  if (expected.contains) {
    expect(text, `artifact ${artifactId} did not contain expected content`).toMatch(expected.contains)
  }
  return {
    filename,
    bytes: body.length,
    text,
    path: '',
  }
}
