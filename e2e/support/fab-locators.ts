import type { Page } from '@playwright/test'

/** Selector contract for the floating quick-action button: plans/261015-1900-fab-and-modal-polish/reports/selector-contract.md */
export const fab = (page: Page) => page.getByTestId('widget-button')
export const fabMenu = (page: Page) => page.getByTestId('fab-menu')
export const fabRules = (page: Page) => page.getByTestId('fab-menu-rules')
export const fabWriteKudo = (page: Page) => page.getByTestId('fab-menu-write-kudo')
export const fabClose = (page: Page) => page.getByTestId('fab-menu-close')
export const writeKudoScrollArea = (page: Page) => page.getByTestId('write-kudo-scroll-area')
