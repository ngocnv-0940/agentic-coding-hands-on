'use client'

import { useCallback, useMemo, useState } from 'react'
import { normalizeSearchText } from '@/lib/kudos/spotlight-node-layout'
import { SPOTLIGHT_SEARCH_MAX_LENGTH } from '../_components/spotlight-search-input'

export type SpotlightSearch = {
  query: string
  /** `SpotlightSearchInputProps.onChange`; truncates to 100 characters (BR-011), because `maxLength` does not stop programmatic input. */
  setQuery: (value: string) => void
  /** Ids of the nodes whose name matches; `null` when the query is empty, meaning "no highlight, nothing dimmed". */
  matches: ReadonlySet<string> | null
}

/**
 * Spotlight search (A10, BR-011): client-only, no network. Case- and diacritic-insensitive substring match over the
 * already loaded receivers. Matching follows the text as it changes; an empty (or blank) query clears the highlight
 * and shows no error.
 */
export function useSpotlightSearch(receivers: ReadonlyArray<{ id: string; name: string }>): SpotlightSearch {
  const [query, setRawQuery] = useState('')
  const setQuery = useCallback((value: string) => setRawQuery(value.slice(0, SPOTLIGHT_SEARCH_MAX_LENGTH)), [])

  const matches = useMemo(() => {
    const needle = normalizeSearchText(query.trim())
    if (needle === '') return null
    return new Set(receivers.filter((receiver) => normalizeSearchText(receiver.name).includes(needle)).map((receiver) => receiver.id))
  }, [query, receivers])

  return { query, setQuery, matches }
}
