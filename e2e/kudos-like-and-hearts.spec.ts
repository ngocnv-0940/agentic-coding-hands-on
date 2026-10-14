import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { MOCK_PORT } from './support/mock-supabase-server'
import { openKudosBoard } from './support/kudos-board-session'
import * as k from './support/kudos-locators'
import { EXPECT } from './support/kudos-fixture-ids'

// Screen: /sun-kudos heart button and sidebar hearts. Spec ids: TC FUNCTION 24, 25, 26, 33;
// FR-401..405, BR-002..006, SM-001, DEC-003, ALG-003.
// Serial, and the only spec that mutates the mock like state. beforeAll and afterAll reset it.
// Each identity runs in its own browser context because the stubbed login sets session cookies.
const MOCK = `http://localhost:${MOCK_PORT}`

/** Reads the sidebar hearts number once the page shows one (the fixture baseline is not 0). */
async function heartsOf(page: Page): Promise<number> {
  const stat = k.sidebarStat(page, 'hearts')
  await expect(stat).toHaveText(/^\d+$/)
  return Number(await stat.innerText())
}

/** Reloads the sender page and waits until the hearts stat equals `expected`. */
async function expectHeartsAfterReload(page: Page, expected: number) {
  await page.reload()
  await expect.poll(() => heartsOf(page), { message: `sender hearts = ${expected}` }).toBe(expected)
}

async function openAs(browser: Browser, as: 'kudos-sender' | 'kudos-liker' | 'kudos-outsider'): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await openKudosBoard(page, as)
  return { context, page }
}

test.describe.configure({ mode: 'serial' })

test.describe('Sun* Kudos likes and hearts (serial, shared mock state)', () => {
  test.beforeAll(async ({ request }) => {
    expect((await request.post(`${MOCK}/__e2e/kudos/reset`)).ok(), 'mock reset').toBeTruthy()
  })

  test.afterAll(async ({ request }) => {
    await request.post(`${MOCK}/__e2e/kudos/reset`)
  })

  // TC FUNCTION 33 / FR-401 / BR-002: the heart toggles red and +1, and back to gray and -1
  test('TC FUNCTION 33 / BR-002: a liker toggles the heart on and off, and the count follows', async ({ browser }) => {
    const { context, page } = await openAs(browser, 'kudos-liker')
    try {
      const card = k.cardIn(k.feedBlock(page), EXPECT.likeTargetA)
      await expect(card, 'like target A in the feed').toBeVisible()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'false')
      await expect(k.likeCount(card)).toHaveText('0')
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'true')
      await expect(k.likeCount(card)).toHaveText('1')
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'false')
      await expect(k.likeCount(card)).toHaveText('0')
    } finally {
      await context.close()
    }
  })

  // TC FUNCTION 24 / BR-003: the sender's own kudo has a disabled heart
  test('TC FUNCTION 24 / BR-003: the sender cannot like their own kudo and the heart is disabled', async ({ browser }) => {
    const { context, page } = await openAs(browser, 'kudos-sender')
    try {
      const card = k.cardIn(k.feedBlock(page), EXPECT.likeTargetA)
      await expect(card, 'own kudo A in the feed').toBeVisible()
      await expect(k.likeButton(card)).toBeDisabled()
    } finally {
      await context.close()
    }
  })

  // FR-404 / DEC-003: a like on a normal day gives the sender +1 heart; unlike gives it back
  test('FR-404 / DEC-003: a like on a normal day adds 1 heart to the sender, and unlike removes it', async ({ browser }) => {
    const sender = await openAs(browser, 'kudos-sender')
    const liker = await openAs(browser, 'kudos-liker')
    try {
      const baseline = await heartsOf(sender.page)
      const card = k.cardIn(k.feedBlock(liker.page), EXPECT.likeTargetA)
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'true')
      await expectHeartsAfterReload(sender.page, baseline + 1)
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'false')
      await expectHeartsAfterReload(sender.page, baseline)
    } finally {
      await sender.context.close()
      await liker.context.close()
    }
  })

  // FR-405 / BR-004: on a special day a like gives the sender 2 hearts; unliking after the day ends revokes 2
  test('FR-405 / BR-004: a like on a special day adds 2 hearts, and unliking revokes exactly those 2', async ({ browser, request }) => {
    const sender = await openAs(browser, 'kudos-sender')
    const liker = await openAs(browser, 'kudos-liker')
    try {
      expect((await request.post(`${MOCK}/__e2e/kudos/special-today`, { data: { on: true } })).ok(), 'special day on').toBeTruthy()
      const baseline = await heartsOf(sender.page)
      const card = k.cardIn(k.feedBlock(liker.page), EXPECT.likeTargetB)
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'true')
      await expectHeartsAfterReload(sender.page, baseline + 2)
      expect((await request.post(`${MOCK}/__e2e/kudos/special-today`, { data: { on: false } })).ok(), 'special day off').toBeTruthy()
      await k.likeButton(card).click()
      await expect(k.likeButton(card)).toHaveAttribute('aria-pressed', 'false')
      await expectHeartsAfterReload(sender.page, baseline)
    } finally {
      await sender.context.close()
      await liker.context.close()
    }
  })

  // FR-402 / BR-003: an identity without a sunner row cannot like; its heart is disabled
  test('FR-402: an identity without a sunner row sees a disabled heart on any kudo', async ({ browser }) => {
    const { context, page } = await openAs(browser, 'kudos-outsider')
    try {
      const card = k.cardIn(k.feedBlock(page), EXPECT.likeTargetB)
      await expect(card, 'like target B in the feed').toBeVisible()
      await expect(k.likeButton(card)).toBeDisabled()
    } finally {
      await context.close()
    }
  })
})
