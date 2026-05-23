import { expect, test } from '@playwright/test'
import { WEB_E2E_URL, apiGet, apiPost } from './helpers/auth'

const fallbackUsername = process.env.EMAIL_FALLBACK_TEST_USERNAME || 'guozhihang'
const fallbackPassword = process.env.EMAIL_FALLBACK_TEST_PASSWORD || 'definitely-wrong-password-for-e2e'
const hasRealFallbackEnv = Boolean(process.env.EMAIL_FALLBACK_TEST_USERNAME && process.env.EMAIL_FALLBACK_TEST_PASSWORD)

test.describe('email login fallback', () => {
  test('email login fallback shows candidates or logs in and auto-binds mailbox', async ({ page, request }) => {
    await page.goto(WEB_E2E_URL)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload({ waitUntil: 'domcontentloaded' })

    await page.getByLabel('用户名或邮箱').fill(fallbackUsername)
    await page.getByLabel('密码').fill(fallbackPassword)
    await page.getByRole('button', { name: /登录|验证中/ }).click()

    if (!hasRealFallbackEnv) {
      await expect(page.getByText('AI Office 登录失败', { exact: false })).toBeVisible({ timeout: 45_000 })
      await expect(page.getByText('guozhihang@cuhk.edu.cn', { exact: false })).toBeVisible()
      await expect(page.getByText('guozhihang@link.cuhk.edu.cn', { exact: false })).toBeVisible()
      await expect(page.getByText('guozhihang@ai.cuhk.edu.cn', { exact: false })).toBeVisible()
      return
    }

    await expect(page.getByText('已通过邮箱验证登录', { exact: false })).toBeVisible({ timeout: 60_000 })
    const token = await page.evaluate(() => localStorage.getItem('aios_auth_token'))
    expect(token).toBeTruthy()

    const me = await apiGet(request, { token: String(token), user: {} }, '/api/auth/me')
    expect(me.ok, `auth/me failed: ${me.status} ${me.text}`).toBeTruthy()

    const accounts = await apiGet<{ accounts?: Array<{ email?: string; user?: string; provider?: string }> }>(
      request,
      { token: String(token), user: {} },
      '/api/email/accounts',
    )
    expect(accounts.ok, `email/accounts failed: ${accounts.status} ${accounts.text}`).toBeTruthy()
    const expectedEmail = fallbackUsername.includes('@') ? fallbackUsername.toLowerCase() : `${fallbackUsername}@cuhk.edu.cn`
    expect(accounts.body.accounts?.some((item) => (item.email || item.user) === expectedEmail)).toBeTruthy()

    const login = await apiPost<{ authMethod?: string; autoBoundMailbox?: { email?: string } }>(
      request,
      undefined,
      '/api/auth/login',
      { username: fallbackUsername, password: fallbackPassword },
    )
    expect(login.ok).toBeTruthy()
    expect(login.body.authMethod).toBe('email_fallback')
    expect(login.body.autoBoundMailbox?.email).toBeTruthy()
  })
})
