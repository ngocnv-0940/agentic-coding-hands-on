import type { Locator, Page } from '@playwright/test'

/**
 * Selector contract for /sun-kudos, read-only for the UI phase (phase 2) and the wiring phase (6).
 * Every block carries a data-testid; a kudo card carries data-kudo-id and data-variant.
 * Contract additions beyond the phase-01 list: `kudo-person-star` (one per star, carries a title),
 * `kudo-person` contains links to /profile (avatar and name), `kudo-detail-link` is the "Xem chi tiết" link,
 * `kudos-highlight` / `kudos-feed` / `kudos-spotlight` / `kudos-sidebar` are the four block roots,
 * and `spotlight-panzoom-toggle` is the Pan/Zoom button (tooltip "Pan/Zoom").
 */
const tid = (id: string) => `[data-testid="${id}"]`

export const kudosBoard = (page: Page) => page.getByTestId('kudos-board')
export const kudosBanner = (page: Page) => page.getByTestId('kudos-banner')
export const composePill = (page: Page) => page.getByTestId('kudos-compose-pill')
export const profileSearchPill = (page: Page) => page.getByTestId('kudos-profile-search-pill')

export const highlightBlock = (page: Page) => page.getByTestId('kudos-highlight')
export const hashtagFilter = (page: Page) => page.getByTestId('kudos-filter-hashtag')
export const departmentFilter = (page: Page) => page.getByTestId('kudos-filter-department')
export const carousel = (page: Page) => page.getByTestId('kudos-carousel')
export const carouselPrev = (page: Page) => page.getByTestId('kudos-carousel-prev')
export const carouselNext = (page: Page) => page.getByTestId('kudos-carousel-next')
export const carouselPager = (page: Page) => page.getByTestId('kudos-carousel-pager')

export const spotlightBlock = (page: Page) => page.getByTestId('kudos-spotlight')
export const spotlightTotal = (page: Page) => page.getByTestId('spotlight-total')
export const spotlightNodes = (page: Page) => page.getByTestId('spotlight-node')
export const spotlightTooltip = (page: Page) => page.getByTestId('spotlight-tooltip')
export const spotlightPanZoom = (page: Page) => page.getByTestId('spotlight-panzoom')
export const spotlightCanvas = (page: Page) => page.getByTestId('spotlight-canvas')
export const spotlightSearch = (page: Page) => page.getByTestId('spotlight-search')
export const spotlightEmpty = (page: Page) => page.getByTestId('spotlight-empty')
export const spotlightPanZoomToggle = (page: Page) => page.getByTestId('spotlight-panzoom-toggle')

export const feedBlock = (page: Page) => page.getByTestId('kudos-feed')
export const feedSentinel = (page: Page) => page.getByTestId('kudos-feed-sentinel')
export const emptyFeed = (page: Page) => page.getByTestId('kudos-empty')

export const sidebarBlock = (page: Page) => page.getByTestId('kudos-sidebar')
export const sidebarStat = (page: Page, key: 'received' | 'sent' | 'hearts' | 'opened' | 'unopened') =>
  page.getByTestId(`sidebar-stat-${key}`)
export const openBoxButton = (page: Page) => page.getByTestId('sidebar-open-box')
export const giftRows = (page: Page) => page.getByTestId('sidebar-gift-row')
export const giftsEmpty = (page: Page) => page.getByTestId('sidebar-gifts-empty')

export const toast = (page: Page) => page.getByTestId('kudos-toast')
export const comingSoonModal = (page: Page) => page.getByTestId('coming-soon-modal')
export const comingSoonModalClose = (page: Page) => page.getByTestId('coming-soon-modal-close')

/** Every kudo card on the page (highlight and feed both render cards). */
export const kudoCards = (page: Page) => page.getByTestId('kudo-card')
/** Card for one kudo inside a block; pass the block root so highlight and feed never mix. */
export const cardIn = (block: Locator, kudoId: string) => block.locator(`${tid('kudo-card')}[data-kudo-id="${kudoId}"]`)
export const cardIds = async (block: Locator): Promise<string[]> =>
  block.locator(tid('kudo-card')).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-kudo-id') ?? ''))

export const likeButton = (card: Locator) => card.getByTestId('kudo-like')
export const likeCount = (card: Locator) => card.getByTestId('kudo-like-count')
export const copyLinkButton = (card: Locator) => card.getByTestId('kudo-copy-link')
export const detailLink = (card: Locator) => card.getByTestId('kudo-detail-link')
export const kudoContent = (card: Locator) => card.getByTestId('kudo-content')
export const kudoTime = (card: Locator) => card.getByTestId('kudo-time')
export const kudoHashtags = (card: Locator) => card.getByTestId('kudo-hashtag')
export const kudoImages = (card: Locator) => card.getByTestId('kudo-image')
export const kudoPerson = (card: Locator, role: 'sender' | 'receiver') => card.locator(`${tid('kudo-person')}[data-role="${role}"]`)
export const personStars = (person: Locator) => person.getByTestId('kudo-person-star')
