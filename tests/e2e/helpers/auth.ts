import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const WEB_E2E_URL = process.env.WEB_E2E_URL || 'http://10.20.5.61:5173/index.web.html'
export const TEST_USER_LOGIN = process.env.TEST_USER_LOGIN || 'yifeichen'
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'yifeichen@ai.cuhk.edu.cn'
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

export interface AuthSession {
  token: string
  user: Record<string, unknown>
}

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean
  status: number
  body: T
  text: string
}

export function apiUrl(pathname: string): string {
  const origin = new URL(WEB_E2E_URL).origin
  return `${origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function authHeaders(session?: AuthSession): Record<string, string> {
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {}
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

async function parseResponse<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<ApiResult<T>> {
  const text = await response.text()
  let body: unknown = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  return {
    ok: response.ok(),
    status: response.status(),
    body: body as T,
    text,
  }
}

export async function apiGet<T = Record<string, unknown>>(
  request: APIRequestContext,
  session: AuthSession | undefined,
  pathname: string,
): Promise<ApiResult<T>> {
  return parseResponse<T>(await request.get(apiUrl(pathname), { headers: authHeaders(session) }))
}

export async function apiPost<T = Record<string, unknown>>(
  request: APIRequestContext,
  session: AuthSession | undefined,
  pathname: string,
  data?: unknown,
): Promise<ApiResult<T>> {
  return parseResponse<T>(await request.post(apiUrl(pathname), {
    headers: authHeaders(session),
    data,
  }))
}

export async function apiPatch<T = Record<string, unknown>>(
  request: APIRequestContext,
  session: AuthSession | undefined,
  pathname: string,
  data?: unknown,
): Promise<ApiResult<T>> {
  return parseResponse<T>(await request.patch(apiUrl(pathname), {
    headers: authHeaders(session),
    data,
  }))
}

export async function apiDelete<T = Record<string, unknown>>(
  request: APIRequestContext,
  session: AuthSession | undefined,
  pathname: string,
): Promise<ApiResult<T>> {
  return parseResponse<T>(await request.delete(apiUrl(pathname), { headers: authHeaders(session) }))
}

export async function loginViaApi(request: APIRequestContext, username = TEST_USER_LOGIN): Promise<AuthSession> {
  const result = await apiPost<{ token?: string; user?: Record<string, unknown>; message?: string }>(
    request,
    undefined,
    '/api/auth/login',
    { username, password: TEST_USER_PASSWORD },
  )
  expect(result.ok, `login API failed for ${username}: HTTP ${result.status} ${result.text}`).toBeTruthy()
  expect(result.body.token, `login API did not return token for ${username}`).toBeTruthy()
  return { token: String(result.body.token), user: asRecord(result.body.user) }
}

export async function loginViaUi(page: Page, username: string): Promise<AuthSession> {
  await page.goto(WEB_E2E_URL)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })

  const usernameField = page.getByLabel('用户名或邮箱')
  try {
    await expect(usernameField).toBeVisible({ timeout: 3_000 })
  } catch {
    const logout = page.getByRole('button', { name: '退出' }).first()
    if (await logout.count()) {
      await logout.click()
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    }
  }

  const passwordField = page.locator('#lg-password')
  await usernameField.fill(username)
  await passwordField.fill(TEST_USER_PASSWORD)
  await expect(usernameField).toHaveValue(username)
  await expect(passwordField).toHaveValue(TEST_USER_PASSWORD)

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/auth/login') && response.request().method() === 'POST',
  )
  const loginButton = page.getByRole('button', { name: /^登录$/ })
  await expect(loginButton).toBeEnabled()
  await loginButton.click()
  const response = await loginResponse
  expect(response.ok(), `UI login failed for ${username}: HTTP ${response.status()} ${await response.text()}`).toBeTruthy()

  await expect.poll(async () => page.evaluate(() => localStorage.getItem('aios_auth_token') || ''), {
    timeout: 30_000,
    message: `token was not persisted after UI login for ${username}`,
  }).not.toBe('')

  await expect(page.getByText(/选择工作区|工作台|文稿编辑|AI Office/i).first()).toBeVisible()
  const token = await page.evaluate(() => localStorage.getItem('aios_auth_token') || '')
  const me = await apiGet<Record<string, unknown>>(page.request, { token, user: {} }, '/api/auth/me')
  expect(me.ok, `/api/auth/me failed after UI login for ${username}: HTTP ${me.status} ${me.text}`).toBeTruthy()
  return { token, user: me.body }
}

export async function installSession(page: Page, session: AuthSession): Promise<void> {
  await page.goto(WEB_E2E_URL)
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('aios_auth_token', token)
    localStorage.setItem('aios_itoken', token)
    localStorage.setItem('ai_office_internal_token', token)
    localStorage.setItem('ai_office_internal_user', JSON.stringify(user || {}))
  }, session)
}

export async function ensureDefaultWorkspace(request: APIRequestContext, session: AuthSession): Promise<string> {
  const result = await apiGet<{ workspace?: { path?: string } }>(request, session, '/api/workspaces/default')
  expect(result.ok, `default workspace failed: HTTP ${result.status} ${result.text}`).toBeTruthy()
  const workspacePath = result.body.workspace?.path
  expect(workspacePath, 'default workspace did not return a path').toBeTruthy()
  return String(workspacePath)
}
