import { expect, test, type Locator, type Page } from '@playwright/test'
import { awardCard, header, hero, navLink, placeholderComingSoon } from './support/homepage-locators'
import { LOGIN_BUTTON, loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  AWARD_MENU_LABELS,
  AWARD_MENU_SLUGS,
  AWARDS_PATH,
  awardDetail,
  awardDetailDescription,
  awardDetailImage,
  awardDetailPrize,
  awardDetailQuantity,
  awardSection,
  awardsCaption,
  awardsKudosBlock,
  awardsKudosDetail,
  awardsMenu,
  awardsMenuItem,
  awardsPage,
  awardsTitle,
  type AwardMenuSlug,
} from './support/awards-information-locators'

// Spec ids: FR-001, FR-101, FR-102, FR-201..205, FR-408, FR-601, BR-001, BR-003, US001, US004, US005, SC-001, SC-002, SC-007, SC-008.
// TC: ID-0..ID-8, ID-12, ID-14. Clarifications D005 (full Figma copy), D006 (VN values), AC12 (EN switch).
// Expected values are the VN Figma strings from the MoMorph CSV; toContainText tolerates the label/value split.

test.use({ viewport: { width: 1440, height: 900 } })

const DETAILS: ReadonlyArray<{ slug: AwardMenuSlug; quantity: string; prize: string[] }> = [
  { slug: 'top-talent', quantity: '10 Cá nhân', prize: ['7.000.000 VNĐ'] },
  { slug: 'top-project', quantity: '02 Tập thể', prize: ['15.000.000 VNĐ'] },
  { slug: 'top-project-leader', quantity: '03 Cá nhân', prize: ['7.000.000 VNĐ'] },
  { slug: 'best-manager', quantity: '01 Cá nhân', prize: ['10.000.000 VNĐ'] },
  { slug: 'signature-2025-creator', quantity: '01', prize: ['5.000.000 VNĐ', '8.000.000 VNĐ'] },
  { slug: 'mvp', quantity: '01', prize: ['15.000.000 VNĐ'] },
]

async function openAwardsSignedIn(page: Page): Promise<void> {
  await loginThroughStubbedGoogle(page)
  await page.goto(AWARDS_PATH)
}

async function computedColor(locator: Locator): Promise<string> {
  return locator.evaluate((el) => getComputedStyle(el).color)
}

