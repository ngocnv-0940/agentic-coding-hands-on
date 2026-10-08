import { expect, type Page, type Route } from '@playwright/test'
import { STUB_CODE, STUB_CODE_ADMIN, STUB_CODE_USERMETA_ADMIN } from './mock-supabase-server'

export const LOGIN_BUTTON = /login with google/i
const APP_ORIGIN = 'http://localhost:3100'

/** user: no admin claim; admin: app_metadata.role; usermeta-admin: user_metadata.role only (must not grant admin). */
export type StubIdentity = 'user' | 'admin' | 'usermeta-admin'
const CODE_FOR_IDENTITY: Record<StubIdentity, string> = {
  user: STUB_CODE,
  admin: STUB_CODE_ADMIN,
  'usermeta-admin': STUB_CODE_USERMETA_ADMIN,
}

export interface GoogleAuthorizeStub {
  /** Every /auth/v1/authorize request the page made, parsed. */
  requests: URL[]
}

export interface GoogleAuthorizeOptions {
  /** answers as a download (attachment) so the OAuth start stays in flight */
  hold?: boolean
  /** mock auth code to hand back; defaults to the regular user */
  code?: string
  /** extra query params appended to the app callback (e.g. a hostile `next`) */
  callbackParams?: Record<string, string>
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
export async function stubGoogleAuthorize(page: Page, options: GoogleAuthorizeOptions = {}): Promise<GoogleAuthorizeStub> {
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
    callback.searchParams.set('code', options.code ?? STUB_CODE)
    for (const [key, value] of Object.entries(options.callbackParams ?? {})) callback.searchParams.set(key, value)
    await route.fulfill({ status: 302, headers: { location: callback.toString() } })
  })

  return { requests }
}

/**
 * Full same-tab login: /login -> click -> stubbed Google -> /auth/callback -> signed-in page.
 * Resolves once the browser has left /login and the callback, so each spec's own assertions
 * decide what passes or fails. The landing URL (`/`) is asserted by the landing specs.
 * as: 'admin' signs in the mock admin identity (app_metadata.role = 'admin');
 * as: 'usermeta-admin' signs in an identity whose only admin claim is user_metadata.role.
 */
export async function loginThroughStubbedGoogle(page: Page, options: { as?: StubIdentity } = {}): Promise<void> {
  await stubGoogleAuthorize(page, { code: CODE_FOR_IDENTITY[options.as ?? 'user'] })
  await page.goto('/login')
  const button = page.getByRole('button', { name: LOGIN_BUTTON })
  await expect(button).toBeVisible()
  await button.click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth/'))
}
