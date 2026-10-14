import { expect, test, type Locator } from '@playwright/test'
import { openKudosBoard, loadFeedUntil } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import { EXPECT, kudoId, NAME } from './support/kudos-fixture-ids'

// Screen: /sun-kudos ALL KUDOS feed and kudo cards. Spec ids: TC FUNCTION 22, 34, 40;
// FR-003, FR-004, FR-204, FR-301..309, FR-313 (copy failure). Heart toggles live in kudos-like-and-hearts.spec.ts;
// profile and detail links are owned by the access spec.
const EMPTY_MESSAGE = 'Hiện tại chưa có Kudos nào.'
const COPIED = 'Link copied — ready to share!'
const LONG_CONTENT_LINES = 5
const HIGHLIGHT_CONTENT_LINES = 3

async function lineClamp(locator: Locator): Promise<string> {
  return locator.evaluate((node) => getComputedStyle(node).getPropertyValue('-webkit-line-clamp').trim())
}

/** The clamped box must be `lines` text lines tall (±2 px) and the text must really overflow it. */
async function expectClampedTo(locator: Locator, lines: number): Promise<void> {
  const box = await locator.evaluate((node) => ({
    height: node.clientHeight,
    lineHeight: parseFloat(getComputedStyle(node).lineHeight),
    overflows: node.scrollHeight > node.clientHeight,
  }))
  expect(Math.abs(box.height - lines * box.lineHeight), `box ${box.height}px vs ${lines} x ${box.lineHeight}px`).toBeLessThanOrEqual(2)
  expect(box.overflows, 'scrollHeight > clientHeight: the text is cut').toBe(true)
}

