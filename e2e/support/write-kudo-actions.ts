import type { Page } from '@playwright/test'
import * as w from './write-kudo-locators'
import type { PickedFile } from './write-kudo-test-files'

/** UI steps shared by the write-kudo specs. Each step leaves the modal where a user would. */

/** Records every request to Supabase Storage on the page (uploads happen only on submit). */
export function recordStorageRequests(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/storage/v1/')) urls.push(request.url())
  })
  return urls
}

/** Opens the hashtag panel if it is closed, then picks each slug. */
export async function pickHashtags(page: Page, slugs: string[]) {
  // Settle first: leaving the recipient field can show its error row and move the button under the pointer.
  if (!(await w.hashtagPanel(page).isVisible())) {
    await w.heading(page).click()
    await w.hashtagAdd(page).click()
  }
  for (const slug of slugs) await w.hashtagOption(page, slug).click()
}

/** Hands files to the hidden multi-file input, as the picker does. */
export async function setImages(page: Page, files: PickedFile[]) {
  await w.imageInput(page).setInputFiles(files.map(({ name, mimeType, buffer }) => ({ name, mimeType, buffer })))
}

/** One file through the "+ Image" button, so the native file chooser path is exercised. */
export async function addImageThroughButton(page: Page, file: PickedFile) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), w.imageAdd(page).click()])
  await chooser.setFiles({ name: file.name, mimeType: file.mimeType, buffer: file.buffer })
}

/**
 * Closes the hashtag listbox by pressing the modal heading, as a user does. The open listbox floats over the footer,
 * so Gửi must not be clicked while it is open.
 */
export async function closeHashtagPanel(page: Page) {
  await w.heading(page).click()
}

/** Presses an enabled Gửi after closing the hashtag listbox, so the footer is not covered. */
export async function submitKudo(page: Page) {
  await closeHashtagPanel(page)
  await w.submitButton(page).click()
}

/** Fills every required field with valid values: recipient, title, content and one hashtag. */
export async function fillRequiredFields(page: Page, title: string, recipient = 'Nguyễn Anh Khoa') {
  await w.recipientInput(page).pressSequentially(recipient)
  await w.sunnerOption(page, recipient).click()
  await w.titleInput(page).fill(title)
  await w.editorContent(page).click()
  await page.keyboard.type('Cảm ơn bạn đã hỗ trợ cả team')
  await pickHashtags(page, ['teamwork'])
  await closeHashtagPanel(page)
}
