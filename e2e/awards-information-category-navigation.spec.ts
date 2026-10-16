import { expect, test, type Page } from '@playwright/test'
import { awardCard, header, navLink } from './support/homepage-locators'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  AWARD_MENU_SLUGS,
  AWARDS_PATH,
  awardSection,
  awardsActiveItems,
  awardsMenu,
  awardsMenuItem,
  awardsPage,
  scrollY,
  type AwardMenuSlug,
} from './support/awards-information-locators'

// Spec ids: FR-401..405, BR-002, DEC-001, ALG-001, D007, US002, US003, SC-003..SC-005. TC: ID-9, ID-10, ID-11, ID-13.
// Active = aria-current="location" on exactly one menu item. Click smooth-scrolls; scroll-spy follows manual scroll.

test.use({ viewport: { width: 1440, height: 900 } })

async function openAwardsSignedIn(page: Page): Promise<void> {
  await loginThroughStubbedGoogle(page)
  await page.goto(AWARDS_PATH)
  await expect(awardsPage(page)).toBeVisible()
}

/** Slugs of the items that carry aria-current="location", read from their href="#<slug>". */
async function activeSlugs(page: Page): Promise<string[]> {
  return awardsActiveItems(page).evaluateAll((els) => els.map((el) => (el.getAttribute('href') ?? '').replace('#', '')))
}

async function expectOnlyActive(page: Page, slug: AwardMenuSlug): Promise<void> {
  await expect.poll(() => activeSlugs(page), `active item for ${slug}`).toEqual([slug])
}

/** The section top sits at or below the bottom edge of the sticky site header. */
async function expectSectionBelowHeader(page: Page, slug: AwardMenuSlug): Promise<void> {
  await expect(awardSection(page, slug), `${slug} in viewport`).toBeInViewport()
  await expect
    .poll(async () => {
      const headerBox = await header(page).boundingBox()
      const sectionBox = await awardSection(page, slug).boundingBox()
      return sectionBox && headerBox ? sectionBox.y - (headerBox.y + headerBox.height) : Number.NEGATIVE_INFINITY
    }, `${slug} top clears the header`)
    .toBeGreaterThanOrEqual(-1)
}

/** Waits until window.scrollY stops changing (five equal reads in a row), without a fixed sleep. */
async function waitForScrollSettled(page: Page): Promise<void> {
  let last = Number.NaN
  let stableReads = 0
  await expect
    .poll(async () => {
      const y = await scrollY(page)
      stableReads = y === last ? stableReads + 1 : 0
      last = y
      return stableReads >= 5
    }, { timeout: 10_000 })
    .toBe(true)
}

/**
 * The section that ALG-001 names as "in view": the last section whose top has reached the line below the sticky header,
 * or the last section at the page bottom. Recomputed from the DOM geometry (independent of the app's helpers).
 */
async function slugInViewNow(page: Page): Promise<AwardMenuSlug> {
  const slug = await page.evaluate((slugs: string[]) => {
    const first = document.getElementById(slugs[0])
    const margin = first ? Number.parseFloat(getComputedStyle(first).scrollMarginTop) : 0
    const line = (margin > 0 ? margin : 80) + 8
    const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    if (atBottom) return slugs[slugs.length - 1]
    let current = slugs[0]
    for (const id of slugs) {
      const top = document.getElementById(id)?.getBoundingClientRect().top
      if (top !== undefined && top <= line) current = id
    }
    return current
  }, [...AWARD_MENU_SLUGS])
  return slug as AwardMenuSlug
}

