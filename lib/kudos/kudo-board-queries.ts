import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type {
  FeedCursor,
  FeedPage,
  FilterOptions,
  KudoCard,
  KudoFilters,
  SidebarData,
  SpotlightData,
} from './kudo-board-types'

// Server-only by construction: `createClient` reads request cookies through `next/headers` and throws outside a
// request. (The `server-only` marker package is not installed and tsc cannot resolve it, so it is not imported.)

/** Cards per All Kudos page (ALG-004). */
export const FEED_PAGE_SIZE = 10

/**
 * A read failed. `operation` names the RPC; the raw PostgREST error is kept in `cause` for server logs only and
 * is never part of `message`, so nothing here is safe to forward but nothing leaks if it is thrown to a boundary.
 */
export class KudosDataError extends Error {
  constructor(
    readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super(`Kudos data request failed: ${operation}`, options)
    this.name = 'KudosDataError'
  }
}

/** One RPC call with the signed-in user's session (RLS and the function itself decide what is visible). */
async function callRpc(operation: string, args?: Record<string, unknown>): Promise<unknown> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(operation, args)
  if (error) throw new KudosDataError(operation, { cause: error })
  return data
}

function expectArray(operation: string, data: unknown): KudoCard[] {
  if (!Array.isArray(data)) throw new KudosDataError(operation, { cause: 'expected a JSON array' })
  return data as KudoCard[]
}

function expectObject<T>(operation: string, data: unknown): T {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new KudosDataError(operation, { cause: 'expected a JSON object' })
  }
  return data as T
}

/** Hashtag and department choices. Cached per request: the page and a load-more action both ask for it. */
export const getFilterOptions = cache(async (): Promise<FilterOptions> => {
  return expectObject<FilterOptions>('kudos_filter_options', await callRpc('kudos_filter_options'))
})

const filterArgs = (filters: KudoFilters) => ({ p_hashtag: filters.hashtag, p_department: filters.department })

/** ALG-001: top 5 kudos by likes (ties: newest first) after the filters. */
export async function getHighlight(filters: KudoFilters): Promise<KudoCard[]> {
  return expectArray('kudos_highlight', await callRpc('kudos_highlight', filterArgs(filters)))
}

/**
 * ALG-004: one All Kudos page. Asks the RPC for one row more than a page so a full page can tell whether another
 * exists without a count; `nextCursor` is the last shown item's (createdAt, id), copied unchanged from the row.
 */
export async function getFeedPage(filters: KudoFilters, cursor: FeedCursor | null): Promise<FeedPage> {
  const rows = expectArray(
    'kudos_feed_page',
    await callRpc('kudos_feed_page', {
      ...filterArgs(filters),
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
      p_limit: FEED_PAGE_SIZE + 1,
    }),
  )
  const items = rows.slice(0, FEED_PAGE_SIZE)
  const last = items[items.length - 1]
  const hasMore = rows.length > FEED_PAGE_SIZE && last !== undefined
  return { items, nextCursor: hasMore ? { createdAt: last.createdAt, id: last.id } : null }
}

/** Spotlight data ignores the page filters (A8). */
export async function getSpotlight(): Promise<SpotlightData> {
  return expectObject<SpotlightData>('kudos_spotlight', await callRpc('kudos_spotlight'))
}

/** Stats and latest gifts for the signed-in user; all zeros when they have no sunners row. */
export async function getSidebar(): Promise<SidebarData> {
  return expectObject<SidebarData>('kudos_sidebar', await callRpc('kudos_sidebar'))
}
