import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle, stubGoogleAuthorize, LOGIN_BUTTON } from './support/login-through-stubbed-google'
import { appAlert } from './support/app-alert'

const VI_ERROR = 'Đăng nhập không thành công. Vui lòng thử lại.'
const SESSION_COOKIE_PREFIX = 'sb-'

test.describe('Auth flow and route guards', () => {
  // TC 45278c06: the login screen is shown to unauthenticated visitors
  test('unauthenticated visitor sees the login screen', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })

  // Clarification: "/" redirects to /login (signed-in users then continue to /todo via the proxy)
  test('root path redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  // Clarification: protected /todo redirects unauthenticated visitors to /login
  test('unauthenticated /todo, nested and query variants redirect to /login', async ({ page }) => {
    for (const path of ['/todo', '/todo/x', '/todo?a=1']) {
      await page.goto(path)
      await expect(page, `GET ${path}`).toHaveURL(/\/login$/)
    }
  })

  // TC e76aa170: valid Google account -> user info returned and redirected to the app page
  test('successful Google sign-in lands on /todo showing the signed-in email', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(page.getByTestId('todo-email')).toHaveText('e2e@example.com')
  })

  // Cancel at Google: the callback sends the user back with a generic error, provider text is never echoed
  test('cancelled Google consent returns to /login with the inline error', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied&error_description=User+cancelled+the+login')
    await expect(page).toHaveURL(/\/login\?error=/)
    await expect(appAlert(page)).toHaveText(VI_ERROR)
    await expect(page.getByText('User cancelled', { exact: false })).toHaveCount(0)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeEnabled()
  })

  test('callback with a rejected code returns to /login with the inline error', async ({ page }) => {
    await page.goto('/auth/callback?code=not-a-valid-code')
    await expect(page).toHaveURL(/\/login\?error=/)
    await expect(appAlert(page)).toHaveText(VI_ERROR)
  })

  test('callback without code or error returns to /login with the inline error', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/login\?error=/)
    await expect(appAlert(page)).toHaveText(VI_ERROR)
  })

  // BR-001: any error flag shows one fixed message; the flag content is never rendered
  test('an error flag shows exactly one fixed alert; a clean /login shows none', async ({ page }) => {
    await page.goto('/login?error=x')
    await expect(appAlert(page)).toHaveCount(1)
    await expect(appAlert(page)).toHaveText(VI_ERROR)

    await page.goto('/login')
    await expect(appAlert(page)).toHaveCount(0)
  })

  test('HTML in the error flag is not injected into the page', async ({ page }) => {
    await page.goto(`/login?error=${encodeURIComponent('<img src=x onerror="window.__xss=1">')}`)
    await expect(appAlert(page)).toHaveText(VI_ERROR)
    await expect(page.locator('img[src="x"]')).toHaveCount(0)
    await expect(page.locator('[onerror]')).toHaveCount(0)
  })

  // Authenticated users are sent away from /login, including when a flag is present
  test('authenticated visitor on /login is redirected to /todo', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/todo$/)
    await page.goto('/login?error=x')
    await expect(page).toHaveURL(/\/todo$/)
  })

  // TC 45278c06 step 2: logout returns to /login and /todo is guarded again
  test('logout returns to /login and /todo is guarded again', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    const logout = page.getByRole('button', { name: /đăng xuất|logout/i })
    await expect(logout).toBeVisible()
    await logout.click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/todo')
    await expect(page).toHaveURL(/\/login$/)
  })

  // Logout must leave no /todo data in the DOM, before or after browser Back (Activity keeps left routes hidden)
  test('browser Back after logout never shows the previous user data', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(page.getByTestId('todo-email')).toBeVisible()
    await page.getByRole('button', { name: /đăng xuất|logout/i }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
    // Full-document navigation: no hidden /todo tree may remain in the /login DOM
    await expect(page.getByTestId('todo-email')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
    await expect(page.getByTestId('todo-email')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('e2e@example.com')
  })

  // Tampered session cookies must not grant access
  test('garbage in the session cookies redirects /todo to /login', async ({ page, context }) => {
    await loginThroughStubbedGoogle(page)
    const sessionCookies = (await context.cookies()).filter((c) => c.name.startsWith(SESSION_COOKIE_PREFIX))
    expect(sessionCookies.length, 'a real login must set session cookies').toBeGreaterThan(0)
    await context.addCookies(sessionCookies.map((c) => ({ ...c, value: 'garbage' })))
    await page.goto('/todo')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a fresh login after a failed one succeeds', async ({ page }) => {
    await page.goto('/auth/callback?code=not-a-valid-code')
    await expect(appAlert(page)).toHaveText(VI_ERROR)
    await stubGoogleAuthorize(page)
    const button = page.getByRole('button', { name: LOGIN_BUTTON })
    await expect(button).toBeVisible()
    await button.click()
    await expect(page).toHaveURL(/\/todo$/)
  })
})
