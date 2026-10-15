import { expect, test, type Page } from '@playwright/test'
import * as w from './support/write-kudo-locators'
import { openWriteKudoModal } from './support/write-kudo-session'

// Screen: Viết Kudo rich-text editor (Nội dung) and the "Add link" dialog (Addlink Box).
// Spec ids: TC ID-27..32; FR-401..407 (toolbar, aria-pressed), FR-501..505 (link dialog), FR-605 (paste is
// reduced to plain, schema-allowed content; no script runs, no raw h1 survives).

const PHRASE = 'Cảm ơn bạn'
const LINK_URL = 'https://example.com'

/** Types `text` into the editor, then selects everything in it (Ctrl+A stays inside the contenteditable). */
async function typeAndSelectAll(page: Page, text: string) {
  await w.editorContent(page).click()
  await page.keyboard.type(text)
  await page.keyboard.press('Control+A')
}

async function openLinkDialogOn(page: Page, text: string) {
  await typeAndSelectAll(page, text)
  await w.tool(page, 'link').click()
  await expect(w.linkDialog(page)).toBeVisible()
}

test.describe('Viết Kudo editor and link dialog', () => {
  // TC ID-27 / FR-401: Bold wraps the selected text in strong and sets aria-pressed
  test('TC ID-27 / FR-401: Bold makes the selected text bold and reports aria-pressed', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeAndSelectAll(page, PHRASE)
    await w.tool(page, 'bold').click()
    await expect(w.editorContent(page).locator('strong')).toContainText(PHRASE)
    await expect(w.tool(page, 'bold')).toHaveAttribute('aria-pressed', 'true')
  })

  // TC ID-28: Italic wraps the selection in em
  test('TC ID-28: Italic makes the selected text italic', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeAndSelectAll(page, PHRASE)
    await w.tool(page, 'italic').click()
    await expect(w.editorContent(page).locator('em')).toContainText(PHRASE)
    await expect(w.tool(page, 'italic')).toHaveAttribute('aria-pressed', 'true')
  })

  // TC ID-29: Strike wraps the selection in s
  test('TC ID-29: Strike puts a line through the selected text', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeAndSelectAll(page, PHRASE)
    await w.tool(page, 'strike').click()
    await expect(w.editorContent(page).locator('s')).toContainText(PHRASE)
    await expect(w.tool(page, 'strike')).toHaveAttribute('aria-pressed', 'true')
  })

  // FR-404: a second click on an active mark removes it and clears aria-pressed
  test('FR-404: a second Bold click removes the mark and clears aria-pressed', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeAndSelectAll(page, PHRASE)
    await w.tool(page, 'bold').click()
    await expect(w.tool(page, 'bold')).toHaveAttribute('aria-pressed', 'true')
    await w.tool(page, 'bold').click()
    await expect(w.tool(page, 'bold')).toHaveAttribute('aria-pressed', 'false')
    await expect(w.editorContent(page).locator('strong')).toHaveCount(0)
  })

  // TC ID-30: the numbered list turns two lines into two ordered items
  test('TC ID-30: the numbered list turns two lines into two ordered items', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.editorContent(page).click()
    await page.keyboard.type('Mục một')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Mục hai')
    await page.keyboard.press('Control+A')
    await w.tool(page, 'ordered-list').click()
    await expect(w.editorContent(page).locator('ol > li')).toHaveCount(2)
  })

  // TC ID-31 / FR-501..503: the link dialog inserts a link with http(s), new-tab and noopener attributes
  test('TC ID-31: the link dialog inserts a link that opens in a new tab', async ({ page }) => {
    await openWriteKudoModal(page)
    await openLinkDialogOn(page, PHRASE)
    await w.linkText(page).fill(PHRASE)
    await w.linkUrl(page).fill(LINK_URL)
    await w.linkSave(page).click()
    await expect(w.linkDialog(page)).toBeHidden()
    const link = w.editorContent(page).locator(`a[href="${LINK_URL}"]`)
    await expect(link).toHaveText(PHRASE)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  // TC ID-32: Quote wraps the selected text in a blockquote
  test('TC ID-32: Quote formats the selected text as a blockquote', async ({ page }) => {
    await openWriteKudoModal(page)
    await typeAndSelectAll(page, 'Đây là quote')
    await w.tool(page, 'quote').click()
    await expect(w.editorContent(page).locator('blockquote')).toContainText('Đây là quote')
    await expect(w.tool(page, 'quote')).toHaveAttribute('aria-pressed', 'true')
  })

  // FR-503: an empty Text is an error; nothing is inserted
  test('FR-503: an empty link Text shows an error and inserts nothing', async ({ page }) => {
    await openWriteKudoModal(page)
    await openLinkDialogOn(page, PHRASE)
    await w.linkText(page).fill('')
    await w.linkUrl(page).fill(LINK_URL)
    await w.linkSave(page).click()
    await expect(w.linkError(page, 'text')).toBeVisible()
    await expect(w.linkDialog(page)).toBeVisible()
    await expect(w.editorContent(page).locator('a')).toHaveCount(0)
  })

  // FR-504: a javascript: URL is refused; nothing is inserted
  test('FR-504: a javascript: URL shows an error and inserts nothing', async ({ page }) => {
    await openWriteKudoModal(page)
    await openLinkDialogOn(page, PHRASE)
    await w.linkText(page).fill(PHRASE)
    await w.linkUrl(page).fill('javascript:alert(1)')
    await w.linkSave(page).click()
    await expect(w.linkError(page, 'url')).toBeVisible()
    await expect(w.editorContent(page).locator('a')).toHaveCount(0)
  })

  // FR-504: an ftp:// URL is refused the same way
  test('FR-504: an ftp:// URL shows an error and inserts nothing', async ({ page }) => {
    await openWriteKudoModal(page)
    await openLinkDialogOn(page, PHRASE)
    await w.linkText(page).fill(PHRASE)
    await w.linkUrl(page).fill('ftp://x')
    await w.linkSave(page).click()
    await expect(w.linkError(page, 'url')).toBeVisible()
    await expect(w.editorContent(page).locator('a')).toHaveCount(0)
  })

  // FR-505 / FR-224: Esc closes the link dialog only; the Viết Kudo modal stays open
  test('FR-505: Escape closes the link dialog and leaves the modal open', async ({ page }) => {
    await openWriteKudoModal(page)
    await openLinkDialogOn(page, PHRASE)
    await page.keyboard.press('Escape')
    await expect(w.linkDialog(page)).toBeHidden()
    await expect(w.modal(page)).toBeVisible()
  })

  // FR-605: pasted HTML keeps only schema-allowed content; the script never runs and no raw h1 survives
  test('FR-605: pasted <h1> and <script> reduce to plain text and the script does not run', async ({ page }) => {
    await openWriteKudoModal(page)
    await w.editorContent(page).click()
    await page.evaluate(() => {
      const target = document.querySelector('[data-testid="write-kudo-editor"] .ProseMirror') as HTMLElement
      const data = new DataTransfer()
      data.setData('text/html', '<h1>Tiêu đề</h1><script>window.__kudoPwned = true</script><p>Nội dung</p>')
      data.setData('text/plain', 'Tiêu đề Nội dung')
      target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
    })
    await expect(w.editorContent(page)).toContainText('Nội dung')
    await expect(w.editorContent(page).locator('h1')).toHaveCount(0)
    await expect(w.editorContent(page).locator('script')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __kudoPwned?: boolean }).__kudoPwned)).toBeUndefined()
  })
})
