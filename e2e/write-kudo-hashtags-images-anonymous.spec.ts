import { expect, test } from '@playwright/test'
import * as w from './support/write-kudo-locators'
import { openWriteKudoModal } from './support/write-kudo-session'
import { addImageThroughButton, pickHashtags, recordStorageRequests, setImages } from './support/write-kudo-actions'
import { jpgFile, mp4File, oversizeImageFile, pdfFile, pngFile, txtFile, webpFile } from './support/write-kudo-test-files'

// Screen: Viết Kudo hashtags (Hashtag), images (Hình ảnh) and anonymous toggle (Ẩn danh).
// Spec ids: TC ID-14..24, 34..44, 53..55 (ID-16 and ID-17 read as the panel limit state, see tc-mapping.md);
// FR-601..606 (hashtags), FR-701..709 (images), FR-801..804 + DEC-005 (anonymous).
// The Gửi-side checks for these rows live in write-kudo-submit-and-anonymous.spec.ts.

const TAGS_FIVE = ['dedicated', 'inspiring', 'quality-first', 'proactive', 'creative']
const LIMIT_TEXT = 'Tối đa 5 hashtag'
const INVALID_TYPE = 'Định dạng file không hợp lệ'
const OVERSIZE = 'Ảnh vượt quá 5 MB'

