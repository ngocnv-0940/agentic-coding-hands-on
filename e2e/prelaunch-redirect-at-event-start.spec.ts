import { expect, test, type Page } from '@playwright/test'
import { startBrowserClockAt } from './support/event-clock'
import {
  browserTimeAfterStart,
  countdownUnitBox,
  DAY_MS,
  fastForwardInSteps,
  expectPrelaunchHydrated,
  MINUTE_MS,
  prelaunchScreen,
  prelaunchTargetMs,
  trackRootNavigations,
} from './support/prelaunch-locators-and-clock'

// Run on the locked server only: E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch
// Spec ids: FR-402, FR-403, DEC-004, ALG-002, US004, SC-006.
// The launch time is ~73 years out, far past the 2^31-1 ms setTimeout ceiling: a naive timer would fire at once and loop.

/** Quiet window for "no request" checks. Absence over a fixed window, no polling race. */
const QUIET_WINDOW_MS = 3_000
/** Slack past the server-computed deadline, so the client timer is due after the fast-forward. */
const SLACK_MS = 2_000

/** Simulates a hidden tab becoming visible again. */
async function wakeTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

test.describe('@prelaunch Redirect home at the real launch time', () => {
  // ALG-002 overflow guard: a far-future launch on a real clock must not fire the redirect at once
  test('ALG-002 / FR-403: on a real clock a 2099 launch makes no / request for 3 s and the URL stays /prelaunch', async ({ page }) => {
    const roots = trackRootNavigations(page)
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await page.waitForTimeout(QUIET_WINDOW_MS)
    expect(roots, 'document requests to / in 3 s on a real clock').toHaveLength(0)
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // FR-402 / DEC-004: at the real launch the page goes to / once; the locked proxy returns it to /prelaunch, no loop
  test('FR-402 / DEC-004: past the real launch one / request goes out, the guest is back on /prelaunch and no loop follows', async ({ page }) => {
    await page.clock.install()
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expectPrelaunchHydrated(page)
    const roots = trackRootNavigations(page)
    await fastForwardInSteps(page, prelaunchTargetMs() - Date.now() + SLACK_MS)
    await expect.poll(() => roots.length, { timeout: 10_000, message: 'one / request after the start' }).toBe(1)
    await expect(page).toHaveURL(/\/prelaunch$/)
    // The returned document streams its Suspense content through a clock-gated reveal. The clock is
    // jumped ~73 years, so it needs one fake second to tick before the reveal runs (dev only; prod
    // reveals during parse). The new document's remainingMs is still ~73 years, so no re-arm fires.
    await page.clock.runFor(1_000)
    await expect(prelaunchScreen(page)).toBeVisible()
    await page.waitForTimeout(QUIET_WINDOW_MS)
    expect(roots.length, 'second / request within 3 s (redirect loop)').toBe(1)
  })

  // FR-403 / DEC-004: a client clock already past the launch must not send the page home (server time decides)
  test('FR-403 / DEC-004: a browser clock an hour past the launch makes no / request for 3 s', async ({ page }) => {
    await startBrowserClockAt(page, browserTimeAfterStart(60 * MINUTE_MS).toISOString())
    const roots = trackRootNavigations(page)
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expect(countdownUnitBox(page, 'minutes')).toHaveText('00')
    await page.waitForTimeout(QUIET_WINDOW_MS)
    expect(roots, 'document requests to / with a fast client clock').toHaveLength(0)
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // FR-403: waking a hidden tab after the wall clock passed the start reloads once; the locked proxy keeps it on /prelaunch
  test('FR-403: a tab woken after the wall clock passed the start reloads once and stays on /prelaunch', async ({ page }) => {
    await page.clock.install()
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expectPrelaunchHydrated(page)
    const prelaunchDocs: string[] = []
    const rootDocs = trackRootNavigations(page)
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame() && new URL(request.url()).pathname === '/prelaunch') {
        prelaunchDocs.push(request.url())
      }
    })
    // Only the wall clock moves; no timer fires, so the wake path is the sole trigger.
    await page.clock.setSystemTime(browserTimeAfterStart(DAY_MS))
    await wakeTab(page)
    await expect.poll(() => prelaunchDocs.length, { timeout: 10_000, message: 'one reload of /prelaunch' }).toBe(1)
    await expect(page).toHaveURL(/\/prelaunch$/)
    await page.waitForTimeout(QUIET_WINDOW_MS)
    expect(prelaunchDocs, '/prelaunch document requests after the wake').toHaveLength(1)
    expect(rootDocs, 'document requests to / after the wake').toHaveLength(0)
  })

  // FR-403 negative: a wake before the wall clock reaches the launch must not reload
  test('FR-403: a tab woken before the wall clock reaches the launch does not reload', async ({ page }) => {
    await page.clock.install()
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expectPrelaunchHydrated(page)
    const docs: string[] = []
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) docs.push(request.url())
    })
    await wakeTab(page)
    await page.waitForTimeout(QUIET_WINDOW_MS)
    expect(docs, 'document requests after an early wake').toHaveLength(0)
    await expect(page).toHaveURL(/\/prelaunch$/)
    await expect(prelaunchScreen(page)).toBeVisible()
  })
})