test.describe('Awards Information access and content', () => {
  // ID-0/FR-101: a signed-in user gets the awards page in place of the placeholder
  test('ID-0: a signed-in user sees the awards page and no Coming soon', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(page).toHaveURL(/\/awards-information$/)
    await expect(awardsPage(page)).toBeVisible()
    await expect(placeholderComingSoon(page)).toHaveCount(0)
  })

  // ID-1/FR-601: a guest is redirected to /login and never sees the content
  test('ID-1: a guest opening the page is redirected to /login', async ({ page }) => {
    await page.goto(AWARDS_PATH)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
    await expect(awardsPage(page)).toHaveCount(0)
  })

  // ID-2/FR-202: the header item opens the page and marks itself as the current page
  test('ID-2: the header "Awards Information" item opens the page', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/')
    await navLink(page, /Awards Information/i).click()
    await expect(page).toHaveURL(/\/awards-information$/)
    await expect(awardsPage(page)).toBeVisible()
    await expect(navLink(page, /Awards Information/i)).toHaveAttribute('aria-current', 'page')
  })

  // ID-3/FR-102: title above the menu and cards, Kudos block below the last award
  test('ID-3: title sits above the menu and cards; the Kudos block sits below the last award', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(awardsPage(page)).toBeVisible()
    const title = await awardsTitle(page).boundingBox()
    const firstAward = await awardSection(page, AWARD_MENU_SLUGS[0]).boundingBox()
    const lastAward = await awardSection(page, 'mvp').boundingBox()
    const kudos = await awardsKudosBlock(page).boundingBox()
    expect(title && firstAward && lastAward && kudos, 'every layout region has a box').toBeTruthy()
    expect(title!.y + title!.height).toBeLessThanOrEqual(firstAward!.y)
    expect(lastAward!.y + lastAward!.height).toBeLessThanOrEqual(kudos!.y)
  })

  // ID-4/FR-001/AC3: caption and gold h1, in different colours
  test('ID-4: caption "Sun* Annual Awards 2025" and gold heading "Hệ thống giải thưởng SAA 2025"', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(awardsCaption(page)).toHaveText('Sun* Annual Awards 2025')
    await expect(awardsTitle(page)).toHaveText('Hệ thống giải thưởng SAA 2025')
    expect(await computedColor(awardsTitle(page))).not.toBe(await computedColor(awardsCaption(page)))
  })

  // ID-5/FR-201/BR-001: six menu items, in the Figma order, each linked to its section
  test('ID-5: the category menu lists six items in order, each linking to its section', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(awardsMenu(page)).toBeVisible()
    await expect(awardsMenu(page).getByRole('link')).toHaveText([...AWARD_MENU_LABELS])
    for (const slug of AWARD_MENU_SLUGS) {
      await expect(awardsMenuItem(page, slug), slug).toHaveAttribute('href', `#${slug}`)
    }
  })

  // ID-6/FR-203..205/US004/US005: six sections in order, each with title, copy, quantity and prize
  test('ID-6: six award sections in order, each with quantity and prize values', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(awardsPage(page)).toBeVisible()
    const ids = await awardsPage(page).locator('section[id]').evaluateAll((els) => els.map((el) => el.id))
    expect(ids).toEqual([...AWARD_MENU_SLUGS])
    for (const { slug, quantity, prize } of DETAILS) {
      await expect(awardDetail(page, slug).getByRole('heading', { level: 2 }), slug).toBeVisible()
      await expect(awardDetailDescription(page, slug), slug).not.toBeEmpty()
      await expect(awardDetailQuantity(page, slug), slug).toContainText(quantity)
      for (const [index, value] of prize.entries()) {
        await expect(awardDetailPrize(page, slug).nth(index), `${slug} prize ${index}`).toContainText(value)
      }
    }
    await expect(awardDetailPrize(page, 'signature-2025-creator')).toHaveCount(2)
  })

  // D005: the award section carries the full Figma description, not the two-line homepage card copy, and is not clamped
  test('D005: the section description is the full Figma copy, not the homepage card copy', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/')
    const homepageCopy = (await awardCard(page, 'top-talent').getByTestId('award-card-description').textContent())?.trim() ?? ''
    expect(homepageCopy.length, 'homepage card copy is read').toBeGreaterThan(0)

    await page.goto(AWARDS_PATH)
    const description = awardDetailDescription(page, 'top-talent')
    await expect(description).toBeVisible()
    const fullCopy = (await description.textContent())?.trim() ?? ''
    expect(fullCopy).not.toBe(homepageCopy)
    expect(fullCopy.length).toBeGreaterThan(homepageCopy.length)
    expect(await description.evaluate((el) => getComputedStyle(el).webkitLineClamp)).toBe('none')
  })

  // ID-7/FR-203: each award image renders at the Figma size of 336 x 336 on desktop
  test('ID-7: each award image renders 336 x 336 at 1440px', async ({ page }) => {
    await openAwardsSignedIn(page)
    for (const slug of AWARD_MENU_SLUGS) {
      const image = awardDetailImage(page, slug)
      await expect(image, slug).toBeVisible()
      const box = await image.boundingBox()
      expect(box && { width: box.width, height: box.height }, slug).toEqual({ width: 336, height: 336 })
    }
  })

  // ID-8/FR-408: the Sun* Kudos block shows its eyebrow, title and the Chi tiết link
  test('ID-8: the Sun* Kudos block shows eyebrow, title and the Chi tiết link', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(awardsKudosBlock(page)).toBeVisible()
    await expect(awardsKudosBlock(page)).toContainText('Phong trào ghi nhận')
    await expect(awardsKudosBlock(page)).toContainText('Sun* Kudos')
    await expect(awardsKudosDetail(page)).toBeVisible()
  })

  // ID-12/FR-408/SC-007: Chi tiết opens /sun-kudos in the same tab
  test('ID-12: Chi tiết opens /sun-kudos in the same tab', async ({ page }) => {
    await openAwardsSignedIn(page)
    const link = awardsKudosDetail(page)
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/sun-kudos')
    await expect(link).not.toHaveAttribute('target', '_blank')
    await link.click()
    await expect(page).toHaveURL(/\/sun-kudos$/)
  })

  // ID-14: an unknown route under the awards path answers with the default 404 (not the awards page)
  test('ID-14: an unknown route under /awards-information answers 404', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    const response = await page.goto(`${AWARDS_PATH}/no-such-section`)
    expect(response?.status()).toBe(404)
    await expect(awardsPage(page)).toHaveCount(0)
  })

  // AC12/BR-003: English keeps the layout and never shows raw dictionary keys
  test('AC12: switching to English localizes the page with no raw awards.* keys', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expect(hero(page)).toHaveCount(0)
    await expect(header(page)).toBeVisible()
    await page.getByTestId('language-selector-trigger').click()
    await page.getByTestId('language-option-en').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(awardsPage(page)).toBeVisible()
    await expect(awardsTitle(page)).not.toHaveText('Hệ thống giải thưởng SAA 2025')
    await expect(awardsPage(page)).not.toContainText('Số lượng giải thưởng')
    await expect(awardsPage(page)).not.toContainText(/\b(awards|home)\.[a-z]+\.[a-z]+/)
  })
})
