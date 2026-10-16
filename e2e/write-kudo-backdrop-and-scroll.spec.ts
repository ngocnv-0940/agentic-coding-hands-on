import { expect, test, type Page } from '@playwright/test'
import { composePill } from './support/kudos-locators'
import { writeKudoScrollArea } from './support/fab-locators'
import * as w from './support/write-kudo-locators'
import { openWriteKudoModal } from './support/write-kudo-session'

// Clarifications 2026-10-15 (plans/261015-1900-fab-and-modal-polish): the mask closes the modal and discards the draft;
// the page behind is scroll-locked; the title and the Hủy/Gửi footer stay visible while only the field area scrolls.

const MASK_CORNER = { x: 4, y: 4 }

async function expectInViewportAndInsideCard(page: Page, name: string, target: ReturnType<typeof w.heading>) {
  const viewport = page.viewportSize()!
  const box = (await target.boundingBox())!
  const card = (await w.modal(page).boundingBox())!
  expect(box.y, `${name} top in viewport`).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height, `${name} bottom in viewport`).toBeLessThanOrEqual(viewport.height)
  expect(box.y, `${name} inside card (top)`).toBeGreaterThanOrEqual(card.y - 1)
  expect(box.y + box.height, `${name} inside card (bottom)`).toBeLessThanOrEqual(card.y + card.height + 1)
}

test.describe('Viết Kudo modal: backdrop close and scroll', () => {
  test('a click on the mask closes the modal and the reopened draft is empty', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.titleInput(page).fill('Bản nháp chưa gửi')
    await w.backdrop(page).click({ position: MASK_CORNER })
    await expect(w.modal(page)).toBeHidden()
    await composePill(page).click()
    await expect(w.modal(page)).toBeVisible()
    await expect(w.titleInput(page)).toHaveValue('')
  })

  test('a press that starts inside the card and releases on the mask keeps the modal open', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.backdrop(page).click({ position: { x: 1, y: 1 }, trial: true }) // mask exists and is hittable
    const heading = (await w.heading(page).boundingBox())!
    await page.mouse.move(heading.x + 10, heading.y + heading.height / 2)
    await page.mouse.down()
    await page.mouse.move(MASK_CORNER.x, MASK_CORNER.y, { steps: 5 })
    await page.mouse.up()
    await expect(w.modal(page)).toBeVisible()
  })

  test('the page behind does not scroll while the modal is open', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 700 })
    await openWriteKudoModal(page)
    await expect(writeKudoScrollArea(page), 'modal scroll area').toBeVisible()
    const overflow = await page.evaluate(() => [document.documentElement, document.body].map((el) => getComputedStyle(el).overflow))
    expect(overflow, 'html or body overflow hidden').toContain('hidden')
    await writeKudoScrollArea(page).evaluate((el) => el.scrollTo(0, el.scrollHeight))
    const before = await page.evaluate(() => window.scrollY)
    const box = (await writeKudoScrollArea(page).boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 800)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 1500 }).toBe(before)
  })

  for (const [width, height] of [[1440, 700], [375, 667]]) {
    test(`at ${width}x${height} the heading and the Hủy/Gửi footer stay visible after scrolling the fields to the bottom`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await openWriteKudoModal(page)
      await expect(writeKudoScrollArea(page), 'modal scroll area').toBeVisible()
      await writeKudoScrollArea(page).evaluate((el) => el.scrollTo(0, el.scrollHeight))
      await expectInViewportAndInsideCard(page, 'heading', w.heading(page))
      await expectInViewportAndInsideCard(page, 'Hủy', w.cancelButton(page))
      await expectInViewportAndInsideCard(page, 'Gửi', w.submitButton(page))
    })
  }

  test('the scroll area keeps scrolling inside itself (overscroll-behavior-y: contain)', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(writeKudoScrollArea(page), 'modal scroll area').toBeVisible()
    await expect(writeKudoScrollArea(page)).toHaveCSS('overscroll-behavior-y', 'contain')
    await expect(writeKudoScrollArea(page)).toHaveCSS('overflow-y', 'auto')
  })
})
