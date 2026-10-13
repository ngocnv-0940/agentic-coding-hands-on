import { expect, test } from '@playwright/test'
import { LOGIN_BUTTON, stubGoogleAuthorize } from './support/login-through-stubbed-google'

// Copy from the design (vi). Logo and button labels are identical in both locales.
const LOGO = /Sun\* Annual Awards 2025/i
const VI_SUBTITLE = 'Bắt đầu hành trình của bạn cùng SAA 2025.'
const VI_TAGLINE = 'Đăng nhập để khám phá!'
const SIZES = [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
] as const

test.describe('Login screen layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  // TC b9805e65: logo top-left at every size, not interactive
  test('logo sits top-left at every size and is not interactive', async ({ page }) => {
    const logo = page.getByRole('img', { name: LOGO })
    for (const size of SIZES) {
      await page.setViewportSize(size)
      await expect(logo).toBeVisible()
      const box = await logo.boundingBox()
      expect(box!.x + box!.width / 2, `logo x at ${size.width}px`).toBeLessThan(size.width / 2)
      expect(box!.y, `logo y at ${size.width}px`).toBeLessThan(120)
    }
    const wrappedInInteractive = await logo.evaluate((el) => el.closest('a, button, [role="link"], [role="button"]') !== null)
    expect(wrappedInInteractive).toBe(false)
    expect(await logo.evaluate((el) => getComputedStyle(el).cursor)).not.toBe('pointer')
  })

  // TC 8415b629: language selector top-right at every size
  test('language selector sits top-right at every size', async ({ page }) => {
    const trigger = page.getByTestId('language-selector-trigger')
    for (const size of SIZES) {
      await page.setViewportSize(size)
      await expect(trigger).toBeVisible()
      const box = await trigger.boundingBox()
      expect(box!.x + box!.width / 2, `selector x at ${size.width}px`).toBeGreaterThan(size.width / 2)
      expect(box!.y, `selector y at ${size.width}px`).toBeLessThan(120)
    }
  })

  // FR-201 / spec: header is fixed or sticky and stays on screen while the page scrolls
  test('header stays fixed while the page scrolls', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 400 })
    const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
    expect(scrollable, 'page must be taller than the viewport to prove the fixed header').toBe(true)
    const header = page.getByRole('banner')
    await expect(header).toHaveCSS('position', /^(fixed|sticky)$/)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(header).toBeInViewport()
  })

  // TC 33a1dacf: footer fixed at bottom, visible while scrolling, not interactive
  test('footer is fixed at the bottom, visible on scroll, and not interactive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 })
    const footer = page.getByRole('contentinfo')
    await expect(footer).toHaveCSS('position', 'fixed')
    await expect(footer).toContainText('Sun*')
    await expect(footer).toBeInViewport()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(footer).toBeInViewport()
    await expect(footer.getByRole('link')).toHaveCount(0)
    await expect(footer.getByRole('button')).toHaveCount(0)
    expect(await footer.evaluate((el) => getComputedStyle(el).cursor)).not.toBe('pointer')
  })

  // TC 5fbe2a18, 42b82364: hero artwork, title, subtitle and tagline; text not interactive
  test('hero shows key visual, title and descriptions as static text', async ({ page }) => {
    const hero = page.getByTestId('login-hero')
    await expect(hero).toBeVisible()
    const box = await hero.boundingBox()
    expect(box!.width * box!.height).toBeGreaterThan(0)
    await expect(page.getByRole('heading', { name: 'ROOT FURTHER', exact: true })).toBeVisible()
    await expect(page.getByText(VI_SUBTITLE, { exact: true })).toBeVisible()
    await expect(page.getByText(VI_TAGLINE, { exact: true })).toBeVisible()
  })

  // TC 6ae76d15: button below the descriptions, with the Google icon and label
  test('login button is below the descriptions and shows the Google icon', async ({ page }) => {
    const button = page.getByRole('button', { name: LOGIN_BUTTON })
    await expect(button).toBeVisible()
    await expect(button.locator('img, svg').first()).toBeVisible()
    const tagline = page.getByText(VI_TAGLINE, { exact: true })
    await expect(tagline).toBeVisible()
    const tagBox = await tagline.boundingBox()
    const buttonBox = await button.boundingBox()
    expect(buttonBox!.y).toBeGreaterThan(tagBox!.y + tagBox!.height - 1)
  })

  // TC c18649fa: hover gives a shadow or elevation
  test('login button shows a shadow on hover', async ({ page }) => {
    const button = page.getByRole('button', { name: LOGIN_BUTTON })
    await expect(button).toHaveCSS('box-shadow', 'none')
    await button.hover()
    await expect(button).not.toHaveCSS('box-shadow', 'none')
  })

  // TC 37eae882: while the OAuth start is in flight the button is disabled and shows a loader
  test('login button is disabled with a loader while the Google sign-in starts', async ({ page }) => {
    await stubGoogleAuthorize(page, { hold: true })
    const button = page.getByRole('button', { name: LOGIN_BUTTON })
    await expect(button).toBeVisible()
    // Google never answers with a document here, so the click must not wait for a navigation.
    await button.click({ noWaitAfter: true })
    await expect(button).toBeDisabled()
    await expect(button.getByRole('status')).toBeVisible()
  })

  // TC 60bc5bbb (superseded by clarifications): same-tab redirect, no popup or new tab
  test('clicking login redirects the same tab to Google PKCE start', async ({ page }) => {
    const popups: string[] = []
    page.context().on('page', (other) => popups.push(other.url()))
    const stub = await stubGoogleAuthorize(page)
    const button = page.getByRole('button', { name: LOGIN_BUTTON })
    await expect(button).toBeVisible()
    await button.click()
    await expect(page).toHaveURL(/\/todo$/)
    expect(popups, 'no new tab or popup').toEqual([])
    expect(page.context().pages()).toHaveLength(1)

    expect(stub.requests).toHaveLength(1)
    const authorize = stub.requests[0]
    expect(authorize.searchParams.get('provider')).toBe('google')
    expect(authorize.searchParams.get('redirect_to')).toContain('/auth/callback')
    expect(authorize.searchParams.get('code_challenge')).toBeTruthy()
    expect(authorize.searchParams.get('code_challenge_method')).toBe('s256')
  })

  // Basic responsive: no horizontal scroll on a phone-width screen
  test('no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