test.describe('Sun* Kudos feed and cards', () => {
  // FR-301 / FR-302: infinite scroll 10 -> 20 -> 25, newest first, no duplicates
  test('FR-301 / FR-302: infinite scroll loads 10, then 20, then 25 cards with no duplicate ids', async ({ page }) => {
    await openKudosBoard(page)
    const feed = k.feedBlock(page)
    expect(await k.cardIds(feed)).toEqual(EXPECT.feedFirstPage)
    await loadFeedUntil(page, 20)
    await loadFeedUntil(page, EXPECT.kudoTotal)
    const ids = await k.cardIds(feed)
    expect(ids).toHaveLength(EXPECT.kudoTotal)
    expect(new Set(ids).size, 'no duplicate kudo ids').toBe(EXPECT.kudoTotal)
  })

  // FR-303: content clamps to 5 lines in the feed and 3 lines in the highlight, and the cut is real
  test('FR-303: the feed clamps content to 5 lines and the highlight to 3, and the text really overflows', async ({ page }) => {
    await openKudosBoard(page)
    await loadFeedUntil(page, 11)
    const longCard = k.cardIn(k.feedBlock(page), EXPECT.longContentKudo)
    await expect(longCard).toBeVisible()
    expect(await lineClamp(k.kudoContent(longCard))).toBe(String(LONG_CONTENT_LINES))
    await expectClampedTo(k.kudoContent(longCard), LONG_CONTENT_LINES)

    // #Inspiring highlight is 21, 7, 16, 12, 11 (ALG-001: likes desc, ties to newer): kudo 11, the long one, is the 5th, so Next x4 centres it
    await page.goto('/sun-kudos?hashtag=inspiring')
    await expect(k.kudosBoard(page)).toBeVisible()
    for (let step = 0; step < 4; step++) await k.carouselNext(page).click()
    await expect(k.carouselPager(page)).toHaveText('5/5')
    const centre = k.highlightBlock(page).locator('[data-testid="kudo-card"][data-active]')
    await expect(centre).toHaveAttribute('data-kudo-id', EXPECT.longContentKudo)
    expect(await lineClamp(k.kudoContent(centre))).toBe(String(HIGHLIGHT_CONTENT_LINES))
    await expectClampedTo(k.kudoContent(centre), HIGHLIGHT_CONTENT_LINES)
  })

  // FR-004: the time is the Asia/Ho_Chi_Minh clock of created_at, not UTC. Fixture base is 02:00Z plus n x 10 min,
  // so kudo 25 is 13:10 and kudo 20 is 12:20 on 10/10/2026 in VN time (06:10Z and 05:20Z in UTC).
  test('FR-004: a card time reads the exact VN clock of its created_at, not UTC', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.kudoTime(k.cardIn(k.feedBlock(page), kudoId(25)))).toHaveText('13:10 - 10/10/2026')
    await expect(k.kudoTime(k.cardIn(k.feedBlock(page), kudoId(20)))).toHaveText('12:20 - 10/10/2026')
    await expect(k.kudoTime(k.cardIn(k.highlightBlock(page), kudoId(25)))).toHaveText('13:10 - 10/10/2026')
  })

  // FR-304: at most five hashtags; overflow shows an ellipsis
  test('FR-304: a card with more than five hashtags shows five and an ellipsis', async ({ page }) => {
    await openKudosBoard(page)
    await loadFeedUntil(page, 12)
    const card = k.cardIn(k.feedBlock(page), EXPECT.overflowTagsKudo)
    await expect(card).toBeVisible()
    await expect(k.kudoHashtags(card)).toHaveCount(5)
    await expect(card).toContainText('…')
  })

  // FR-305: at most five images in the gallery
  test('FR-305: a card with six images shows five thumbnails', async ({ page }) => {
    await openKudosBoard(page)
    await loadFeedUntil(page, 13)
    const card = k.cardIn(k.feedBlock(page), EXPECT.overflowImagesKudo)
    await expect(card).toBeVisible()
    await expect(k.kudoImages(card)).toHaveCount(5)
  })

  // TC FUNCTION 40 / FR-305: a thumbnail opens the full-size image in a new tab
  test('TC FUNCTION 40 / FR-305: clicking an image thumbnail opens the full-size image in a new tab', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.feedBlock(page), kudoId(20))
    await expect(card).toBeVisible()
    const [popup] = await Promise.all([page.waitForEvent('popup'), k.kudoImages(card).first().click()])
    expect(popup.url()).toContain('/images/kudos/posts/kudo-20-1.jpg')
  })

  // FR-306: the like count uses a dot as thousands separator
  test('FR-306: a like count of 1000 renders as "1.000"', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.highlightBlock(page), EXPECT.thousandLikesKudo)
    await expect(card).toBeVisible()
    await expect(k.likeCount(card)).toHaveText('1.000')
  })

  // FR-307: stars from received totals (9 -> 0, 10 -> 1, 20 -> 2, 50 -> 3) with a hero badge
  test('FR-307: receiver stars follow the received total and a hero badge is shown', async ({ page }) => {
    await openKudosBoard(page)
    await loadFeedUntil(page, 17)
    const toLinh = k.kudoPerson(k.cardIn(k.feedBlock(page), kudoId(25)), 'receiver')
    await expect(k.personStars(toLinh)).toHaveCount(EXPECT.stars.linh)
    await expect(toLinh).toContainText(/Hero/)
    const toQuy = k.kudoPerson(k.cardIn(k.feedBlock(page), kudoId(17)), 'receiver')
    await expect(toQuy).toContainText(NAME.quy)
    await expect(k.personStars(toQuy)).toHaveCount(EXPECT.stars.quy)
    const toNhat = k.kudoPerson(k.cardIn(k.feedBlock(page), kudoId(22)), 'receiver')
    await expect(k.personStars(toNhat)).toHaveCount(EXPECT.stars.nhat)
  })

  // FR-309: the content opens the kudo detail route
  test('FR-309: the content of a feed card opens /sun-kudos/<id>', async ({ page }) => {
    await openKudosBoard(page)
    const card = k.cardIn(k.feedBlock(page), kudoId(25))
    await expect(card).toBeVisible()
    await k.kudoContent(card).click()
    await expect(page).toHaveURL(new RegExp(`/sun-kudos/${kudoId(25)}$`))
  })

  // TC FUNCTION 34 / FR-311: copy link writes the absolute URL, shows the toast, and the toast hides by itself
  test('TC FUNCTION 34: copy link writes the absolute kudo URL and the toast hides after about 3 seconds', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openKudosBoard(page)
    const card = k.cardIn(k.highlightBlock(page), kudoId(25))
    await k.copyLinkButton(card).click()
    await expect(k.toast(page)).toHaveText(COPIED)
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe(`${new URL(page.url()).origin}/sun-kudos/${kudoId(25)}`)
    await expect(k.toast(page)).toBeHidden({ timeout: 6000 })
  })

  // FR-313: a blocked clipboard shows an error toast instead of the success text
  test('FR-313: when the browser blocks the clipboard, an error toast replaces the success text', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('blocked'))
    })
    await openKudosBoard(page)
    await k.copyLinkButton(k.cardIn(k.highlightBlock(page), kudoId(25))).click()
    await expect(k.toast(page)).toBeVisible()
    await expect(k.toast(page)).not.toHaveText(COPIED)
  })

  // TC FUNCTION 22: a viewer with no kudos at all sees the empty message in both blocks
  test('TC FUNCTION 22: with no kudos at all, the feed and the highlight show the empty message', async ({ page }) => {
    await openKudosBoard(page, 'kudos-empty')
    await expect(k.emptyFeed(page)).toContainText(EMPTY_MESSAGE)
    await expect(k.highlightBlock(page)).toContainText(EMPTY_MESSAGE)
  })
})
