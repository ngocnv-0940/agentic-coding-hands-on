'use client'

import type { FeedPage, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { useInfiniteKudosFeed } from '../_behavior/use-infinite-kudos-feed'
import { FeedView } from '../_components/feed-view'
import type { FeedTexts, KudoCardTexts } from './build-kudos-labels'
import { KudoCardContainer } from './kudo-card-container'

type FeedContainerProps = { initialPage: FeedPage; filters: KudoFilters; cardTexts: KudoCardTexts; feedTexts: FeedTexts }

/** All Kudos feed: the server-rendered first page, then pages appended as the sentinel nears the viewport (A5). */
export function FeedContainer({ initialPage, filters, cardTexts, feedTexts }: FeedContainerProps) {
  const { items, status, sentinelRef } = useInfiniteKudosFeed(initialPage, filters)

  return (
    <FeedView
      cards={items.map((card) => ({
        id: card.id,
        node: <KudoCardContainer card={card} variant="feed" texts={cardTexts} filters={filters} />,
      }))}
      sentinelRef={sentinelRef}
      status={status}
      labels={feedTexts}
    />
  )
}
