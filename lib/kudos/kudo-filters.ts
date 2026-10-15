import type { FilterOptions, KudoFilters } from './kudo-board-types'

export type RawSearchParams = Record<string, string | string[] | undefined>

/** Next.js gives repeated query keys as an array: the first value wins. Non-strings count as absent. */
function firstValue(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * URL query (or Server Action input) -> filters the DB can trust. A value that is not a known hashtag slug or
 * department code becomes `null` ("no filter", D014), so a hand-edited URL never errors and never reaches the RPC.
 */
export function sanitizeFilters(params: RawSearchParams, options: FilterOptions): KudoFilters {
  const hashtag = firstValue(params.hashtag)
  const department = firstValue(params.department)
  return {
    hashtag: hashtag !== null && options.hashtags.some((h) => h.slug === hashtag) ? hashtag : null,
    department: department !== null && options.departments.some((d) => d.code === department) ? department : null,
  }
}

/** Stable identity of a filter set. Client containers use it as a React `key` so a filter change resets them. */
export function filtersKey(filters: KudoFilters): string {
  return `${filters.hashtag ?? ''}|${filters.department ?? ''}`
}

/** `hashtag=…&department=…` without the leading `?`; cleared filters are dropped, so "no filter" is `''`. */
export function buildFilterQuery(filters: KudoFilters): string {
  const query = new URLSearchParams()
  if (filters.hashtag !== null) query.set('hashtag', filters.hashtag)
  if (filters.department !== null) query.set('department', filters.department)
  return query.toString()
}
