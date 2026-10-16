import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle, stubGoogleAuthorize, LOGIN_BUTTON } from './support/login-through-stubbed-google'
import { footer, header, headerNav, hero, navLink, placeholderComingSoon } from './support/homepage-locators'

// Spec ids: FR-101..105, FR-601, FR-603, BR-005, DEC-003, DEC-004, US001, US002, SC-001..003, SC-011.
// Guest redirects to /login for `/` and the five placeholders (ID-0 is superseded by clarifications).
const PLACEHOLDER_PATHS = ['/awards-information', '/sun-kudos', '/standards', '/profile', '/admin', '/sun-kudos/x']

test.describe('Homepage access and landing', () => {
  // ID-0 (superseded): a guest on / is sent to the login screen, never shown the homepage
  test('guest on / is redirected to /login and never sees the homepage hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(hero(page)).toHaveCount(0)
  })

  // FR-105: every placeholder route, including a nested one, is protected like `/`
  test('guest opening any placeholder or nested route is redirected to /login', async ({ page }) => {
    for (const path of PLACEHOLDER_PATHS) {
      await page.goto(path)
      await expect(page, `GET ${path}`).toHaveURL(/\/login$/)
      await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
    }
  })

  // FR-601/BR-005: the callback never reads `next`, so a hostile value cannot redirect the user off-app
  test('callback with next=https://evil.example still lands on the homepage /', async ({ page }) => {
    await stubGoogleAuthorize(page, { callbackParams: { next: 'https://evil.example' } })
    await page.goto('/login')
    await page.getByRole('button', { name: LOGIN_BUTTON }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(new URL(page.url()).host).toBe('localhost:3100')
    await expect(hero(page)).toBeVisible()
  })

  // FR-104: /todo keeps its own behaviour; it is reachable for a signed-in user
  test('/todo stays reachable for a signed-in user', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/todo')
    await expect(page).toHaveURL(/\/todo$/)
    await expect(page.getByTestId('todo-email')).toHaveText('e2e@example.com')
  })

  // FR-603/DEC-004/US007: a non-admin typing /admin is sent to the homepage, not the placeholder
  test('a non-admin opening /admin is sent to the homepage /', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
    await expect(hero(page)).toBeVisible()
    await expect(placeholderComingSoon(page)).toHaveCount(0)
  })

  // FR-602/FR-603: the admin identity may open /admin, which shows the placeholder inside the shared shell
  test('an admin opening /admin sees the Coming soon placeholder with header and footer', async ({ page }) => {
    await loginThroughStubbedGoogle(page, { as: 'admin' })
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(placeholderComingSoon(page)).toBeVisible()
    await expect(header(page)).toBeVisible()
    await expect(footer(page)).toBeVisible()
  })

  // Security negative (FR-603/D009): role in user_metadata is user-editable and must not open /admin
  test('a user_metadata admin claim does not open /admin: the user is sent to the homepage', async ({ page }) => {
    await loginThroughStubbedGoogle(page, { as: 'usermeta-admin' })
    await expect(hero(page)).toBeVisible()
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
    await expect(hero(page)).toBeVisible()
    await expect(placeholderComingSoon(page)).toHaveCount(0)
  })

  // FR-002/D010: every placeholder reuses the homepage header and footer, with Coming soon in the body
  test('signed-in placeholder pages show the shared header, footer and Coming soon', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    for (const path of ['/standards', '/profile']) {
      await page.goto(path)
      await expect(page, `GET ${path}`).toHaveURL(new RegExp(`${path}$`))
      await expect(header(page)).toBeVisible()
      await expect(footer(page)).toBeVisible()
      await expect(placeholderComingSoon(page)).toBeVisible()
    }
  })

  // FR-202/D010: the nav item for the current route is the only one marked active
  test('the active nav item follows the current placeholder route', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/awards-information')
    await expect(navLink(page, /Award Information/i)).toHaveAttribute('aria-current', 'page')
    await expect(navLink(page, /About SAA 2025/i)).not.toHaveAttribute('aria-current', 'page')

    await page.goto('/standards')
    await expect(headerNav(page).locator('[aria-current="page"]')).toHaveCount(0)
  })
})
