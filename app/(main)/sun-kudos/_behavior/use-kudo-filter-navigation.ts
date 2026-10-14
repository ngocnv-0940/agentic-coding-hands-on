'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { KudoFilters } from '@/lib/kudos/kudo-board-types'
import { buildFilterQuery } from '@/lib/kudos/kudo-filters'

const KUDOS_PATH = '/sun-kudos'

export type KudoFilterNavigation = {
  /** Set (or with `null` clear) the hashtag filter; the department filter stays. Also used by a card's hashtag chip (A4). */
  selectHashtag: (slug: string | null) => void
  /** Set (or with `null` clear) the department filter; the hashtag filter stays (A3). */
  selectDepartment: (code: string | null) => void
}

/**
 * Filters live in the URL (clarifications): a change is a `router.replace` to `/sun-kudos?hashtag&department`
 * without a history entry and without scrolling to the top, and the server re-renders Highlight and All Kudos.
 * `filters` is the server-sanitised current state (page props), not the raw query, so a hand-edited unknown
 * value never lingers in the URL after the next click. Cleared filters are dropped; no filter is `/sun-kudos`.
 */
export function useKudoFilterNavigation(filters: KudoFilters): KudoFilterNavigation {
  const router = useRouter()

  const navigate = useCallback(
    (next: KudoFilters) => {
      const query = buildFilterQuery(next)
      router.replace(query === '' ? KUDOS_PATH : `${KUDOS_PATH}?${query}`, { scroll: false })
    },
    [router],
  )

  const selectHashtag = useCallback((hashtag: string | null) => navigate({ ...filters, hashtag }), [filters, navigate])
  const selectDepartment = useCallback((department: string | null) => navigate({ ...filters, department }), [filters, navigate])

  return { selectHashtag, selectDepartment }
}
