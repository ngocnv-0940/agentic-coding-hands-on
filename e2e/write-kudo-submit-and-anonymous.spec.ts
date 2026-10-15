import { expect, test, type Page } from '@playwright/test'
import { openWriteKudoModal } from './support/write-kudo-session'
import * as w from './support/write-kudo-locators'
import * as k from './support/kudos-locators'
import { jpgFile, pngFile } from './support/write-kudo-test-files'
import { closeHashtagPanel, fillRequiredFields, pickHashtags, setImages, submitKudo } from './support/write-kudo-actions'
import { createdCount, resetMock, setCreateControl, storedNames } from './support/write-kudo-mock-control'

// Screen: Viết Kudo submit (Gửi), validation errors and the anonymous sender on the board.
// Spec ids: TC ID-7, 11, 45 (storage), 46..52, 56; US003 (title required), FR-901..910, INT-002 (create rules),
// FR-604 (anonymous masking on the board). Identity kudos-writer owns a private dataset, so this serial spec
// may create kudos; beforeAll and afterAll reset the mock.
// Serial: the first failing test stops the rest, which Playwright reports as "did not run", not passed.

const WRITER_NAME = 'Vũ Hải Đăng'
const RECIPIENT = 'Nguyễn Anh Khoa'
const SUCCESS_TOAST = 'Đã gửi Kudos thành công!'
const REQUIRED = 'Không được để trống'

/**
 * Clicks Gửi while it is aria-disabled (force skips only Playwright's enabled check) and asserts the modal stayed open
 * with no success toast. The hashtag listbox is closed first so it cannot cover the footer.
 */
async function clickSubmitAndExpectNoSend(page: Page) {
  await closeHashtagPanel(page)
  await w.submitButton(page).click({ force: true })
  await expect(w.modal(page)).toBeVisible()
  await expect(k.toast(page)).toBeHidden()
}

test.describe.configure({ mode: 'serial' })

