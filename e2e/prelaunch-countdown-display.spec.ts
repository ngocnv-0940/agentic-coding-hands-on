import { expect, test, type Page } from '@playwright/test'
import { startBrowserClockAt } from './support/event-clock'
import {
  bannerLandmark,
  browserTimeAfterStart,
  browserTimeWithMinutesLeft,
  comingSoonMarker,
  contentinfoLandmark,
  countdownUnitBox,
  digitTiles,
  expectCountdown,
  expectNoHydrationErrors,
  DAY_MS,
  languageTrigger,
  MINUTE_MS,
  naturalWidthOf,
  prelaunchBackground,
  prelaunchScreen,
  prelaunchTargetMs,
  prelaunchTitle,
  recordPageProblems,
  type CountdownUnit,
  unitLabel,
} from './support/prelaunch-locators-and-clock'

// Run on the locked server only: E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch
// Launch time = SITE_LAUNCH_AT (the homepage EVENT_START_AT stays at its past default in this run).
// Spec ids: TC GUI 5-11, FUNCTION 12-17; FR-002, FR-201..206, FR-401, DEC-003, US001, SC-003..SC-005, SC-007.
// Values come from the browser clock: each case sets the browser time to (start − minutesLeft − 30 s),
// so the page reads exactly `minutesLeft` whole minutes. The server lock still uses the real clock.

const TITLE_VI = 'Sự kiện sẽ bắt đầu sau'
const TITLE_EN = 'Event starts in'
const VIEWPORT = { width: 1440, height: 900 }
const SWEEP_MINUTES = [
  1, 59, 60, 61, 119, 120, 599, 600, 1439, 1440, 1441, 2879, 2880, 5999, 6000, 10079, 14399, 14400,
  43199, 43200, 86399, 86400, 129599, 129600, 172799, 172800, 259199, 259200, 500000, 1000000,
]

const pad = (value: number) => String(value).padStart(2, '0')
/** Expected unit strings for a whole number of minutes left (days keep 3 digits from 100). */
function expectedFor(totalMinutes: number) {
  return {
    days: pad(Math.floor(totalMinutes / 1440)),
    hours: pad(Math.floor((totalMinutes % 1440) / 60)),
    minutes: pad(totalMinutes % 60),
  }
}

async function openAtMinutesLeft(page: Page, minutesLeft: number) {
  await startBrowserClockAt(page, browserTimeWithMinutesLeft(minutesLeft).toISOString())
  await page.goto('/prelaunch')
  await expect(prelaunchScreen(page)).toBeVisible()
}

