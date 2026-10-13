import type { Page } from '@playwright/test'

/**
 * Puts the browser clock at `iso` for the countdown. Must run before page.goto so the
 * client countdown starts from this instant; the clock keeps flowing, and tests advance it
 * explicitly with page.clock.runFor when they need a minute to pass.
 */
export async function startBrowserClockAt(page: Page, iso: string): Promise<void> {
  await page.clock.install({ time: new Date(iso) })
}
