import { expect, test, type Locator, type Page } from '@playwright/test'
import { openKudosBoard } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import { EXPECT, kudoId } from './support/kudos-fixture-ids'

// Screen: /sun-kudos Highlight block and URL filters. Spec ids: TC FUNCTION 29-32, FR-201..208,
// DEC-002, DEC-004, ALG-001 (order), BR-011 (unknown filter values). Filters live in ?hashtag= and ?department=.
const EMPTY_MESSAGE = 'Hiện tại chưa có Kudos nào.'

async function chooseOption(page: Page, trigger: Locator, name: string | RegExp) {
  await trigger.click()
  await page.getByRole('option', { name }).click()
}

test.describe('Sun* Kudos highlight and filters', () => {
  // FR-204 / ALG-001: like count desc, ties to the newer kudo (kudo 21 beats kudo 10 at 7 likes)
  test('FR-204 / ALG-001: the highlight shows the top five kudos by likes, ties to the newer', async ({ page }) => {
    await openKudosBoard(page)
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightAll)
  })

  // TC FUNCTION 32 / FR-201: next and prev move one card; each end disables its arrow
  test('TC FUNCTION 32 / FR-201: the carousel arrows move one card and disable at both ends', async ({ page }) => {
    await openKudosBoard(page)
    await expect(k.carouselPrev(page)).toBeDisabled()
    for (let step = 2; step <= 5; step++) {
      await k.carouselNext(page).click()
      await expect(k.carouselPager(page)).toHaveText(`${step}/5`)
    }
    await expect(k.carouselNext(page)).toBeDisabled()
    await k.carouselPrev(page).click()
    await expect(k.carouselPager(page)).toHaveText('4/5')
  })

  // FR-201 / DEC-002: at desktop width the non-centre slides are faded (opacity < 1), the centre one is opaque
  test('FR-201 / DEC-002: at 1440px the neighbour slides are faded and the centre slide is fully opaque', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openKudosBoard(page)
    const slides = k.carousel(page).locator(':scope > ul > li')
    await expect(slides).toHaveCount(5)
    const opacityOf = (slide: Locator) => slide.evaluate((node) => parseFloat(getComputedStyle(node).opacity))
    const centre = slides.filter({ has: page.locator('[data-active]') })
    await expect(centre).toHaveCount(1)
    await expect.poll(() => opacityOf(centre)).toBe(1)
    for (let index = 1; index < 5; index++) {
      await expect.poll(() => opacityOf(slides.nth(index)), { message: `slide ${index + 1} is faded` }).toBeLessThan(1)
    }
  })

  // TC FUNCTION 29 / FR-205: the hashtag dropdown lists the seeded hashtags plus a clear option
  test('TC FUNCTION 29 / FR-205: the hashtag dropdown lists seeded hashtags with a clear option', async ({ page }) => {
    await openKudosBoard(page)
    await k.hashtagFilter(page).click()
    await expect(page.getByRole('option', { name: '#Dedicated' })).toBeVisible()
    await expect(page.getByRole('option', { name: '#Teamwork' })).toBeVisible()
    await expect(page.getByRole('option', { name: /Bỏ lọc|Tất cả/ })).toBeVisible()
  })

  // TC FUNCTION 30 / FR-205: the department dropdown filters by the receiver's department
  test('TC FUNCTION 30 / FR-205: choosing a department filters the board and sets ?department=', async ({ page }) => {
    await openKudosBoard(page)
    await chooseOption(page, k.departmentFilter(page), 'Marketing')
    await expect(page).toHaveURL(/[?&]department=MKT/)
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightMarketing)
  })

  // FR-202: choosing a hashtag reruns the highlight, sets ?hashtag= and resets the carousel to 1/N
  test('FR-202: choosing a hashtag reruns the highlight and resets the carousel to 1/N', async ({ page }) => {
    await openKudosBoard(page)
    await k.carouselNext(page).click()
    await k.carouselNext(page).click()
    await expect(k.carouselPager(page)).toHaveText('3/5')
    await chooseOption(page, k.hashtagFilter(page), '#Teamwork')
    await expect(page).toHaveURL(/[?&]hashtag=teamwork/)
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightTeamwork)
    await expect(k.carouselPager(page)).toHaveText('1/5')
  })

  // FR-202: both filters combine with AND and survive a reload
  test('FR-202: combined filters apply together and survive a reload', async ({ page }) => {
    await openKudosBoard(page, undefined, '/sun-kudos?hashtag=dedicated&department=MKT')
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightDedicatedMarketing)
    await page.reload()
    await expect(k.kudosBoard(page)).toBeVisible()
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightDedicatedMarketing)
  })

  // TC FUNCTION 31 / FR-206: a hashtag on a card sets the hashtag and keeps the department
  test('TC FUNCTION 31 / FR-206: clicking a card hashtag keeps the department filter', async ({ page }) => {
    await openKudosBoard(page, undefined, '/sun-kudos?department=MKT')
    const card = k.cardIn(k.highlightBlock(page), kudoId(25))
    await expect(card).toBeVisible()
    await k.kudoHashtags(card).filter({ hasText: '#Dedicated' }).click()
    await expect(page).toHaveURL(/[?&]hashtag=dedicated/)
    await expect(page).toHaveURL(/[?&]department=MKT/)
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightDedicatedMarketing)
  })

  // FR-207 / BR-011: an unknown hashtag or department in the URL is ignored, as if unfiltered
  test('FR-207: unknown hashtag and department values in the URL are ignored', async ({ page }) => {
    await openKudosBoard(page, undefined, '/sun-kudos?hashtag=nope&department=zzz')
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightAll)
    await expect(k.highlightBlock(page)).not.toContainText(EMPTY_MESSAGE)
  })

  // FR-208: a combination with no kudos shows the empty message in both highlight and feed
  test('FR-208: an empty filter combination shows the empty message in both blocks', async ({ page }) => {
    await openKudosBoard(page, undefined, '/sun-kudos?hashtag=quality-first&department=HR')
    await expect(k.highlightBlock(page)).toContainText(EMPTY_MESSAGE)
    await expect(k.feedBlock(page)).toContainText(EMPTY_MESSAGE)
    await expect(k.carouselPager(page)).toHaveCount(0)
  })

  // FR-205: the selected department shows on its filter button, so the user sees what is applied
  test('FR-205: the selected department label shows on its filter button', async ({ page }) => {
    await openKudosBoard(page, undefined, '/sun-kudos?department=MKT')
    await expect(k.departmentFilter(page)).toContainText('Marketing')
  })
})