test.describe('@prelaunch Prelaunch countdown display', () => {
  test.beforeEach(({ page }) => recordPageProblems(page))
  test.afterEach(({ page }) => expectNoHydrationErrors(page))

  // TC GUI 5-7 / FR-201: each unit is a block of two LED digit tiles with an uppercase label
  test('TC GUI 5-7 / FR-201: DAYS, HOURS and MINUTES each show two digit tiles and a label', async ({ page }) => {
    await openAtMinutesLeft(page, 46079)
    for (const unit of ['days', 'hours', 'minutes'] as CountdownUnit[]) {
      await expect(digitTiles(page, unit), `${unit} digit tiles`).toHaveCount(2)
    }
    for (const label of ['DAYS', 'HOURS', 'MINUTES'] as const) {
      await expect(unitLabel(page, label)).toHaveText(label)
    }
  })

  // TC GUI 8 / FR-201: labels are white (computed color), not a theme token
  test('TC GUI 8 / FR-201: the unit labels are white (rgb 255, 255, 255)', async ({ page }) => {
    await openAtMinutesLeft(page, 46079)
    for (const label of ['DAYS', 'HOURS', 'MINUTES'] as const) {
      await expect(unitLabel(page, label)).toHaveCSS('color', 'rgb(255, 255, 255)')
    }
  })

  // FR-002: the title is the VI dictionary string under the default locale
  test('FR-002 / DEC-003: the default (vi) title reads "Sự kiện sẽ bắt đầu sau"', async ({ page }) => {
    await openAtMinutesLeft(page, 46079)
    await expect(prelaunchTitle(page)).toHaveText(TITLE_VI)
  })

  // FR-002: the NEXT_LOCALE=en cookie switches the title; no raw dictionary key leaks
  test('FR-002: NEXT_LOCALE=en shows "Event starts in" and no raw prelaunch. key', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
    await openAtMinutesLeft(page, 46079)
    await expect(prelaunchTitle(page)).toHaveText(TITLE_EN)
    await expect(prelaunchScreen(page)).not.toContainText('prelaunch.')
  })

  // FR-205: no site chrome and no language switcher or coming-soon marker on this page
  test('FR-205: no banner, contentinfo, language trigger or coming-soon marker', async ({ page }) => {
    await openAtMinutesLeft(page, 46079)
    await expect(bannerLandmark(page)).toHaveCount(0)
    await expect(contentinfoLandmark(page)).toHaveCount(0)
    await expect(languageTrigger(page)).toHaveCount(0)
    await expect(comingSoonMarker(page)).toHaveCount(0)
  })

  // FR-204: the Figma background fills the 1440 x 900 viewport and the image decodes
  test('FR-204: the background covers the 1440 x 900 viewport and decodes', async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await openAtMinutesLeft(page, 46079)
    const box = await prelaunchBackground(page).boundingBox()
    expect(Math.round(box?.width ?? 0)).toBe(VIEWPORT.width)
    expect(Math.round(box?.height ?? 0)).toBe(VIEWPORT.height)
    await expect.poll(() => naturalWidthOf(prelaunchBackground(page))).toBeGreaterThan(0)
  })

  // TC FUNCTION 13 / FR-203 / FR-202: under one day the days read 00; 5h 5m reads 00 05 05
  test('TC FUNCTION 13 / FR-202: 5h 5m left reads 00 05 05', async ({ page }) => {
    await openAtMinutesLeft(page, 305)
    await expectCountdown(page, '00', '05', '05')
  })

  // TC GUI 9 / FR-202 / FR-203: two-digit days (31, 10, 9, 0) and three digits from 100
  const VALUE_CASES = [
    { title: 'TC GUI 9 / TC GUI 10 / TC GUI 11 / FR-202: 31d 23h 59m reads 31 23 59', minutes: 46079, want: ['31', '23', '59'] },
    { title: 'TC GUI 9 / FR-202: 10d 10h 10m reads 10 10 10', minutes: 15010, want: ['10', '10', '10'] },
    { title: 'TC GUI 9 / TC GUI 11 / FR-202: 9d 9h 9m reads 09 09 09', minutes: 13509, want: ['09', '09', '09'] },
    { title: 'TC GUI 10 / TC GUI 11 / FR-202: 1d 0h 0m reads 01 00 00', minutes: 1440, want: ['01', '00', '00'] },
    { title: 'TC FUNCTION 17 / FR-202: 120d reads three day digits 120 00 00', minutes: 172800, want: ['120', '00', '00'] },
  ] as const
  for (const row of VALUE_CASES) {
    test(row.title, async ({ page }) => {
      await openAtMinutesLeft(page, row.minutes)
      await expectCountdown(page, row.want[0], row.want[1], row.want[2])
    })
  }

  // TC FUNCTION 12 / FR-401: the minutes drop after a minute with no reload
  test('TC FUNCTION 12 / FR-401: the minutes drop by one after clock.runFor 01:00, no reload', async ({ page }) => {
    await openAtMinutesLeft(page, 305)
    await expect(countdownUnitBox(page, 'minutes')).toHaveText('05')
    await page.clock.runFor('01:00')
    await expect(countdownUnitBox(page, 'minutes')).toHaveText('04')
    await expect(countdownUnitBox(page, 'hours')).toHaveText('05')
  })

  // TC GUI 9-11 / TC FUNCTION 14-15 / FR-203: about 30 sampled offsets, each read exactly
  test('TC FUNCTION 14-15 / FR-203: ~30 sampled offsets read the exact days, hours (00-23) and minutes (00-59)', async ({ context }) => {
    test.setTimeout(180_000)
    for (const minutesLeft of SWEEP_MINUTES) {
      const page = await context.newPage()
      recordPageProblems(page)
      await startBrowserClockAt(page, browserTimeWithMinutesLeft(minutesLeft).toISOString())
      await page.goto('/prelaunch')
      await expect(prelaunchScreen(page), `prelaunch screen at ${minutesLeft} min`).toBeVisible()
      const want = expectedFor(minutesLeft)
      await expectCountdown(page, want.days, want.hours, want.minutes)
      expectNoHydrationErrors(page)
      await page.close()
    }
  })

  // Split (F005 follow-up): the target is SITE_LAUNCH_AT, never EVENT_START_AT. On the real clock the
  // days are those left to 2099; EVENT_START_AT (2025-12-26, past) would read 00 00 00.
  test('SITE_LAUNCH_AT drives the countdown: real clock shows the days left to 2099, not the past EVENT_START_AT', async ({ page }) => {
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    const daysLeft = Math.floor((prelaunchTargetMs() - Date.now()) / DAY_MS)
    expect(daysLeft).toBeGreaterThan(20_000)
    const shown = Number(((await countdownUnitBox(page, 'days').textContent()) ?? '').replace(/\s/g, ''))
    expect(shown).toBeGreaterThan(20_000)
    expect(Math.abs(shown - daysLeft)).toBeLessThanOrEqual(1)
  })

  // TC FUNCTION 16 / FR-206 / DEC-003: 30 s left reads 00 00 00 and the page stays on /prelaunch
  test('TC FUNCTION 16 / DEC-003: 30 s left reads 00 00 00 and the URL stays /prelaunch', async ({ page }) => {
    await openAtMinutesLeft(page, 0)
    await expectCountdown(page, '00', '00', '00')
    await expect(page).toHaveURL(/\/prelaunch$/)
  })

  // TC FUNCTION 16 / FR-206: a browser clock past the start reads 00 00 00
  test('TC FUNCTION 16 / FR-206: a browser clock an hour past the start reads 00 00 00', async ({ page }) => {
    await startBrowserClockAt(page, browserTimeAfterStart(60 * MINUTE_MS).toISOString())
    await page.goto('/prelaunch')
    await expect(prelaunchScreen(page)).toBeVisible()
    await expectCountdown(page, '00', '00', '00')
  })
})
