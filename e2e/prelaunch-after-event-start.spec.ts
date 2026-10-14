import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import { hero } from './support/homepage-locators'

// Untagged: runs in the default run (SITE_LAUNCH_AT unset, so the site is unlocked).
// Spec ids: FR-104, FR-106, DEC-002, SC-006, SC-008. Pins the post-start landing that the locked run cannot reach.

test.describe('Prelaunch page after the launch', () => {
  // FR-104: once the site has launched, /prelaunch is no longer a page; it sends the browser to /
  test('FR-104: GET /prelaunch answers 307 to / once the site has launched', async ({ request }) => {
    const response = await request.get('/prelaunch', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(new URL(response.headers().location ?? '', response.url()).pathname).toBe('/')
  })

  // DEC-002: a guest who lands on / from /prelaunch is then sent on to /login by the existing guards
  test('DEC-002 / SC-008: a guest opening /prelaunch ends on /login', async ({ page }) => {
    await page.goto('/prelaunch')
    await expect(page).toHaveURL(/\/login$/)
  })

  // DEC-002: a signed-in user lands on the homepage /
  test('DEC-002 / SC-008: a signed-in user opening /prelaunch ends on the homepage /', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/prelaunch')
    await expect(page).toHaveURL(/\/$/)
    await expect(hero(page)).toBeVisible()
  })

  // FR-106: with no lock after the launch, a guest on / still goes to /login (existing guard unchanged)
  test('FR-106: a guest on / still goes to /login after the launch', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })
})
