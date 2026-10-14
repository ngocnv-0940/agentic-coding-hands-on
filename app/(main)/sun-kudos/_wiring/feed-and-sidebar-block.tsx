import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import { getFeedPage, getSidebar } from '@/lib/kudos/kudo-board-queries'
import { filtersKey, type RawSearchParams } from '@/lib/kudos/kudo-filters'
import type { FeedPage, SidebarData } from '@/lib/kudos/kudo-board-types'
import { AllKudosSection } from '../_components/all-kudos-section'
import { buildFeedTexts, buildKudoCardTexts, buildSidebarLabels } from './build-kudos-labels'
import { FeedContainer } from './feed-container'
import { resolveBoardFilters } from './resolve-board-filters'
import { SidebarContainer } from './sidebar-container'

const EMPTY_PAGE: FeedPage = { items: [], nextCursor: null }
/** Same shape the RPC returns for a signed-in user without a sunners row: zeros, no gifts. */
const EMPTY_SIDEBAR: SidebarData = {
  hasSunner: false,
  stats: { received: 0, sent: 0, hearts: 0, boxesOpened: 0, boxesUnopened: 0 },
  latestGifts: [],
}

async function readOrFallback<T>(operation: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read()
  } catch (error) {
    console.error(`[kudos] ${operation} failed`, error instanceof Error ? error.name : 'unknown')
    return fallback
  }
}

/** ALL KUDOS: first feed page and the personal sidebar. Each read degrades on its own (empty text / zeros), never the page. */
export async function FeedAndSidebarBlock({ searchParams, dict }: { searchParams: Promise<RawSearchParams>; dict: Dictionary }) {
  const { filters } = await resolveBoardFilters(searchParams)
  const [page, sidebar] = await Promise.all([
    readOrFallback('feed', () => getFeedPage(filters, null), EMPTY_PAGE),
    readOrFallback('sidebar', getSidebar, EMPTY_SIDEBAR),
  ])

  return (
    <AllKudosSection
      eyebrow={dict['kudos.eyebrow']}
      title={dict['kudos.feed.title']}
      feed={
        <FeedContainer
          key={filtersKey(filters)}
          initialPage={page}
          filters={filters}
          cardTexts={buildKudoCardTexts(dict)}
          feedTexts={buildFeedTexts(dict)}
        />
      }
      sidebar={<SidebarContainer data={sidebar} labels={buildSidebarLabels(dict)} />}
    />
  )
}
