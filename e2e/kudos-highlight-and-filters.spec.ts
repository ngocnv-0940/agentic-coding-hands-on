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
    await expect(k.carouselPager(page)).toHaveText('2/5')
    await k.carouselPrev(page).click()
    await expect(k.carouselPager(page)).toHaveText('1/5')
    await expect(k.carouselPrev(page)).toBeDisabled()
    for (let step = 2; step <= 5; step++) {
      await k.carouselNext(page).click()
      await expect(k.carouselPager(page)).toHaveText(`${step}/5`)
    }
    await expect(k.carouselNext(page)).toBeDisabled()
    await k.carouselPrev(page).click()
    await expect(k.carouselPager(page)).toHaveText('4/5')
  })

  // FR-201 / DEC-002: at the Figma width the neighbours keep the cream card (opacity 1) and are faded only by the dark
  // edge gradients (mm:2940:13469 / 13467); they stay inert. Between 1024 and 1279px the gradients would cover the
  // centred active card, so the neighbours are dimmed instead.
  test('FR-201 / DEC-002: at 1440px the neighbours sit under the edge fades, inert; at 1100px they are dimmed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openKudosBoard(page)
    const slides = k.carousel(page).locator(':scope > ul > li')
    await expect(slides).toHaveCount(5)
    const opacityOf = (slide: Locator) => slide.evaluate((node) => parseFloat(getComputedStyle(node).opacity))
    // Opens on the second card (Figma pager "2/5"), so a card shows on each side of the centre
    await expect(slides.nth(1).locator('[data-active]')).toHaveCount(1)
    for (const index of [0, 1, 2]) await expect.poll(() => opacityOf(slides.nth(index))).toBe(1)
    for (const index of [0, 2, 3, 4]) await expect(slides.nth(index)).toHaveAttribute('inert', '')
    await expect(page.getByTestId('kudos-carousel-side-prev').locator('..')).toBeVisible()
    await expect(page.getByTestId('kudos-carousel-side-next').locator('..')).toBeVisible()
    await k.carousel(page).scrollIntoViewIfNeeded()
    for (const index of [0, 2]) {
      await expect(slides.nth(index), `slide ${index + 1} sits beside the centre`).toBeInViewport()
    }

    await page.setViewportSize({ width: 1100, height: 900 })
    await expect(page.getByTestId('kudos-carousel-side-prev').locator('..')).toBeHidden()
    await expect.poll(() => opacityOf(slides.nth(1))).toBe(1)
    for (const index of [0, 2]) {
      await expect.poll(() => opacityOf(slides.nth(index)), { message: `slide ${index + 1} is dimmed` }).toBeLessThan(1)
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

  // FR-202: choosing a hashtag reruns the highlight, sets ?hashtag= and resets the carousel to its opening card
  test('FR-202: choosing a hashtag reruns the highlight and resets the carousel to its opening card', async ({ page }) => {
    await openKudosBoard(page)
    await k.carouselNext(page).click()
    await k.carouselNext(page).click()
    await expect(k.carouselPager(page)).toHaveText('4/5')
    await chooseOption(page, k.hashtagFilter(page), '#Teamwork')
    await expect(page).toHaveURL(/[?&]hashtag=teamwork/)
    expect(await k.cardIds(k.highlightBlock(page))).toEqual(EXPECT.highlightTeamwork)
    await expect(k.carouselPager(page)).toHaveText('2/5')
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
    // Kudo 25 ranks first, so it sits on the faded left slide until the carousel steps back to 1/N
    await k.carouselPrev(page).click()
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
