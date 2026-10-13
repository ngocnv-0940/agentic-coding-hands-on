import { expect, test, type Page } from '@playwright/test'
import { AWARD_SLUGS, awardCard, awardsGrid, footer, hero, kudosPromo, widgetButton } from './support/homepage-locators'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'

// Spec ids: FR-002, FR-206..212, BR-006, US004, US005, SC-009; TC ID-7, 15..17, 44..53, 55, 59, 62.
const DESKTOP = { width: 1280, height: 720 }
const TABLET = { width: 768, height: 1024 }
const PHONE = { width: 375, height: 812 }
const KUDOS_DETAIL = /Chi tiết|Details/

/** Distinct left edges of the award cards = number of grid columns on screen. */
async function awardColumns(page: Page): Promise<number> {
  const boxes = await Promise.all(AWARD_SLUGS.map((slug) => awardCard(page, slug).boundingBox()))
  return new Set(boxes.map((box) => Math.round(box?.x ?? -1))).size
}

test.describe('Homepage content and links', () => {
  test.beforeEach(async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
  })

  // FR-206/US005/ID-44/ID-45: the two hero CTAs open the awards and kudos placeholders
  test('ABOUT AWARDS and ABOUT KUDOS open their pages', async ({ page }) => {
    await hero(page).getByRole('link', { name: /ABOUT AWARDS/ }).click()
    await expect(page).toHaveURL(/\/awards-information$/)
    await page.goto('/')
    await hero(page).getByRole('link', { name: /ABOUT KUDOS/ }).click()
    await expect(page).toHaveURL(/\/sun-kudos$/)
  })

  // FR-209/BR-006: six cards, each one link to its own slug anchor
  test('the six award cards link to /awards-information with their slug', async ({ page }) => {
    await expect(awardsGrid(page)).toBeVisible()
    await expect(page.getByTestId('award-card-description')).toHaveCount(6)
    for (const slug of AWARD_SLUGS) {
      await expect(awardCard(page, slug), slug).toHaveAttribute('href', `/awards-information#${slug}`)
    }
  })

  // FR-209/ID-47..49: image, title and "Chi tiết" of one card all open the same anchor
  test('image, title and Chi tiết of a card each open its award section', async ({ page }) => {
    const card = awardCard(page, 'top-talent')
    const targets = [card.locator('img').first(), card.getByText(/Top Talent/i).first(), card.getByText(KUDOS_DETAIL).first()]
    for (const target of targets) {
      await page.goto('/')
      await expect(card).toBeVisible()
      await target.click()
      await expect(page).toHaveURL(/\/awards-information#top-talent$/)
    }
  })

  // FR-208/ID-51: a card lifts on hover
  test('hovering an award card changes its transform or shadow', async ({ page }) => {
    const card = awardCard(page, 'top-talent')
    await expect(card).toBeVisible()
    const lookOf = () => card.evaluate((el) => `${getComputedStyle(el).transform}|${getComputedStyle(el).boxShadow}`)
    const before = await lookOf()
    await card.hover()
    await expect.poll(lookOf).not.toBe(before)
  })

  // FR-208/ID-15/ID-16: 3 columns on desktop, 2 on tablet and phone
  test('award grid is 3 columns on desktop and 2 on tablet and phone', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.reload()
    await expect(awardCard(page, 'top-talent')).toBeVisible()
    await expect.poll(() => awardColumns(page)).toBe(3)

    await page.setViewportSize(TABLET)
    await expect.poll(() => awardColumns(page)).toBe(2)

    await page.setViewportSize(PHONE)
    await expect.poll(() => awardColumns(page)).toBe(2)
  })

  // FR-208: descriptions clamp to two lines
  test('every award description is clamped to at most two lines', async ({ page }) => {
    const descriptions = page.getByTestId('award-card-description')
    await expect(descriptions).toHaveCount(6)
    const clamped = await descriptions.evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el)
        const lineHeight = parseFloat(style.lineHeight)
        return style.webkitLineClamp === '2' || el.getBoundingClientRect().height <= lineHeight * 2 + 1
      }),
    )
    expect(clamped).toEqual(Array(6).fill(true))
  })

  // FR-210/ID-53: the Sun* Kudos promo block opens the kudos placeholder
  test('the Sun* Kudos Chi tiết button opens /sun-kudos', async ({ page }) => {
    await expect(kudosPromo(page)).toBeVisible()
    await kudosPromo(page).getByRole('link', { name: KUDOS_DETAIL }).click()
    await expect(page).toHaveURL(/\/sun-kudos$/)
  })

  // FR-211/ID-54 (drawing only): the widget stays fixed in the bottom-right corner after scrolling
  test('the widget button stays fixed in the bottom-right corner after scrolling', async ({ page }) => {
    await expect(widgetButton(page)).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(widgetButton(page)).toBeInViewport()
    expect(await widgetButton(page).evaluate((el) => getComputedStyle(el).position)).toBe('fixed')
    const box = await widgetButton(page).boundingBox()
    expect(box!.x + box!.width).toBeGreaterThan(DESKTOP.width - 120)
    expect(box!.y + box!.height).toBeGreaterThan(DESKTOP.height - 120)
  })

  // FR-212/ID-17: footer shows the four links and the copyright line
  test('footer shows the four navigation links and the copyright line', async ({ page }) => {
    const links = footer(page)
    await links.scrollIntoViewIfNeeded()
    for (const name of ['About SAA 2025', 'Awards Information', 'Sun* Kudos', 'Tiêu chuẩn chung']) {
      await expect(links.getByRole('link', { name }), name).toBeVisible()
    }
    await expect(links).toContainText(/Bản quyền thuộc v\S* Sun\* © 2025/)
  })

  // ID-55/FR-212: footer links navigate (Tiêu chuẩn chung is a placeholder, not a dead link)
  test('footer Tiêu chuẩn chung opens the standards placeholder', async ({ page }) => {
    await footer(page).getByRole('link', { name: 'Tiêu chuẩn chung' }).click()
    await expect(page).toHaveURL(/\/standards$/)
    await expect(page.getByTestId('coming-soon')).toBeVisible()
  })

  // ID-59: every internal link on the homepage answers below 400 for a signed-in visitor
  test('every internal link on the homepage answers below 400', async ({ page, context }) => {
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
    const paths = [...new Set(hrefs.filter((h) => h.startsWith('/') && !h.startsWith('//')).map((h) => h.split('#')[0] || '/'))]
    expect(paths).toEqual(expect.arrayContaining(['/awards-information', '/sun-kudos', '/standards']))
    for (const path of paths) {
      const response = await context.request.get(path)
      expect(response.status(), `GET ${path}`).toBeLessThan(400)
    }
  })

  // ID-7/ID-16: no horizontal scroll on a phone-width screen
  test('the homepage has no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.reload()
    await expect(hero(page)).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(0)
  })
})
