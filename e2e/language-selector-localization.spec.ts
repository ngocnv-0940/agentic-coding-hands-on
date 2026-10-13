import { expect, test, type Page } from '@playwright/test'
import { stubGoogleAuthorize } from './support/login-through-stubbed-google'

const VI_SUBTITLE = 'Bắt đầu hành trình của bạn cùng SAA 2025.'
const VI_FOOTER = 'Bản quyền thuộc về Sun* © 2025'
const ONE_YEAR_DAYS = [360, 370]

const trigger = (page: Page) => page.getByTestId('language-selector-trigger')
const optionEn = (page: Page) => page.getByTestId('language-option-en')
const optionVi = (page: Page) => page.getByTestId('language-option-vi')

test.describe('Language selector and localization', () => {
  // TC 5f1cbabd: default language is Vietnamese
  test('defaults to Vietnamese with the VN label and html lang vi', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toContainText('VN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByText(VI_SUBTITLE, { exact: true })).toBeVisible()
  })

  // TC 98e20775: flag left of the label, chevron right of it
  test('shows a flag left of VN and a chevron right of it', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    const box = await trigger(page).boundingBox()
    const icons = trigger(page).locator('img, svg')
    await expect(icons).toHaveCount(2)
    const flag = await icons.first().boundingBox()
    const chevron = await icons.last().boundingBox()
    expect(flag!.x).toBeLessThan(box!.x + box!.width / 2)
    expect(chevron!.x).toBeGreaterThan(box!.x + box!.width / 2)
  })

  // TC 4426635b, 20d87e28: click opens the menu, aria-expanded reflects it
  test('clicking the selector opens the menu', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
    await trigger(page).click()
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(optionVi(page)).toBeVisible()
    await expect(optionEn(page)).toBeVisible()
  })

  // TC cb42461d: hover highlights and shows a pointer cursor
  test('hovering the selector shows a pointer cursor', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    await trigger(page).hover()
    expect(await trigger(page).evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer')
  })

  test('menu closes on re-click, Escape and outside click', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    await trigger(page).click()
    await trigger(page).click()
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')

    await trigger(page).click()
    await page.keyboard.press('Escape')
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')

    await trigger(page).click()
    await page.mouse.click(5, 400)
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('keyboard: Enter opens the menu and Tab reaches the options', async ({ page }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
    for (let i = 0; i < 4 && !(await optionEn(page).evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(optionEn(page)).toBeFocused()
  })

  // FR-401: picking EN stores NEXT_LOCALE=en (1 year, path /, SameSite=Lax) and re-renders in EN
  test('picking EN switches the copy, persists a cookie, and survives reload', async ({ page, context }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    await trigger(page).click()
    await optionEn(page).click()

    await expect(trigger(page)).toContainText('EN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByText(VI_SUBTITLE, { exact: true })).toHaveCount(0)
    await expect(page.getByText(VI_FOOTER, { exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'ROOT FURTHER', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /login with google/i })).toBeVisible()

    const cookie = (await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')
    expect(cookie?.value).toBe('en')
    expect(cookie?.path).toBe('/')
    expect(cookie?.sameSite).toBe('Lax')
    const daysLeft = (cookie!.expires - Date.now() / 1000) / 86_400
    expect(daysLeft).toBeGreaterThan(ONE_YEAR_DAYS[0])
    expect(daysLeft).toBeLessThan(ONE_YEAR_DAYS[1])

    await page.reload()
    await expect(trigger(page)).toContainText('EN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('picking the current language writes no cookie', async ({ page, context }) => {
    await page.goto('/login')
    await expect(trigger(page)).toBeVisible()
    await trigger(page).click()
    await optionVi(page).click()
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
    expect((await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')).toBeUndefined()
  })

  test('an unknown NEXT_LOCALE value falls back to Vietnamese', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'xx', url: 'http://localhost:3100' }])
    await page.goto('/login')
    await expect(trigger(page)).toContainText('VN')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  })

  test('the homepage landing follows the locale cookie', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3100' }])
    await stubGoogleAuthorize(page)
    await page.goto('/login')
    const button = page.getByRole('button', { name: /login with google/i })
    await expect(button).toBeVisible()
    await button.click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(trigger(page)).toContainText('EN')
  })

  test('/todo labels follow the locale cookie', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3100' }])
    await stubGoogleAuthorize(page)
    await page.goto('/login')
    await page.getByRole('button', { name: /login with google/i }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth/'))
    await page.goto('/todo')
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /đăng xuất/i })).toHaveCount(0)
  })
})
