import { expect, test, type Page } from '@playwright/test'
import * as w from './support/write-kudo-locators'
import { openWriteKudoModal } from './support/write-kudo-session'

// Screen: Viết Kudo recipient search (Người nhận) and the "@" mention in the editor.
// Spec ids: TC ID-8, ID-9, ID-10, ID-12, ID-13, ID-25, ID-26, ID-33; FR-301..312 (search), ALG-001 (ordering,
// the 10-result cap, viewer excluded, diacritic- and case-insensitive, special characters literal).
// Fixture: 13 sunners match "Nguyễn" for the user identity, so the cap shows exactly 10.

const NGUYEN_MATCHES = 10
const NO_RESULT = 'Không tìm thấy kết quả'
const NGUYEN_NAME = /Nguy[eễ]n/

async function typeRecipient(page: Page, text: string) {
  await w.recipientInput(page).fill('')
  await w.recipientInput(page).pressSequentially(text)
}

async function typeInEditor(page: Page, text: string) {
  await w.editorContent(page).click()
  await page.keyboard.type(text)
}

test.describe('Viết Kudo recipient search and mention', () => {
  // TC ID-8: typing "Nguyễn" lists the matches (capped at 10), and a suggestion can be selected
  test('TC ID-8: typing "Nguyễn" lists at most 10 matching sunners, and one can be selected', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'Nguyễn')
    await expect(w.sunnerOptions(page)).toHaveCount(NGUYEN_MATCHES)
    await expect(w.sunnerOptions(page).first()).toContainText(NGUYEN_NAME)
    await w.sunnerOption(page, 'Nguyễn Anh Khoa').click()
    await expect(w.recipientSelected(page)).toContainText('Nguyễn Anh Khoa')
  })

  // TC ID-9: special characters are literal; nothing matches "@ # $" so the empty message shows
  test('TC ID-9: "@ # $" is matched literally and reports "Không tìm thấy kết quả"', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, '@ # $')
    await expect(w.sunnerEmpty(page)).toHaveText(NO_RESULT)
  })

  // TC ID-10: surrounding spaces are trimmed before the search, so the padded query returns the same list
  test('TC ID-10: "  Nguyễn  " is trimmed and returns the same suggestions as "Nguyễn"', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'Nguyễn')
    await expect(w.sunnerOptions(page)).toHaveCount(NGUYEN_MATCHES)
    const plain = await w.sunnerOptions(page).allInnerTexts()
    await typeRecipient(page, '  Nguyễn  ')
    await expect.poll(() => w.sunnerOptions(page).allInnerTexts()).toEqual(plain)
  })

  // TC ID-25 / FR-304: suggestions appear while typing and are filtered by what was typed
  test('TC ID-25: the suggestion list appears while typing "An" and holds Nguyễn Văn An', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'An')
    await expect(w.sunnerList(page)).toBeVisible()
    await expect(w.sunnerOption(page, 'Nguyễn Văn An')).toBeVisible()
  })

  // TC ID-26 / FR-305: picking a suggestion fills the field with the name and closes the list
  test('TC ID-26: picking "Nguyễn Văn An" fills the field with the name and closes the list', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'An')
    await w.sunnerOption(page, 'Nguyễn Văn An').click()
    await expect(w.recipientSelected(page)).toContainText('Nguyễn Văn An')
    await expect(w.sunnerList(page)).toBeHidden()
  })

  // TC ID-33 / ID-12 / FR-502: typing "@" in the editor shows the same suggestions; picking one inserts it
  test('TC ID-12 / ID-33: "@Nguyen" in the editor shows selectable colleague suggestions', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeInEditor(page, 'Cảm ơn @Nguyen')
    await expect(w.sunnerList(page)).toBeVisible()
    await expect(w.sunnerOptions(page).first()).toBeVisible()
    await w.sunnerOption(page, 'NguyenVanA').click()
    await expect(w.editor(page).locator('span[data-type="mention"]')).toHaveCount(1)
  })

  // TC ID-13 / FR-503: picking "NguyenVanA" after "Cảm ơn @Nguyen" puts that name into the text as a mention
  test('TC ID-13: "Cảm ơn @Nguyen" then NguyenVanA mentions the name in the text', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeInEditor(page, 'Cảm ơn @Nguyen')
    await expect(w.sunnerList(page)).toBeVisible()
    await w.sunnerOption(page, 'NguyenVanA').click()
    await expect(w.editor(page).locator('span[data-type="mention"][data-id]')).toContainText('NguyenVanA')
    await expect(w.editorContent(page)).toContainText('@NguyenVanA')
  })

  // FR-306: the viewer is never listed; searching the viewer's own name returns the empty message
  test('FR-306: the signed-in viewer is never suggested', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'E2E')
    await expect(w.sunnerEmpty(page)).toHaveText(NO_RESULT)
  })

  // FR-307 / ALG-001: "duc" finds Trần Minh Đức (đ folds to d)
  test('FR-307: "duc" finds Trần Minh Đức', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'duc')
    await expect(w.sunnerOption(page, 'Trần Minh Đức')).toBeVisible()
  })

  // FR-308: the clear button removes the selection, restores the search field and focus, and searches again
  test('FR-308: the clear button removes the selected recipient and restores the search', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'An')
    await w.sunnerOption(page, 'Nguyễn Văn An').click()
    await expect(w.recipientSelected(page)).toBeVisible()
    await w.recipientClear(page).click()
    await expect(w.recipientSelected(page)).toBeHidden()
    await expect(w.recipientInput(page)).toBeFocused()
    await typeRecipient(page, 'Trần')
    await expect(w.sunnerOption(page, 'Trần Minh Đức')).toBeVisible()
  })

  // FR-309 / BR-Esc: Esc closes the open suggestion list only; the modal stays open
  test('FR-309: Escape closes the recipient list and leaves the modal open', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeRecipient(page, 'Nguyễn')
    await expect(w.sunnerList(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(w.sunnerList(page)).toBeHidden()
    await expect(w.modal(page)).toBeVisible()
  })
})
