import { expect, test } from '@playwright/test'
import { LOGIN_BUTTON } from './support/login-through-stubbed-google'

// Runs only on its own server (a custom SITE_LAUNCH_AT), one command per invalid value:
//   E2E_SITE_LAUNCH_AT=not-a-date bun run test:e2e --grep @launch-env-invalid
// Spec ids: BR-001, FR-104. A missing or invalid launch time means no lock: /prelaunch goes on to /login
// for a guest, and the rest of the site is open as it is after the launch.

test.describe('@launch-env-invalid Prelaunch with an invalid SITE_LAUNCH_AT', () => {
  // FR-104 / BR-001: /prelaunch is not a page here; it sends the browser to / and then to /login
  test('@launch-env-invalid FR-104 / BR-001: GET /prelaunch answers 307 to / with no lock', async ({ request }) => {
    const response = await request.get('/prelaunch', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(new URL(response.headers().location ?? '', response.url()).pathname).toBe('/')
  })

  test('@launch-env-invalid FR-104 / BR-001: a guest opening /prelaunch ends on /login', async ({ page }) => {
    await page.goto('/prelaunch')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })
})
