import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  awardsGrid,
  comingSoon,
  countdownUnit,
  eventDate,
  footer,
  header,
  hero,
  kudosPromo,
} from './support/homepage-locators'

// Runs only on its own server (a custom EVENT_START_AT), one command per invalid value:
//   E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid
//   E2E_EVENT_START_AT=2025-12-26T18:30:00 bun run test:e2e --grep @event-env-invalid   (offset-less: strict ISO-8601 needs ±HH:MM or Z)
//   E2E_EVENT_START_AT=2025-02-30T10:00:00Z bun run test:e2e --grep @event-env-invalid (impossible day-of-month: must be rejected)
// Each value must give countdown 00, Coming soon hidden and the date "—" (BR-002, DEC-005).
// Spec ids: BR-002, DEC-005, FR-204, FR-205; TC ID-60 (invalid datetime shows a fallback, no crash).

test.describe('@event-env-invalid Homepage with an invalid EVENT_START_AT', () => {
  test('countdown reads 00, Coming soon is hidden and the event date shows a dash', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await expect(countdownUnit(page, 'days')).toHaveText('00')
    await expect(countdownUnit(page, 'hours')).toHaveText('00')
    await expect(countdownUnit(page, 'minutes')).toHaveText('00')
    await expect(comingSoon(page)).toBeHidden()
    await expect(eventDate(page)).toHaveText('—')
  })

  test('the rest of the homepage still renders around the bad configuration', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await expect(header(page)).toBeVisible()
    await expect(awardsGrid(page)).toBeVisible()
    await expect(kudosPromo(page)).toBeVisible()
    await expect(footer(page)).toBeVisible()
  })
})