test.describe('Viết Kudo hashtags, images and anonymous toggle', () => {
  // TC ID-14 / ID-52: with no hashtag, Gửi shows the required message at the Hashtag row
  test('TC ID-14: with no hashtag, clicking Gửi shows "Không được để trống" on the Hashtag row', async ({ page }) => {
    await openWriteKudoModal(page)
    // aria-disabled stays clickable by design (contract); force skips only Playwright's enabled check
    await w.submitButton(page).click({ force: true })
    await expect(w.fieldError(w.field(page, 'hashtags'))).toHaveText('Không được để trống')
  })

  // TC ID-15 / FR-601: one hashtag is added as a chip (the submit path is covered by the submit spec)
  test('TC ID-15: one picked hashtag appears as a chip', async ({ page }) => {
    await openWriteKudoModal(page)
    await pickHashtags(page, ['teamwork'])
    await expect(w.hashtagChips(page)).toHaveCount(1)
    await expect(w.hashtagChip(page, 'teamwork')).toContainText('Teamwork')
  })

  // TC ID-16 / FR-602: five chips; "+ Hashtag" stays visible (the panel carries the limit state)
  test('TC ID-16: five picked hashtags make five chips and "+ Hashtag" stays visible', async ({ page }) => {
    await openWriteKudoModal(page)
    await pickHashtags(page, TAGS_FIVE)
    await expect(w.hashtagChips(page)).toHaveCount(5)
    await expect(w.hashtagAdd(page)).toBeVisible()
  })

  // TC ID-17 / ID-53 / FR-603: at five, unselected options are aria-disabled, the limit shows, a sixth is refused
  test('TC ID-17 / ID-53: at five selected, the other options are disabled, the limit shows, a sixth is refused', async ({ page }) => {
    await openWriteKudoModal(page)
    await pickHashtags(page, TAGS_FIVE)
    await expect(w.hashtagLimit(page)).toHaveText(LIMIT_TEXT)
    await expect(w.hashtagOption(page, 'teamwork')).toHaveAttribute('aria-disabled', 'true')
    await w.hashtagOption(page, 'teamwork').click({ force: true })
    await expect(w.hashtagChips(page)).toHaveCount(5)
  })

  // TC ID-34: "+ Hashtag" lists the existing tags; "TeamWork" maps to the existing #Teamwork option
  test('TC ID-34: "+ Hashtag" opens the list and picking Teamwork adds its chip', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.hashtagAdd(page).click()
    await expect(w.hashtagPanel(page)).toBeVisible()
    await w.hashtagOption(page, 'teamwork').click()
    await expect(w.hashtagChip(page, 'teamwork')).toBeVisible()
  })

  // TC ID-35: three picks make three separate chips
  test('TC ID-35: three picked hashtags make three separate chips', async ({ page }) => {
    await openWriteKudoModal(page)
    await pickHashtags(page, ['dedicated', 'inspiring', 'teamwork'])
    await expect(w.hashtagChips(page)).toHaveCount(3)
  })

  // TC ID-36: the x on one chip removes that tag only
  test('TC ID-36: removing one chip keeps the others', async ({ page }) => {
    await openWriteKudoModal(page)
    await pickHashtags(page, ['dedicated', 'teamwork'])
    await w.hashtagChipRemove(w.hashtagChip(page, 'dedicated')).click()
    await expect(w.hashtagChips(page)).toHaveCount(1)
    await expect(w.hashtagChip(page, 'teamwork')).toBeVisible()
  })

  // TC ID-18 / ID-21 / ID-22: a valid jpg, png or webp is accepted and thumbnailed; "+ Image" stays
  for (const [tc, file] of [['ID-18 / ID-21', jpgFile()], ['ID-22', pngFile()], ['ID-22 (webp)', webpFile()]] as const) {
    test(`TC ${tc}: a valid ${file.mimeType} is added as a thumbnail`, async ({ page }) => {
      await openWriteKudoModal(page)
      await setImages(page, [file])
      await expect(w.imageThumbs(page)).toHaveCount(1)
      await expect(w.imageAdd(page)).toBeVisible()
    })
  }

  // TC ID-19 / ID-20 / ID-54: five thumbnails hide "+ Image"; a sixth pick adds nothing
  test('TC ID-19 / ID-20 / ID-54: five images hide "+ Image" and a sixth pick is ignored', async ({ page }) => {
    await openWriteKudoModal(page)
    await setImages(page, [jpgFile('a.jpg'), jpgFile('b.jpg'), jpgFile('c.jpg'), pngFile('d.png'), webpFile('e.webp')])
    await expect(w.imageThumbs(page)).toHaveCount(5)
    await expect(w.imageAdd(page)).toBeHidden()
    await setImages(page, [jpgFile('f.jpg')])
    await expect(w.imageThumbs(page)).toHaveCount(5)
  })

  // FR-704: seven picked at once keep the first five
  test('FR-704: seven files picked at once keep five thumbnails', async ({ page }) => {
    await openWriteKudoModal(page)
    await setImages(page, [1, 2, 3, 4, 5, 6, 7].map((n) => jpgFile(`n-${n}.jpg`)))
    await expect(w.imageThumbs(page)).toHaveCount(5)
  })

  // TC ID-23 / ID-24 / ID-55 / FR-705: pdf, mp4 and txt are refused with the invalid-format message and not uploaded
  for (const [tc, file] of [['ID-23', pdfFile()], ['ID-24', mp4File()], ['ID-55', txtFile()]] as const) {
    test(`TC ${tc}: a ${file.mimeType} file shows the invalid-format error, is not added and is not uploaded`, async ({ page }) => {
      const storage = recordStorageRequests(page)
      await openWriteKudoModal(page)
      await setImages(page, [file])
      await expect(w.imageError(page)).toHaveText(INVALID_TYPE)
      await expect(w.imageThumbs(page)).toHaveCount(0)
      expect(storage).toEqual([])
    })
  }

  // TC ID-37 / FR-702: "+ Image" opens the file picker; the picked file becomes a thumbnail
  test('TC ID-37: "+ Image" opens the file picker and the picked file becomes a thumbnail', async ({ page }) => {
    await openWriteKudoModal(page)
    await addImageThroughButton(page, jpgFile())
    await expect(w.imageThumbs(page)).toHaveCount(1)
  })

  // TC ID-38: five picks through the button hide "+ Image" after the fifth
  test('TC ID-38: five picks through "+ Image" hide the button after the fifth', async ({ page }) => {
    await openWriteKudoModal(page)
    for (let n = 1; n <= 5; n += 1) await addImageThroughButton(page, jpgFile(`pick-${n}.jpg`))
    await expect(w.imageThumbs(page)).toHaveCount(5)
    await expect(w.imageAdd(page)).toBeHidden()
  })

  // TC ID-39: the x on the second thumbnail removes it; two remain
  test('TC ID-39: removing the second of three thumbnails leaves two', async ({ page }) => {
    await openWriteKudoModal(page)
    await setImages(page, [jpgFile('x-1.jpg'), pngFile('x-2.png'), webpFile('x-3.webp')])
    await w.imageRemove(w.imageThumbs(page).nth(1)).click()
    await expect(w.imageThumbs(page)).toHaveCount(2)
  })

  // TC ID-40: removing one of five brings "+ Image" back
  test('TC ID-40: removing one of five thumbnails shows "+ Image" again', async ({ page }) => {
    await openWriteKudoModal(page)
    await setImages(page, [jpgFile('y-1.jpg'), jpgFile('y-2.jpg'), jpgFile('y-3.jpg'), jpgFile('y-4.jpg'), jpgFile('y-5.jpg')])
    await w.imageRemove(w.imageThumbs(page).first()).click()
    await expect(w.imageThumbs(page)).toHaveCount(4)
    await expect(w.imageAdd(page)).toBeVisible()
  })

  // FR-706: a file over 5 MB is refused with the size message
  test('FR-706: a file over 5 MB shows "Ảnh vượt quá 5 MB" and is not added', async ({ page }) => {
    await openWriteKudoModal(page)
    await setImages(page, [oversizeImageFile()])
    await expect(w.imageError(page)).toHaveText(OVERSIZE)
    await expect(w.imageThumbs(page)).toHaveCount(0)
  })

  // TC ID-41 / ID-42 / FR-801: the anonymous checkbox toggles on and off
  test('TC ID-41 / ID-42: the anonymous checkbox checks on click and unchecks on the second click', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.anonymousCheckbox(page).click()
    await expect(w.anonymousCheckbox(page)).toBeChecked()
    await w.anonymousCheckbox(page).click()
    await expect(w.anonymousCheckbox(page)).not.toBeChecked()
  })

  // TC ID-43 / ID-44 / FR-802: checking shows the alias field (max 50); unchecking hides it
  test('TC ID-43 / ID-44: checking shows the alias field (max 50) and unchecking hides it', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.anonymousCheckbox(page).click()
    await expect(w.anonymousName(page)).toBeVisible()
    await expect(w.anonymousName(page)).toHaveAttribute('maxlength', '50')
    await w.anonymousCheckbox(page).click()
    await expect(w.anonymousName(page)).toBeHidden()
  })

  // DEC-005: unchecking clears the alias, so a re-check starts empty
  test('DEC-005: unchecking clears the alias text', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.anonymousCheckbox(page).click()
    await w.anonymousName(page).fill('Bí danh tạm')
    await w.anonymousCheckbox(page).click()
    await w.anonymousCheckbox(page).click()
    await expect(w.anonymousName(page)).toHaveValue('')
  })
})
