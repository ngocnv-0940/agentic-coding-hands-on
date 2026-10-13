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

// One app server per run means one EVENT_START_AT per run. The default run pins the
// Figma event start; E2E_EVENT_START_AT starts a separate server with another value
// (invalid-env run: `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid`).
const EVENT_START_AT = process.env.E2E_EVENT_START_AT ?? '2025-12-26T18:30:00+07:00'
const customEventEnv = process.env.E2E_EVENT_START_AT !== undefined

// Tagged groups are excluded unless their run asks for them: @smoke needs the real stack,
// @event-env-invalid and @prelaunch need their own server (a custom EVENT_START_AT; @prelaunch
// runs with E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch).
const grepInvert = [
  ...(process.env.E2E_SMOKE ? [] : [/@smoke/]),
  ...(customEventEnv ? [] : [/@event-env-invalid/, /@prelaunch/]),
]

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Capped: each worker drives its own Chromium + next dev, and 8 local workers starve a ~4 GB box (page.goto timeouts).
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  // @smoke specs need the real Supabase stack (Docker + `supabase start`); run them with E2E_SMOKE=1.
  grepInvert: grepInvert.length > 0 ? grepInvert : undefined,
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
      // A reused server would keep whatever EVENT_START_AT it was started with, so a custom
      // event env always gets a fresh server.
      reuseExistingServer: !process.env.CI && !customEventEnv,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: MOCK_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key',
        EVENT_START_AT,
      },
    },
  ],
})
