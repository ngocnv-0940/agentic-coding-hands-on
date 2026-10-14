import { expect, test } from '@playwright/test'
import { LOGIN_BUTTON, loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import { openKudosBoard } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import { EXPECT, kudoId } from './support/kudos-fixture-ids'
import { footer, header, placeholderComingSoon } from './support/homepage-locators'

// Screen: /sun-kudos (MoMorph MaZUn5xHXZ). Spec ids: TC ACCESSING 1-3, GUI 4-18 (CSV row order),
// FR-002, FR-101..106, FR-314, FR-601. Every test here fails on the screen until phase 2/6 land,
// except the guest-redirect and EN-cookie guards, which already hold and must stay green.

const COMPOSE_PLACEHOLDER = 'Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?'
const SEARCH_PLACEHOLDER = 'Tìm kiếm'
const TIME_FORMAT = /\d{2}:\d{2} - \d{2}\/\d{2}\/\d{4}/

test.describe('Sun* Kudos live board: access and layout', () => {
  // TC ACCESSING 1 / FR-106: the sender avatar or name opens the sender's profile
  test('TC ACCESSING 1 / FR-106: a sender avatar or name in a kudo card opens /profile', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.feedBlock(page), kudoId(25))
    await expect(card, 'feed card for kudo 25').toBeVisible()
    await k.kudoPerson(card, 'sender').getByRole('link').first().click()
    await expect(page).toHaveURL(/\/profile$/)
  })

  // TC ACCESSING 2 / FR-103: "Xem chi tiết" on the highlight card opens the kudo detail route
  test('TC ACCESSING 2 / FR-103: "Xem chi tiết" on a highlight card opens /sun-kudos/<id>', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.highlightBlock(page), kudoId(25))
    await expect(card, 'highlight card for kudo 25').toBeVisible()
    await k.detailLink(card).click()
    await expect(page).toHaveURL(new RegExp(`/sun-kudos/${kudoId(25)}$`))
  })

  // TC ACCESSING 3 / FR-106: a guest is sent to /login (existing guard; already green, keep it green)
  test('TC ACCESSING 3 / FR-106: a guest on /sun-kudos is redirected to /login', async ({ page }) => {
    await page.goto('/sun-kudos')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })

  // SC-001: a guest on a kudo detail route is sent to /login too (the (main) guard, not only the board root)
  test('SC-001 / FR-106: a guest on /sun-kudos/<id> is redirected to /login', async ({ page }) => {
    await page.goto(`/sun-kudos/${kudoId(25)}`)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })

  // GUI 4: banner with logo, title, and it is not clickable
  test('TC GUI 4: the banner shows the title and logo and is not interactive', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.kudosBanner(page)).toBeVisible()
    await expect(k.kudosBanner(page)).toContainText(/Hệ thống ghi nhận/)
    await expect(k.kudosBanner(page)).toContainText('SAA 2025 KUDOS')
    await expect(k.kudosBanner(page).getByRole('link')).toHaveCount(0)
  })

  // GUI 5 and GUI 17: the compose pill is visible, pill-shaped, and shows the Vietnamese placeholder
  test('TC GUI 5 and GUI 17: the compose pill is visible with the Vietnamese placeholder', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.composePill(page)).toBeVisible()
    await expect(k.composePill(page)).toContainText(COMPOSE_PLACEHOLDER)
  })

  // GUI 6 to 9: highlight header, subtitle, and both filter buttons
  test('TC GUI 6 to 9: the highlight header and both filter buttons are visible and aligned', async ({ page }) => {
    await openKudosBoard(page)
    const highlight = k.highlightBlock(page)
    await expect(highlight).toContainText('HIGHLIGHT KUDOS')
    await expect(highlight).toContainText('Sun* Annual Awards 2025')
    await expect(k.hashtagFilter(page)).toBeVisible()
    await expect(k.departmentFilter(page)).toBeVisible()
  })

  // GUI 10: five slides, the centre one active, neighbours inert, prev disabled at the start
  test('TC GUI 10: the carousel shows five cards, the centre active, prev disabled on 1', async ({ page }) => {
    await openKudosBoard(page)
    const cards = k.highlightBlock(page).getByTestId('kudo-card')
    await expect(cards).toHaveCount(5)
    await expect(k.highlightBlock(page).locator('[data-active]')).toHaveCount(1)
    await expect(k.carouselPrev(page)).toBeDisabled()
    await expect(k.carouselNext(page)).toBeEnabled()
    await expect(k.carouselPager(page)).toHaveText('1/5')
  })

  // GUI 11: a highlight card shows sender, receiver, time, hashtags and the action bar
  test('TC GUI 11: a highlight card shows sender, receiver, time, hashtags, like and copy link', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.highlightBlock(page), kudoId(25))
    await expect(k.kudoPerson(card, 'sender')).toBeVisible()
    await expect(k.kudoPerson(card, 'receiver')).toBeVisible()
    await expect(k.kudoTime(card)).toHaveText(TIME_FORMAT)
    await expect(k.kudoHashtags(card).first()).toBeVisible()
    await expect(k.likeButton(card)).toBeVisible()
    await expect(k.copyLinkButton(card)).toBeVisible()
  })

  // GUI 12 and GUI 18: spotlight search bar with the Vietnamese placeholder
  test('TC GUI 12 and GUI 18: the spotlight search bar shows its icon and placeholder', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.spotlightSearch(page)).toBeVisible()
    await expect(k.spotlightSearch(page)).toHaveAttribute('placeholder', SEARCH_PLACEHOLDER)
  })

  // GUI 13: spotlight total label, pan/zoom control, and the receiver nodes
  test('TC GUI 13: the spotlight shows the total, the pan/zoom control and receiver nodes', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.spotlightTotal(page)).toHaveText(`${EXPECT.kudoTotal} KUDOS`)
    await expect(k.spotlightPanZoomToggle(page)).toBeVisible()
    await expect(k.spotlightNodes(page)).toHaveCount(EXPECT.spotlightReceiverCount)
  })

  // GUI 14: the feed shows the first page of 10 and the sidebar sits beside it
  test('TC GUI 14: the feed holds the first page of 10 cards, with the sidebar beside it', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.feedBlock(page).getByTestId('kudo-card')).toHaveCount(EXPECT.feedPageSize)
    const feed = await k.feedBlock(page).boundingBox()
    const sidebar = await k.sidebarBlock(page).boundingBox()
    expect(feed && sidebar, 'feed and sidebar have boxes').toBeTruthy()
    expect(sidebar!.x, 'sidebar starts right of the feed').toBeGreaterThan(feed!.x + feed!.width - 1)
  })

  // GUI 15: a feed card lists its attached images and hashtags
  test('TC GUI 15: a feed card shows its image gallery and hashtags', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.feedBlock(page), kudoId(20))
    await expect(card).toBeVisible()
    await expect(k.kudoImages(card)).toHaveCount(2)
    await expect(k.kudoHashtags(card).first()).toBeVisible()
  })

  // GUI 16: sidebar statistics labels and values are visible
  test('TC GUI 16: the sidebar shows the five statistics', async ({ page }) => {
    await openKudosBoard(page)
    for (const key of ['received', 'sent', 'hearts', 'opened', 'unopened'] as const) {
      await expect(k.sidebarStat(page, key), `stat ${key}`).toBeVisible()
    }
  })

  // FR-002: EN cookie renders copy, never raw translation keys
  test('FR-002: with the EN locale cookie the board shows no raw kudos translation keys', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3100' }])
    await openKudosBoard(page)
    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(/kudos\.[a-z][A-Za-z.]*/)
  })

  // FR-314: no horizontal scroll at 375 and 768; at 375 the sidebar sits below the feed
  test('FR-314 at 375px: no horizontal scroll and the sidebar sits below the feed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await openKudosBoard(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'horizontal overflow px').toBeLessThanOrEqual(0)
    const feed = await k.feedBlock(page).boundingBox()
    const sidebar = await k.sidebarBlock(page).boundingBox()
    expect(feed && sidebar).toBeTruthy()
    expect(sidebar!.y, 'sidebar below feed').toBeGreaterThanOrEqual(feed!.y + feed!.height - 1)
  })

  test('FR-314 at 768px: no horizontal scroll on the board', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await openKudosBoard(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'horizontal overflow px').toBeLessThanOrEqual(0)
  })

  // Detail route placeholder for an unknown kudo id keeps the shared shell
  test('FR-103: /sun-kudos/abc shows the Coming soon placeholder with header and footer', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/sun-kudos/abc')
    await expect(placeholderComingSoon(page)).toBeVisible()
    await expect(header(page)).toBeVisible()
    await expect(footer(page)).toBeVisible()
  })
})
