import type { Locator, Page } from '@playwright/test'

/**
 * Selector contract for the Viết Kudo modal (MoMorph ihQ26W78P2), read-only for the UI phase (phase 2) and the
 * wiring phase (6). Full list and semantics: plans/261015-0950-write-kudo-modal/reports/write-kudo-selector-contract.md
 */
const tid = (id: string) => `[data-testid="${id}"]`

export type WriteKudoField = 'recipient' | 'title' | 'content' | 'hashtags' | 'images' | 'anonymous'

export const modal = (page: Page) => page.getByTestId('write-kudo-modal')
export const backdrop = (page: Page) => page.getByTestId('write-kudo-backdrop')
export const heading = (page: Page) => page.getByTestId('write-kudo-heading')
export const fieldRows = (page: Page) => page.locator(tid('write-kudo-field'))
export const field = (page: Page, name: WriteKudoField) => page.locator(`${tid('write-kudo-field')}[data-field="${name}"]`)
export const fieldError = (row: Locator) => row.getByTestId('write-kudo-field-error')

export const recipientInput = (page: Page) => page.getByTestId('write-kudo-recipient-input')
export const recipientSelected = (page: Page) => page.getByTestId('write-kudo-recipient-selected')
export const recipientClear = (page: Page) => page.getByTestId('write-kudo-recipient-clear')

/** Shared suggestion list for the recipient field and the "@" mention in the editor. */
export const sunnerList = (page: Page) => page.getByTestId('sunner-option-list')
export const sunnerOptions = (page: Page) => page.getByTestId('sunner-option')
export const sunnerOption = (page: Page, name: string) => sunnerOptions(page).filter({ hasText: name })
export const sunnerEmpty = (page: Page) => page.getByTestId('sunner-option-empty')

export const titleInput = (page: Page) => page.getByTestId('write-kudo-title-input')
export const titleHint = (page: Page) => page.getByTestId('write-kudo-title-hint')

export const tool = (page: Page, name: 'bold' | 'italic' | 'strike' | 'ordered-list' | 'link' | 'quote') =>
  page.getByTestId(`write-kudo-tool-${name}`)
export const standardsLink = (page: Page) => page.getByTestId('write-kudo-standards-link')
export const editor = (page: Page) => page.getByTestId('write-kudo-editor')
export const editorContent = (page: Page) => editor(page).locator('.ProseMirror')
export const mentionHint = (page: Page) => page.getByTestId('write-kudo-mention-hint')

export const linkDialog = (page: Page) => page.getByTestId('write-kudo-link-dialog')
export const linkText = (page: Page) => page.getByTestId('write-kudo-link-text')
export const linkUrl = (page: Page) => page.getByTestId('write-kudo-link-url')
export const linkError = (page: Page, which: 'text' | 'url') => page.locator(`${tid('write-kudo-link-error')}[data-for="${which}"]`)
export const linkCancel = (page: Page) => page.getByTestId('write-kudo-link-cancel')
export const linkSave = (page: Page) => page.getByTestId('write-kudo-link-save')

export const hashtagAdd = (page: Page) => page.getByTestId('write-kudo-hashtag-add')
export const hashtagPanel = (page: Page) => page.getByTestId('write-kudo-hashtag-panel')
export const hashtagOption = (page: Page, slug: string) => page.locator(`${tid('write-kudo-hashtag-option')}[data-slug="${slug}"]`)
export const hashtagLimit = (page: Page) => page.getByTestId('write-kudo-hashtag-limit')
export const hashtagChip = (page: Page, slug: string) => page.locator(`${tid('write-kudo-hashtag-chip')}[data-slug="${slug}"]`)
export const hashtagChips = (page: Page) => page.getByTestId('write-kudo-hashtag-chip')
export const hashtagChipRemove = (chip: Locator) => chip.getByTestId('write-kudo-hashtag-chip-remove')

export const imageAdd = (page: Page) => page.getByTestId('write-kudo-image-add')
export const imageInput = (page: Page) => page.getByTestId('write-kudo-image-input')
export const imageThumbs = (page: Page) => page.getByTestId('write-kudo-image-thumb')
export const imageRemove = (thumb: Locator) => thumb.getByTestId('write-kudo-image-remove')
export const imageError = (page: Page) => page.getByTestId('write-kudo-image-error')

export const anonymousCheckbox = (page: Page) => page.getByTestId('write-kudo-anonymous-checkbox')
export const anonymousName = (page: Page) => page.getByTestId('write-kudo-anonymous-name')

export const cancelButton = (page: Page) => page.getByTestId('write-kudo-cancel')
export const submitButton = (page: Page) => page.getByTestId('write-kudo-submit')
export const submitSpinner = (page: Page) => page.getByTestId('write-kudo-submit-spinner')
