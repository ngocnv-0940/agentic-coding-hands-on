import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import * as f from './support/fab-locators'
import * as k from './support/kudos-locators'
import * as w from './support/write-kudo-locators'
import { fillRequiredFields, submitKudo } from './support/write-kudo-actions'
import { createdCount, resetMock } from './support/write-kudo-mock-control'

// Regression (review H1): FAB hop from / -> /sun-kudos?compose=1 -> send. router.refresh() after the send must not
// write `compose` back into the URL, so a reload must not reopen the modal. Serial: kudos-writer owns a private dataset.

test.describe.configure({ mode: 'serial' })

test.describe('FAB hop then send (serial, kudos-writer)', () => {
  test.beforeAll(({ request }) => resetMock(request))
  test.afterAll(({ request }) => resetMock(request))

  test('after a send from a FAB hop the URL has no compose and a reload keeps the modal closed', async ({ page, request }) => {
    await loginThroughStubbedGoogle(page, { as: 'kudos-writer' })
    await page.goto('/')
    await expect(f.fab(page), 'FAB on the page').toBeVisible()
    await f.fab(page).click()
    await expect(f.fabMenu(page), 'FAB quick-action group').toBeVisible()
    await f.fabWriteKudo(page).click()
    await expect(w.modal(page)).toBeVisible()
    await fillRequiredFields(page, 'Hồi quy compose')
    await submitKudo(page)
    await expect(k.toast(page)).toContainText('Đã gửi Kudos thành công!')
    await expect(w.modal(page)).toBeHidden()
    expect(await createdCount(request), 'one kudo created').toBe(1)
    // router.refresh() after the send re-syncs the URL on a later tick: settle before reading it, then require it stays clean.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    expect(new URL(page.url()).search, 'URL query after send and refresh').not.toContain('compose')
    await expect(w.modal(page), 'modal stays closed after refresh').toBeHidden()
    await page.reload()
    await expect(k.kudosBoard(page), 'board after reload').toBeVisible()
    await expect(page).not.toHaveURL(/compose/)
    await page.waitForLoadState('networkidle')
    await expect(w.modal(page), 'modal after reload').toBeHidden()
  })
})
