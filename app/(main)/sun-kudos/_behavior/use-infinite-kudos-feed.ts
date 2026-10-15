'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FeedCursor, FeedPage, KudoCard, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { loadMoreKudos } from '@/lib/kudos/load-more-kudos-action'
import type { FeedStatus } from '../_components/kudos-view-types'

export type InfiniteKudosFeed = {
  items: KudoCard[]
  status: FeedStatus
  /** `FeedViewProps.sentinelRef`: the element whose approach to the viewport loads the next page. */
  sentinelRef: RefObject<HTMLDivElement | null>
}

/** Start loading a little before the sentinel is on screen so the next page is usually there when the user arrives. */
const LOOK_AHEAD = '0px 0px 200px 0px'

/**
 * All Kudos infinite scroll (A5, SM: idle -> loading -> idle | done | error). Starts from the server-rendered
 * first page; the parent keys the container by the filters so a filter change remounts this hook with a fresh page.
 *
 * - One request at a time (`inFlight` ref), so a double callback never fetches the same cursor twice.
 * - Appended items are de-duplicated by id; `nextCursor === null` ends the feed (`done`).
 * - An observer exists only while the feed can load (`idle` or `error`) and is re-created after every settled
 *   load, which makes the browser report the sentinel's current visibility again: a sentinel that is still on
 *   screen after an append keeps loading without needing a scroll.
 * - After `error` the next load needs a fresh intersection: the sentinel must leave the viewport and come back,
 *   so a failing server is not hammered in a loop while the sentinel stays visible (§3.8).
 */
export function useInfiniteKudosFeed(initialPage: FeedPage, filters: KudoFilters): InfiniteKudosFeed {
  const [items, setItems] = useState<KudoCard[]>(initialPage.items)
  const [cursor, setCursor] = useState<FeedCursor | null>(initialPage.nextCursor)
  const [status, setStatus] = useState<FeedStatus>(initialPage.nextCursor === null ? 'done' : 'idle')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const inFlight = useRef(false)
  const { hashtag, department } = filters

  const loadMore = useCallback(async () => {
    if (inFlight.current || cursor === null) return
    inFlight.current = true
    setStatus('loading')
    try {
      const page = await loadMoreKudos({ cursor, hashtag, department })
      setItems((current) => {
        const known = new Set(current.map((item) => item.id))
        return [...current, ...page.items.filter((item) => !known.has(item.id))]
      })
      setCursor(page.nextCursor)
      setStatus(page.nextCursor === null ? 'done' : 'idle')
    } catch {
      setStatus('error')
    } finally {
      inFlight.current = false
    }
  }, [cursor, hashtag, department])

  const canLoad = (status === 'idle' || status === 'error') && cursor !== null

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!canLoad || !sentinel || typeof IntersectionObserver === 'undefined') return
    let armed = status !== 'error'
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) armed = true
          else if (armed) void loadMore()
        }
      },
      { rootMargin: LOOK_AHEAD },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [canLoad, status, loadMore])

  return { items, status, sentinelRef }
}
