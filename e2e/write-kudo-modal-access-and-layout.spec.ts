import { expect, test, type Locator, type Page } from '@playwright/test'
import { LOGIN_BUTTON } from './support/login-through-stubbed-google'
import { openKudosBoard } from './support/kudos-board-session'
import { composePill } from './support/kudos-locators'
import * as w from './support/write-kudo-locators'
import { openWriteKudoModal } from './support/write-kudo-session'

// Screen: Viết Kudo modal on /sun-kudos (MoMorph ihQ26W78P2). Spec ids: TC ID-0..6, ID-45; FR-101, FR-103..106,
// FR-201, FR-202, FR-206, FR-209, FR-224..227. Every test here opens the modal, so each fails on the modal
// precondition until phase 2/6 land. The guest guard (ID-1) already holds and must stay green.

const ROW_ORDER = ['recipient', 'title', 'content', 'hashtags', 'images', 'anonymous']
const TITLE_PLACEHOLDER = 'Dành tặng một danh hiệu cho đồng đội'
const CONTENT_PLACEHOLDER = 'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!'
const FIGMA_MODAL_WIDTH = 752

const top = async (locator: Locator) => (await locator.boundingBox())!.y

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0)
}

test.describe('Viết Kudo modal: access and layout', () => {
  // TC ID-0 / FR-101: the compose pill opens the modal, which carries the Figma title ("Gửi lời cám ơn và ghi nhận đến đồng đội")
  test('TC ID-0 / FR-101: the compose pill opens the Viết Kudo modal with its title', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.modal(page)).toHaveAttribute('role', 'dialog')
    await expect(w.modal(page)).toHaveAttribute('aria-modal', 'true')
    await expect(w.heading(page)).toContainText('Gửi lời cám ơn và ghi nhận đến đồng đội')
  })

  // TC ID-1 / FR-106: a guest cannot reach the modal and is sent to /login (existing guard, stays green)
  test('TC ID-1 / FR-106: a guest on /sun-kudos is sent to /login before the modal can open', async ({ page }) => {
    await page.goto('/sun-kudos')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible()
  })

  // TC ID-2 / ID-3 / FR-201: every field in Figma order; title at the top; Hủy and Gửi in the footer
  test('TC ID-2 / ID-3 / FR-201: the modal shows six rows in order, the title on top, and Hủy + Gửi in the footer', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect.poll(() => w.fieldRows(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-field')))).toEqual(ROW_ORDER)
    expect(await top(w.heading(page))).toBeLessThan(await top(w.field(page, 'recipient')))
    await expect(w.cancelButton(page)).toHaveText('Hủy')
    await expect(w.submitButton(page)).toHaveText('Gửi')
  })

  // TC ID-4 / FR-202: the recipient input carries the "Tìm kiếm" placeholder and is a combobox
  test('TC ID-4 / FR-202: the recipient field shows the "Tìm kiếm" placeholder and is a closed combobox', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.recipientInput(page)).toHaveAttribute('placeholder', 'Tìm kiếm')
    await expect(w.recipientInput(page)).toHaveAttribute('role', 'combobox')
    await expect(w.recipientInput(page)).toHaveAttribute('aria-expanded', 'false')
  })

  // TC ID-5 / FR-206: the editor placeholder is the Figma sentence (read from the attribute, not a pseudo-element)
  test('TC ID-5 / FR-206: the editor placeholder reads the Figma sentence', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.editor(page).locator('p[data-placeholder]').first()).toHaveAttribute('data-placeholder', CONTENT_PLACEHOLDER)
  })

  // TC ID-6: the anonymous checkbox is unchecked by default
  test('TC ID-6: the anonymous checkbox is unchecked on open', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.anonymousCheckbox(page)).not.toBeChecked()
  })

  // TC ID-45 / FR-204: Hủy closes the modal and discards what was typed; a reopened modal starts empty
  test('TC ID-45: Hủy closes the modal with data entered, and a reopened modal is empty', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.titleInput(page).fill('Bản nháp chưa gửi')
    await w.cancelButton(page).click()
    await expect(w.modal(page)).toBeHidden()
    await composePill(page).click()
    await expect(w.modal(page)).toBeVisible()
    await expect(w.titleInput(page)).toHaveValue('')
  })

  // FR-103: a viewer without a sunner row (kudos-outsider) sees the compose pill disabled
  test('FR-103: an identity without a sunner row sees the compose pill disabled', async ({ page }) => {
    await openKudosBoard(page, 'kudos-outsider')
    await expect(composePill(page)).toBeDisabled()
  })

  // FR-104: closing with Hủy returns focus to the compose pill
  test('FR-104: Hủy returns focus to the compose pill', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.cancelButton(page).click()
    await expect(composePill(page)).toBeFocused()
  })

  // FR-105: the community standards link opens /standards in a new tab
  test('FR-105: "Tiêu chuẩn cộng đồng" opens /standards in a new tab', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.standardsLink(page)).toContainText('Tiêu chuẩn cộng đồng')
    await expect(w.standardsLink(page)).toHaveAttribute('target', '_blank')
    await w.heading(page).click() // settle the recipient blur before the click (see pickHashtags)
    const [popup] = await Promise.all([page.waitForEvent('popup'), w.standardsLink(page).click()])
    expect(new URL(popup.url()).pathname).toBe('/standards')
  })

  // FR-202 / FR-206 / FR-209: the title placeholder, its helper lines, the 100-char limit and the toolbar labels
  test('FR-202 / FR-206 / FR-209: the title, its helper text and the action labels read the Figma copy', async ({ page }) => {
    await openWriteKudoModal(page)
    await expect(w.titleInput(page)).toHaveAttribute('placeholder', TITLE_PLACEHOLDER)
    await expect(w.titleInput(page)).toHaveAttribute('maxlength', '100')
    await expect(w.titleHint(page)).toContainText('Ví dụ: Người truyền động lực cho tôi.')
    await expect(w.titleHint(page)).toContainText('Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn.')
    await expect(w.hashtagAdd(page)).toContainText('Hashtag')
    await expect(w.imageAdd(page)).toContainText('Image')
  })

  // FR-224: Esc closes the modal; a click on the backdrop does nothing (no accidental data loss)
  test('FR-224: Escape closes the modal and a backdrop click leaves it open', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.backdrop(page).click({ position: { x: 4, y: 4 } })
    await expect(w.modal(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(w.modal(page)).toBeHidden()
  })

  // FR-225: Tab cycles inside the modal and never lands on the page behind it
  test('FR-225: Tab cycles focus inside the modal', async ({ page }) => {
    await openWriteKudoModal(page)
    const insideModal = () => page.evaluate(() => Boolean(document.activeElement?.closest('[data-testid="write-kudo-modal"]')))
    for (let step = 0; step < 25; step += 1) {
      await page.keyboard.press('Tab')
      expect(await insideModal(), `focus after Tab ${step + 1}`).toBe(true)
    }
  })

  // FR-226: with the EN locale the modal shows translated copy, never a raw writeKudo.* key
  test('FR-226: with the EN locale the modal shows no raw writeKudo. keys', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3100' }])
    await openWriteKudoModal(page)
    await expect(w.modal(page)).not.toContainText('writeKudo.')
  })

  // FR-227: 768 and 375 wide, no horizontal scroll; under 640 px the recipient input spans the modal row
  for (const width of [768, 375]) {
    test(`FR-227: at ${width} px the modal has no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openWriteKudoModal(page)
      await expectNoHorizontalScroll(page)
      const modalBox = await w.modal(page).boundingBox()
      expect(modalBox!.width, 'modal fits the viewport').toBeLessThanOrEqual(width)
      if (width < 640) {
        const inputBox = await w.recipientInput(page).boundingBox()
        expect(inputBox!.width, 'stacked recipient row').toBeGreaterThanOrEqual(modalBox!.width * 0.6)
      }
    })
  }

  // FR-227 (1440): the modal is 752 px wide, as in the Figma frame
  test('FR-227: at 1440 px the modal is the 752 px Figma width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openWriteKudoModal(page)
    const box = await w.modal(page).boundingBox()
    expect(box!.width).toBeCloseTo(FIGMA_MODAL_WIDTH, 0)
  })
})
