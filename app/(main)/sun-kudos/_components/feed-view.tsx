import { Fragment } from 'react'
import type { FeedViewProps } from './kudos-view-types'

const NOTE = 'm-0 text-center font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold'

/** Card column of ALL KUDOS (mm:2940:13482): cards, status lines and the infinite-scroll sentinel. */
export function FeedView({ cards, sentinelRef, status, labels }: FeedViewProps) {
  return (
    <div data-testid="kudos-feed" className="flex w-full min-w-0 flex-col gap-6">
      {cards.length === 0 && status !== 'loading' ? (
        <p data-testid="kudos-empty" className={`${NOTE} py-10 text-xl leading-8 text-white`}>
          {labels.empty}
        </p>
      ) : (
        cards.map((card) => <Fragment key={card.id}>{card.node}</Fragment>)
      )}
      {status === 'loading' ? (
        <p role="status" className={`${NOTE} text-white`}>
          {labels.loading}
        </p>
      ) : null}
      {status === 'error' ? (
        <p role="alert" className={`${NOTE} text-[#ff8a85]`}>
          {labels.error}
        </p>
      ) : null}
      {/* Always present so the observer can attach once and the feed can be scrolled to its end. */}
      <div ref={sentinelRef} data-testid="kudos-feed-sentinel" aria-hidden="true" className="h-px w-full" />
    </div>
  )
}
