import type { Locator, Page } from '@playwright/test'

// Selector contract for /awards-information (plan phase 1). Roles and testids only; phases 2, 4 and 5 read it.
export const AWARDS_PATH = '/awards-information'

/** Menu order and section ids (BR-001). Same slugs as the homepage card anchors. */
export const AWARD_MENU_SLUGS = [
  'top-talent',
  'top-project',
  'top-project-leader',
  'best-manager',
  'signature-2025-creator',
  'mvp',
] as const

export type AwardMenuSlug = (typeof AWARD_MENU_SLUGS)[number]

/** Vietnamese menu labels, verbatim from the Figma frame (menu order matches AWARD_MENU_SLUGS). */
export const AWARD_MENU_LABELS = [
  'Top Talent',
  'Top Project',
  'Top Project Leader',
  'Best Manager',
  'Signature 2025 - Creator',
  'MVP',
] as const

export const awardsPage = (page: Page): Locator => page.getByTestId('awards-information')
export const awardsHero = (page: Page): Locator => page.getByTestId('awards-hero')
export const awardsKeyvisual = (page: Page): Locator => awardsHero(page).getByRole('img', { name: 'Keyvisual Sun* Annual Award 2025' })
export const awardsCaption = (page: Page): Locator => page.getByTestId('awards-caption')
export const awardsTitle = (page: Page): Locator => page.getByRole('heading', { level: 1 })

export const awardsMenu = (page: Page): Locator => page.getByTestId('awards-category-menu')
export const awardsMenuItem = (page: Page, slug: AwardMenuSlug): Locator => page.getByTestId(`awards-menu-item-${slug}`)
/** Exactly one item carries aria-current="location" once the page is ready. */
export const awardsActiveItems = (page: Page): Locator => awardsMenu(page).locator('[aria-current="location"]')

/** One section per award, anchored by slug (`section#<slug>`). */
export const awardSection = (page: Page, slug: AwardMenuSlug): Locator => page.locator(`section#${slug}`)
export const awardDetail = (page: Page, slug: AwardMenuSlug): Locator => page.getByTestId(`award-detail-${slug}`)
export const awardDetailImage = (page: Page, slug: AwardMenuSlug): Locator => awardDetail(page, slug).getByTestId('award-detail-image')
export const awardDetailDescription = (page: Page, slug: AwardMenuSlug): Locator =>
  awardDetail(page, slug).getByTestId('award-detail-description')
export const awardDetailQuantity = (page: Page, slug: AwardMenuSlug): Locator => awardDetail(page, slug).getByTestId('award-detail-quantity')
/** Signature 2025 carries two prize elements; every other award carries one. */
export const awardDetailPrize = (page: Page, slug: AwardMenuSlug): Locator => awardDetail(page, slug).getByTestId('award-detail-prize')

/** Sun* Kudos block at the bottom of the page: reuses the homepage KudosPromo testid. */
export const awardsKudosBlock = (page: Page): Locator => page.getByTestId('kudos-promo')
export const awardsKudosDetail = (page: Page): Locator => awardsKudosBlock(page).getByRole('link', { name: /Chi tiết|Details/ })

/** Current window scroll offset; read with expect.poll, never a fixed wait. */
export const scrollY = (page: Page): Promise<number> => page.evaluate(() => window.scrollY)
