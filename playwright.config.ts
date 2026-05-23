import fs from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.WEB_E2E_URL || 'http://10.20.5.61:5173/index.web.html'
const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (fs.existsSync('/snap/bin/chromium') ? '/snap/bin/chromium' : undefined)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  webServer: {
    command: 'npm run dev:web:full',
    url: 'http://127.0.0.1:5173/index.web.html',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: systemChromium ? {
          executablePath: systemChromium,
        } : undefined,
      },
    },
  ],
})
