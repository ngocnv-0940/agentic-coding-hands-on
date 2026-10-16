'use client'

import { useEffect, useRef, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/lib/kudos/kudo-write-rules'
import type { SunnerOption } from '@/lib/kudos/kudo-write-types'
import { searchSunnersAction } from '@/lib/kudos/search-sunners-action'

export type SunnerSearchStatus = 'idle' | 'loading' | 'empty' | 'ready'

type Settled = { query: string; options: SunnerOption[] }

const NO_OPTIONS: SunnerOption[] = []

/**
 * Recipient / "@" mention search (A3). The query is trimmed; a blank one is `idle` and never calls the server. A change
 * waits 250 ms before it searches, every search carries a sequence number and any answer that is not the latest is
 * dropped, so a slow old response can never overwrite a newer list (§3.8). A failed call counts as "no result".
 * While the latest query has no answer yet the status is `loading` (the view draws its skeleton).
 */
export function useSunnerSearch(query: string): { status: SunnerSearchStatus; options: SunnerOption[] } {
  const trimmed = query.trim()
  const [settled, setSettled] = useState<Settled | null>(null)
  const sequence = useRef(0)

  useEffect(() => {
    if (trimmed === '') return
    const mine = ++sequence.current
    const timer = setTimeout(async () => {
      let options = NO_OPTIONS
      try {
        const result = await searchSunnersAction(trimmed)
        if (result.ok) options = result.options
      } catch {
        // network or server failure: shown as "no result", like `{ ok: false }`
      }
      if (sequence.current === mine) setSettled({ query: trimmed, options })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      sequence.current += 1 // an answer still in flight is stale from here on, also after unmount
    }
  }, [trimmed])

  if (trimmed === '') return { status: 'idle', options: NO_OPTIONS }
  if (settled?.query !== trimmed) return { status: 'loading', options: NO_OPTIONS }
  return { status: settled.options.length > 0 ? 'ready' : 'empty', options: settled.options }
}
