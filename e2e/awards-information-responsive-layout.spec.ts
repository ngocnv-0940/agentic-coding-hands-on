import { expect, test, type Page } from '@playwright/test'
import { header } from './support/homepage-locators'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  AWARD_MENU_SLUGS,
  AWARDS_PATH,
  awardDetailDescription,
  awardDetailImage,
  awardSection,
  awardsActiveItems,
  awardsMenu,
  awardsMenuItem,
  awardsPage,
  type AwardMenuSlug,
} from './support/awards-information-locators'

// Spec ids: FR-406, FR-407, DEC-002, D009, SC-006. Decisions: clarifications.md (menu below 1024px = one row of
// horizontal tabs; cards below 768px stack image over text, from 768px image and text sit side by side).
// Not asserted here (recorded in the plan, no Figma frame): exact hover colour, underline thickness, tablet visuals.

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 768, height: 1024 }
const PHONE = { width: 375, height: 812 }

async function openAwardsAt(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport)
  await loginThroughStubbedGoogle(page)
  await page.goto(AWARDS_PATH)
  await expect(awardsPage(page)).toBeVisible()
}

async function activeSlugs(page: Page): Promise<string[]> {
  return awardsActiveItems(page).evaluateAll((els) => els.map((el) => (el.getAttribute('href') ?? '').replace('#', '')))
}

async function hasNoPageHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

test.describe('Awards Information responsive layout', () => {
  // FR-406/DEC-002: at 1440px the menu sits left of the cards, is position: sticky and stays under the header
  test('FR-406: at 1440px the menu is left of the cards and stays sticky under the header', async ({ page }) => {
    await openAwardsAt(page, DESKTOP)
    const menu = await awardsMenu(page).boundingBox()
    const firstCard = await awardSection(page, AWARD_MENU_SLUGS[0]).boundingBox()
    expect(menu && firstCard, 'menu and first card have boxes').toBeTruthy()
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(firstCard!.x)
    expect(await awardsMenu(page).evaluate((el) => getComputedStyle(el).position)).toBe('sticky')

    await awardsMenuItem(page, 'mvp').click()
    await expect(awardSection(page, 'mvp')).toBeInViewport()
    await expect(awardsMenu(page)).toBeInViewport()
    await expect
      .poll(async () => {
        const headerBox = await header(page).boundingBox()
        const menuBox = await awardsMenu(page).boundingBox()
        return headerBox && menuBox ? menuBox.y - (headerBox.y + headerBox.height) : Number.NEGATIVE_INFINITY
      }, 'menu top clears the header after scrolling to MVP')
      .toBeGreaterThanOrEqual(-1)
  })

  // FR-407/DEC-002/SC-006: below 1024px all six items share one row and the row scrolls sideways
  for (const [label, viewport] of [
    ['768px', TABLET],
    ['375px', PHONE],
  ] as const) {
    test(`FR-407: at ${label} the menu is one horizontal row of tabs with no page-level horizontal scroll`, async ({ page }) => {
      await openAwardsAt(page, viewport)
      const items = awardsMenu(page).getByRole('link')
      await expect(items).toHaveCount(AWARD_MENU_SLUGS.length)
      const rowTops = await items.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().y)))
      expect(new Set(rowTops).size, `item tops ${rowTops.join(',')}`).toBe(1)
      expect(await awardsMenu(page).evaluate((el) => getComputedStyle(el).overflowX)).toMatch(/auto|scroll/)
      const menu = await awardsMenu(page).boundingBox()
      const firstCard = await awardSection(page, AWARD_MENU_SLUGS[0]).boundingBox()
      expect(menu!.y + menu!.height).toBeLessThanOrEqual(firstCard!.y + 1)
      expect(await hasNoPageHorizontalScroll(page)).toBe(true)
    })
  }

  // D009/FR-407: from 768px image and text sit side by side; below 768px the image is above the text
  test('D009: from 768px each award card puts image and text side by side', async ({ page }) => {
    await openAwardsAt(page, TABLET)
    for (const slug of AWARD_MENU_SLUGS) {
      const image = await awardDetailImage(page, slug).boundingBox()
      const text = await awardDetailDescription(page, slug).boundingBox()
      expect(image && text, slug).toBeTruthy()
      const apartHorizontally = text!.x >= image!.x + image!.width - 1 || image!.x >= text!.x + text!.width - 1
      const overlapVertically = text!.y < image!.y + image!.height && image!.y < text!.y + text!.height
      expect(apartHorizontally && overlapVertically, `${slug} image and text side by side`).toBe(true)
    }
  })

  test('D009: below 768px each award card stacks the image above the text', async ({ page }) => {
    await openAwardsAt(page, PHONE)
    for (const slug of AWARD_MENU_SLUGS) {
      const image = await awardDetailImage(page, slug).boundingBox()
      const text = await awardDetailDescription(page, slug).boundingBox()
      expect(image && text, slug).toBeTruthy()
      expect(text!.y, `${slug} text below image`).toBeGreaterThanOrEqual(image!.y + image!.height - 1)
    }
  })

  // DEC-002: the active item survives a breakpoint change (one nav element serves both layouts)
  test('DEC-002: resizing from 1440px to 375px keeps the active menu item', async ({ page }) => {
    await openAwardsAt(page, DESKTOP)
    const target: AwardMenuSlug = 'best-manager'
    await awardsMenuItem(page, target).click()
    await expect.poll(() => activeSlugs(page)).toEqual([target])
    await page.setViewportSize(PHONE)
    await expect.poll(() => activeSlugs(page), 'active item after resize').toEqual([target])
  })
})
