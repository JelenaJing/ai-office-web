import base from './playwright.config'

/** 复用本机已启动的 https dev + dist server，不拉起 webServer */
export default {
  ...base,
  webServer: undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...base.projects?.[0]?.use,
        ignoreHTTPSErrors: true,
        baseURL: process.env.WEB_E2E_URL || 'https://127.0.0.1:5173/index.web.html',
        launchOptions: {},
      },
    },
  ],
}
