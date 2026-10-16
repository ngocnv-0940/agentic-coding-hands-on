import { expect, test } from '@playwright/test'
import { openKudosBoard } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import * as write from './support/write-kudo-locators'
import { EXPECT, NAME } from './support/kudos-fixture-ids'

// Screen: /sun-kudos sidebar statistics, gift list and the Coming soon modal.
// Spec ids: TC FUNCTION 19, 23, 27, 41; TC GUI 16; FR-103 (entry points), FR-310..313, DEC-006.
// The viewer (e2e-user) stats are read-only fixtures; the like spec never touches them.
const EMPTY_GIFTS = 'Chưa có dữ liệu'
const STAT_KEYS = ['received', 'sent', 'hearts', 'opened', 'unopened'] as const

test.describe('Sun* Kudos sidebar and Coming soon modal', () => {
  // FR-310: the viewer's five statistics match the fixture
  test('FR-310: the viewer sees received 3, sent 2, hearts 3, opened 2, unopened 1', async ({ page }) => {
    await openKudosBoard(page)
    const { received, sent, hearts, boxesOpened, boxesUnopened } = EXPECT.viewerStats
    await expect(k.sidebarStat(page, 'received')).toHaveText(String(received))
    await expect(k.sidebarStat(page, 'sent')).toHaveText(String(sent))
    await expect(k.sidebarStat(page, 'hearts')).toHaveText(String(hearts))
    await expect(k.sidebarStat(page, 'opened')).toHaveText(String(boxesOpened))
    await expect(k.sidebarStat(page, 'unopened')).toHaveText(String(boxesUnopened))
  })

  // FR-312: the latest gifts list holds the 10 Sunners who most recently opened a box, one row each, newest first
  test('FR-312: the gift list shows each recent gift receiver once, newest first', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.giftRows(page)).toHaveCount(EXPECT.giftsShown)
    await expect(k.giftRows(page).first()).toContainText(NAME.linh)
    await expect(k.giftRows(page).first()).toContainText(EXPECT.firstGiftPrize)
    const names = await k.giftRows(page).locator('a[aria-label]').evaluateAll((links) => links.map((a) => a.getAttribute('aria-label')))
    expect(new Set(names).size).toBe(names.length)
  })

  // TC FUNCTION 41 / FR-312: a gift row's avatar or name opens the profile
  test('TC FUNCTION 41 / FR-312: a gift row avatar or name opens /profile', async ({ page }) => {
    await openKudosBoard(page)
    await k.giftRows(page).first().getByRole('link').first().click()
    await expect(page).toHaveURL(/\/profile$/)
  })

  // TC FUNCTION 23: an empty gift list says so; a viewer with no sunner row has zero stats
  test('TC FUNCTION 23: with no data the gift list reads "Chưa có dữ liệu" and all stats are 0', async ({ page }) => {
    await openKudosBoard(page, 'kudos-empty')
    await expect(k.giftsEmpty(page)).toContainText(EMPTY_GIFTS)
    for (const key of STAT_KEYS) await expect(k.sidebarStat(page, key), `stat ${key}`).toHaveText('0')
    await expect(k.openBoxButton(page)).toBeDisabled()
  })

  // TC FUNCTION 27 / FR-313: without a sunner row the Mở Secret Box button stays disabled
  test('TC FUNCTION 27 / FR-313: an identity without a sunner row sees zero stats and a disabled box button', async ({ page }) => {
    await openKudosBoard(page, 'kudos-outsider')
    for (const key of STAT_KEYS) await expect(k.sidebarStat(page, key), `stat ${key}`).toHaveText('0')
    await expect(k.openBoxButton(page)).toBeDisabled()
  })

  // TC FUNCTION 19 / FR-101 / FR-104 (write-kudo): the compose pill opens the Viết Kudo modal; Hủy returns focus to the pill
  test('TC FUNCTION 19 / FR-101: the compose pill opens the Viết Kudo modal, and Hủy returns focus to the pill', async ({ page }) => {
    await openKudosBoard(page)
    await k.composePill(page).click()
    await expect(write.modal(page)).toBeVisible()
    await write.cancelButton(page).click()
    await expect(write.modal(page)).toBeHidden()
    await expect(k.composePill(page)).toBeFocused()
  })

  // FR-103 / DEC-006: the Mở Secret Box button opens the modal; Escape closes it
  test('FR-103 / DEC-006: Mở Secret Box opens the modal and Escape closes it', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.openBoxButton(page)).toBeEnabled()
    await k.openBoxButton(page).click()
    await expect(k.comingSoonModal(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(k.comingSoonModal(page)).toBeHidden()
  })

  // FR-103: the profile search pill opens the same modal; a click on the backdrop closes it
  test('FR-103: the profile search pill opens the modal and a backdrop click closes it', async ({ page }) => {
    await openKudosBoard(page)
    await k.profileSearchPill(page).click()
    await expect(k.comingSoonModal(page)).toBeVisible()
    await page.mouse.click(4, 4)
    await expect(k.comingSoonModal(page)).toBeHidden()
  })
})
