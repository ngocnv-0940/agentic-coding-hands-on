import { expect, type Locator, type Page, type Request } from '@playwright/test'

// Shared by the @prelaunch specs and the untagged after-start spec. Owned by phase 1 (tester).
// Selector contract: plan phase-01 "Architecture" table.

export const MINUTE_MS = 60_000
export const DAY_MS = 86_400_000
/** Mid-minute pin (30 s past the boundary), as in homepage-countdown-and-event-info.spec.ts. */
const MID_MINUTE_MS = 30_000
/** Under the 2^31-1 ms setTimeout ceiling (~24.8 days); each step stays below it (ALG-002). */
const FAST_FORWARD_STEP_MS = 20 * DAY_MS

/**
 * The locked server's start instant, from the run command
 * (`E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch`).
 * Throws with the run command when a @prelaunch spec runs without it: a missing value
 * would otherwise read as "already started" and fail for the wrong reason.
 */
export function prelaunchTargetMs(): number {
  const raw = process.env.E2E_EVENT_START_AT
  if (!raw) {
    throw new Error(
      'Run @prelaunch specs with E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch',
    )
  }
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) throw new Error(`E2E_EVENT_START_AT is not a date: ${raw}`)
  return ms
}

/** Browser time that shows `minutesLeft` whole minutes (plus the 30 s pin). 0 → the display reads 00 00 00. */
export function browserTimeWithMinutesLeft(minutesLeft: number): Date {
  return new Date(prelaunchTargetMs() - minutesLeft * MINUTE_MS - MID_MINUTE_MS)
}

/** Browser time `ms` after the start (a client clock ahead of the real start). */
export function browserTimeAfterStart(ms: number): Date {
  return new Date(prelaunchTargetMs() + ms)
}

export const prelaunchScreen = (page: Page) => page.getByTestId('prelaunch-screen')
export const prelaunchBackground = (page: Page) => page.getByTestId('prelaunch-background')
export const prelaunchTitle = (page: Page) => prelaunchScreen(page).getByRole('heading', { level: 1 })

export type CountdownUnit = 'days' | 'hours' | 'minutes'
export const countdownUnitBox = (page: Page, unit: CountdownUnit) => page.getByTestId(`countdown-${unit}`)
/** The two LED digit tiles of one unit: direct child spans. */
export const digitTiles = (page: Page, unit: CountdownUnit) => countdownUnitBox(page, unit).locator(':scope > span')
export const unitLabel = (page: Page, label: 'DAYS' | 'HOURS' | 'MINUTES') =>
  prelaunchScreen(page).getByText(new RegExp(`^${label}$`))

export const bannerLandmark = (page: Page) => page.getByRole('banner')
export const contentinfoLandmark = (page: Page) => page.getByRole('contentinfo')
export const languageTrigger = (page: Page) => page.getByTestId('language-selector-trigger')
export const comingSoonMarker = (page: Page) => page.getByTestId('countdown-coming-soon')

/** Decoded width of an <img>; 0 until the bytes arrive. */
export const naturalWidthOf = (image: Locator) => image.evaluate((el) => (el as HTMLImageElement).naturalWidth)

/** Asserts the three units read the given two-digit (days: up to three) strings. */
export async function expectCountdown(page: Page, days: string, hours: string, minutes: string) {
  await expect(countdownUnitBox(page, 'days')).toHaveText(days)
  await expect(countdownUnitBox(page, 'hours')).toHaveText(hours)
  await expect(countdownUnitBox(page, 'minutes')).toHaveText(minutes)
}

/**
 * Document navigations to `/` in the main frame. At the real start the page sends the browser
 * to `/` (then the proxy bounces a locked guest back). Attach before goto so no request is missed.
 */
export function trackRootNavigations(page: Page): Request[] {
  const hits: Request[] = []
  page.on('request', (request) => {
    if (!request.isNavigationRequest() || request.frame() !== page.mainFrame()) return
    if (new URL(request.url()).pathname === '/') hits.push(request)
  })
  return hits
}

/**
 * Advances the fake browser clock past a far deadline. Playwright fires timers that are due
 * inside each fastForward call, so steps of ≤ 20 days let every re-armed chunk fire in turn.
 */
export async function fastForwardInSteps(page: Page, totalMs: number): Promise<void> {
  for (let left = totalMs; left > 0; left -= FAST_FORWARD_STEP_MS) {
    await page.clock.fastForward(Math.min(FAST_FORWARD_STEP_MS, left))
  }
}

// Hydration guard: any hydration mismatch reported on /prelaunch fails the test.
const pageProblems = new WeakMap<Page, string[]>()
const HYDRATION_ERROR = /hydrat|did not match|Minified React error #(418|423|425)|react\.dev\/errors\/(418|423|425)/i

/** Call in beforeEach (or right after a new page opens) to start recording console and page errors. */
export function recordPageProblems(page: Page): void {
  const problems: string[] = []
  pageProblems.set(page, problems)
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))
}

/** Call in afterEach (or before closing a page) to fail on a reported hydration mismatch. */
export function expectNoHydrationErrors(page: Page): void {
  const hydrationErrors = (pageProblems.get(page) ?? []).filter((text) => HYDRATION_ERROR.test(text))
  expect(hydrationErrors, 'hydration mismatch reported on /prelaunch').toEqual([])
}

/**
 * Waits until React has hydrated the prelaunch screen. The server HTML is visible before hydration,
 * so `toBeVisible()` alone does not mean the client redirect timer is armed. A fast-forward that runs
 * first jumps past the due time before the timer exists, and the redirect never fires.
 * React attaches a `__reactFiber$` key to every hydrated node; one macrotask later the passive effects
 * (the timer) have run.
 */
export async function expectPrelaunchHydrated(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const el = document.querySelector('[data-testid="prelaunch-screen"]')
          return !!el && Object.keys(el).some((key) => key.startsWith('__reactFiber'))
        }),
      { message: 'prelaunch screen hydrated', timeout: 60_000 },
    )
    .toBe(true)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const channel = new MessageChannel()
        channel.port1.onmessage = () => resolve()
        channel.port2.postMessage(null)
      }),
  )
}
