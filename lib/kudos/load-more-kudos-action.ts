'use server'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import type { FeedPage } from './kudo-board-types'
import { getFeedPage, getFilterOptions } from './kudo-board-queries'
import { sanitizeFilters } from './kudo-filters'
import { parseFeedCursor } from './kudo-input-validation'

export type LoadMoreKudosInput = {
  cursor: { createdAt: string; id: string } | null
  hashtag: string | null
  department: string | null
}

/**
 * Next All Kudos page (A5). A Server Action is a public POST endpoint, so it re-checks the session and treats
 * every field as untrusted: the cursor must be exactly what the RPC issues, and filter values are matched against
 * the real option lists (unknown -> no filter), so a forged value cannot reach the database. Errors are thrown
 * with a generic message; the client shows its own dictionary text and retries on the next scroll.
 */
export async function loadMoreKudos(input: LoadMoreKudosInput): Promise<FeedPage> {
  if (!(await getCurrentUser())) throw new Error('Unauthorized')
  if (typeof input !== 'object' || input === null) throw new Error('Invalid input')

  const cursor = parseFeedCursor(input.cursor)
  if (cursor === undefined) throw new Error('Invalid cursor')

  const filters = sanitizeFilters({ hashtag: input.hashtag ?? undefined, department: input.department ?? undefined }, await getFilterOptions())
  return getFeedPage(filters, cursor)
}
