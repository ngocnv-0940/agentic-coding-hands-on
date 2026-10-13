import type { Page } from '@playwright/test'

/** Six award slugs (BR-006). Card links are `/awards-information#<slug>`. */
export const AWARD_SLUGS = [
  'top-talent',
  'top-project',
  'top-project-leader',
  'best-manager',
  'signature-2025-creator',
  'mvp',
] as const

// Selector contract shared by the homepage specs (roles first, data-testid for the rest).
export const header = (page: Page) => page.getByRole('banner')
export const footer = (page: Page) => page.getByRole('contentinfo')
export const headerNav = (page: Page) => header(page).getByRole('navigation')
export const navLink = (page: Page, name: RegExp) => headerNav(page).getByRole('link', { name })

export const notificationsTrigger = (page: Page) => page.getByTestId('notifications-trigger')
export const notificationsPanel = (page: Page) => page.getByTestId('notifications-panel')
export const notificationsBadge = (page: Page) => page.getByTestId('notifications-badge')
export const accountTrigger = (page: Page) => page.getByTestId('account-trigger')
export const accountMenu = (page: Page) => page.getByTestId('account-menu')
export const accountMenuProfile = (page: Page) => page.getByTestId('account-menu-profile')
export const accountMenuSignOut = (page: Page) => page.getByTestId('account-menu-signout')
export const accountMenuAdmin = (page: Page) => page.getByTestId('account-menu-admin')

export const languageTrigger = (page: Page) => page.getByTestId('language-selector-trigger')
export const languageOptionVi = (page: Page) => page.getByTestId('language-option-vi')
export const languageOptionEn = (page: Page) => page.getByTestId('language-option-en')

export const hero = (page: Page) => page.getByTestId('homepage-hero')
export const comingSoon = (page: Page) => page.getByTestId('countdown-coming-soon')
/** Placeholder pages (`/awards-information`, `/sun-kudos`, `/standards`, `/profile`, `/admin`). */
export const placeholderComingSoon = (page: Page) => page.getByTestId('coming-soon')
export const countdownUnit = (page: Page, unit: 'days' | 'hours' | 'minutes') => page.getByTestId(`countdown-${unit}`)
export const eventDate = (page: Page) => page.getByTestId('event-date')
export const eventVenue = (page: Page) => page.getByTestId('event-venue')
export const eventLivestream = (page: Page) => page.getByTestId('event-livestream')

export const awardsGrid = (page: Page) => page.getByTestId('awards-grid')
export const awardCard = (page: Page, slug: string) => page.getByTestId(`award-card-${slug}`)
export const kudosPromo = (page: Page) => page.getByTestId('kudos-promo')
export const widgetButton = (page: Page) => page.getByTestId('widget-button')
