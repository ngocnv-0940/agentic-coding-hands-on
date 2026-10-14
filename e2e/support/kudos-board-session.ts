import { expect, type Page } from '@playwright/test'
import { loginThroughStubbedGoogle, type StubIdentity } from './login-through-stubbed-google'
import { cardIds, feedBlock, feedSentinel, kudosBoard } from './kudos-locators'

/**
 * Signs in as `as` (default: the viewer identity), opens `path` and waits for the board root.
 * The visible-screen precondition makes a missing screen fail here, by name, not in a later click.
 */
export async function openKudosBoard(page: Page, as?: StubIdentity, path = '/sun-kudos'): Promise<void> {
  await loginThroughStubbedGoogle(page, as ? { as } : {})
  await page.goto(path)
  await expect(kudosBoard(page), `board root on ${path}`).toBeVisible()
}

/** Scrolls the feed sentinel into view until the feed holds at least `count` cards (infinite scroll). */
export async function loadFeedUntil(page: Page, count: number): Promise<void> {
  await expect
    .poll(async () => {
      await feedSentinel(page).scrollIntoViewIfNeeded()
      return (await cardIds(feedBlock(page))).length
    }, { message: `feed reaches ${count} cards` })
    .toBeGreaterThanOrEqual(count)
}