test.describe('Viết Kudo submit and anonymous sender (serial, kudos-writer)', () => {
  test.beforeAll(({ request }) => resetMock(request))
  test.afterAll(({ request }) => resetMock(request))

  // TC ID-48: with every required field empty, Gửi reports aria-disabled
  test('TC ID-48: with every required field empty, Gửi is aria-disabled', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await expect(w.submitButton(page)).toHaveAttribute('aria-disabled', 'true')
  })

  // TC ID-49: recipient, title, content and one hashtag make Gửi enabled (title joins the required set, clarifications)
  test('TC ID-49: with recipient, title, content and one hashtag, Gửi is enabled', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, 'Tiêu đề kiểm tra')
    await expect(w.submitButton(page)).not.toHaveAttribute('aria-disabled', 'true')
  })

  // TC ID-7 / ID-50: no recipient, click Gửi -> red border and required message on Người nhận; not submitted
  test('TC ID-7 / ID-50: clicking Gửi without a recipient marks the recipient row and does not submit', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await w.titleInput(page).fill('Tiêu đề')
    await w.editorContent(page).click()
    await page.keyboard.type('Nội dung')
    await pickHashtags(page, ['teamwork'])
    await clickSubmitAndExpectNoSend(page)
    const row = w.field(page, 'recipient')
    await expect(row).toHaveAttribute('data-invalid', 'true')
    await expect(w.fieldError(row)).toHaveText(REQUIRED)
  })

  // TC ID-11 / ID-51: no content, click Gửi -> required message at the editor; not submitted
  test('TC ID-11 / ID-51: clicking Gửi without content shows the required message at the editor', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await w.recipientInput(page).pressSequentially(RECIPIENT)
    await w.sunnerOption(page, RECIPIENT).click()
    await w.titleInput(page).fill('Tiêu đề')
    await pickHashtags(page, ['teamwork'])
    await clickSubmitAndExpectNoSend(page)
    await expect(w.fieldError(w.field(page, 'content'))).toHaveText(REQUIRED)
  })

  // TC ID-52: no hashtag, click Gửi -> required message at the Hashtag row
  test('TC ID-52: clicking Gửi without a hashtag shows the required message at the Hashtag row', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, 'Tiêu đề')
    await w.hashtagChipRemove(w.hashtagChips(page).first()).click()
    await clickSubmitAndExpectNoSend(page)
    await expect(w.fieldError(w.field(page, 'hashtags'))).toHaveText(REQUIRED)
  })

  // TC ID-56 / US003: all empty, click Gửi -> errors on recipient, title, content and hashtags; no create_kudo
  test('TC ID-56 / US003: all required fields empty and Gửi clicked shows every error and creates nothing', async ({ page, request }) => {
    const before = await createdCount(request)
    await openWriteKudoModal(page, 'kudos-writer')
    await clickSubmitAndExpectNoSend(page)
    for (const field of ['recipient', 'title', 'content', 'hashtags'] as const) {
      await expect(w.fieldError(w.field(page, field)), `error on ${field}`).toHaveText(REQUIRED)
    }
    expect(await createdCount(request)).toBe(before)
  })

  // Blur and clear: an empty required field errors on blur and the error clears as soon as the value is valid
  test('blur and clear: an empty title errors on blur and the error clears once it is filled', async ({ page }) => {
    await openWriteKudoModal(page, 'kudos-writer')
    await w.titleInput(page).focus()
    await page.keyboard.press('Tab')
    await expect(w.fieldError(w.field(page, 'title'))).toHaveText(REQUIRED)
    await w.titleInput(page).fill('Đã điền')
    await expect(w.fieldError(w.field(page, 'title'))).toBeHidden()
  })

  // TC ID-46: two tags and two images -> spinner, inputs and Hủy disabled while pending; success toast; new first kudo
  test('TC ID-46: a valid submit with two tags and two images shows the spinner, then closes with the toast and the new kudo first', async ({ page, request }) => {
    const title = 'Kudos mẫu hai ảnh'
    await setCreateControl(request, { delayMs: 1500 })
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, title)
    await pickHashtags(page, ['dedicated'])
    await setImages(page, [jpgFile('ok-1.jpg'), pngFile('ok-2.png')])
    await submitKudo(page)
    await expect(w.submitSpinner(page)).toBeVisible()
    await expect(w.cancelButton(page)).toBeDisabled()
    await expect(w.titleInput(page)).toBeDisabled()
    await expect(w.submitButton(page)).toHaveAttribute('aria-busy', 'true')
    await expect(w.modal(page)).toBeHidden()
    await expect(k.toast(page)).toContainText(SUCCESS_TOAST)
    await setCreateControl(request, { delayMs: 0 })
    const first = k.feedBlock(page).getByTestId('kudo-card').first()
    await expect(first).toContainText(title)
    await expect(first.getByTestId('kudo-image')).toHaveCount(2)
    // kudo-image is the link around the thumbnail: its href is the public Storage URL (the <img> inside carries src)
    await expect(first.getByTestId('kudo-image').first()).toHaveAttribute('href', /kudo-images\//)
  })

  // TC ID-47: one tag and no image -> submitted, modal closes, new kudo first without images
  test('TC ID-47: a valid submit with one tag and no image closes the modal and shows the kudo first', async ({ page }) => {
    const title = 'Kudos mẫu không ảnh'
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, title)
    await submitKudo(page)
    await expect(w.modal(page)).toBeHidden()
    const first = k.feedBlock(page).getByTestId('kudo-card').first()
    await expect(first).toContainText(title)
    await expect(first.getByTestId('kudo-image')).toHaveCount(0)
  })

  // FR-604 / FR-801: an anonymous kudo shows the alias to everyone, sender block without avatar or profile link
  test('FR-604: an anonymous kudo shows the alias in the sender block with no avatar or profile link', async ({ page }) => {
    const title = 'Kudos ẩn danh có bí danh'
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, title)
    await w.anonymousCheckbox(page).click()
    await w.anonymousName(page).fill('Bí danh e2e')
    await submitKudo(page)
    await expect(w.modal(page)).toBeHidden()
    const first = k.feedBlock(page).getByTestId('kudo-card').first()
    await expect(first).toContainText(title)
    const sender = first.locator('[data-testid="kudo-person"][data-role="sender"]')
    await expect(sender).toHaveAttribute('data-anonymous', 'true')
    await expect(sender).toContainText('Bí danh e2e')
    await expect(sender.locator('img')).toHaveCount(0)
    await expect(sender.locator('a')).toHaveCount(0)
    await expect(first).not.toContainText(WRITER_NAME)
  })

  // FR-802: an anonymous kudo with an empty alias shows the default label
  test('FR-802: an anonymous kudo with an empty alias shows "Người gửi ẩn danh"', async ({ page }) => {
    const title = 'Kudos ẩn danh không bí danh'
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, title)
    await w.anonymousCheckbox(page).click()
    await submitKudo(page)
    await expect(w.modal(page)).toBeHidden()
    const first = k.feedBlock(page).getByTestId('kudo-card').first()
    await expect(first).toContainText(title)
    await expect(first.locator('[data-testid="kudo-person"][data-role="sender"]')).toContainText('Người gửi ẩn danh')
  })

  // FR-903: a failed submit keeps the modal and the data, shows the error toast, and removes the uploaded image
  test('FR-903: a failed submit keeps the modal and data, shows the error toast, and removes the uploaded image', async ({ page, request }) => {
    const title = 'Kudos lỗi giả lập'
    const before = { created: await createdCount(request), stored: await storedNames(request) }
    await setCreateControl(request, { failNext: true })
    await openWriteKudoModal(page, 'kudos-writer')
    await fillRequiredFields(page, title)
    await setImages(page, [jpgFile('fail-1.jpg')])
    await submitKudo(page)
    await expect(k.toast(page)).toBeVisible()
    await expect(w.modal(page)).toBeVisible()
    await expect(w.titleInput(page)).toHaveValue(title)
    await expect(w.imageThumbs(page)).toHaveCount(1)
    expect(await createdCount(request)).toBe(before.created)
    await expect.poll(() => storedNames(request), { message: 'uploaded image removed after failure' }).toEqual(before.stored)
  })

  // ID-45 (storage side): an image picked and then Hủy is never uploaded or stored
  test('TC ID-45: an image picked and then Hủy is never uploaded or stored', async ({ page, request }) => {
    const before = await storedNames(request)
    const uploads: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/storage/v1/object/')) uploads.push(req.url())
    })
    await openWriteKudoModal(page, 'kudos-writer')
    await setImages(page, [jpgFile('cancel-1.jpg')])
    await expect(w.imageThumbs(page)).toHaveCount(1)
    await w.cancelButton(page).click()
    await expect(w.modal(page)).toBeHidden()
    expect(uploads).toEqual([])
    expect(await storedNames(request)).toEqual(before)
  })
})