test.describe('Awards Information category navigation', () => {
  // ID-9/ID-11/BR-002: Top Talent is active by default; each click scrolls to its section and leaves only it active
  test('ID-9/ID-11: default active is Top Talent; each click scrolls to its section and leaves only it active', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expectOnlyActive(page, 'top-talent')
    for (const slug of AWARD_MENU_SLUGS) {
      await awardsMenuItem(page, slug).click()
      await expectOnlyActive(page, slug)
      await expectSectionBelowHeader(page, slug)
    }
  })

  // D007/FR-405: a click writes #slug with replaceState, so history gains no entry and the header item stays current
  test('D007: a click sets #slug without adding a history entry', async ({ page }) => {
    await openAwardsSignedIn(page)
    const historyBefore = await page.evaluate(() => history.length)
    await awardsMenuItem(page, 'mvp').click()
    await expectSectionBelowHeader(page, 'mvp')
    await expect(page).toHaveURL(/\/awards-information#mvp$/)
    expect(await page.evaluate(() => history.length)).toBe(historyBefore)
    await expect(navLink(page, /Award Information/i)).toHaveAttribute('aria-current', 'page')
  })

  // BR-002/US002 error path: during the smooth scroll only the clicked item ever gains the active state
  test('BR-002: no flicker, only the clicked item ever gains aria-current during a click scroll', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expectOnlyActive(page, 'top-talent')
    await page.evaluate(() => {
      const menu = document.querySelector('[data-testid="awards-category-menu"]')
      if (!menu) throw new Error('awards-category-menu is missing')
      const gained: string[] = []
      ;(window as unknown as { awardsActiveGained: string[] }).awardsActiveGained = gained
      new MutationObserver((records) => {
        for (const record of records) {
          const el = record.target as Element
          if (el.getAttribute('aria-current') === 'location' && record.oldValue !== 'location') {
            gained.push(el.getAttribute('href') ?? '')
          }
        }
      }).observe(menu, { attributes: true, attributeFilter: ['aria-current'], attributeOldValue: true, subtree: true })
    })
    await awardsMenuItem(page, 'mvp').click()
    await expectOnlyActive(page, 'mvp')
    await expectSectionBelowHeader(page, 'mvp')
    await waitForScrollSettled(page)
    const gained = await page.evaluate(() => (window as unknown as { awardsActiveGained: string[] }).awardsActiveGained)
    expect(gained).toEqual(['#mvp'])
  })

  // ID-10: hovering an inactive item changes its computed look
  test('ID-10: hovering an inactive menu item changes its computed style', async ({ page }) => {
    await openAwardsSignedIn(page)
    const item = awardsMenuItem(page, 'best-manager')
    await expect(item).toBeVisible()
    const lookOf = () => item.evaluate((el) => {
      const style = getComputedStyle(el)
      return `${style.color}|${style.textDecorationLine}|${style.backgroundColor}`
    })
    const before = await lookOf()
    await item.hover()
    await expect.poll(lookOf).not.toBe(before)
  })

  // FR-404/SC-004: manual scroll moves the active item with it and never changes the URL
  test('scroll-spy: manual scrolling moves the active item and leaves the URL untouched', async ({ page }) => {
    await openAwardsSignedIn(page)
    for (const slug of ['top-project', 'best-manager', 'mvp'] as const) {
      await page.evaluate((id) => {
        const el = document.getElementById(id)
        if (!el) throw new Error(`section #${id} is missing`)
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
      }, slug)
      await expectOnlyActive(page, slug)
      await expect(page).toHaveURL(/\/awards-information$/)
    }
  })

  // FR-403/AC9: a deep link #mvp scrolls to MVP and activates it
  test('deep link #mvp scrolls to MVP and activates it', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto(`${AWARDS_PATH}#mvp`)
    await expectOnlyActive(page, 'mvp')
    await expectSectionBelowHeader(page, 'mvp')
  })

  // AC9/FR-209: the homepage Best Manager card lands on its section, active
  test('homepage Best Manager card opens #best-manager with that section active', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await page.goto('/')
    await awardCard(page, 'best-manager').click()
    await expect(page).toHaveURL(/\/awards-information#best-manager$/)
    await expectOnlyActive(page, 'best-manager')
    await expectSectionBelowHeader(page, 'best-manager')
  })

  // ID-13/FR-405: an unknown hash is a no-op: no page error, page stays at the top, Top Talent stays active
  test('ID-13: an unknown hash raises no page error, keeps the top of the page and Top Talent active', async ({ page }) => {
    const pageErrors: string[] = []
    await loginThroughStubbedGoogle(page)
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto(`${AWARDS_PATH}#abc`)
    await expect(awardsPage(page)).toBeVisible()
    await expect(awardsMenu(page)).toBeVisible()
    await expectOnlyActive(page, 'top-talent')
    await waitForScrollSettled(page)
    expect(await scrollY(page)).toBeLessThan(50)
    expect(pageErrors).toEqual([])
  })

  // Fix round 1 (modifier-click): Ctrl/Cmd-click is the browser's new-tab gesture, so the menu must not preventDefault it,
  // smooth-scroll, move the active item or rewrite the hash. Whether a popup opens is left to the browser.
  test('modifier-click: Ctrl-click on an inactive item leaves scroll, active item and URL hash untouched', async ({ page, context }) => {
    await openAwardsSignedIn(page)
    await expectOnlyActive(page, 'top-talent')
    // The hero pushes the menu below the fold, and Playwright scrolls an off-screen target into view before it clicks.
    // Do that first and let it settle, so the baseline and the Ctrl-click are the only movements under test.
    await awardsMenuItem(page, 'mvp').scrollIntoViewIfNeeded()
    await waitForScrollSettled(page)
    const scrollBefore = await scrollY(page)
    await page.evaluate(() => {
      const clicks: { href: string | null; modified: boolean }[] = []
      ;(window as unknown as { awardsClicks: typeof clicks }).awardsClicks = clicks
      window.addEventListener(
        'click',
        (event) => {
          const link = (event.target as Element).closest('a')
          clicks.push({ href: link?.getAttribute('href') ?? null, modified: event.ctrlKey || event.metaKey })
        },
        { capture: true },
      )
    })
    const popupOpened = context.waitForEvent('page', { timeout: 3_000 }).catch(() => null)
    await awardsMenuItem(page, 'mvp').click({ modifiers: ['ControlOrMeta'] })
    // Vacuity guard: the Ctrl-click really reached the MVP link with a modifier held.
    const clicks = await page.evaluate(() => (window as unknown as { awardsClicks: { href: string | null; modified: boolean }[] }).awardsClicks)
    expect(clicks).toEqual([{ href: '#mvp', modified: true }])

    const popup = await popupOpened
    if (popup) {
      await expect(popup).toHaveURL(/\/awards-information#mvp$/)
      await popup.close()
    }

    // The settle window (about 2.8 s without movement) outlasts any smooth scroll a plain click would have started.
    await waitForScrollSettled(page)
    expect(Math.abs((await scrollY(page)) - scrollBefore), 'window.scrollY after Ctrl-click').toBeLessThanOrEqual(2)
    await expectOnlyActive(page, 'top-talent')
    await expect(page).toHaveURL(/\/awards-information$/)
  })

  // Fix round 1 (scroll-key takeover): a scroll key pressed during a click's smooth scroll hands the scroll back to the user,
  // so the scroll-spy follows the section that is actually in view after the scroll settles (ALG-001).
  test('scroll-key takeover: PageUp during the smooth scroll to MVP makes the active item follow the section in view', async ({ page }) => {
    await openAwardsSignedIn(page)
    await expectOnlyActive(page, 'top-talent')
    // Bring the off-screen MVP item into view first (Playwright would scroll it itself before the click) and let that settle,
    // so the scrollend probe below only ever sees the click's own smooth scroll.
    await awardsMenuItem(page, 'mvp').scrollIntoViewIfNeeded()
    await waitForScrollSettled(page)
    await page.evaluate(() => {
      ;(window as unknown as { awardsScrollEnded: boolean }).awardsScrollEnded = false
      window.addEventListener('scrollend', () => {
        ;(window as unknown as { awardsScrollEnded: boolean }).awardsScrollEnded = true
      })
    })
    const yBeforeClick = await scrollY(page)
    await awardsMenuItem(page, 'mvp').click()
    // Precondition: the click's smooth scroll is still in flight (started, not ended, short of its target). Otherwise the key
    // would not be a takeover and the test would pass without the fix.
    const probeMvpScroll = () =>
      page.evaluate((slug) => {
        const el = document.getElementById(slug)
        if (!el) throw new Error(`section #${slug} is missing`)
        const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        const maxY = document.documentElement.scrollHeight - window.innerHeight
        const target = Math.min(maxY, el.getBoundingClientRect().top + window.scrollY - margin)
        return {
          y: window.scrollY,
          target,
          ended: (window as unknown as { awardsScrollEnded: boolean }).awardsScrollEnded,
        }
      }, 'mvp')
    // The click returns once it is dispatched, but the smooth scroll only starts on a later frame. Wait (bounded) until the
    // page has visibly started moving or has already ended, so the reads below see the scroll in flight and not the start.
    await expect
      .poll(async () => {
        const probe = await probeMvpScroll()
        return probe.ended || Math.abs(probe.y - yBeforeClick) >= 20
      }, { message: 'smooth scroll to MVP never started moving', timeout: 5_000 })
      .toBe(true)
    const inFlight = await probeMvpScroll()
    expect(inFlight.ended, 'smooth scroll to MVP had already ended before the key').toBe(false)
    expect(inFlight.y, 'smooth scroll to MVP had not moved the page before the key').not.toBe(yBeforeClick)
    expect(inFlight.y, 'smooth scroll to MVP had already reached its target before the key').toBeLessThan(inFlight.target - 2)

    await page.keyboard.press('PageUp')
    await waitForScrollSettled(page)

    expect(await scrollY(page), 'PageUp moved the page up from the MVP target').toBeLessThan(inFlight.target - 50)
    const expected = await slugInViewNow(page)
    expect(expected, 'the section in view after PageUp must not be MVP').not.toBe('mvp')
    await expectOnlyActive(page, expected)
  })
})
