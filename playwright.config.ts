import { defineConfig, devices } from '@playwright/test'

const APP_PORT = 3100
const MOCK_PORT = 54399
const APP_URL = `http://localhost:${APP_PORT}`
const MOCK_URL = `http://localhost:${MOCK_PORT}`

// Default: next dev. E2E_PROD=1 runs build + start instead (use it when another
// `next dev` already holds this directory's lock).
const appCommand = process.env.E2E_PROD
  ? `bun run build && bun run start -p ${APP_PORT}`
  : `bun run dev -p ${APP_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],
  // @smoke specs need the real Supabase stack (Docker + `supabase start`); run them with E2E_SMOKE=1.
  grepInvert: process.env.E2E_SMOKE ? undefined : /@smoke/,
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'bun run e2e/support/start-mock-supabase.ts',
      url: `${MOCK_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: appCommand,
      url: `${APP_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: MOCK_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key',
      },
    },
  ],
})
