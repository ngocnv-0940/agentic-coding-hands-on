import { expect, test } from '@playwright/test'
import { loginThroughStubbedGoogle } from './support/login-through-stubbed-google'
import {
  accountMenu,
  accountMenuAdmin,
  accountMenuProfile,
  accountMenuSignOut,
  accountTrigger,
  headerNav,
  hero,
  languageOptionEn,
  languageTrigger,
  notificationsBadge,
  notificationsPanel,
  notificationsTrigger,
} from './support/homepage-locators'

// Spec ids: FR-401..404, FR-602, BR-004, DEC-002, US007, US008 (dropdowns, bell, account menu, sign out).

test.describe('Homepage dropdown menus', () => {
  // ID-27/FR-401/US008: the bell opens an empty panel with no badge
  test('bell opens an empty notifications panel with no badge', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await notificationsTrigger(page).click()
    await expect(notificationsTrigger(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(notificationsPanel(page)).toBeVisible()
    await expect(notificationsPanel(page)).toContainText(/Chưa có thông báo|No notifications/i)
    await expect(notificationsBadge(page)).toHaveCount(0)
  })

  // ID-36/FR-402/DEC-002: a regular user sees Profile and Sign out only
  test('account menu for a regular user has Profile and Sign out but no Admin Dashboard', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(accountMenu(page)).toBeVisible()
    await expect(accountMenuProfile(page)).toBeVisible()
    await expect(accountMenuSignOut(page)).toBeVisible()
    await expect(accountMenuAdmin(page)).toHaveCount(0)
  })

  // ID-37/FR-602/BR-004: an admin sees the Admin Dashboard entry in addition
  test('account menu for an admin adds Admin Dashboard', async ({ page }) => {
    await loginThroughStubbedGoogle(page, { as: 'admin' })
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(accountMenuProfile(page)).toBeVisible()
    await expect(accountMenuSignOut(page)).toBeVisible()
    await expect(accountMenuAdmin(page)).toBeVisible()
  })

  // Security negative (BR-004/D009): user_metadata.role = 'admin' must not show the Admin Dashboard entry
  test('account menu for a user_metadata-only admin claim has no Admin Dashboard', async ({ page }) => {
    await loginThroughStubbedGoogle(page, { as: 'usermeta-admin' })
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(accountMenu(page)).toBeVisible()
    await expect(accountMenuProfile(page)).toBeVisible()
    await expect(accountMenuSignOut(page)).toBeVisible()
    await expect(accountMenuAdmin(page)).toHaveCount(0)
  })

  // FR-403/US007: Sign out ends the session and returns to /login; / is guarded afterwards
  test('Sign out returns to /login and the homepage is guarded afterwards', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).click()
    await accountMenuSignOut(page).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  // FR-404/ID-30..32: click toggles, a second click or an outside click closes
  test('account menu toggles on click and closes on a second click or outside click', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(accountMenu(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(accountMenu(page)).toBeHidden()
    await accountTrigger(page).click()
    await expect(accountMenu(page)).toBeVisible()
    await page.locator('body').click({ position: { x: 5, y: 400 } })
    await expect(accountMenu(page)).toBeHidden()
  })

  // FR-404/ID-33..35: Enter and Space open from the keyboard; Escape closes and returns focus to the trigger
  test('keyboard opens the account menu with Enter or Space and Escape returns focus to the trigger', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await accountTrigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(accountMenu(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(accountMenu(page)).toBeHidden()
    await expect(accountTrigger(page)).toBeFocused()
    await page.keyboard.press('Space')
    await expect(accountMenu(page)).toBeVisible()
  })

  // FR-404: only one dropdown is open at a time (bell vs account)
  test('opening the bell closes the account menu and the reverse', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await notificationsTrigger(page).click()
    await expect(notificationsPanel(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(notificationsPanel(page)).toBeHidden()
    await expect(accountMenu(page)).toBeVisible()
  })

  // FR-404: opening the account menu closes an open language menu
  test('opening the account menu closes the language menu', async ({ page }) => {
    await loginThroughStubbedGoogle(page)
    await expect(hero(page)).toBeVisible()
    await languageTrigger(page).click()
    await expect(languageOptionEn(page)).toBeVisible()
    await accountTrigger(page).click()
    await expect(languageOptionEn(page)).toBeHidden()
    await expect(languageTrigger(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(headerNav(page)).toBeVisible()
  })
})
