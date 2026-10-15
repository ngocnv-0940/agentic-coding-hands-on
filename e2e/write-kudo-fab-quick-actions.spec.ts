import { expect, test, type Page } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import { openKudosBoard } from './support/kudos-board-session'
import { comingSoonModal } from './support/kudos-locators'
import * as f from './support/fab-locators'
import * as w from './support/write-kudo-locators'

// MoMorph FAB closed _hphd32jN2 / open Sv7DFwBw1h. Decisions: plans/261015-1900-fab-and-modal-polish/clarifications.md.
// Every test first opens the FAB menu: the precondition names the missing quick-action group when it is absent.

async function openFabMenu(page: Page, path = '/sun-kudos') {
  await openKudosBoard(page, undefined, path)
  await expect(f.fab(page), 'FAB on the page').toBeVisible()
  await f.fab(page).click()
  await expect(f.fabMenu(page), 'FAB quick-action group').toBeVisible()
}

test.describe('FAB quick actions', () => {
  test('clicking the FAB opens the group with Thể lệ, Viết KUDOS and the close button', async ({ page }) => {
    await openKudosBoard(page)
    await expect(f.fabMenu(page)).toBeHidden()
    await f.fab(page).click()
    await expect(f.fabMenu(page), 'FAB quick-action group').toBeVisible()
    await expect(f.fabRules(page)).toContainText('Thể lệ')
    await expect(f.fabWriteKudo(page)).toContainText('Viết KUDOS')
    await expect(f.fabClose(page)).toBeVisible()
  })

  test('the red × closes the group and focus returns to the FAB', async ({ page }) => {
    await openFabMenu(page)
    await f.fabClose(page).click()
    await expect(f.fabMenu(page)).toBeHidden()
    await expect(f.fab(page)).toBeFocused()
  })

  test('Escape closes the group and focus returns to the FAB', async ({ page }) => {
    await openFabMenu(page)
    await page.keyboard.press('Escape')
    await expect(f.fabMenu(page)).toBeHidden()
    await expect(f.fab(page)).toBeFocused()
  })

  test('a click outside the group closes it', async ({ page }) => {
    await openFabMenu(page)
    await page.mouse.click(40, 300)
    await expect(f.fabMenu(page)).toBeHidden()
  })

  test('on /sun-kudos Viết KUDOS opens the Write Kudo modal', async ({ page }) => {
    await openFabMenu(page)
    await f.fabWriteKudo(page).click()
    await expect(w.modal(page)).toBeVisible()
    await expect(f.fabMenu(page)).toBeHidden()
  })

  test('Hủy on a modal opened from the FAB returns focus to the FAB', async ({ page }) => {
    await openFabMenu(page)
    await f.fabWriteKudo(page).click()
    await expect(w.modal(page)).toBeVisible()
    await w.cancelButton(page).click()
    await expect(f.fab(page)).toBeFocused()
  })

  for (const path of ['/', '/awards-information']) {
    test(`from ${path} Viết KUDOS goes to /sun-kudos, opens the modal once and drops ?compose`, async ({ page }) => {
      await loginThroughStubbedGoogle(page, {})
      await page.goto(path)
      await expect(f.fab(page), 'FAB on the page').toBeVisible()
      await f.fab(page).click()
      await expect(f.fabMenu(page), 'FAB quick-action group').toBeVisible()
      await f.fabWriteKudo(page).click()
      await expect(page).toHaveURL(/\/sun-kudos/)
      await expect(w.modal(page)).toBeVisible()
      await expect(w.modal(page)).toHaveCount(1)
      await expect.poll(() => new URL(page.url()).searchParams.has('compose'), { message: 'compose param removed' }).toBe(false)
    })
  }

  test('Thể lệ opens the Coming soon modal', async ({ page }) => {
    await openFabMenu(page)
    await f.fabRules(page).click()
    await expect(comingSoonModal(page)).toBeVisible()
  })

  test('a viewer without a sunner does not get the modal from Viết KUDOS', async ({ page }) => {
    await openKudosBoard(page, 'kudos-outsider')
    await f.fab(page).click()
    await expect(f.fabMenu(page), 'FAB quick-action group').toBeVisible()
    await f.fabWriteKudo(page).click()
    // The form chunk is ssr:false: let it load and the click settle before asserting the modal never mounts.
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('widget-button')).toBeVisible()
    await expect(w.modal(page)).toHaveCount(0)
    await page.waitForTimeout(1000)
    await expect(w.modal(page)).toHaveCount(0)
  })
})
