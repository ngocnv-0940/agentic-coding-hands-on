import { expect, test } from '@playwright/test'
import { LOGIN_BUTTON, loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import { appAlert } from './support/app-alert'
import { startBrowserClockAt } from './support/event-clock'
import { browserTimeAfterStart, DAY_MS, naturalWidthOf, prelaunchScreen } from './support/prelaunch-locators-and-clock'

// Run on the locked server only (E2E_EVENT_START_AT in the future):
//   E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch
// Spec ids: TC ACCESS-1..4, FR-101..105, FR-601, BR-001, BR-003, DEC-001, US002, US003, SC-001, SC-002.

const VI_ERROR = 'Đăng nhập không thành công. Vui lòng thử lại.'
const LOCKED_PATHS = ['/', '/awards-information', '/admin', '/todo', '/sun-kudos/x', '/khong-co-trang-nay']
const SESSION_COOKIE_PREFIX = 'sb-'
const SESSION_TOKEN_COOKIE = 'sb-localhost-auth-token'

/** Resolves a (possibly relative) Location header against the response URL and returns its path. */
function locationPath(location: string | undefined, from: string): string {
  return new URL(location ?? '', from).pathname
}

test.describe('@prelaunch Prelaunch lock and access', () => {
  // TC ACCESS-2 / FR-101: guests see the countdown page and are never sent to /login
  test('TC ACCESS-2 / FR-101: a guest sees /prelaunch and is not sent to /login', async ({ page }) => {
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // TC ACCESS-1 / FR-101: a signed-in user of any privilege sees the same page
  test('TC ACCESS-1 / FR-101: a signed-in user sees /prelaunch', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // TC ACCESS-3 / US003: the admin identity also sees /prelaunch (no privilege-based exception)
  test('TC ACCESS-3 / FR-101: the admin identity sees /prelaunch', async ({ page }) => {
    await loginThroughStubbedGoogle(page, { as: 'admin' })
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // TC ACCESS-1 step 4 / FR-102 / BR-003: every locked path, including unknown ones, answers 307 to /prelaunch
  test('TC ACCESS-1 step 4 / FR-102: locked paths answer 307 to /prelaunch for guests and signed-in users', async ({ page, request }) => {
    for (const path of LOCKED_PATHS) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), `guest GET ${path}`).toBe(307)
      expect(locationPath(response.headers().location, response.url()), `guest GET ${path} location`).toBe('/prelaunch')
    }
    await loginThroughStubbedGoogle(page)
    for (const path of LOCKED_PATHS) {
      const response = await page.request.get(path, { maxRedirects: 0 })
      expect(response.status(), `signed-in GET ${path}`).toBe(307)
      expect(locationPath(response.headers().location, response.url()), `signed-in GET ${path} location`).toBe('/prelaunch')
    }
  })

  // FR-103: /login is not locked for a guest
  test('FR-103: /login renders for a guest', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })

  // FR-103 / US002 / US003: the full Google sign-in works before launch and ends on /prelaunch
  test('FR-103 / US003: the full stubbed login ends on /prelaunch', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(page).toHaveURL(/\/prelaunch$/)
    await expect(prelaunchScreen(page)).toBeVisible()
  })

  // FR-105 / US003: the session survives the lock. /login sends a signed-in user to / and the lock then to /prelaunch
  test('FR-105: a signed-in goto /login ends on /prelaunch', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // FR-103: an OAuth error is answered with the fixed alert, /login stays reachable
  test('FR-103: /auth/callback?error=x lands on /login with the fixed alert', async ({ page }) => {
    await page.goto('/auth/callback?error=x')
    await expect(page).toHaveURL(/\/login\?error=/)
    await expect(appAlert(page)).toHaveText(VI_ERROR)
  })

  // FR-103: sign-out is exempt from the lock and still answers 303 to /login
  test('FR-103: POST /auth/logout answers 303 to /login', async ({ request }) => {
    const response = await request.post('/auth/logout', { maxRedirects: 0 })
    expect(response.status()).toBe(303)
    expect(locationPath(response.headers().location, response.url())).toBe('/login')
  })

  // FR-102 exempts static images; FR-204 the login key visual still decodes
  test('FR-102: /images/login/logo.png answers 200 and the login key visual decodes', async ({ page, request }) => {
    const logo = await request.get('/images/login/logo.png', { maxRedirects: 0 })
    expect(logo.status()).toBe(200)
    await page.goto('/login')
    await expect(page.locator('img[src*="key-visual"]')).toBeVisible()
    await expect.poll(() => naturalWidthOf(page.locator('img[src*="key-visual"]'))).toBeGreaterThan(0)
  })

  // TC ACCESS-4 / FR-101: garbage session cookies do not break the lock or the page
  test('TC ACCESS-4 / FR-101: garbage sb-* session cookies still show /prelaunch', async ({ page, context }) => {
    await loginThroughStubbedGoogle(page)
    const sessionCookies = (await context.cookies()).filter((c) => c.name.startsWith(SESSION_COOKIE_PREFIX))
    expect(sessionCookies.length, 'a real login must set session cookies').toBeGreaterThan(0)
    await context.addCookies(sessionCookies.map((c) => ({ ...c, value: 'garbage' })))
    await page.goto('/')
    await expect(page).toHaveURL(/\/prelaunch$/)
    await expect(prelaunchScreen(page)).toBeVisible()
  })

  // SC-002 / BR-004: the lock 307 still carries the cookies Supabase writes while refreshing the session.
  // Garbage cookies are not enough (Supabase writes nothing for them), so the real session is aged to expired
  // and the proxy's getUser() refreshes it against the mock, which makes it call setAll().
  test('SC-002: a lock 307 for a request with an expired session carries the refreshed sb- set-cookie', async ({ page, context }) => {
    await loginThroughStubbedGoogle(page)
    const cookie = (await context.cookies()).find((c) => c.name === SESSION_TOKEN_COOKIE)
    expect(cookie, 'a real login sets the (unchunked) session token cookie').toBeDefined()
    if (!cookie) return
    const BASE64_PREFIX = 'base64-'
    expect(cookie.value.startsWith(BASE64_PREFIX), 'session cookie is base64url JSON').toBe(true)
    const session = JSON.parse(Buffer.from(cookie.value.slice(BASE64_PREFIX.length), 'base64url').toString('utf8'))
    const expired = { ...session, expires_at: 1, expires_in: 0 }
    const expiredValue = BASE64_PREFIX + Buffer.from(JSON.stringify(expired)).toString('base64url')
    await context.addCookies([{ ...cookie, value: expiredValue }])

    const response = await page.request.get('/', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(locationPath(response.headers().location, response.url())).toBe('/prelaunch')
    const setCookies = response
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value)
    expect(
      setCookies.some((value) => value.startsWith(`${cookie.name}=`) && value.length > cookie.name.length + 20),
      `set-cookie headers on the lock 307: ${JSON.stringify(setCookies)}`,
    ).toBe(true)
  })

  // FR-601 / BR-001 / DEC-001: a browser clock past the start does not unlock the site (server clock decides)
  test('FR-601 / BR-001: a browser clock past the start still shows /prelaunch for a guest', async ({ page }) => {
    await startBrowserClockAt(page, browserTimeAfterStart(DAY_MS).toISOString())
    await page.goto('/')
    await expect(page).toHaveURL(/\/prelaunch$/)
    await expect(prelaunchScreen(page)).toBeVisible()
  })
})
