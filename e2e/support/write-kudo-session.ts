import { expect, type Page } from '@playwright/test'
import { openKudosBoard } from './kudos-board-session'
import { composePill } from './kudos-locators'
import { modal } from './write-kudo-locators'
import type { StubIdentity } from './login-through-stubbed-google'

/**
 * Signs in as `as` (default: the viewer), opens /sun-kudos and clicks the compose pill. The modal assertion is the
 * screen precondition: while the pill still opens Coming soon, a spec fails here, by name, on the modal.
 */
export async function openWriteKudoModal(page: Page, as?: StubIdentity): Promise<void> {
  await openKudosBoard(page, as)
  await expect(composePill(page), 'compose pill enabled').toBeEnabled()
  await composePill(page).click()
  await expect(modal(page), 'write-kudo modal open').toBeVisible()
}
