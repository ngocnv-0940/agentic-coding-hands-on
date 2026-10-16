import { expect, test, type Locator, type Page } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  footer,
  header,
  hero,
  languageOptionEn,
  languageOptionVi,
  languageTrigger,
  navLink,
} from './support/homepage-locators'

// Spec ids: FR-201..205 (header), FR-401..405 (menus), FR-602, BR-004, DEC-002.
const ABOUT = /About SAA 2025/i
const AWARDS = /Award Information/i
const LOGO = /Sun\* Annual Awards 2025/i
const scrollY = (page: Page) => page.evaluate(() => window.scrollY)
const scrollToBottom = (page: Page) => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
const paint = (loc: Locator) => loc.evaluate((el) => `${getComputedStyle(el).backgroundColor}|${getComputedStyle(el).color}`)

test.describe('Homepage header navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
  })

  // FR-201: the header stays on screen while the page scrolls
  test('header stays fixed at the top after scrolling', async ({ page }) => {
    await scrollToBottom(page)
    await expect.poll(() => scrollY(page)).toBeGreaterThan(0)
    await expect(header(page)).toBeInViewport()
    expect(await header(page).evaluate((el) => getComputedStyle(el).position)).toMatch(/^(fixed|sticky)$/)
  })

  // FR-201/ID-9: "About SAA 2025" is the highlighted item on the homepage
  test('About SAA 2025 is the active nav item on /', async ({ page }) => {
    await expect(navLink(page, ABOUT)).toHaveAttribute('aria-current', 'page')
    await expect(navLink(page, AWARDS)).not.toHaveAttribute('aria-current', 'page')
  })

  // FR-202/ID-20: clicking the active item scrolls to the top instead of reloading
  test('clicking the active About item scrolls the homepage to the top', async ({ page }) => {
    await scrollToBottom(page)
    await expect.poll(() => scrollY(page)).toBeGreaterThan(0)
    await navLink(page, ABOUT).click()
    await expect.poll(() => scrollY(page)).toBe(0)
    await expect(page).toHaveURL(/\/$/)
  })

  // FR-202/ID-2/ID-18: the logo returns to / and scrolls to the top, from the homepage and from another page
  test('logo click returns to the top of / from the homepage and from a placeholder', async ({ page }) => {
    await scrollToBottom(page)
    await header(page).getByRole('link', { name: LOGO }).click()
    await expect.poll(() => scrollY(page)).toBe(0)

    await navLink(page, AWARDS).click()
    await expect(page).toHaveURL(/\/awards-information$/)
    await header(page).getByRole('link', { name: LOGO }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(hero(page)).toBeVisible()
  })

  // ID-3/ID-4: the footer About link also returns to the homepage, from a placeholder page
  test('footer About link from a placeholder page opens the homepage', async ({ page }) => {
    await navLink(page, AWARDS).click()
    await expect(page).toHaveURL(/\/awards-information$/)
    await footer(page).getByRole('link', { name: ABOUT }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(hero(page)).toBeVisible()
  })

  // FR-202/ID-21/ID-22: other nav items navigate to their pages
  test('Award Information and Sun* Kudos nav items navigate to their pages', async ({ page }) => {
    await navLink(page, AWARDS).click()
    await expect(page).toHaveURL(/\/awards-information$/)
    await page.goto('/')
    await navLink(page, /Sun\* Kudos/i).click()
    await expect(page).toHaveURL(/\/sun-kudos$/)
  })

  // ID-23: hovering a nav item changes its paint
  test('hovering a nav item changes its colours', async ({ page }) => {
    const link = navLink(page, AWARDS)
    await expect(link).toBeVisible()
    const before = await paint(link)
    await link.hover()
    await expect.poll(() => paint(link)).not.toBe(before)
  })

  // ID-10: language button defaults to VN and the document is Vietnamese
  test('language selector shows VN by default and the page is lang vi', async ({ page }) => {
    await expect(languageTrigger(page)).toContainText('VN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  })

  // ID-24/ID-58: the language menu offers exactly VN and EN
  test('language menu opens with exactly the VN and EN options', async ({ page }) => {
    await languageTrigger(page).click()
    await expect(languageOptionVi(page)).toBeVisible()
    await expect(languageOptionEn(page)).toBeVisible()
    await expect(page.locator('[data-testid^="language-option-"]')).toHaveCount(2)
  })

  // ID-25/FR-405: choosing EN changes the homepage strings and survives a reload
  test('choosing EN switches the homepage to English and keeps it after reload', async ({ page }) => {
    await languageTrigger(page).click()
    await languageOptionEn(page).click()
    await expect(languageTrigger(page)).toContainText('EN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(footer(page)).not.toContainText('Bản quyền')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(languageTrigger(page)).toContainText('EN')
  })

  // ID-26: EN can switch back to VN
  test('choosing VN again restores the Vietnamese homepage', async ({ page }) => {
    await languageTrigger(page).click()
    await languageOptionEn(page).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await languageTrigger(page).click()
    await languageOptionVi(page).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(footer(page)).toContainText('Bản quyền')
  })
})
