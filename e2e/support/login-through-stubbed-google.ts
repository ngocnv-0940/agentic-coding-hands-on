import { expect, type Page, type Route } from '@playwright/test'
import { STUB_CODE } from './mock-supabase-server'

export const LOGIN_BUTTON = /login with google/i
const APP_ORIGIN = 'http://localhost:3100'

export interface GoogleAuthorizeStub {
  /** Every /auth/v1/authorize request the page made, parsed. */
  requests: URL[]
}

/**
 * Stands in for Google at the browser boundary: the Supabase authorize URL is
 * answered with a 302 back to the app callback carrying the stub code. The real
 * button click still runs the genuine PKCE start (verifier cookie is real).
 *
 * hold: answers as a download (attachment), so the browser stays on /login with the
 * OAuth start still in flight. A 204 or a pending document leaves Playwright waiting
 * for a navigation and hides the DOM from locators.
 */
export async function stubGoogleAuthorize(page: Page, options: { hold?: boolean } = {}): Promise<GoogleAuthorizeStub> {
  const requests: URL[] = []

  await page.route('**/auth/v1/authorize**', async (route: Route) => {
    const authorizeUrl = new URL(route.request().url())
    requests.push(authorizeUrl)
    if (options.hold) {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: { 'content-disposition': 'attachment; filename=authorize' },
        body: '',
      })
      return
    }
    const callback = new URL(authorizeUrl.searchParams.get('redirect_to') ?? `${APP_ORIGIN}/auth/callback`)
    callback.searchParams.set('code', STUB_CODE)
    await route.fulfill({ status: 302, headers: { location: callback.toString() } })
  })

  return { requests }
}

/** Full same-tab login: /login -> click -> stubbed Google -> /auth/callback -> /todo. */
export async function loginThroughStubbedGoogle(page: Page): Promise<void> {
  await stubGoogleAuthorize(page)
  await page.goto('/login')
  const button = page.getByRole('button', { name: LOGIN_BUTTON })
  await expect(button).toBeVisible()
  await button.click()
  await expect(page).toHaveURL(/\/todo$/)
}
