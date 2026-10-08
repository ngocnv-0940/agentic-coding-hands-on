import { expect, test, type Page } from '@playwright/test'
import { startBrowserClockAt } from './support/event-clock'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import { comingSoon, countdownUnit, eventDate, eventLivestream, eventVenue, hero } from './support/homepage-locators'

// Spec ids: FR-001, FR-203..205, BR-001, BR-002, DEC-001, DEC-005, US003, SC-004.
// The default run pins EVENT_START_AT=2025-12-26T18:30:00+07:00 (Figma date 26/12/2025).
// 2 days 5 h 9 min 30 s before the start. Pinned mid-minute, not on the minute: login and the
// live clock take a few seconds, and at exactly 13:21:00 (5 h 09 min 00 s left) any drift floors to 08.
// At 13:20:30 the minutes read 09 for about 30 s after login, and the reading is 08 once a minute passes.
const BEFORE_EVENT = '2025-12-24T13:20:30+07:00'
// 55 s before the start (margin for login + first compile; the fake clock keeps flowing): the server snapshot reads 00 (server clock is past the event), so Coming soon
// visible here proves the client hook recomputed after hydration (BR-001 floor: 00 00 00).
const SHORTLY_BEFORE_START = '2025-12-26T18:29:05+07:00'
const AT_EVENT = '2025-12-26T18:30:00+07:00'
const AFTER_EVENT = '2025-12-27T09:00:00+07:00'

// Hydration guard: every test records console errors and page errors; any hydration mismatch fails it.
const pageProblems = new WeakMap<Page, string[]>()
// Dev builds say "Hydration failed"; production React reports minified errors #418/#423/#425.
const HYDRATION_ERROR = /hydrat|did not match|Minified React error #(418|423|425)|react\.dev\/errors\/(418|423|425)/i

test.beforeEach(({ page }) => {
  const problems: string[] = []
  pageProblems.set(page, problems)
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))
})

test.afterEach(({ page }) => {
  const hydrationErrors = (pageProblems.get(page) ?? []).filter((text) => HYDRATION_ERROR.test(text))
  expect(hydrationErrors, 'hydration mismatch reported by the homepage').toEqual([])
})

async function signedInAt(page: Page, browserTime: string) {
  await startBrowserClockAt(page, browserTime)
  await loginThroughStubbedGoogle(page)
  await expect(hero(page)).toBeVisible()
}

test.describe('Homepage countdown and event info', () => {
  // ID-12/ID-13/ID-40/ID-43/FR-203/FR-204: two-digit values with leading zeros and labels; Coming soon before the start
  test('before the start the countdown shows 02 05 09 with labels and Coming soon', async ({ page }) => {
    await signedInAt(page, BEFORE_EVENT)
    await expect(countdownUnit(page, 'days')).toHaveText('02')
    await expect(countdownUnit(page, 'hours')).toHaveText('05')
    await expect(countdownUnit(page, 'minutes')).toHaveText('09')
    await expect(hero(page).getByText(/^DAYS$/)).toBeVisible()
    await expect(hero(page).getByText(/^HOURS$/)).toBeVisible()
    await expect(hero(page).getByText(/^MINUTES$/)).toBeVisible()
    await expect(comingSoon(page)).toBeVisible()
  })

  // ID-39/FR-204: the minutes count down as the clock moves on
  test('the minutes value drops by one after a minute passes', async ({ page }) => {
    await signedInAt(page, BEFORE_EVENT)
    await expect(countdownUnit(page, 'minutes')).toHaveText('09')
    await page.clock.runFor('01:00')
    await expect(countdownUnit(page, 'minutes')).toHaveText('08')
    await expect(countdownUnit(page, 'hours')).toHaveText('05')
  })

  // FR-204/BR-001/DEC-001: the client hook (not the server snapshot) turns Coming soon off when the start passes
  test('shortly before the start the client shows 00 00 00 with Coming soon, then hides it once the start passes', async ({ page }) => {
    await signedInAt(page, SHORTLY_BEFORE_START)
    await expect(countdownUnit(page, 'days')).toHaveText('00')
    await expect(countdownUnit(page, 'hours')).toHaveText('00')
    await expect(countdownUnit(page, 'minutes')).toHaveText('00')
    await expect(comingSoon(page)).toBeVisible()
    await page.clock.runFor('00:56')
    await expect(comingSoon(page)).toBeHidden()
    await expect(countdownUnit(page, 'minutes')).toHaveText('00')
  })

  // ID-41/ID-42/FR-204/DEC-001: at the start the countdown reads 00 and Coming soon disappears
  test('at the event start the countdown reads 00 and Coming soon is hidden', async ({ page }) => {
    await signedInAt(page, AT_EVENT)
    await expect(countdownUnit(page, 'days')).toHaveText('00')
    await expect(countdownUnit(page, 'hours')).toHaveText('00')
    await expect(countdownUnit(page, 'minutes')).toHaveText('00')
    await expect(comingSoon(page)).toBeHidden()
  })

  // BR-001: the countdown never goes negative after the start
  test('after the event start the countdown stays at 00 and Coming soon stays hidden', async ({ page }) => {
    await signedInAt(page, AFTER_EVENT)
    await expect(countdownUnit(page, 'days')).toHaveText('00')
    await expect(countdownUnit(page, 'minutes')).toHaveText('00')
    await expect(comingSoon(page)).toBeHidden()
  })

  // FR-205/D005/D007/FR-001: date from EVENT_START_AT as dd/MM/yyyy, plus the Figma venue and livestream note
  test('event date, venue and livestream note show the Figma content', async ({ page }) => {
    await signedInAt(page, BEFORE_EVENT)
    await expect(eventDate(page)).toHaveText('26/12/2025')
    await expect(eventVenue(page)).toContainText('Âu Cơ Art Center')
    await expect(eventLivestream(page)).toContainText(/Tường thuật trực tiếp/)
  })

  // FR-203/FR-207: the hero carries the ROOT FURTHER title
  test('the hero shows the ROOT FURTHER title', async ({ page }) => {
    await signedInAt(page, BEFORE_EVENT)
    await expect(hero(page)).toContainText('ROOT FURTHER')
  })
})
