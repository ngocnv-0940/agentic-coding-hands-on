'use server'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { toSunnerOptions } from './create-kudo-input'
import { SEARCH_QUERY_MAX, textLength } from './kudo-write-rules'
import type { SearchSunnersResult } from './kudo-write-types'

/**
 * Recipient / "@" mention search (INT-003). Public POST endpoint: re-checks the session, then lets the INVOKER RPC
 * decide (it folds case and diacritics, matches the trimmed query literally, excludes the viewer, caps at 10).
 * A blank or over-long query is not an error, it simply has no results; a failed query is `{ ok: false }` and the UI
 * shows its "no result" text. Nothing of the database error is forwarded.
 */
export async function searchSunnersAction(query: unknown): Promise<SearchSunnersResult> {
  if (!(await getCurrentUser())) return { ok: false }
  if (typeof query !== 'string') return { ok: true, options: [] }
  const trimmed = query.trim()
  if (trimmed === '' || textLength(trimmed) > SEARCH_QUERY_MAX) return { ok: true, options: [] }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('search_sunners', { p_query: trimmed })
    if (error) {
      console.error('[kudos] search_sunners failed', error.code)
      return { ok: false }
    }
    return { ok: true, options: toSunnerOptions(data) }
  } catch (error) {
    console.error('[kudos] search_sunners threw', error instanceof Error ? error.name : 'unknown')
    return { ok: false }
  }
}
